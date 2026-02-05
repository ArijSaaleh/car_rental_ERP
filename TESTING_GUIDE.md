# 🎯 Complete Testing Guide - Car Rental System

## ✅ What Has Been Fixed

### 1. Field Name Standardization (snake_case → camelCase)
All frontend interfaces and table renderings have been updated to use camelCase consistently:

#### **ClientManagement.tsx**
- ✅ Client interface: `firstName`, `lastName`, `isBlacklisted`, `blacklistReason`, `totalRentals`, `totalRevenue`
- ✅ RentalHistory interface: `bookingNumber`, `startDate`, `endDate`, `durationDays`, `totalAmount`, `paymentStatus`
- ✅ All table renderings and API calls updated
- ✅ Normalizer functions properly map API responses

#### **BookingManagement.tsx**
- ✅ Booking interface: `bookingNumber`, `vehicleId`, `customerId`, `startDate`, `endDate`, `dailyRate`, `durationDays`, `totalAmount`, `paymentStatus`
- ✅ Customer interface: `firstName`, `lastName`, `cinNumber`
- ✅ Vehicle interface: `dailyRate`
- ✅ All table renderings updated

#### **ContractManagement.tsx**
- ✅ Contract interface: `contractNumber`, `bookingId`, `termsAndConditions`, `specialClauses`
- ✅ Nested booking object with customer and vehicle
- ✅ Search filter updated to use nested fields
- ✅ All table renderings and dialogs updated

#### **AgencyManagement.tsx**
- ✅ Agency creation flow: Two-step process (owner registration → agency creation)
- ✅ Payload fields: `name`, `legalName`, `ownerId`, `taxId`, `email`, `phone`, `address`

#### **Other Files Fixed**
- ✅ Bookings.tsx
- ✅ BookingDetails.tsx
- ✅ OwnerDashboard.tsx
- ✅ MyAgencies.tsx
- ✅ Users.tsx
- ✅ VehicleManagement.tsx
- ✅ EmployeeManagement.tsx

### 2. HTTP Methods Alignment
- ✅ All update operations: `PUT` → `PATCH`
- ✅ All delete operations use `DELETE`
- ✅ All action operations use `POST`

### 3. Backend Services Implementation
- ✅ Users service: Role filtering implemented
- ✅ Customers service: Bookings retrieval and blacklist toggle
- ✅ Bookings service: Complete workflow (confirm, start, complete, checkAvailability)
- ✅ Contracts service: Full CRUD + PDF generation
- ✅ Payments service: Full CRUD with filtering
- ✅ Settings service: Get/update with defaults

### 4. JWT Token Expiration
- ✅ Extended from 15 minutes → 24 hours
- ✅ Backend restarted with new configuration

### 5. Schema Fixes
- ✅ Prisma schema uses correct field names
- ✅ All type mismatches resolved (vehicleId as UUID string, not number)

---

## 🚀 Before Testing - CRITICAL STEPS

### Step 1: Clear Browser Cache & Local Storage
**This is MANDATORY to remove old 15-minute tokens!**

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Local Storage** → `http://localhost:5173`
4. Click "Clear All" button
5. Also clear **Session Storage**
6. Close and reopen the browser

**Or use this shortcut:**
```javascript
// Paste in browser console (F12 → Console tab)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 2: Verify Backend is Running
The backend should already be running with the new 24h JWT configuration.

**Check if backend is running:**
```powershell
Get-Process -Name node | Where-Object { $_.Path -like "*backend*" }
```

**If NOT running, restart it:**
```powershell
cd "C:\\Users\\Arij\\Desktop\\Car Rental\\CR\\backend"
npm run start:dev
```

Wait for: `Application is running on: http://localhost:3001`

### Step 3: Login with Fresh Credentials

**⚠️ IMPORTANT:** The email `arij@admin.com` already exists in database!

**Use these credentials for testing:**
- **Super Admin:** `arij@admin.com` / `admin123` (existing user)
- **For testing new user creation:** Use DIFFERENT emails like `newadmin@test.com`, `manager@agency.com`, etc.

---

## 📋 Systematic Testing Checklist

### ADMIN Features Testing

#### 1. Users Management (`/admin/users`)
- [ ] **List users** with role filtering:
  - [ ] Filter by: ALL, SUPER_ADMIN, OWNER, MANAGER, EMPLOYEE
  - [ ] Verify table shows: firstName, lastName, email, role
- [ ] **Create user:**
  - [ ] Use NEW email (not existing ones!)
  - [ ] Fill: firstName, lastName, email, password, role
  - [ ] Verify success message
- [ ] **Edit user:**
  - [ ] Click edit button
  - [ ] Update firstName or role
  - [ ] Verify PATCH method used
- [ ] **Delete user:**
  - [ ] Click delete button
  - [ ] Confirm deletion
  - [ ] Verify user removed from list

**Expected API Calls:**
```
GET    /users?agencyId=...&role=EMPLOYEE
POST   /users
PATCH  /users/:id
DELETE /users/:id
```

#### 2. Agency Management (`/admin/agencies`)
- [ ] **List agencies:**
  - [ ] Verify table shows all agencies
  - [ ] Check stats: manager_count, employee_count
- [ ] **Create agency (Two-step process):**
  - [ ] Step 1: Fill owner details (firstName, lastName, email, password)
  - [ ] Verify owner registered successfully
  - [ ] Step 2: Fill agency details (name, legalName, taxId, email, phone, address)
  - [ ] Verify agency created with ownerId
  - [ ] **Use unique emails!** (e.g., `owner-${Date.now()}@test.com`)
- [ ] **Edit agency:**
  - [ ] Update name or phone
  - [ ] Verify PATCH method used
- [ ] **Toggle agency status:**
  - [ ] Activate/deactivate agency
  - [ ] Verify POST to `/agencies/:id/toggle-status`
- [ ] **Delete agency:**
  - [ ] Confirm deletion
  - [ ] Verify DELETE method

**Expected API Calls:**
```
GET    /agencies
POST   /auth/register (owner)
POST   /agencies (with ownerId)
PATCH  /agencies/:id
POST   /agencies/:id/toggle-status
DELETE /agencies/:id
```

#### 3. Settings (`/admin/settings`)
- [ ] **Load settings:**
  - [ ] Verify default values shown
- [ ] **Update settings:**
  - [ ] Change tax rate or other values
  - [ ] Click Save
  - [ ] Verify POST to `/settings`

**Expected API Calls:**
```
GET    /settings?agencyId=...
POST   /settings
```

#### 4. Admin Dashboard (`/admin`)
- [ ] **View statistics:**
  - [ ] Total agencies
  - [ ] Total users
  - [ ] Total vehicles
  - [ ] Total bookings
- [ ] **Verify no NaN warnings** in console

---

### OWNER Features Testing

#### 5. Vehicles Management (`/owner/vehicles`)
- [ ] **List vehicles:**
  - [ ] Filter by agency
  - [ ] Verify table shows: brand, model, licensePlate, dailyRate
- [ ] **Create vehicle:**
  - [ ] Fill all required fields
  - [ ] Verify POST to `/vehicles`
- [ ] **Edit vehicle:**
  - [ ] Update dailyRate or status
  - [ ] Verify PATCH method
- [ ] **Delete vehicle:**
  - [ ] Confirm deletion
  - [ ] Verify DELETE method

**Expected API Calls:**
```
GET    /vehicles?agencyId=...
POST   /vehicles
PATCH  /vehicles/:id
DELETE /vehicles/:id
```

#### 6. Bookings Management (`/owner/bookings`)
- [ ] **List bookings:**
  - [ ] Filter by agency
  - [ ] Verify table shows: bookingNumber, customer (firstName lastName), vehicle (brand model), durationDays, totalAmount, paymentStatus
- [ ] **Confirm booking:**
  - [ ] Click "Confirmer" on pending booking
  - [ ] Verify POST to `/bookings/:id/confirm`
  - [ ] Status changes to CONFIRMED
- [ ] **Start rental:**
  - [ ] Click "Démarrer" on confirmed booking
  - [ ] Verify POST to `/bookings/:id/start`
  - [ ] Status changes to IN_PROGRESS
- [ ] **Complete rental:**
  - [ ] Click "Terminer" on in-progress booking
  - [ ] Verify POST to `/bookings/:id/complete`
  - [ ] Status changes to COMPLETED

**Expected API Calls:**
```
GET    /bookings?agencyId=...
POST   /bookings/:id/confirm
POST   /bookings/:id/start
POST   /bookings/:id/complete
```

#### 7. Customers Management (`/owner/clients`)
- [ ] **List customers:**
  - [ ] Filter by agency
  - [ ] Verify table shows: firstName, lastName, email, phone, isBlacklisted, totalRentals, totalRevenue
- [ ] **View rental history:**
  - [ ] Click "Historique" button
  - [ ] Verify dialog shows:
    - [ ] bookingNumber
    - [ ] vehicle (brand model) - from nested object
    - [ ] startDate, endDate, durationDays
    - [ ] totalAmount, paymentStatus
- [ ] **Blacklist customer:**
  - [ ] Click "Blacklister" button
  - [ ] Enter blacklist reason
  - [ ] Verify POST to `/customers/:id/blacklist`
  - [ ] isBlacklisted becomes true
- [ ] **Remove from blacklist:**
  - [ ] Click "Retirer" on blacklisted customer
  - [ ] Verify isBlacklisted becomes false

**Expected API Calls:**
```
GET    /customers?agencyId=...
GET    /customers/:id/bookings?agencyId=...
POST   /customers/:id/blacklist
```

#### 8. Employees Management (`/owner/employees`)
- [ ] **List employees (role filter = EMPLOYEE):**
  - [ ] Verify only employees shown
  - [ ] No OWNER or SUPER_ADMIN users
- [ ] **Create employee:**
  - [ ] Use unique email
  - [ ] Set role = EMPLOYEE
  - [ ] Verify POST to `/users`
- [ ] **Edit employee:**
  - [ ] Update details
  - [ ] Verify PATCH method
- [ ] **Delete employee:**
  - [ ] Verify DELETE method

**Expected API Calls:**
```
GET    /users?agencyId=...&role=EMPLOYEE
POST   /users
PATCH  /users/:id
DELETE /users/:id
```

#### 9. Managers Management (`/owner/managers`)
- [ ] **List managers (role filter = MANAGER):**
  - [ ] Verify only managers shown
- [ ] **Create manager:**
  - [ ] Use unique email
  - [ ] Set role = MANAGER
  - [ ] Verify POST to `/users`
- [ ] **Edit manager:**
  - [ ] Update details
  - [ ] Verify PATCH method
- [ ] **Delete manager:**
  - [ ] Verify DELETE method

**Expected API Calls:**
```
GET    /users?agencyId=...&role=MANAGER
POST   /users
PATCH  /users/:id
DELETE /users/:id
```

#### 10. My Agencies (`/owner/my-agencies`)
- [ ] **List owner's agencies:**
  - [ ] Verify only owner's agencies shown
- [ ] **Create branch:**
  - [ ] Fill branch details
  - [ ] Verify payload includes `parentAgencyId`
  - [ ] Verify POST to `/agencies`
- [ ] **Edit agency:**
  - [ ] Update details
  - [ ] Verify PATCH with explicit field mapping (no spread operator)
  - [ ] Check payload only includes: name, legalName, email, phone, address, city, postalCode, country, taxId
- [ ] **Toggle agency status:**
  - [ ] Activate/deactivate
  - [ ] Verify POST to `/agencies/:id/toggle-status`

**Expected API Calls:**
```
GET    /agencies
POST   /agencies (with parentAgencyId for branches)
PATCH  /agencies/:id
POST   /agencies/:id/toggle-status
```

#### 11. Contracts Management (`/owner/contracts`)
- [ ] **List contracts:**
  - [ ] Filter by agency
  - [ ] Verify table shows:
    - [ ] Booking number (from nested booking object)
    - [ ] Customer name (from booking.customer.firstName lastName)
    - [ ] Vehicle info (from booking.vehicle.brand model)
    - [ ] Start/end dates (from booking.startDate/endDate)
    - [ ] Total amount (from booking.totalAmount)
- [ ] **View contract details:**
  - [ ] Click "Détails" button
  - [ ] Verify dialog shows all nested fields correctly
- [ ] **Download PDF:**
  - [ ] Click "PDF" button
  - [ ] Verify GET to `/contracts/:id/pdf?agencyId=...`
  - [ ] Check filename uses contractNumber (not contract_number)

**Expected API Calls:**
```
GET    /contracts?agencyId=...
GET    /contracts/:id/pdf?agencyId=...
```

#### 12. Rental Workflow (`/owner/rental`)
**Complete end-to-end rental creation:**

**Step 1: Customer & Vehicle Selection**
- [ ] Select agency
- [ ] Select existing customer OR create new one
- [ ] Select available vehicle
- [ ] Click "Suivant"

**Step 2: Booking Details**
- [ ] Fill start date and end date
- [ ] System calculates:
  - [ ] durationDays
  - [ ] subtotal (dailyRate × days)
  - [ ] taxAmount (19%)
  - [ ] timbreFiscal (1 DT)
  - [ ] totalAmount
- [ ] Verify all calculations correct
- [ ] Click "Suivant"

**Step 3: Contract**
- [ ] Review generated contract terms
- [ ] Modify articles if needed
- [ ] Click "Générer le Contrat"
- [ ] Verify contract preview shown
- [ ] Click "Suivant"

**Step 4: Payment**
- [ ] Select payment method (cash/card/check/transfer)
- [ ] Enter amount
- [ ] Add payment reference
- [ ] Verify amount >= totalAmount
- [ ] Click "Finaliser la Location"

**Verify API Sequence:**
```
1. POST   /bookings (creates booking)
2. POST   /bookings/:id/confirm (confirms it)
3. POST   /contracts (creates contract)
4. POST   /payments (records payment)
```

**After Completion:**
- [ ] Booking appears in bookings list with status CONFIRMED
- [ ] Contract appears in contracts list
- [ ] Payment appears in payments (if implemented)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Email already exists" (409 Conflict)
**Solution:** Use different emails for testing:
```
owner-test-1@example.com
manager-new@agency.com
employee-${Date.now()}@test.com
```

### Issue 2: Token Expired (401 Unauthorized)
**Solution:**
1. Clear localStorage (see Step 1 above)
2. Log out and log back in
3. Verify backend is running with 24h token config

### Issue 3: "Cannot read property 'firstName' of undefined"
**Solution:** This means the API didn't return nested customer/vehicle objects. Check backend service implementation.

### Issue 4: NaN in totals/counts
**Solution:** Already fixed with `|| 0` defaults. If still occurring, check backend response.

### Issue 5: 404 on API calls
**Solution:**
1. Verify backend is running on port 3001
2. Check browser console for actual endpoint being called
3. Verify agencyId is being passed correctly

---

## 📊 What to Check During Testing

### In Browser Console (F12)
- ✅ No errors (red messages)
- ✅ API calls use correct methods (GET/POST/PATCH/DELETE)
- ✅ API calls include agencyId where required
- ✅ Responses return expected data structure
- ✅ No "undefined" or "null" errors

### In Network Tab (F12 → Network)
- ✅ Status codes: 200 OK, 201 Created
- ✅ Request payloads use camelCase
- ✅ Response payloads use camelCase
- ✅ No 400 (Bad Request) or 500 (Server Error)

### In Application
- ✅ Tables render correctly with all columns
- ✅ Dialogs show correct data
- ✅ Forms submit successfully
- ✅ Success/error messages display
- ✅ Data refreshes after operations

---

## 🎉 Success Criteria

Your system is working correctly when:

1. ✅ All tables display data without "undefined" or "NaN"
2. ✅ All CRUD operations complete successfully
3. ✅ Complete rental workflow works end-to-end
4. ✅ No console errors during normal usage
5. ✅ All nested objects (customer, vehicle, booking) render correctly
6. ✅ Token doesn't expire during testing session (24h)
7. ✅ PDF downloads work for contracts
8. ✅ Booking workflow (confirm → start → complete) works
9. ✅ Customer blacklisting works
10. ✅ Role filtering (EMPLOYEE, MANAGER) works correctly

---

## 📞 If You Still Get Errors

**Provide these details:**
1. Which page/feature
2. What action you performed
3. Error message from browser console (F12)
4. Network request details (Request URL, Method, Status Code, Response)
5. Screenshot if possible

**Example:**
```
Page: Client Management
Action: Clicked "Historique" button
Error: "Cannot read property 'brand' of undefined"
Network: GET /customers/123/bookings?agencyId=abc → 200 OK
Response: Array of bookings but vehicle field is missing
```

This helps identify if it's:
- Frontend rendering issue (fixed with optional chaining `?.`)
- Backend not including relations (need to add `include` in Prisma query)
- API payload structure mismatch

---

## 🔄 Next Steps After Testing

1. **Test all features systematically** using this checklist
2. **Document any remaining errors** with details above
3. **For any persistent issues:** I'll fix them immediately with targeted patches
4. **Once all features work:** We can move to advanced features (reports, analytics, etc.)

**Happy Testing! 🚀**
