from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import UserLogin, UserCreate, UserResponse, Token
from app.services.auth import AuthService
from app.models.user import User, UserRole


router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login endpoint - Authenticate user and return JWT token
    """
    user = AuthService.authenticate_user(db, credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = AuthService.create_access_token_for_user(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    Note: In production, this might be restricted or require email verification
    """
    # Validate role assignment
    # Only super_admin can create other super_admins
    # For now, we allow registration but default to AGENT_COMPTOIR role
    if user_data.role == UserRole.SUPER_ADMIN:
        user_data.role = UserRole.AGENT_COMPTOIR
    
    user = AuthService.create_user(db, user_data)
    return user


@router.post("/logout")
async def logout():
    """
    Logout endpoint
    Note: With JWT, logout is typically handled client-side by removing the token
    Server-side logout would require token blacklisting (future enhancement)
    """
    return {
        "message": "Successfully logged out",
        "detail": "Please remove the access token from your client"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information
    """
    return current_user
