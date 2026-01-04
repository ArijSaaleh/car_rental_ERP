from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application configuration settings
    """
    # Database
    DATABASE_URL: str = "postgresql://car_rental_user:car_rental_password@localhost:5432/car_rental_db"
    
    # Redis Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT Authentication
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000"
    ]
    
    # Multi-Tenant Configuration
    DEFAULT_TENANT_PLAN: str = "basique"
    ENABLE_FEATURE_FLAGS: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
