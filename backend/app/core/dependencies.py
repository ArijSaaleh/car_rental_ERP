from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.models.agency import Agency


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    # Check is_active properly
    if not user.is_active:  # type: ignore
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current active user
    """
    if not current_user.is_active:  # type: ignore
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_tenant(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Optional[Agency]:
    """
    Get the current tenant (agency) from the authenticated user
    """
    if current_user.role == UserRole.SUPER_ADMIN:  # type: ignore
        return None  # Super admin has access to all tenants
    
    if not current_user.agency_id:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any agency"
        )
    
    agency = db.query(Agency).filter(Agency.id == current_user.agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agency not found or inactive"
        )
    
    # Check is_active properly
    if not agency.is_active:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agency is not active"
        )
    
    return agency


def require_role(allowed_roles: list[str]):
    """
    Dependency to check if the current user has one of the allowed roles
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def check_permission(minimum_role: UserRole):
    """
    Dependency to check if the current user has at least the minimum required role
    Role hierarchy: SUPER_ADMIN > PROPRIETAIRE > MANAGER > AGENT_COMPTOIR > AGENT_PARC
    """
    role_hierarchy = {
        UserRole.SUPER_ADMIN: 5,
        UserRole.PROPRIETAIRE: 4,
        UserRole.MANAGER: 3,
        UserRole.AGENT_COMPTOIR: 2,
        UserRole.AGENT_PARC: 1,
        UserRole.CLIENT: 0
    }
    
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        # Get role value - handle SQLAlchemy column type
        user_role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)  # type: ignore
        current_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(minimum_role, 0)
        
        if current_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {minimum_role.value} or higher"
            )
        return current_user
    
    return permission_checker


def verify_agency_access(current_user: User, agency_id: UUID, db: Session) -> Agency:
    """
    Verify that a user has access to a specific agency
    
    Access rules:
    - SUPER_ADMIN: Access to all agencies
    - PROPRIETAIRE: Access only to agencies they own
    - MANAGER/AGENT_*: Access only to their assigned agency
    """
    # Get user's actual role value
    user_role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)  # type: ignore
    
    # Super admin has access to all agencies
    if user_role == UserRole.SUPER_ADMIN:  # type: ignore
        agency = db.query(Agency).filter(Agency.id == agency_id).first()
        if not agency:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agency not found"
            )
        return agency
    
    # Proprietaire can only access agencies they own
    if user_role == UserRole.PROPRIETAIRE:  # type: ignore
        agency = db.query(Agency).filter(
            Agency.id == agency_id,
            Agency.owner_id == current_user.id
        ).first()
        if not agency:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this agency"
            )
        return agency
    
    # Manager and employees can only access their own agency
    user_agency_id = current_user.agency_id  # type: ignore
    if user_agency_id != agency_id:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your assigned agency"
        )
    
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )
    
    return agency


def can_manage_user(manager: User, target_user: User, db: Session) -> bool:
    """
    Check if a user can manage (create/update/delete) another user
    
    Rules:
    - SUPER_ADMIN: Can manage all users except other SUPER_ADMINs
    - PROPRIETAIRE: Can manage MANAGER and employees in their agencies
    - MANAGER: Can manage only AGENT_COMPTOIR and AGENT_PARC in their agency
    - Others: Cannot manage users
    """
    # Get role values
    manager_role = manager.role if isinstance(manager.role, UserRole) else UserRole(manager.role)  # type: ignore
    target_role = target_user.role if isinstance(target_user.role, UserRole) else UserRole(target_user.role)  # type: ignore
    
    # Super admin can manage everyone except other super admins
    if manager_role == UserRole.SUPER_ADMIN:  # type: ignore
        return target_role != UserRole.SUPER_ADMIN  # type: ignore
    
    # Proprietaire can manage managers and employees in their owned agencies
    if manager_role == UserRole.PROPRIETAIRE:  # type: ignore
        # Check if target user is in one of the proprietaire's agencies
        if target_role in [UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE]:  # type: ignore
            return False
        
        target_agency_id = target_user.agency_id  # type: ignore
        if target_agency_id:  # type: ignore
            agency = db.query(Agency).filter(
                Agency.id == target_agency_id,
                Agency.owner_id == manager.id
            ).first()
            return agency is not None
        return False
    
    # Manager can manage only agents in their agency
    if manager_role == UserRole.MANAGER:  # type: ignore
        if target_role not in [UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:  # type: ignore
            return False
        manager_agency_id = manager.agency_id  # type: ignore
        target_agency_id = target_user.agency_id  # type: ignore
        return manager_agency_id == target_agency_id  # type: ignore
    
    # Employees cannot manage users
    return False
