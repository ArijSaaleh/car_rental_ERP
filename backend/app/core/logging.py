"""
Structured logging configuration using structlog
"""
import logging
import structlog
from pythonjsonlogger import jsonlogger

from app.core.config import settings


def configure_logging():
    """
    Configure structured logging for the application
    """
    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer() if not settings.DEBUG else structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = None):
    """
    Get a structured logger instance
    
    Args:
        name: Logger name (typically __name__)
    
    Returns:
        Structured logger instance
    """
    return structlog.get_logger(name)


# Application loggers
app_logger = get_logger("app")
security_logger = get_logger("security")
database_logger = get_logger("database")
api_logger = get_logger("api")
