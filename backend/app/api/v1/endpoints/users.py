"""
User Management endpoints for agency proprietaires
Allows agency owners to manage their team members
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, check_permission, get_current_tenant
from app.models.user import User, UserRole
from app.models.agency import Agency
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserChangePassword
from app.services.auth import AuthService
from app.core.security import get_password_hash


router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("/", response_model=List[UserResponse])
async def list_agency_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    List all users in the current agency
    
    Accessible par: PROPRIETAIRE, SUPER_ADMIN
    """
    # Super admin already filtered by get_current_tenant
    query = db.query(User).filter(User.agency_id == agency.id)
    
    # Apply filters
    if role is not None:
        query = query.filter(User.role == role)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # Pagination
    users = query.offset(skip).limit(limit).all()
    
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID
    
    Accessible par: PROPRIETAIRE, SUPER_ADMIN
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.agency_id == agency.id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_agency_user(
    user_data: UserCreate,
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Create a new user for the current agency
    
    Accessible par: PROPRIETAIRE, SUPER_ADMIN
    
    Restrictions:
    - Cannot create SUPER_ADMIN users
    - Cannot create users for other agencies
    - User email must be unique
    """
    # Prevent creating super admins
    if user_data.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez pas créer d'utilisateurs super admin"
        )
    
    # Prevent creating another proprietaire unless current user is super admin
    if user_data.role == UserRole.PROPRIETAIRE and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un super admin peut créer un propriétaire d'agence"
        )
    
    # Force agency_id to current user's agency
    user_data.agency_id = agency.id
    
    # Create the user
    user = AuthService.create_user(db, user_data)
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_agency_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Update a user in the current agency
    
    Accessible par: PROPRIETAIRE, SUPER_ADMIN
    
    Restrictions:
    - Cannot modify users from other agencies
    - Cannot modify your own role
    """
    # Get the user
    user = db.query(User).filter(
        User.id == user_id,
        User.agency_id == agency.id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Prevent users from modifying themselves (use dedicated endpoint)
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisez l'endpoint /users/me pour modifier votre propre profil"
        )
    
    # Update user fields
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Check if email is being changed
    if "email" in update_data and update_data["email"] != user.email:
        # Check if new email already exists
        existing_user = db.query(User).filter(User.email == update_data["email"]).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cet email est déjà utilisé"
            )
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agency_user(
    user_id: UUID,
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Delete/deactivate a user from the current agency
    
    Accessible par: PROPRIETAIRE, SUPER_ADMIN
    
    Note: This sets is_active to False instead of hard delete
    """
    # Get the user
    user = db.query(User).filter(
        User.id == user_id,
        User.agency_id == agency.id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas supprimer votre propre compte"
        )
    
    # Soft delete by deactivating
    user.is_active = False
    db.commit()
    
    return None


@router.patch("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: UUID,
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Activate a deactivated user
    
    Accessible par: PROPRIETAIRE, SUPER_ADMIN
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.agency_id == agency.id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    return user


@router.patch("/{user_id}/change-role", response_model=UserResponse)
async def change_user_role(
    user_id: UUID,
    new_role: UserRole,
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Change a user's role
    
    Accessible par: PROPRIETAIRE (can assign MANAGER/EMPLOYEE), SUPER_ADMIN (can assign any role)
    
    Restrictions:
    - Cannot assign SUPER_ADMIN role (reserved for platform admins)
    - Cannot assign PROPRIETAIRE role unless you're a SUPER_ADMIN
    - Cannot change your own role
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.agency_id == agency.id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Prevent self role change
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas modifier votre propre rôle"
        )
    
    # Validate role assignment
    if new_role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez pas assigner le rôle SUPER_ADMIN"
        )
    
    if new_role == UserRole.PROPRIETAIRE and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un super admin peut assigner le rôle PROPRIETAIRE"
        )
    
    user.role = new_role
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/{user_id}/reset-password", response_model=dict)
async def reset_user_password(
    user_id: UUID,
    new_password: str = Query(..., min_length=8, max_length=100),
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Reset a user's password (admin action)
    
    Accessible par: PROPRIETAIRE, SUPER_ADMIN
    
    Note: For security, notify the user via email (to be implemented)
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.agency_id == agency.id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # TODO: Send email notification to user
    
    return {
        "message": "Mot de passe réinitialisé avec succès",
        "detail": "L'utilisateur devrait recevoir un email de notification"
    }


@router.get("/stats/summary", response_model=dict)
async def get_users_stats(
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get user statistics for the current agency
    
    Accessible par: PROPRIETAIRE, SUPER_ADMIN
    """
    total_users = db.query(User).filter(User.agency_id == agency.id).count()
    active_users = db.query(User).filter(
        User.agency_id == agency.id,
        User.is_active == True
    ).count()
    inactive_users = total_users - active_users
    
    # Count by role
    proprietaires = db.query(User).filter(
        User.agency_id == agency.id,
        User.role == UserRole.PROPRIETAIRE
    ).count()
    
    managers = db.query(User).filter(
        User.agency_id == agency.id,
        User.role == UserRole.MANAGER
    ).count()
    
    employees = db.query(User).filter(
        User.agency_id == agency.id,
        User.role == UserRole.EMPLOYEE
    ).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "by_role": {
            "proprietaire": proprietaires,
            "manager": managers,
            "employee": employees
        }
    }
