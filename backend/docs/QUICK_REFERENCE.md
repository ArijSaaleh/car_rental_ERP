# Quick Reference: Database Models

## All 19 Models at a Glance

### Core (7)
| Model | Table | Key Fields | Purpose |
|-------|-------|------------|---------|
| **Agency** | agencies | id, owner_id, subscription_plan | Multi-tenant isolation |
| **User** | users | id, email, role, agency_id | Authentication & authorization |
| **Vehicle** | vehicles | id, license_plate, status | Fleet management |
| **Customer** | customers | id, cin_number, license_number | Client management |
| **Booking** | bookings | id, booking_number, status | Reservations |
| **Contract** | contracts | id, contract_number, pdf_url | Legal contracts |
| **Payment** | payments | id, payment_reference, gateway | Payment processing |

### Maintenance & Damage (2)
| Model | Table | Key Fields | Purpose |
|-------|-------|------------|---------|
| **Maintenance** | maintenances | id, maintenance_number, type | Vehicle maintenance |
| **DamageReport** | damage_reports | id, report_number, severity | Incident tracking |

### Financial (1)
| Model | Table | Key Fields | Purpose |
|-------|-------|------------|---------|
| **Invoice** | invoices | id, invoice_number, total_amount | Billing |

### Documents & Notifications (2)
| Model | Table | Key Fields | Purpose |
|-------|-------|------------|---------|
| **Document** | documents | id, document_type, file_path | File storage |
| **Notification** | notifications | id, notification_type, channel | Alerts |

### Pricing & Discounts (3)
| Model | Table | Key Fields | Purpose |
|-------|-------|------------|---------|
| **PricingRule** | pricing_rules | id, rule_type, adjustment_value | Dynamic pricing |
| **Discount** | discounts | id, code, discount_value | Promo codes |
| **BookingDiscount** | booking_discounts | booking_id, discount_id | Applied discounts |

### Reviews & Insurance (3)
| Model | Table | Key Fields | Purpose |
|-------|-------|------------|---------|
| **Review** | reviews | id, overall_rating, comment | Customer feedback |
| **Insurance** | insurances | id, policy_number, coverage_amount | Insurance policies |
| **InsuranceClaim** | insurance_claims | id, claim_number, status | Claims |

### Audit (1)
| Model | Table | Key Fields | Purpose |
|-------|-------|------------|---------|
| **AuditLog** | audit_logs | id, action, resource_type | Audit trail |

---

## Common Queries

### Check Vehicle Availability
```python
available_vehicles = db.query(Vehicle).filter(
    Vehicle.agency_id == agency_id,
    Vehicle.status == VehicleStatus.DISPONIBLE,
    ~Vehicle.id.in_(
        db.query(Booking.vehicle_id).filter(
            Booking.start_date <= end_date,
            Booking.end_date >= start_date,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
        )
    )
).all()
```

### Get Upcoming Maintenance
```python
upcoming = db.query(Maintenance).filter(
    Maintenance.agency_id == agency_id,
    Maintenance.status == MaintenanceStatus.SCHEDULED,
    Maintenance.scheduled_date >= today,
    Maintenance.scheduled_date <= next_week
).all()
```

### Calculate Booking Total with Discounts
```python
subtotal = booking.daily_rate * booking.duration_days
discount_amount = sum(bd.discount_amount for bd in booking.booking_discounts)
tax = (subtotal - discount_amount) * 0.19
total = subtotal - discount_amount + tax + Decimal('0.600')  # timbre fiscal
```

### Get Pending Invoices
```python
pending = db.query(Invoice).filter(
    Invoice.agency_id == agency_id,
    Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.SENT]),
    Invoice.due_date < today
).all()
```

### Get Expiring Insurances
```python
expiring = db.query(Insurance).filter(
    Insurance.agency_id == agency_id,
    Insurance.status == InsuranceStatus.ACTIVE,
    Insurance.end_date <= days_30_from_now,
    Insurance.reminder_sent_30_days == False
).all()
```

---

## Enum Quick Reference

### UserRole
- `SUPER_ADMIN` - Platform admin
- `PROPRIETAIRE` - Agency owner
- `MANAGER` - Agency manager
- `EMPLOYEE` - Agency employee

### VehicleStatus
- `DISPONIBLE` - Available
- `LOUE` - Rented
- `MAINTENANCE` - Under maintenance
- `HORS_SERVICE` - Out of service

### BookingStatus
- `PENDING` - Awaiting confirmation
- `CONFIRMED` - Confirmed
- `IN_PROGRESS` - Vehicle picked up
- `COMPLETED` - Returned
- `CANCELLED` - Cancelled

### PaymentStatus
- `PENDING` - Not paid
- `PROCESSING` - In progress
- `COMPLETED` - Paid
- `FAILED` - Failed
- `REFUNDED` - Refunded

### MaintenanceType
- `PREVENTIVE` - Scheduled maintenance
- `CORRECTIVE` - Repair
- `INSPECTION` - Technical control
- `OIL_CHANGE` - Oil change
- `TIRE_CHANGE` - Tire replacement
- `BRAKE_SERVICE` - Brake service
- `BATTERY` - Battery replacement

### DamageSeverity
- `MINOR` - Small scratch/dent
- `MODERATE` - Moderate damage
- `MAJOR` - Major repair needed
- `TOTAL_LOSS` - Total loss

### InvoiceStatus
- `DRAFT` - Not finalized
- `ISSUED` - Issued
- `SENT` - Sent to customer
- `PAID` - Paid
- `PARTIALLY_PAID` - Partially paid
- `OVERDUE` - Payment overdue
- `CANCELLED` - Cancelled

### NotificationChannel
- `EMAIL` - Email notification
- `SMS` - SMS message
- `IN_APP` - In-app notification
- `PUSH` - Push notification

### DiscountType
- `PERCENTAGE` - Percentage discount
- `FIXED_AMOUNT` - Fixed amount off
- `FREE_DAYS` - Free rental days

---

## Foreign Key Relationships

### Agency (Parent of Everything)
```
Agency ─┬─► User (employees)
        ├─► Vehicle
        ├─► Customer
        ├─► Booking
        ├─► Contract
        ├─► Payment
        ├─► Maintenance
        ├─► DamageReport
        ├─► Invoice
        ├─► Document
        ├─► Notification
        ├─► PricingRule
        ├─► Discount
        ├─► Review
        └─► Insurance
```

### Booking (Central Hub)
```
Booking ─┬─► Contract (1:1)
         ├─► Payment (1:M)
         ├─► Invoice (1:M)
         ├─► DamageReport (1:M)
         ├─► Document (1:M)
         ├─► Review (1:1)
         └─► BookingDiscount (M:M with Discount)
```

### Vehicle
```
Vehicle ─┬─► Booking (1:M)
         ├─► Maintenance (1:M)
         ├─► DamageReport (1:M)
         ├─► Document (1:M)
         ├─► Review (1:M)
         └─► Insurance (1:M)
```

---

## Important Constraints

### Unique Constraints
```
- agencies.tax_id
- users.email
- vehicles.license_plate
- vehicles.vin
- customers.cin_number
- bookings.booking_number
- contracts.contract_number
- payments.payment_reference
- maintenances.maintenance_number
- damage_reports.report_number
- invoices.invoice_number
- documents.document_number
- discounts.code
- insurances.policy_number
- insurance_claims.claim_number
```

### NOT NULL Fields (Critical)
```
- All id fields
- All agency_id (except User, Notification)
- booking.vehicle_id, customer_id
- payment.amount
- invoice.total_amount
- vehicle.license_plate
- customer.license_number
```

---

## Tunisian-Specific Constants

### Tax Rates
```python
TVA_RATE = Decimal('19.00')  # 19% VAT
TIMBRE_FISCAL_BOOKING = Decimal('0.600')  # TND
TIMBRE_FISCAL_INVOICE = Decimal('1.000')  # TND
```

### Payment Gateways
```python
PAYMEE_GATEWAY = "paymee"
CLICTOPAY_GATEWAY = "clictopay"
```

### Default Currency
```python
CURRENCY = "TND"  # Tunisian Dinar
DECIMAL_PLACES = 3  # TND uses 3 decimal places
```

---

## Common Patterns

### Creating a Booking with Discount
```python
# 1. Create booking
booking = Booking(
    agency_id=agency_id,
    vehicle_id=vehicle_id,
    customer_id=customer_id,
    start_date=start_date,
    end_date=end_date,
    daily_rate=vehicle.daily_rate,
    duration_days=(end_date - start_date).days
)

# 2. Apply discount code
discount = db.query(Discount).filter_by(code=promo_code).first()
if discount:
    discount_amount = calculate_discount(booking.subtotal, discount)
    booking_discount = BookingDiscount(
        booking=booking,
        discount=discount,
        discount_amount=discount_amount
    )
    db.add(booking_discount)

# 3. Calculate totals
booking.subtotal = booking.daily_rate * booking.duration_days
booking.total_amount = calculate_total(booking)
db.add(booking)
db.commit()
```

### Reporting Damage with Insurance Claim
```python
# 1. Create damage report
damage = DamageReport(
    agency_id=agency_id,
    vehicle_id=vehicle_id,
    booking_id=booking_id,
    customer_id=customer_id,
    damage_type="collision",
    severity=DamageSeverity.MAJOR,
    description="Front bumper damaged"
)
db.add(damage)

# 2. If insurance required
if damage.severity in [DamageSeverity.MAJOR, DamageSeverity.TOTAL_LOSS]:
    insurance = db.query(Insurance).filter_by(
        vehicle_id=vehicle_id,
        status=InsuranceStatus.ACTIVE
    ).first()
    
    if insurance:
        claim = InsuranceClaim(
            agency_id=agency_id,
            insurance_id=insurance.id,
            damage_report=damage,
            incident_date=damage.occurred_at,
            claimed_amount=damage.estimated_repair_cost
        )
        db.add(claim)

db.commit()
```

### Scheduling Maintenance
```python
# Check mileage
if vehicle.mileage >= vehicle.next_maintenance_mileage:
    maintenance = Maintenance(
        agency_id=agency_id,
        vehicle_id=vehicle.id,
        maintenance_type=MaintenanceType.PREVENTIVE,
        scheduled_date=datetime.now() + timedelta(days=7),
        description="Regular maintenance due"
    )
    
    # Update vehicle status
    vehicle.status = VehicleStatus.MAINTENANCE
    
    # Create notification
    notification = Notification(
        agency_id=agency_id,
        user_id=manager_id,
        notification_type=NotificationType.VEHICLE_MAINTENANCE_DUE,
        channel=NotificationChannel.IN_APP,
        title="Maintenance Required",
        message=f"Vehicle {vehicle.license_plate} needs maintenance"
    )
    
    db.add_all([maintenance, notification])
    db.commit()
```

---

## Database Indexes to Create

### Priority 1 (Critical)
```sql
CREATE INDEX idx_bookings_agency_dates ON bookings(agency_id, start_date, end_date);
CREATE INDEX idx_vehicles_agency_status ON vehicles(agency_id, status);
CREATE INDEX idx_payments_agency_status ON payments(agency_id, status);
```

### Priority 2 (Important)
```sql
CREATE INDEX idx_maintenances_vehicle_date ON maintenances(vehicle_id, scheduled_date);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_invoices_agency_status ON invoices(agency_id, status);
```

### Priority 3 (Performance)
```sql
CREATE INDEX idx_damage_reports_vehicle ON damage_reports(vehicle_id);
CREATE INDEX idx_reviews_vehicle ON reviews(vehicle_id);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
```

---

## Migration Checklist

- [ ] Create Alembic migration: `alembic revision --autogenerate -m "Add all new models"`
- [ ] Review generated migration file
- [ ] Test migration on dev database: `alembic upgrade head`
- [ ] Create indexes (see above)
- [ ] Verify relationships work in Python shell
- [ ] Seed initial data (pricing rules, notification templates)
- [ ] Run integration tests
- [ ] Deploy to staging
- [ ] Backup production database
- [ ] Deploy to production

---

*Quick Reference v1.0 - 2025-11-30*
