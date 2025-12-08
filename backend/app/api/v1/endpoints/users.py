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
    agency_id: Optional[UUID] = None,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List users based on current user's role
    
    - SUPER_ADMIN: Can list all users across all agencies
    - PROPRIETAIRE: Can list users from their owned agencies
    - MANAGER: Can list only employees in their agency
    - Others: Cannot list users
    """
    query = db.query(User)
    
    # Apply role-based filtering
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can see all users except other super admins
        query = query.filter(User.role != UserRole.SUPER_ADMIN)
        
        # If specific agency requested, filter by it
        if agency_id:
            query = query.filter(User.agency_id == agency_id)
    
    elif current_user.role == UserRole.PROPRIETAIRE:
        # Proprietaire sees users from their owned agencies only
        owned_agencies = db.query(Agency.id).filter(
            Agency.owner_id == current_user.id
        ).subquery()
        
        query = query.filter(User.agency_id.in_(owned_agencies))
        
        # If specific agency requested, verify ownership and filter
        if agency_id:
            agency = db.query(Agency).filter(
                Agency.id == agency_id,
                Agency.owner_id == current_user.id
            ).first()
            
            if not agency:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this agency"
                )
            
            query = query.filter(User.agency_id == agency_id)
    
    elif current_user.role == UserRole.MANAGER:
        # Manager sees only employees in their agency
        query = query.filter(
            User.agency_id == current_user.agency_id,
            User.role.in_([UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC])
        )
    
    else:
        # Employees cannot list users
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to list users"
        )
    
    # Apply additional filters
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new user for an agency
    
    Role-based restrictions:
    - SUPER_ADMIN: Can create PROPRIETAIRE (agency owners)
    - PROPRIETAIRE: Can create MANAGER and employees for their agencies
    - MANAGER: Can create AGENT_COMPTOIR and AGENT_PARC for their agency only
    - Others: Cannot create users
    """
    # Validate role-based creation permissions
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can create proprietaires
        if user_data.role == UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create super admin users"
            )
    
    elif current_user.role == UserRole.PROPRIETAIRE:
        # Proprietaire can create managers and employees
        if user_data.role in [UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create managers and employees"
            )
        
        # Must specify agency_id and must own that agency
        if not user_data.agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agency ID is required"
            )
        
        # Verify ownership
        agency = db.query(Agency).filter(
            Agency.id == user_data.agency_id,
            Agency.owner_id == current_user.id
        ).first()
        
        if not agency:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create users for agencies you own"
            )
    
    elif current_user.role == UserRole.MANAGER:
        # Manager can only create agents in their own agency
        if user_data.role not in [UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create counter agents and park agents"
            )
        
        # Force agency to manager's agency
        user_data.agency_id = current_user.agency_id
    
    else:
        # Employees cannot create users
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create users"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create the user
    user = AuthService.create_user(db, user_data)
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_agency_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a user
    
    Role-based restrictions:
    - SUPER_ADMIN: Can update any user except other super admins
    - PROPRIETAIRE: Can update managers and employees in their agencies
    - MANAGER: Can update agents in their agency
    - Others: Cannot update users (use /users/me for self-update)
    """
    # Get the target user
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent users from modifying themselves (use dedicated endpoint)
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use the /users/me endpoint to update your own profile"
        )
    
    # Import the helper function
    from app.core.dependencies import can_manage_user
    
    # Check if current user can manage this user
    if not can_manage_user(current_user, user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this user"
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
                detail="This email is already in use"
            )
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agency_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete/deactivate a user
    
    Role-based restrictions:
    - SUPER_ADMIN: Can delete any user except other super admins
    - PROPRIETAIRE: Can delete managers and employees in their agencies
    - MANAGER: Can delete agents in their agency
    - Others: Cannot delete users
    
    Note: This sets is_active to False instead of hard delete
    """
    # Get the target user
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    # Import the helper function
    from app.core.dependencies import can_manage_user
    
    # Check if current user can manage this user
    if not can_manage_user(current_user, user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this user"
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change a user's role
    
    Role-based restrictions:
    - SUPER_ADMIN: Can assign PROPRIETAIRE role only
    - PROPRIETAIRE: Can assign MANAGER, AGENT_COMPTOIR, AGENT_PARC in their agencies
    - MANAGER: Can assign AGENT_COMPTOIR, AGENT_PARC in their agency
    - Others: Cannot change roles
    
    Restrictions:
    - Cannot assign SUPER_ADMIN role (platform reserved)
    - Cannot change your own role
    """
    # Get the target user
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self role change
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )
    
    # Import helper
    from app.core.dependencies import can_manage_user
    
    # Check if current user can manage this user
    if not can_manage_user(current_user, user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to change this user's role"
        )
    
    # Validate role assignment based on current user's role
    if new_role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot assign SUPER_ADMIN role"
        )
    
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can only assign PROPRIETAIRE
        if new_role not in [UserRole.PROPRIETAIRE]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin can only assign PROPRIETAIRE role"
            )
    elif current_user.role == UserRole.PROPRIETAIRE:
        # Proprietaire can assign MANAGER and employees
        if new_role not in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only assign MANAGER, AGENT_COMPTOIR, or AGENT_PARC roles"
            )
    elif current_user.role == UserRole.MANAGER:
        # Manager can only assign employee roles
        if new_role not in [UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only assign AGENT_COMPTOIR or AGENT_PARC roles"
            )
    
    user.role = new_role
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/{user_id}/reset-password", response_model=dict)
async def reset_user_password(
    user_id: UUID,
    new_password: str = Query(..., min_length=8, max_length=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reset a user's password (admin action)
    
    Role-based access:
    - Must have permission to manage the target user
    - Uses same rules as user update
    
    Note: For security, notify the user via email (to be implemented)
    """
    # Get the target user
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Import helper
    from app.core.dependencies import can_manage_user
    
    # Check if current user can manage this user
    if not can_manage_user(current_user, user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to reset this user's password"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # TODO: Send email notification to user
    
    return {
        "message": "Password reset successfully",
        "detail": "User should receive an email notification"
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
        User.role.in_([UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC])
    ).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "by_role": {
            "proprietaire": proprietaires,
            "manager": managers,
            "employees": employees
        }
    }
