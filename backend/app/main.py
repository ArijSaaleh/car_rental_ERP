from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import engine
from app.core.logging import configure_logging, get_logger
from app.models import base  # Import all models
from app.api.v1.router import api_router
from app.middleware.tenant import TenantMiddleware
from app.core.rate_limiter import limiter, rate_limit_exceeded_handler

# Configure logging at module level
configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events
    """
    # Startup
    logger.info(
        "starting_application",
        environment=settings.ENVIRONMENT,
        multi_tenant=True
    )
    
    yield
    
    # Shutdown
    logger.info("shutting_down_application")


app = FastAPI(
    title="Car Rental SaaS Platform",
    description="""
    ## 🚗 Plateforme SaaS Multi-Tenant pour la gestion de location de voitures
    
    ### Fonctionnalités
    
    * **Multi-Tenancy**: Isolation stricte des données par agence
    * **Authentification JWT**: Sécurité avec gestion des rôles (Super Admin, Propriétaire, Manager, Employé)
    * **Gestion de Flotte**: CRUD complet pour les véhicules
    * **Réservations**: Système de booking avec vérification de disponibilité
    * **Contrats PDF**: Génération automatique conformes à la législation tunisienne
    * **Paiements**: Intégration Paymee et ClicToPay
    * **Reporting**: Dashboard KPIs et statistiques
    
    ### Rôles Utilisateurs
    
    * **SUPER_ADMIN**: Accès complet à la plateforme
    * **PROPRIETAIRE**: Gestion de plusieurs agences
    * **MANAGER**: Gestion d'une agence
    * **AGENT_COMPTOIR**: Opérations de location
    * **AGENT_PARC**: Gestion des véhicules
    
    ### Rate Limiting
    
    * Login: 5 requêtes/minute par IP
    * Register: 3 requêtes/heure par IP
    * Autres endpoints: 200 requêtes/heure par IP
    """,
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    contact={
        "name": "Car Rental Support",
        "email": "support@carrental.tn",
    },
    license_info={
        "name": "Proprietary",
    },
)

# Configure rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Configure CORS
logger.info("configuring_cors", origins=settings.CORS_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # Use configured origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
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
