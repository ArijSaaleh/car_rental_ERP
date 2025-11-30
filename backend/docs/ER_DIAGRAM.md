# Entity Relationship Diagram

## ASCII ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               MULTI-TENANT ARCHITECTURE                                   │
│                                                                                           │
│  ┌──────────────┐                  ┌──────────────┐                                      │
│  │   AGENCY     │◄─────────────────│     USER     │                                      │
│  │  (Tenant)    │  employs         │              │                                      │
│  │              │                  │              │                                      │
│  │ • id (UUID)  │                  │ • id (UUID)  │                                      │
│  │ • owner_id ──┼──────────────────┤ • email      │                                      │
│  │ • name       │  owns (1:M)      │ • role       │                                      │
│  │ • tax_id     │                  │ • agency_id  │                                      │
│  │ • subscription│                 └──────┬───────┘                                      │
│  └──────┬───────┘                         │                                              │
│         │                                 │ creates                                       │
│         │ has                             │                                              │
│         ├─────────────────────────────────┼─────────────────────────────────┐            │
│         │                                 │                                 │            │
│         ▼                                 ▼                                 ▼            │
│  ┌──────────────┐                  ┌──────────────┐                  ┌──────────────┐   │
│  │   VEHICLE    │                  │   CUSTOMER   │                  │   BOOKING    │   │
│  │              │                  │              │                  │              │   │
│  │ • id (UUID)  │                  │ • id         │                  │ • id         │   │
│  │ • agency_id  │                  │ • agency_id  │                  │ • agency_id  │   │
│  │ • license_pl │◄─────┐           │ • cin_number │◄─────┐           │ • booking_#  │   │
│  │ • status     │      │           │ • license_#  │      │           │ • status     │   │
│  │ • daily_rate │      │           │ • type       │      │           │ • total_amt  │   │
│  └──────┬───────┘      │           └──────┬───────┘      │           └──────┬───────┘   │
│         │              │                  │              │                  │           │
│         │ has          │ rented by        │ customer of  │ has              │ has       │
│         ├──────────────┤                  ├──────────────┤                  ├───────────┤
│         │              │                  │              │                  │           │
└─────────┼──────────────┴──────────────────┼──────────────┴──────────────────┼───────────┘
          │                                 │                                 │
          │                                 │                                 │
          ▼                                 ▼                                 ▼
   ┌─────────────┐                   ┌─────────────┐                   ┌─────────────┐
   │ MAINTENANCE │                   │DAMAGE REPORT│                   │  CONTRACT   │
   │             │                   │             │                   │             │
   │ • vehicle_id│                   │ • vehicle_id│                   │ • booking_id│ 1:1
   │ • type      │                   │ • customer  │                   │ • status    │
   │ • status    │                   │ • severity  │                   │ • pdf_url   │
   │ • cost      │                   │ • photos    │                   │ • signatures│
   └─────────────┘                   └─────┬───────┘                   └─────────────┘
                                           │
                                           │ claims
                                           ▼
                                     ┌─────────────┐
                                     │ INSURANCE   │
                                     │   CLAIM     │
                                     │             │
                                     │ • damage_id │ 1:1
                                     │ • status    │
                                     │ • amount    │
                                     └─────────────┘


   ┌────────────────────────────────────────────────────────────────────────────┐
   │                          FINANCIAL SUBSYSTEM                               │
   │                                                                            │
   │  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐      │
   │  │   BOOKING    │────────►│   INVOICE    │────────►│   PAYMENT    │      │
   │  │              │ generates│              │ pays    │              │      │
   │  │              │         │ • invoice_#  │         │ • reference  │      │
   │  │              │         │ • line_items │         │ • gateway    │      │
   │  │              │         │ • tax (19%)  │         │ • status     │      │
   │  │              │         │ • timbre     │         │ • method     │      │
   │  └──────┬───────┘         └──────────────┘         └──────────────┘      │
   │         │                                                                 │
   │         │ applies                                                         │
   │         ▼                                                                 │
   │  ┌──────────────┐                                                         │
   │  │   DISCOUNT   │                                                         │
   │  │              │                                                         │
   │  │ • code       │                                                         │
   │  │ • type       │                                                         │
   │  │ • value      │                                                         │
   │  └──────────────┘                                                         │
   │         │                                                                 │
   │         │ M:M via                                                         │
   │         ▼                                                                 │
   │  ┌──────────────┐                                                         │
   │  │ BOOKING      │                                                         │
   │  │  DISCOUNT    │                                                         │
   │  │              │                                                         │
   │  │ • booking_id │                                                         │
   │  │ • discount_id│                                                         │
   │  │ • amount     │                                                         │
   │  └──────────────┘                                                         │
   └────────────────────────────────────────────────────────────────────────────┘


   ┌────────────────────────────────────────────────────────────────────────────┐
   │                      PRICING & YIELD MANAGEMENT                            │
   │                                                                            │
   │  ┌──────────────┐                                                         │
   │  │ PRICING RULE │                                                         │
   │  │              │                                                         │
   │  │ • rule_type  │ (SEASONAL, WEEKEND, DEMAND_BASED, etc.)                │
   │  │ • priority   │                                                         │
   │  │ • valid_from │                                                         │
   │  │ • valid_to   │                                                         │
   │  │ • adjustment │                                                         │
   │  │ • occupancy  │                                                         │
   │  └──────────────┘                                                         │
   │         │                                                                 │
   │         │ applies to                                                      │
   │         ▼                                                                 │
   │  ┌──────────────┐                                                         │
   │  │   VEHICLE    │                                                         │
   │  │  (categories)│                                                         │
   │  └──────────────┘                                                         │
   └────────────────────────────────────────────────────────────────────────────┘


   ┌────────────────────────────────────────────────────────────────────────────┐
   │                      DOCUMENT MANAGEMENT SYSTEM                            │
   │                                                                            │
   │  ┌──────────────┐         references                                      │
   │  │   DOCUMENT   │◄────────────┐                                           │
   │  │              │             │                                           │
   │  │ • type       │             ├─── VEHICLE                                │
   │  │ • file_path  │             ├─── CUSTOMER                               │
   │  │ • entity_type│             ├─── BOOKING                                │
   │  │ • entity_id  │             ├─── CONTRACT                               │
   │  │ • is_verified│             └─── (polymorphic)                          │
   │  │ • ocr_text   │                                                         │
   │  └──────────────┘                                                         │
   └────────────────────────────────────────────────────────────────────────────┘


   ┌────────────────────────────────────────────────────────────────────────────┐
   │                      NOTIFICATION SYSTEM                                   │
   │                                                                            │
   │  ┌──────────────┐                                                         │
   │  │ NOTIFICATION │                                                         │
   │  │              │                                                         │
   │  │ • user_id    │ (or customer_id)                                        │
   │  │ • type       │ (BOOKING_CREATED, PAYMENT_DUE, etc.)                   │
   │  │ • channel    │ (EMAIL, SMS, IN_APP, PUSH)                             │
   │  │ • priority   │                                                         │
   │  │ • is_read    │                                                         │
   │  │ • is_sent    │                                                         │
   │  └──────────────┘                                                         │
   └────────────────────────────────────────────────────────────────────────────┘


   ┌────────────────────────────────────────────────────────────────────────────┐
   │                      INSURANCE TRACKING                                    │
   │                                                                            │
   │  ┌──────────────┐                                                         │
   │  │   VEHICLE    │                                                         │
   │  │              │                                                         │
   │  └──────┬───────┘                                                         │
   │         │                                                                 │
   │         │ has                                                             │
   │         ▼                                                                 │
   │  ┌──────────────┐         ┌──────────────┐                               │
   │  │  INSURANCE   │────────►│ INSURANCE    │                               │
   │  │              │  files  │    CLAIM     │                               │
   │  │ • policy_#   │         │              │                               │
   │  │ • company    │         │ • claim_#    │                               │
   │  │ • coverage   │         │ • status     │                               │
   │  │ • premium    │         │ • amount     │                               │
   │  └──────────────┘         └──────┬───────┘                               │
   │                                  │                                        │
   │                                  │ references                             │
   │                                  ▼                                        │
   │                           ┌──────────────┐                                │
   │                           │DAMAGE REPORT │                                │
   │                           └──────────────┘                                │
   └────────────────────────────────────────────────────────────────────────────┘


   ┌────────────────────────────────────────────────────────────────────────────┐
   │                      REVIEW & RATING SYSTEM                                │
   │                                                                            │
   │  ┌──────────────┐                                                         │
   │  │   BOOKING    │                                                         │
   │  │              │                                                         │
   │  └──────┬───────┘                                                         │
   │         │                                                                 │
   │         │ has (1:1)                                                       │
   │         ▼                                                                 │
   │  ┌──────────────┐                                                         │
   │  │    REVIEW    │                                                         │
   │  │              │                                                         │
   │  │ • overall    │ (float, 0-5 stars)                                     │
   │  │ • condition  │                                                         │
   │  │ • service    │                                                         │
   │  │ • comment    │                                                         │
   │  │ • status     │ (PENDING, APPROVED)                                    │
   │  │ • response   │ (agency response)                                      │
   │  └──────────────┘                                                         │
   └────────────────────────────────────────────────────────────────────────────┘
```

## Relationship Cardinalities

### One-to-Many (1:M)
- Agency → Users (employees)
- Agency → Vehicles
- Agency → Customers
- Agency → Bookings
- Agency → All tenant-scoped entities
- User (Proprietaire) → Agencies (owned)
- Vehicle → Bookings
- Vehicle → Maintenances
- Vehicle → DamageReports
- Vehicle → Insurances
- Customer → Bookings
- Booking → Payments
- Booking → Invoices
- Booking → DamageReports
- Discount → BookingDiscounts
- Insurance → InsuranceClaims

### One-to-One (1:1)
- Booking ←→ Contract
- Booking ←→ Review
- DamageReport ←→ InsuranceClaim

### Many-to-Many (M:M)
- Booking ←→ Discount (via BookingDiscount)

### Polymorphic
- Document → (Vehicle | Customer | Booking | Contract)
- Notification → (User | Customer)

## Key Foreign Keys

### Multi-Tenancy (Most Critical)
```
ALL entities → agency_id (except User where nullable for super_admin)
```

### Core Relationships
```
User.agency_id → Agency.id (CASCADE)
Agency.owner_id → User.id (RESTRICT)
Vehicle.agency_id → Agency.id (CASCADE)
Customer.agency_id → Agency.id (CASCADE)
Booking.agency_id → Agency.id (CASCADE)
Booking.vehicle_id → Vehicle.id (RESTRICT)
Booking.customer_id → Customer.id (RESTRICT)
Contract.booking_id → Booking.id (CASCADE)
Payment.booking_id → Booking.id (CASCADE)
Payment.invoice_id → Invoice.id (SET NULL)
```

### Support Relationships
```
Maintenance.vehicle_id → Vehicle.id (CASCADE)
DamageReport.vehicle_id → Vehicle.id (CASCADE)
DamageReport.booking_id → Booking.id (SET NULL)
Invoice.booking_id → Booking.id (SET NULL)
Review.booking_id → Booking.id (CASCADE)
Insurance.vehicle_id → Vehicle.id (CASCADE)
InsuranceClaim.damage_report_id → DamageReport.id (SET NULL)
```

## Cascade Strategy Summary

| Parent → Child | Delete Behavior | Reason |
|----------------|----------------|---------|
| Agency → all entities | CASCADE | Full tenant isolation |
| Vehicle → Maintenance | CASCADE | Maintenance records belong to vehicle |
| Vehicle → DamageReport | CASCADE | Damage history belongs to vehicle |
| Booking → Contract | CASCADE | Contract is part of booking lifecycle |
| Booking → Payment | CASCADE | Payments are part of booking |
| Booking → DamageReport | SET NULL | Keep damage history even if booking deleted |
| Customer → Booking | RESTRICT | Prevent deletion if active bookings |
| Vehicle → Booking | RESTRICT | Cannot delete vehicle with active bookings |
| DamageReport → InsuranceClaim | CASCADE | Claim depends on damage report |

## Data Flow Diagrams

### Booking Creation Flow
```
1. Customer selects Vehicle
2. System checks Availability (no conflicting bookings)
3. Apply PricingRules based on dates/duration
4. Check for valid Discount code
5. Create Booking (PENDING)
6. Generate Invoice
7. Process Payment
8. Confirm Booking → status = CONFIRMED
9. Generate Contract (PENDING_SIGNATURE)
10. Send Notification to Customer
```

### Vehicle Return Flow
```
1. Booking status → IN_PROGRESS
2. Record final_mileage, final_fuel_level
3. Inspect vehicle for damages
4. If damage found:
   a. Create DamageReport
   b. Calculate charges
   c. Add to Invoice
5. Complete Booking → status = COMPLETED
6. Generate final Invoice
7. Process additional Payment if needed
8. Request Review from Customer
9. Send Notification (receipt + review request)
```

### Maintenance Scheduling Flow
```
1. System checks:
   - Vehicle mileage → next_maintenance_mileage
   - Insurance expiry date
   - Technical control expiry
2. Create Notification (VEHICLE_MAINTENANCE_DUE)
3. Manager creates Maintenance (SCHEDULED)
4. Vehicle status → MAINTENANCE
5. Mechanic performs work → IN_PROGRESS
6. Complete work → COMPLETED
7. Upload invoice Document
8. Vehicle status → DISPONIBLE
9. Update next_maintenance_mileage
```

## Index Strategy

### Critical Indexes for Performance
```sql
-- Multi-tenancy filtering
CREATE INDEX idx_vehicles_agency ON vehicles(agency_id);
CREATE INDEX idx_customers_agency ON customers(agency_id);
CREATE INDEX idx_bookings_agency ON bookings(agency_id);

-- Status filtering
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_status ON payments(status);

-- Date range queries
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_pricing_rules_validity ON pricing_rules(valid_from, valid_to);
CREATE INDEX idx_invoices_dates ON invoices(invoice_date, due_date);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_agency_dates ON bookings(agency_id, start_date, end_date);
CREATE INDEX idx_vehicles_agency_status ON vehicles(agency_id, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);
```

## Estimated Table Sizes

### Small Tables (<1000 rows per agency)
- Agency (global: ~100-1000 agencies)
- User (~10-50 per agency)
- PricingRule (~10-20 per agency)
- Discount (~50-100 per agency)
- Insurance (~vehicles count per agency)

### Medium Tables (1000-10000 rows per agency)
- Vehicle (~50-500 per agency)
- Customer (~500-5000 per agency)
- Maintenance (~500-5000 per agency)
- DamageReport (~100-1000 per agency)
- Review (~500-5000 per agency)

### Large Tables (>10000 rows per agency)
- Booking (~5000-50000 per year per agency)
- Payment (~10000-100000 per year per agency)
- Invoice (~5000-50000 per year per agency)
- Document (~10000-100000 per agency)
- Notification (~50000-500000 per agency)
- AuditLog (global: millions)

### Partitioning Recommendations
Consider partitioning by date (monthly/yearly) for:
- Bookings (by start_date)
- Payments (by created_at)
- Invoices (by invoice_date)
- Notifications (by created_at)
- AuditLog (by created_at)

---

*This diagram represents the complete database schema for the Car Rental SaaS Platform*
