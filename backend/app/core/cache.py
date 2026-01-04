"""
Redis caching configuration and utilities
"""
import json
from typing import Any, Optional
from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class RedisCache:
    """
    Redis cache manager with JSON serialization
    """
    
    def __init__(self):
        self.redis_client: Optional[Redis] = None
        self._connect()
    
    def _connect(self):
        """
        Initialize Redis connection
        """
        try:
            if hasattr(settings, 'REDIS_URL') and settings.REDIS_URL:
                self.redis_client = Redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                self.redis_client.ping()
                logger.info("redis_connected", url=settings.REDIS_URL)
            else:
                logger.warning("redis_not_configured", message="REDIS_URL not set, caching disabled")
        except RedisError as e:
            logger.error("redis_connection_failed", error=str(e))
            self.redis_client = None
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        if not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except (RedisError, json.JSONDecodeError) as e:
            logger.error("redis_get_failed", key=key, error=str(e))
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """
        Set value in cache with TTL
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (default: 5 minutes)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            serialized = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, serialized)
            return True
        except (RedisError, TypeError, json.JSONEncodeError) as e:
            logger.error("redis_set_failed", key=key, error=str(e))
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete key from cache
        
        Args:
            key: Cache key to delete
            
        Returns:
            True if successful, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except RedisError as e:
            logger.error("redis_delete_failed", key=key, error=str(e))
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern
        
        Args:
            pattern: Key pattern (e.g., "agency:*")
            
        Returns:
            Number of keys deleted
        """
        if not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except RedisError as e:
            logger.error("redis_delete_pattern_failed", pattern=pattern, error=str(e))
            return 0
    
    def healthcheck(self) -> bool:
        """
        Check if Redis is healthy
        
        Returns:
            True if healthy, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            return self.redis_client.ping()
        except RedisError:
            return False


# Global cache instance
cache = RedisCache()


# Cache key builders
def agency_cache_key(agency_id: str) -> str:
    """Build cache key for agency"""
    return f"agency:{agency_id}"


def agencies_list_cache_key() -> str:
    """Build cache key for agencies list"""
    return "agencies:list"


def vehicle_categories_cache_key(agency_id: str) -> str:
    """Build cache key for vehicle categories"""
    return f"vehicle_categories:{agency_id}"
