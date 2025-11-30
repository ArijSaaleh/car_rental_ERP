from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine
from app.models import base  # Import all models
from app.api.v1.router import api_router
from app.middleware.tenant import TenantMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events
    """
    # Startup
    print("🚀 Starting Car Rental SaaS Platform...")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Multi-Tenant Mode: Enabled")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Car Rental SaaS Platform...")


app = FastAPI(
    title="Car Rental SaaS Platform",
    description="Plateforme SaaS Multi-Tenant pour la gestion de location de voitures",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Tenant Middleware (Multi-Tenancy isolation)
app.add_middleware(TenantMiddleware)

# Include API routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """
    Root endpoint - Health check
    """
    return {
        "message": "Car Rental SaaS Platform API",
        "version": "1.0.0",
        "status": "operational",
        "multi_tenant": True
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }
