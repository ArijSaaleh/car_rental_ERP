# API Endpoint Checklist - Admin & Owner Features

## ADMIN FEATURES

### 1. Users Management (admin/Users.tsx)
- ✅ GET /users - List all users
- ✅ POST /auth/register - Create new user
- ✅ PATCH /users/:id    - Update user
- ✅ DELETE /users/:id   - Delete user

### 2. Agency Management (admin/AgencyManagement.tsx)
- ✅ GET     /agencies      - List all agencies
- ✅ GET     /users         - List all users (for owner selection)
- ✅ POST    /auth/register - Create new owner
- ✅ POST    /agencies      - Create agency
- ✅ PATCH   /agencies/:id  - Update agency
- ✅ DELETE  /agencies/:id  - Delete agency

### 3. System Settings (admin/SystemSettings.tsx)
- ✅ GET  /settings - Get system settings
- ✅ POST /settings - Update settings

### 4. Admin Dashboard (admin/AdminDashboard.tsx)
- ✅ GET /agencies  - Get agencies for stats

## OWNER FEATURES

### 1. Vehicle Management (owner/VehicleManagement.tsx)
- ✅ GET /vehicles?agencyId=X - List vehicles
- ✅ POST /vehicles - Create vehicle
- ✅ PATCH /vehicles/:id - Update vehicle
- ✅ DELETE /vehicles/:id - Delete vehicle

### 2. Booking Management (owner/BookingManagement.tsx)
- ✅ GET /agencies - List agencies
- ✅ GET /bookings?agencyId=X - List bookings
- ✅ GET /customers?agencyId=X - List customers
- ✅ GET /vehicles?agencyId=X - List vehicles
- ✅ PATCH /bookings/:id - Update booking
- ✅ DELETE /bookings/:id - Delete booking
- ✅ POST /bookings/:id/confirm - Confirm booking
- ✅ POST /bookings/:id/start - Start rental
- ✅ POST /bookings/:id/complete - Complete rental

### 3. Customer Management (owner/ClientManagement.tsx)
- ✅ GET /customers - List customers
- ✅ GET /customers/:id/bookings  - Get customer bookings
- ✅ PUT /customers/:id/blacklist - Toggle blacklist

### 4. Employee Management (owner/EmployeeManagement.tsx)
- ✅ GET /agencies       - List agencies
- ✅ GET /users?agencyId=X&role=AGENT_COMPTOIR,AGENT_PARC - List employees
- ✅ POST /auth/register - Create employee
- ✅ PATCH /users/:id    - Update employee
- ✅ DELETE /users/:id   - Delete employee

### 5. Manager Management (owner/AgencyManagers.tsx)
- ✅ GET /agencies - List agencies
- ✅ GET /users?agencyId=X&role=MANAGER - List managers
- ✅ POST /auth/register - Create manager
- ✅ DELETE /users/:id - Delete manager

### 6. My Agencies (owner/MyAgencies.tsx)
- ✅ GET /agencies - List agencies
- ✅ POST /agencies - Create agency/branch
- ✅ PATCH /agencies/:id - Update agency
- ✅ POST /agencies/:id/toggle-status - Toggle status

### 7. Contract Management (owner/ContractManagement.tsx)
- ✅ GET /agencies - List agencies
- ✅ GET /contracts?agencyId=X - List contracts
- ✅ GET /contracts/:id/pdf - Download contract PDF

### 8. Rental Workflow (owner/RentalWorkflow.tsx)
- ✅ GET /vehicles?agencyId=X&status=DISPONIBLE - List available vehicles
- ✅ POST /bookings/check-availability - Check vehicle availability
- ✅ GET /customers?agencyId=X - List customers
- ✅ POST /customers - Create customer
- ✅ POST /bookings?agencyId=X - Create booking
- ✅ POST /contracts - Create contract
- ✅ POST /bookings/:id/confirm - Confirm booking
- ✅ POST /bookings/:id/start - Start rental
- ✅ GET /contracts/:id/pdf - Get contract PDF

## Known Issues to Fix:

1. **Email Conflict Error**: arij@admin.com already exists
   - Solution: Use different emails when testing user creation

2. **Token Expiration**: Backend needs restart to load new 24h expiration
   - Solution: Backend restarted, clear localStorage and re-login

3. **Field Name Mismatches**: Some interfaces still use snake_case
   - Check: ClientManagement, BookingManagement dialogs

4. **Missing Query Parameter Support**: 
   - Users service role filtering - IMPLEMENTED ✅
   - Contracts service filtering - IMPLEMENTED  ✅
   - Payments service filtering - IMPLEMENTED   ✅

## Next Steps:
1. Clear browser localStorage
2. Log in with: arij@admin.com / admin123
3. Test each feature systematically
4. Report any remaining errors