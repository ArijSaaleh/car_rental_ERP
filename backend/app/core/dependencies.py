from typing import Optional
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
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current active user
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_tenant(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Optional[Agency]:
    """
    Get the current tenant (agency) from the authenticated user
    """
    if current_user.role == "super_admin":
        return None  # Super admin has access to all tenants
    
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any agency"
        )
    
    agency = db.query(Agency).filter(Agency.id == current_user.agency_id).first()
    if not agency or not agency.is_active:
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
    Role hierarchy: SUPER_ADMIN > PROPRIETAIRE > MANAGER > EMPLOYEE
    """
    role_hierarchy = {
        UserRole.SUPER_ADMIN: 4,
        UserRole.PROPRIETAIRE: 3,
        UserRole.MANAGER: 2,
        UserRole.EMPLOYEE: 1
    }
    
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        current_level = role_hierarchy.get(current_user.role, 0)
        required_level = role_hierarchy.get(minimum_role, 0)
        
        if current_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Minimum required role: {minimum_role.value}"
            )
        return current_user
    
    return permission_checker
