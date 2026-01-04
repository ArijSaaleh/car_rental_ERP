"""
Comprehensive health check endpoints
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any
import time
from datetime import datetime

from app.core.database import get_db
from app.core.cache import cache
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Health"])


@router.get("/health")
async def basic_health_check():
    """
    Basic health check - always returns healthy if server is running
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/detailed", status_code=status.HTTP_200_OK)
async def detailed_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Detailed health check with database connectivity verification
    
    Returns:
        - status: overall health status (healthy/degraded/unhealthy)
        - checks: individual component health statuses
        - timestamp: current server time
    """
    checks = {}
    overall_status = "healthy"
    
    # Check database connectivity
    db_status = await check_database(db)
    checks["database"] = db_status
    if db_status["status"] != "healthy":
        overall_status = "degraded" if overall_status == "healthy" else "unhealthy"
    
    # Check database query performance
    db_perf = await check_database_performance(db)
    checks["database_performance"] = db_perf
    if db_perf["status"] != "healthy":
        overall_status = "degraded"
    
    # Check Redis cache
    redis_status = await check_redis()
    checks["redis"] = redis_status
    if redis_status["status"] != "healthy":
        # Redis is optional, so degraded instead of unhealthy
        overall_status = "degraded" if overall_status == "healthy" else overall_status
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }


async def check_database(db: Session) -> Dict[str, Any]:
    """
    Check database connectivity
    """
    try:
        start_time = time.time()
        db.execute(text("SELECT 1"))
        latency_ms = (time.time() - start_time) * 1000
        
        return {
            "status": "healthy",
            "latency_ms": round(latency_ms, 2),
            "message": "Database connection successful"
        }
    except Exception as e:
        logger.error("database_health_check_failed", error=str(e))
        return {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }


async def check_database_performance(db: Session) -> Dict[str, Any]:
    """
    Check database query performance
    """
    try:
        start_time = time.time()
        
        # Execute a more complex query to test performance
        result = db.execute(text("""
            SELECT 
                COUNT(*) as table_count
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        
        latency_ms = (time.time() - start_time) * 1000
        table_count = result.scalar()
        
        # Warn if query is slow
        status = "healthy" if latency_ms < 100 else "degraded"
        
        return {
            "status": status,
            "latency_ms": round(latency_ms, 2),
            "tables_count": table_count,
            "message": "Performance check completed"
        }
    except Exception as e:
        logger.error("database_performance_check_failed", error=str(e))
        return {
            "status": "degraded",
            "message": f"Performance check failed: {str(e)}"
        }


async def check_redis() -> Dict[str, Any]:
    """
    Check Redis cache connectivity
    """
    try:
        if cache.healthcheck():
            return {
                "status": "healthy",
                "message": "Redis connection successful"
            }
        else:
            return {
                "status": "degraded",
                "message": "Redis not configured or unavailable"
            }
    except Exception as e:
        logger.error("redis_health_check_failed", error=str(e))
        return {
            "status": "degraded",
            "message": f"Redis check failed: {str(e)}"
        }


@router.get("/health/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    """
    Kubernetes readiness probe - checks if app can handle requests
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return {"status": "not_ready"}, 503


@router.get("/health/liveness")
async def liveness_check():
    """
    Kubernetes liveness probe - checks if app is alive
    """
    return {"status": "alive"}
