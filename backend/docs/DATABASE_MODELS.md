# Database Models Documentation

## Overview
Complete database schema for the Car Rental SaaS platform with multi-tenancy support for the Tunisian market.

## Model Summary

| Category | Models | Count |
|----------|--------|-------|
| **Core** | Agency, User, Vehicle, Customer, Booking, Contract, Payment | 7 |
| **Maintenance & Damage** | Maintenance, DamageReport | 2 |
| **Financial** | Invoice, Payment (already counted) | 1 |
| **Documents & Notifications** | Document, Notification | 2 |
| **Pricing & Discounts** | PricingRule, Discount, BookingDiscount | 3 |
| **Reviews & Insurance** | Review, Insurance, InsuranceClaim | 3 |
| **Audit** | AuditLog | 1 |
| **TOTAL** | | **19 models** |

---

## Core Models

### 1. Agency
**Table**: `agencies`  
**Description**: Multi-tenant agency entities (each agency is an isolated tenant)

**Key Fields**:
- `id` (UUID, PK) - Primary identifier
- `owner_id` (UUID, FK→users.id) - Proprietaire who owns this agency
- `name`, `legal_name`, `tax_id` - Business information
- `subscription_plan` - BASIQUE, STANDARD, PREMIUM, ENTREPRISE
- `is_active` - Agency active status

**Relationships**:
- `owner` → User (proprietaire who owns the agency)
- `users` → List[User] (employees of the agency)
- `vehicles` → List[Vehicle]
- `customers` → List[Customer]
- `bookings` → List[Booking]
- `contracts` → List[Contract]
- `payments` → List[Payment]
- `maintenances` → List[Maintenance]
- `damage_reports` → List[DamageReport]
- `invoices` → List[Invoice]
- `documents` → List[Document]
- `notifications` → List[Notification]
- `pricing_rules` → List[PricingRule]
- `discounts` → List[Discount]
- `reviews` → List[Review]
- `insurances` → List[Insurance]

**CASCADE Behavior**: DELETE → Cascade all child entities

---

### 2. User
**Table**: `users`  
**Description**: Platform users with role-based access

**Key Fields**:
- `id` (UUID, PK)
- `email` (unique) - User email
- `hashed_password` - Bcrypt hashed password
- `role` - SUPER_ADMIN, PROPRIETAIRE, MANAGER, EMPLOYEE
- `agency_id` (FK→agencies.id, nullable) - Null for super_admin

**Relationships**:
- `agency` → Agency (employer agency)
- `owned_agencies` → List[Agency] (agencies owned by proprietaire)
- `notifications` → List[Notification]

**Special Features**:
- Super Admin: `agency_id` is NULL
- Proprietaire: Can own multiple agencies via `owner_id` in Agency
- Multi-agency ownership supported

---

### 3. Vehicle
**Table**: `vehicles`  
**Description**: Fleet vehicles for rental

**Key Fields**:
- `id` (UUID, PK)
- `agency_id` (FK→agencies.id) - Multi-tenant isolation
- `license_plate` (unique) - Immatriculation
- `brand`, `model`, `year` - Vehicle details
- `status` - DISPONIBLE, LOUE, MAINTENANCE, HORS_SERVICE
- `fuel_type` - ESSENCE, DIESEL, HYBRIDE, ELECTRIQUE
- `transmission` - MANUELLE, AUTOMATIQUE
- `mileage` - Current odometer reading
- `insurance_expiry`, `technical_control_expiry` - Legal dates

**Relationships**:
- `agency` → Agency
- `bookings` → List[Booking]
- `maintenances` → List[Maintenance]
- `damage_reports` → List[DamageReport]
- `documents` → List[Document]
- `reviews` → List[Review]
- `insurances` → List[Insurance]

---

### 4. Customer
**Table**: `customers`  
**Description**: Individual and corporate clients

**Key Fields**:
- `id` (Integer, PK)
- `agency_id` (FK→agencies.id)
- `customer_type` - INDIVIDUAL, COMPANY
- `first_name`, `last_name`, `email`, `phone`
- `cin_number` (unique) - Tunisian National ID
- `license_number` - Driver's license
- `company_name`, `company_tax_id` - For COMPANY type
- `is_blacklisted` - Blacklist status

**Relationships**:
- `agency` → Agency
- `bookings` → List[Booking]
- `damage_reports` → List[DamageReport]
- `invoices` → List[Invoice]
- `documents` → List[Document]
- `notifications` → List[Notification]
- `reviews` → List[Review]

---

### 5. Booking
**Table**: `bookings`  
**Description**: Vehicle reservations

**Key Fields**:
- `id` (Integer, PK)
- `booking_number` (unique)
- `agency_id`, `vehicle_id`, `customer_id`, `created_by_user_id`
- `start_date`, `end_date` - Rental period
- `daily_rate`, `duration_days`, `total_amount`
- `timbre_fiscal` (default 0.600 TND) - Tunisian stamp tax
- `status` - PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- `payment_status` - PENDING, PAID, PARTIALLY_PAID, REFUNDED
- `initial_mileage`, `final_mileage`, `mileage_limit`
- `initial_fuel_level`, `final_fuel_level`

**Relationships**:
- `agency` → Agency
- `vehicle` → Vehicle
- `customer` → Customer
- `created_by` → User
- `contract` → Contract (one-to-one)
- `payments` → List[Payment]
- `damage_reports` → List[DamageReport]
- `invoices` → List[Invoice]
- `documents` → List[Document]
- `review` → Review (one-to-one)
- `booking_discounts` → List[BookingDiscount]

---

### 6. Contract
**Table**: `contracts`  
**Description**: Legal rental contracts with digital signatures

**Key Fields**:
- `id` (Integer, PK)
- `contract_number` (unique)
- `agency_id`, `booking_id` (unique)
- `status` - DRAFT, PENDING_SIGNATURE, SIGNED, COMPLETED, CANCELLED
- `pdf_url`, `pdf_storage_path` - Generated PDF
- `customer_signature_data`, `customer_signed_at`
- `agent_signature_data`, `agent_signed_at`, `agent_id`
- `terms_and_conditions` - General terms
- `special_clauses` (JSON) - Additional clauses
- `timbre_fiscal_amount` - "0.600 TND"

**Relationships**:
- `agency` → Agency
- `booking` → Booking
- `agent` → User (who signed for agency)
- `documents` → List[Document]

---

### 7. Payment
**Table**: `payments`  
**Description**: Payment transactions with Tunisian gateway integration

**Key Fields**:
- `id` (Integer, PK)
- `payment_reference` (unique)
- `agency_id`, `booking_id`, `invoice_id`
- `payment_method` - CASH, CARD, PAYMEE, CLICTOPAY, etc.
- `payment_type` - DEPOSIT, RENTAL_FEE, EXTRA_CHARGES, REFUND
- `amount`, `currency` (default TND)
- `status` - PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
- `gateway` - paymee, clictopay, stripe
- `gateway_transaction_id`, `gateway_response` (JSON)
- `card_last4`, `card_brand` - Tokenized card info

**Relationships**:
- `agency` → Agency
- `booking` → Booking
- `invoice` → Invoice
- `processed_by` → User

---

## Maintenance & Damage Models

### 8. Maintenance
**Table**: `maintenances`  
**Description**: Vehicle maintenance tracking

**Key Fields**:
- `id` (Integer, PK)
- `maintenance_number` (unique)
- `agency_id`, `vehicle_id`
- `maintenance_type` - PREVENTIVE, CORRECTIVE, INSPECTION, OIL_CHANGE, etc.
- `status` - SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- `scheduled_date`, `started_at`, `completed_at`
- `mileage_at_maintenance`, `next_maintenance_mileage`
- `garage_name`, `mechanic_name`
- `estimated_cost`, `actual_cost`, `parts_cost`, `labor_cost`
- `invoice_url`

**Relationships**:
- `agency` → Agency
- `vehicle` → Vehicle
- `created_by` → User
- `completed_by` → User

---

### 9. DamageReport
**Table**: `damage_reports`  
**Description**: Vehicle damage and incident tracking

**Key Fields**:
- `id` (Integer, PK)
- `report_number` (unique)
- `agency_id`, `vehicle_id`, `booking_id`, `customer_id`
- `damage_type` - Type of damage (collision, scratch, glass breakage, etc.)
- `severity` - MINOR, MODERATE, MAJOR, TOTAL_LOSS
- `status` - REPORTED, ASSESSING, REPAIRING, REPAIRED, INSURANCE_CLAIM, CLOSED
- `occurred_at`, `reported_at`, `location_address`
- `customer_responsible`, `third_party_involved`, `third_party_info` (JSON)
- `police_report_filed`, `police_report_number`
- `insurance_claim_filed`, `insurance_claim_number`
- `estimated_repair_cost`, `actual_repair_cost`
- `photos` (JSON), `documents` (JSON)

**Relationships**:
- `agency` → Agency
- `vehicle` → Vehicle
- `booking` → Booking
- `customer` → Customer
- `reported_by` → User
- `assessed_by` → User
- `insurance_claim` → InsuranceClaim (one-to-one)

---

## Financial Models

### 10. Invoice
**Table**: `invoices`  
**Description**: Tunisian-compliant invoicing

**Key Fields**:
- `id` (Integer, PK)
- `invoice_number` (unique)
- `agency_id`, `booking_id`, `customer_id`
- `invoice_type` - RENTAL, DEPOSIT, EXTRA_CHARGES, DAMAGE, CREDIT_NOTE
- `status` - DRAFT, ISSUED, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
- `invoice_date`, `due_date`, `paid_date`
- `subtotal`, `tax_rate` (default 19%), `tax_amount`
- `timbre_fiscal` (default 1.000 TND), `discount_amount`
- `total_amount`, `paid_amount`, `balance_due`
- `line_items` (JSON) - Array of invoice lines
- `agency_tax_id`, `customer_tax_id` - Tunisian fiscal IDs
- `pdf_url`, `sent_to_email`

**Relationships**:
- `agency` → Agency
- `booking` → Booking
- `customer` → Customer
- `created_by` → User
- `payments` → List[Payment]

---

## Document & Notification Models

### 11. Document
**Table**: `documents`  
**Description**: Centralized document management system

**Key Fields**:
- `id` (Integer, PK)
- `document_number` (unique)
- `agency_id`
- `document_type` - VEHICLE_REGISTRATION, INSURANCE_POLICY, CUSTOMER_ID, DRIVERS_LICENSE, SIGNED_CONTRACT, DAMAGE_PHOTO, INVOICE, etc.
- `entity_type`, `entity_id` - Polymorphic reference
- `vehicle_id`, `customer_id`, `booking_id`, `contract_id` - Direct FKs
- `filename`, `original_filename`, `file_path`, `file_url`
- `file_size`, `mime_type`, `file_extension`
- `ocr_text`, `is_ocr_processed` - OCR extraction
- `document_date`, `expiry_date`
- `is_public`, `is_confidential`, `password_protected`
- `is_verified`, `verified_by_user_id`, `verified_at`

**Relationships**:
- `agency` → Agency
- `vehicle` → Vehicle
- `customer` → Customer
- `booking` → Booking
- `contract` → Contract
- `uploaded_by` → User
- `verified_by` → User

---

### 12. Notification
**Table**: `notifications`  
**Description**: Multi-channel notification system

**Key Fields**:
- `id` (Integer, PK)
- `agency_id`, `user_id`, `customer_id`
- `notification_type` - BOOKING_CREATED, PAYMENT_RECEIVED, VEHICLE_MAINTENANCE_DUE, etc.
- `channel` - EMAIL, SMS, IN_APP, PUSH
- `priority` - LOW, NORMAL, HIGH, URGENT
- `title`, `message`, `action_url`
- `entity_type`, `entity_id` - Reference to source
- `notification_metadata` (JSON)
- `is_read`, `read_at`, `is_sent`, `sent_at`, `send_after`
- `email_to`, `email_subject`, `sms_to`
- `delivery_status`, `delivery_error`
- `retry_count`, `max_retries`

**Relationships**:
- `agency` → Agency
- `user` → User
- `customer` → Customer

---

## Pricing & Discount Models

### 13. PricingRule
**Table**: `pricing_rules`  
**Description**: Dynamic pricing and yield management

**Key Fields**:
- `id` (Integer, PK)
- `agency_id`
- `rule_type` - BASE_RATE, SEASONAL, WEEKEND, HOLIDAY, DURATION, ADVANCE_BOOKING, LAST_MINUTE, DEMAND_BASED
- `status` - ACTIVE, INACTIVE, SCHEDULED
- `name`, `description`, `priority`
- `valid_from`, `valid_to`
- `applies_monday` through `applies_sunday` - Day-of-week flags
- `applies_to_all_vehicles`, `vehicle_categories`, `specific_vehicle_ids`
- `min_rental_days`, `max_rental_days`
- `min_advance_booking_days`, `max_advance_booking_days`
- `adjustment_type` - percentage, fixed_amount, new_rate
- `adjustment_value`
- `minimum_daily_rate`, `maximum_daily_rate`
- `apply_when_occupancy_above`, `apply_when_occupancy_below`
- `can_combine_with_other_rules`, `max_discount_percentage`
- `times_applied`, `total_revenue_impact`

**Relationships**:
- `agency` → Agency
- `created_by` → User

---

### 14. Discount
**Table**: `discounts`  
**Description**: Promotional codes and discounts

**Key Fields**:
- `id` (Integer, PK)
- `agency_id`
- `code` (unique) - Promotional code (e.g., SUMMER2024)
- `name`, `description`
- `discount_type` - PERCENTAGE, FIXED_AMOUNT, FREE_DAYS
- `discount_value`
- `valid_from`, `valid_to`
- `max_uses`, `max_uses_per_customer`, `current_uses`
- `minimum_rental_days`, `minimum_amount`
- `applies_to_new_customers_only`
- `status` - ACTIVE, INACTIVE, EXPIRED, EXHAUSTED
- `is_public` - Public vs private codes
- `total_discount_given`, `total_bookings`

**Relationships**:
- `agency` → Agency
- `created_by` → User
- `booking_discounts` → List[BookingDiscount]

---

### 15. BookingDiscount
**Table**: `booking_discounts`  
**Description**: Association between bookings and applied discounts

**Key Fields**:
- `id` (Integer, PK)
- `booking_id`, `discount_id`
- `discount_amount` - Actual discount applied
- `applied_at`, `applied_by_user_id`

**Relationships**:
- `booking` → Booking
- `discount` → Discount
- `applied_by` → User

---

## Review & Insurance Models

### 16. Review
**Table**: `reviews`  
**Description**: Customer feedback and ratings

**Key Fields**:
- `id` (Integer, PK)
- `agency_id`, `booking_id` (unique), `customer_id`, `vehicle_id`
- `overall_rating` (float, 0-5 stars)
- `vehicle_condition_rating`, `service_quality_rating`, `value_for_money_rating`, `cleanliness_rating`
- `title`, `comment`, `would_recommend`
- `status` - PENDING, APPROVED, REJECTED, FLAGGED
- `is_verified`, `is_public`
- `moderated_by_user_id`, `moderated_at`, `moderation_notes`
- `agency_response`, `agency_responded_at`, `agency_responded_by_user_id`
- `is_flagged`, `flag_reason`
- `helpful_count`, `not_helpful_count`

**Relationships**:
- `agency` → Agency
- `booking` → Booking
- `customer` → Customer
- `vehicle` → Vehicle
- `moderated_by` → User
- `agency_responded_by` → User

---

### 17. Insurance
**Table**: `insurances`  
**Description**: Vehicle insurance policies

**Key Fields**:
- `id` (Integer, PK)
- `policy_number` (unique)
- `agency_id`, `vehicle_id`
- `insurance_company`, `insurance_company_phone`, `insurance_company_email`
- `insurance_type` - LIABILITY, COMPREHENSIVE, COLLISION, THEFT, FIRE, PERSONAL_ACCIDENT
- `coverage_description`, `coverage_limits` (JSON)
- `start_date`, `end_date`, `renewal_date`
- `premium_amount`, `deductible_amount`, `coverage_amount`
- `status` - ACTIVE, EXPIRED, CANCELLED, PENDING_RENEWAL
- `is_active`, `auto_renew`
- `policy_document_url`, `certificate_url`
- `beneficiaries` (JSON), `special_conditions`, `exclusions`
- `claims_count`, `total_claims_amount`
- `reminder_sent_30_days`, `reminder_sent_15_days`, `reminder_sent_7_days`

**Relationships**:
- `agency` → Agency
- `vehicle` → Vehicle
- `created_by` → User
- `insurance_claims` → List[InsuranceClaim]

---

### 18. InsuranceClaim
**Table**: `insurance_claims`  
**Description**: Insurance claim submissions

**Key Fields**:
- `id` (Integer, PK)
- `claim_number` (unique)
- `agency_id`, `insurance_id`, `damage_report_id`
- `incident_date`, `claim_date`, `incident_description`, `incident_location`
- `claimed_amount`, `approved_amount`, `paid_amount`, `deductible_paid`
- `status` - filed, reviewing, approved, rejected, paid
- `is_approved`
- `claim_documents` (JSON), `police_report_number`
- `reviewed_at`, `approved_at`, `paid_at`
- `rejection_reason`

**Relationships**:
- `agency` → Agency
- `insurance` → Insurance
- `damage_report` → DamageReport
- `filed_by` → User

---

## Audit Model

### 19. AuditLog
**Table**: `audit_logs`  
**Description**: System audit trail for super admin actions

**Key Fields**:
- `id` (Integer, PK)
- `user_id` - Admin who performed action
- `action` - Action performed
- `resource_type` - Type of resource
- `resource_id` - ID of resource
- `details` (JSON) - Action details
- `ip_address`, `user_agent`
- `created_at`

**Relationships**:
- `user` → User

---

## Multi-Tenancy Architecture

### Data Isolation
All tenant-scoped models include `agency_id` foreign key:
- Agency ✓
- User (nullable for super_admin)
- Vehicle ✓
- Customer ✓
- Booking ✓
- Contract ✓
- Payment ✓
- Maintenance ✓
- DamageReport ✓
- Invoice ✓
- Document ✓
- Notification ✓ (nullable)
- PricingRule ✓
- Discount ✓
- Review ✓
- Insurance ✓
- InsuranceClaim ✓

### Cascade Behaviors
**Agency Deletion** → CASCADE:
- All users (except owner)
- All vehicles
- All customers
- All bookings
- All contracts
- All payments
- All maintenance records
- All damage reports
- All invoices
- All documents
- All notifications
- All pricing rules
- All discounts
- All reviews
- All insurances

**Vehicle Deletion** → CASCADE:
- Maintenance records
- Damage reports
- Documents
- Reviews
- Insurances

**Booking Deletion** → CASCADE:
- Damage reports
- Invoices
- Documents
- Review
- Booking discounts

**Customer Deletion** → RESTRICT (prevent if bookings exist)

---

## Tunisian-Specific Features

### Legal Compliance
1. **Timbre Fiscal**: 0.600 TND on bookings, 1.000 TND on invoices
2. **TVA (VAT)**: 19% tax rate
3. **Fiscal Identifiers**: 
   - `tax_id` (Matricule fiscal)
   - `company_registry_number` (RNE)
4. **CIN**: Tunisian National ID card number

### Payment Gateways
- **Paymee**: Tunisian mobile payment
- **ClicToPay**: Tunisian bank card gateway
- Support for Cash, Bank Transfer, International cards

### Currency
- All amounts in **TND (Tunisian Dinar)**
- Numeric precision: `Numeric(10, 3)` for 3 decimal places

---

## Enumerations

### Core Enums
- **SubscriptionPlan**: BASIQUE, STANDARD, PREMIUM, ENTREPRISE
- **UserRole**: SUPER_ADMIN, PROPRIETAIRE, MANAGER, EMPLOYEE
- **VehicleStatus**: DISPONIBLE, LOUE, MAINTENANCE, HORS_SERVICE
- **FuelType**: ESSENCE, DIESEL, HYBRIDE, ELECTRIQUE
- **TransmissionType**: MANUELLE, AUTOMATIQUE
- **CustomerType**: INDIVIDUAL, COMPANY

### Booking & Payment
- **BookingStatus**: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- **PaymentStatus**: PENDING, PAID, PARTIALLY_PAID, REFUNDED, FAILED
- **PaymentMethod**: CASH, CARD, BANK_TRANSFER, PAYMEE, CLICTOPAY, ONLINE
- **PaymentType**: DEPOSIT, RENTAL_FEE, EXTRA_CHARGES, REFUND

### Contracts & Documents
- **ContractStatus**: DRAFT, PENDING_SIGNATURE, SIGNED, COMPLETED, CANCELLED
- **DocumentType**: VEHICLE_REGISTRATION, INSURANCE_POLICY, CUSTOMER_ID, DRIVERS_LICENSE, etc.

### Maintenance & Damage
- **MaintenanceType**: PREVENTIVE, CORRECTIVE, INSPECTION, TIRE_CHANGE, OIL_CHANGE, etc.
- **MaintenanceStatus**: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- **DamageSeverity**: MINOR, MODERATE, MAJOR, TOTAL_LOSS
- **DamageStatus**: REPORTED, ASSESSING, REPAIRING, REPAIRED, INSURANCE_CLAIM, CLOSED

### Financial
- **InvoiceStatus**: DRAFT, ISSUED, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
- **InvoiceType**: RENTAL, DEPOSIT, EXTRA_CHARGES, DAMAGE, CREDIT_NOTE

### Notifications
- **NotificationType**: BOOKING_CREATED, PAYMENT_RECEIVED, VEHICLE_MAINTENANCE_DUE, etc.
- **NotificationChannel**: EMAIL, SMS, IN_APP, PUSH
- **NotificationPriority**: LOW, NORMAL, HIGH, URGENT

### Pricing & Discounts
- **PricingRuleType**: BASE_RATE, SEASONAL, WEEKEND, HOLIDAY, DURATION, etc.
- **PricingRuleStatus**: ACTIVE, INACTIVE, SCHEDULED
- **DiscountType**: PERCENTAGE, FIXED_AMOUNT, FREE_DAYS
- **DiscountStatus**: ACTIVE, INACTIVE, EXPIRED, EXHAUSTED

### Reviews & Insurance
- **ReviewStatus**: PENDING, APPROVED, REJECTED, FLAGGED
- **InsuranceType**: LIABILITY, COMPREHENSIVE, COLLISION, THEFT, FIRE, PERSONAL_ACCIDENT
- **InsuranceStatus**: ACTIVE, EXPIRED, CANCELLED, PENDING_RENEWAL

---

## Database Indexes

### Primary Indexes (Automatic)
- All `id` columns (Primary Keys)

### Foreign Key Indexes (Important for Performance)
- `agency_id` on all tenant-scoped tables
- `vehicle_id` on bookings, maintenances, damage_reports
- `customer_id` on bookings, damage_reports, invoices
- `booking_id` on contracts, payments, damage_reports

### Unique Constraints
- `agencies.tax_id`
- `users.email`
- `vehicles.license_plate`, `vehicles.vin`
- `customers.cin_number`
- `bookings.booking_number`
- `contracts.contract_number`
- `payments.payment_reference`
- `maintenances.maintenance_number`
- `damage_reports.report_number`
- `invoices.invoice_number`
- `documents.document_number`
- `discounts.code`
- `insurances.policy_number`
- `insurance_claims.claim_number`

### Status Indexes (for filtering)
- `vehicle.status`
- `booking.status`, `booking.payment_status`
- `contract.status`
- `payment.status`
- `maintenance.status`
- `damage_report.status`
- `invoice.status`
- `notification.is_read`, `notification.is_sent`
- `discount.status`
- `review.status`
- `insurance.status`

### Date Indexes (for range queries)
- `booking.start_date`, `booking.end_date`
- `invoice.invoice_date`, `invoice.due_date`
- `maintenance.scheduled_date`
- `insurance.start_date`, `insurance.end_date`
- `pricing_rule.valid_from`, `pricing_rule.valid_to`

---

## Migration Notes

### Recommended Order
1. Create Core tables: Agency, User
2. Create Entity tables: Vehicle, Customer
3. Create Booking workflow: Booking, Contract, Payment
4. Create Support tables: Maintenance, DamageReport
5. Create Financial: Invoice
6. Create Documents: Document, Notification
7. Create Pricing: PricingRule, Discount, BookingDiscount
8. Create Reviews: Review
9. Create Insurance: Insurance, InsuranceClaim
10. Create Audit: AuditLog

### Data Migration Considerations
- Ensure all `agency_id` are properly set before enforcing NOT NULL
- Populate `owner_id` in agencies before adding FK constraint
- Set up initial super_admin user before other users
- Create default pricing rules for each agency

---

## API Integration Points

### REST Endpoints to Implement
- `/api/v1/maintenances/*` - Maintenance management
- `/api/v1/damage-reports/*` - Damage tracking
- `/api/v1/invoices/*` - Invoicing
- `/api/v1/documents/*` - Document management
- `/api/v1/notifications/*` - Notification management
- `/api/v1/pricing-rules/*` - Dynamic pricing
- `/api/v1/discounts/*` - Discount codes
- `/api/v1/reviews/*` - Customer reviews
- `/api/v1/insurances/*` - Insurance policies

### Webhooks Needed
- Payment gateway webhooks (Paymee, ClicToPay)
- Email delivery status
- SMS delivery status
- Insurance claim status updates

---

## Business Logic Highlights

### Booking Workflow
1. Create Booking (PENDING)
2. Apply Discount codes (optional)
3. Calculate pricing with PricingRules
4. Generate Invoice
5. Process Payment
6. Confirm Booking
7. Generate Contract (PENDING_SIGNATURE)
8. Customer signs → Contract SIGNED
9. Vehicle pickup → Booking IN_PROGRESS
10. Vehicle return → Check for damages
11. Complete Booking → Request Review

### Maintenance Workflow
1. Schedule Maintenance (SCHEDULED)
2. Vehicle status → MAINTENANCE
3. Start work → IN_PROGRESS
4. Complete work → COMPLETED
5. Vehicle status → DISPONIBLE
6. Update mileage and next maintenance

### Damage Workflow
1. Report Damage → Create DamageReport
2. Assess damage → Update severity
3. If insurance required → Create InsuranceClaim
4. Repair vehicle → Status REPAIRING
5. Complete repairs → Status REPAIRED
6. Close report → Status CLOSED

---

## Performance Optimization

### Recommended Composite Indexes
```sql
CREATE INDEX idx_bookings_agency_dates ON bookings(agency_id, start_date, end_date);
CREATE INDEX idx_vehicles_agency_status ON vehicles(agency_id, status);
CREATE INDEX idx_payments_agency_status ON payments(agency_id, status);
CREATE INDEX idx_maintenances_vehicle_scheduled ON maintenances(vehicle_id, scheduled_date);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);
```

### Query Optimization Tips
- Always filter by `agency_id` first (multi-tenancy)
- Use status indexes for workflow queries
- Partition large tables by date if needed (invoices, payments, bookings)
- Consider materialized views for dashboard statistics

---

## Next Steps

### Database Setup
1. Generate Alembic migration for all 19 models
2. Review and test migration up/down
3. Seed initial data (super_admin user)
4. Create indexes for performance

### API Development
1. Implement CRUD endpoints for new models
2. Add business logic validations
3. Implement webhook handlers
4. Add automated notifications

### Testing
1. Unit tests for models
2. Integration tests for relationships
3. Performance tests for queries
4. Multi-tenancy isolation tests

---

*Last Updated: 2025-11-30*
*Total Models: 19*
*Total Relationships: 100+*
