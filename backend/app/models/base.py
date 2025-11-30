# Import all models here to ensure they are registered with SQLAlchemy
from app.core.database import Base
from app.models.agency import Agency
from app.models.user import User
from app.models.vehicle import Vehicle

__all__ = ["Base", "Agency", "User", "Vehicle"]
