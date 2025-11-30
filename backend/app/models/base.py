# Import all models here to ensure they are registered with SQLAlchemy
from app.core.database import Base
from app.models.agency import Agency
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.models.booking import Booking
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.audit_log import AuditLog
from app.models.maintenance import Maintenance
from app.models.damage_report import DamageReport
from app.models.invoice import Invoice
from app.models.document import Document
from app.models.notification import Notification
from app.models.pricing_rule import PricingRule
from app.models.discount import Discount, BookingDiscount
from app.models.review import Review
from app.models.insurance import Insurance, InsuranceClaim

__all__ = [
    "Base", 
    "Agency", 
    "User", 
    "Vehicle", 
    "Customer", 
    "Booking", 
    "Contract", 
    "Payment", 
    "AuditLog",
    "Maintenance",
    "DamageReport",
    "Invoice",
    "Document",
    "Notification",
    "PricingRule",
    "Discount",
    "BookingDiscount",
    "Review",
    "Insurance",
    "InsuranceClaim"
]
