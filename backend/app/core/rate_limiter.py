"""
Rate limiting configuration using slowapi
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from starlette.responses import JSONResponse


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom handler for rate limit exceeded errors
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Rate limit exceeded: {exc.detail}",
            "error": "too_many_requests"
        }
    )


# Initialize limiter with remote address as key
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/hour"],
    storage_uri="memory://",  # Use Redis in production: redis://localhost:6379
    strategy="fixed-window"
)
