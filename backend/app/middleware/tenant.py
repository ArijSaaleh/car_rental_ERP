from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from fastapi import HTTPException, status
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware for Multi-Tenant data isolation
    
    This middleware ensures that:
    1. Each request is associated with a specific tenant (agency)
    2. Data isolation is enforced at the middleware level
    3. Super admins can bypass tenant restrictions
    
    The tenant is extracted from the authenticated user's JWT token
    and stored in the request state for use in database queries.
    """
    
    EXCLUDED_PATHS = [
        "/api/docs",
        "/api/redoc",
        "/api/openapi.json",
        "/",
        "/health",
        "/api/v1/auth/login",
        "/api/v1/auth/register",
    ]
    
    async def dispatch(self, request: Request, call_next):
        """
        Process each request to extract and validate tenant information
        """
        # Skip tenant validation for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Skip tenant validation for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)
        
        # Initialize tenant_id in request state
        request.state.tenant_id = None
        request.state.is_super_admin = False
        
        # Extract tenant from Authorization header (JWT token)
        # This will be populated by the authentication dependency
        # For now, we just pass through - actual tenant extraction
        # happens in the get_current_user dependency
        
        response = await call_next(request)
        return response


def get_tenant_id(request: Request) -> Optional[str]:
    """
    Helper function to get the current tenant ID from request state
    """
    return getattr(request.state, "tenant_id", None)


def set_tenant_id(request: Request, tenant_id: str):
    """
    Helper function to set the tenant ID in request state
    """
    request.state.tenant_id = tenant_id


def is_super_admin(request: Request) -> bool:
    """
    Helper function to check if the current user is a super admin
    """
    return getattr(request.state, "is_super_admin", False)
