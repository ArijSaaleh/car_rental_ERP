# Models package
from app.models.agency import Agency, SubscriptionPlan
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleStatus, FuelType, TransmissionType
from app.models.customer import Customer, CustomerType
from app.models.booking import Booking, BookingStatus, PaymentStatus as BookingPaymentStatus
from app.models.contract import Contract, ContractStatus
from app.models.payment import Payment, PaymentMethod, PaymentType, PaymentStatus
from app.models.audit_log import AuditLog
from app.models.maintenance import Maintenance, MaintenanceType, MaintenanceStatus
from app.models.damage_report import DamageReport, DamageSeverity, DamageStatus
from app.models.invoice import Invoice, InvoiceStatus, InvoiceType
from app.models.document import Document, DocumentType
from app.models.notification import Notification, NotificationType, NotificationChannel, NotificationPriority
from app.models.pricing_rule import PricingRule, PricingRuleType, PricingRuleStatus
from app.models.discount import Discount, BookingDiscount, DiscountType, DiscountStatus
from app.models.review import Review, ReviewStatus
from app.models.insurance import Insurance, InsuranceClaim, InsuranceType, InsuranceStatus

__all__ = [
    # Core models
    "Agency",
    "SubscriptionPlan",
    "User",
    "UserRole",
    "Vehicle",
    "VehicleStatus",
    "FuelType",
    "TransmissionType",
    "Customer",
    "CustomerType",
    "Booking",
    "BookingStatus",
    "BookingPaymentStatus",
    "Contract",
    "ContractStatus",
    "Payment",
    "PaymentMethod",
    "PaymentType",
    "PaymentStatus",
    "AuditLog",
    # Maintenance & Damage
    "Maintenance",
    "MaintenanceType",
    "MaintenanceStatus",
    "DamageReport",
    "DamageSeverity",
    "DamageStatus",
    # Financial
    "Invoice",
    "InvoiceStatus",
    "InvoiceType",
    # Documents & Notifications
    "Document",
    "DocumentType",
    "Notification",
    "NotificationType",
    "NotificationChannel",
    "NotificationPriority",
    # Pricing & Discounts
    "PricingRule",
    "PricingRuleType",
    "PricingRuleStatus",
    "Discount",
    "BookingDiscount",
    "DiscountType",
    "DiscountStatus",
    # Reviews
    "Review",
    "ReviewStatus",
    # Insurance
    "Insurance",
    "InsuranceClaim",
    "InsuranceType",
    "InsuranceStatus",
]
