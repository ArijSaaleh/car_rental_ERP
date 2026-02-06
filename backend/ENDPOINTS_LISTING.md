# Backend CRUD Endpoints Listing

## Overview
Complete list of all CRUD endpoints available in the Car Rental ERP backend.

---

## Users Module
**Base URL:** `/users`
**Authentication:** Required (Bearer Token)
**Authorization:** Role-based (SUPER_ADMIN, PROPRIETAIRE, MANAGER)

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|------------------|-----------------|-------------|
| **POST** | `/users` | `create()` | `create()` | Create a new user |
| **GET** | `/users` | `findAll()` | `findAll()` | Get all users (filtered by agency/role) |
| **GET** | `/users/:id` | `findOne()` | `findOne()` | Get a specific user by ID |
| **PATCH** | `/users/:id` | `update()` | `update()` | Update user information |
| **DELETE** | `/users/:id` | `remove()` | `remove()` | Deactivate/remove a user |

**Request/Response Examples:**

### Create User (POST /users)
```bash
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "MANAGER",
  "agencyId": "agency-123",
  "isActive": true
}
```

### Get All Users (GET /users)
```bash
GET /users
Authorization: Bearer <token>

# Query Parameters (optional):
# - agencyId: filter by agency
# - role: filter by user role
# - isActive: filter by active status
```

### Get User by ID (GET /users/:id)
```bash
GET /users/user-123
Authorization: Bearer <token>
```

### Update User (PATCH /users/:id)
```bash
PATCH /users/user-123
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "phone": "+0987654321",
  "role": "MANAGER"
}
```

### Delete User (DELETE /users/:id)
```bash
DELETE /users/user-123
Authorization: Bearer <token>
```

---

## Agencies Module
**Base URL:** `/agencies`
**Authentication:** Required (Bearer Token)
**Authorization:** Role-based (SUPER_ADMIN, PROPRIETAIRE)

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|------------------|-----------------|-------------|
| **GET** | `/agencies` | `findAll()` | `findAll()` / `findByOwnerId()` | Get all agencies |
| **GET** | `/agencies/:id` | `findOne()` | `findOne()` | Get a specific agency |
| **POST** | `/agencies` | `create()` | `create()` | Create a new agency |
| **PATCH** | `/agencies/:id` | `update()` | `update()` | Update agency information |
| **DELETE** | `/agencies/:id` | `remove()` | `remove()` | Delete an agency |
| **POST** | `/agencies/:id/toggle-status` | `toggleStatus()` | `toggleStatus()` | Toggle agency active status |

**Request/Response Examples:**

### Get All Agencies (GET /agencies)
```bash
GET /agencies
Authorization: Bearer <token>

# Returns all agencies for SUPER_ADMIN
# Returns only owned agencies for PROPRIETAIRE
```

### Get Agency by ID (GET /agencies/:id)
```bash
GET /agencies/agency-123
Authorization: Bearer <token>
```

### Create Agency (POST /agencies)
```bash
POST /agencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Downtown Branch",
  "city": "New York",
  "address": "123 Main Street",
  "phone": "+1234567890",
  "email": "branch@example.com",
  "parentAgencyId": "parent-agency-123"
}
```

### Update Agency (PATCH /agencies/:id)
```bash
PATCH /agencies/agency-123
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Branch Name",
  "city": "Los Angeles",
  "address": "456 Oak Avenue"
}
```

### Delete Agency (DELETE /agencies/:id)
```bash
DELETE /agencies/agency-123
Authorization: Bearer <token>
```

### Toggle Agency Status (POST /agencies/:id/toggle-status)
```bash
POST /agencies/agency-123/toggle-status
Authorization: Bearer <token>
```

---

## Vehicles Module
**Base URL:** `/vehicles`
**Authentication:** Required (Bearer Token)
**Authorization:** Role-based (SUPER_ADMIN, PROPRIETAIRE, MANAGER)

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|------------------|-----------------|-------------|
| **POST** | `/vehicles` | `create()` | `create()` | Create a new vehicle |
| **GET** | `/vehicles` | `findAll()` | `findAll()` | Get all vehicles with filtering |
| **GET** | `/vehicles/:id` | `findOne()` | `findOne()` | Get a specific vehicle |
| **PATCH** | `/vehicles/:id` | `update()` | `update()` | Update vehicle information |
| **DELETE** | `/vehicles/:id` | `remove()` | `remove()` | Delete/disable a vehicle |
| **GET** | `/vehicles/statistics` | `getStatistics()` | `getStatistics()` | Get vehicle statistics |
| **GET** | `/vehicles/:id/availability` | `checkAvailability()` | `checkAvailability()` | Check vehicle availability |

**Request/Response Examples:**

### Create Vehicle (POST /vehicles)
```bash
POST /vehicles
Authorization: Bearer <token>
Content-Type: application/json

{
  "licensePlate": "ABC123XYZ",
  "brand": "Toyota",
  "model": "Camry",
  "year": 2023,
  "category": "sedan",
  "dailyRate": 50.00,
  "status": "available",
  "agencyId": "agency-123"
}
```

### Get All Vehicles (GET /vehicles)
```bash
GET /vehicles?page=1&pageSize=10&brand=Toyota&status=available
Authorization: Bearer <token>

# Query Parameters:
# - page: page number (default: 1)
# - pageSize: items per page (default: 10)
# - brand: filter by brand
# - status: filter by status (available, rented, maintenance)
# - search: search by license plate or model
```

### Get Vehicle by ID (GET /vehicles/:id)
```bash
GET /vehicles/vehicle-123
Authorization: Bearer <token>
```

### Update Vehicle (PATCH /vehicles/:id)
```bash
PATCH /vehicles/vehicle-123
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "maintenance",
  "dailyRate": 55.00
}
```

### Delete Vehicle (DELETE /vehicles/:id)
```bash
DELETE /vehicles/vehicle-123
Authorization: Bearer <token>

# Soft delete - prevents deletion if active bookings exist
```

### Get Vehicle Statistics (GET /vehicles/statistics)
```bash
GET /vehicles/statistics
Authorization: Bearer <token>

# Returns statistics for agency vehicles
```

### Check Vehicle Availability (GET /vehicles/:id/availability)
```bash
GET /vehicles/vehicle-123/availability?startDate=2024-02-01&endDate=2024-02-05
Authorization: Bearer <token>

# Query Parameters:
# - startDate: rental start date (ISO format)
# - endDate: rental end date (ISO format)
```

---

## Customers Module
**Base URL:** `/customers`
**Authentication:** Required (Bearer Token)
**Authorization:** Role-based (SUPER_ADMIN, PROPRIETAIRE, MANAGER, AGENT_COMPTOIR)

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|------------------|-----------------|-------------|
| **POST** | `/customers` | `create()` | `create()` | Create a new customer |
| **GET** | `/customers` | `findAll()` | `findAll()` | Get all customers |
| **GET** | `/customers/:id` | `findOne()` | `findOne()` | Get a specific customer |
| **PATCH** | `/customers/:id` | `update()` | `update()` | Update customer information |
| **DELETE** | `/customers/:id` | `remove()` | `remove()` | Delete a customer |
| **GET** | `/customers/:id/bookings` | `getBookings()` | `getBookings()` | Get customer booking history |
| **PUT** | `/customers/:id/blacklist` | `toggleBlacklist()` | `toggleBlacklist()` | Toggle customer blacklist status |

**Request/Response Examples:**

### Create Customer (POST /customers)
```bash
POST /customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "customerType": "individual",
  "dateOfBirth": "1990-01-15",
  "idCardNumber": "ID123456",
  "driverLicenseNumber": "DL987654",
  "licenseExpiryDate": "2026-01-15",
  "address": "123 Main Street",
  "city": "New York",
  "agencyId": "agency-123"
}
```

### Get All Customers (GET /customers)
```bash
GET /customers
Authorization: Bearer <token>

# Returns customers for the user's agency
```

### Get Customer by ID (GET /customers/:id)
```bash
GET /customers/customer-123
Authorization: Bearer <token>
```

### Update Customer (PATCH /customers/:id)
```bash
PATCH /customers/customer-123
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+0987654321",
  "address": "456 Oak Avenue",
  "licenseExpiryDate": "2027-01-15"
}
```

### Delete Customer (DELETE /customers/:id)
```bash
DELETE /customers/customer-123
Authorization: Bearer <token>
```

### Get Customer Bookings (GET /customers/:id/bookings)
```bash
GET /customers/customer-123/bookings
Authorization: Bearer <token>

# Returns customer's booking history
```

### Toggle Customer Blacklist (PUT /customers/:id/blacklist)
```bash
PUT /customers/customer-123/blacklist
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_blacklisted": true,
  "reason": "Non-payment of previous rental"
}
```

---

## Bookings Module
**Base URL:** `/bookings`
**Authentication:** Required (Bearer Token)

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|------------------|-----------------|-------------|
| **POST** | `/bookings` | `create()` | `create()` | Create a new booking |
| **GET** | `/bookings` | `findAll()` | `findAll()` | Get all bookings |
| **GET** | `/bookings/:id` | `findOne()` | `findOne()` | Get a specific booking |
| **PATCH** | `/bookings/:id` | `update()` | `update()` | Update booking information |
| **DELETE** | `/bookings/:id` | `remove()` | `remove()` | Delete a booking |
| **POST** | `/bookings/check-availability` | `checkAvailability()` | `checkAvailability()` | Check vehicle availability |
| **POST** | `/bookings/:id/confirm` | `confirm()` | `confirm()` | Confirm a booking |
| **POST** | `/bookings/:id/start` | `start()` | `start()` | Start rental (vehicle pickup) |
| **POST** | `/bookings/:id/complete` | `complete()` | `complete()` | Complete rental (vehicle return) |
| **POST** | `/bookings/:id/cancel` | `cancel()` | `cancel()` | Cancel a booking |

**Request/Response Examples:**

### Create Booking (POST /bookings)
```bash
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer-123",
  "vehicleId": "vehicle-456",
  "startDate": "2024-02-15T10:00:00Z",
  "endDate": "2024-02-20T10:00:00Z",
  "estimatedCost": 250.00,
  "notes": "Airport pickup",
  "agencyId": "agency-123"
}
```

### Get All Bookings (GET /bookings)
```bash
GET /bookings?status=confirmed&customerId=customer-123
Authorization: Bearer <token>

# Query Parameters:
# - status: filter by status (pending, confirmed, active, completed, cancelled)
# - customerId: filter by customer
# - vehicleId: filter by vehicle
# - agencyId: filter by agency
```

### Get Booking by ID (GET /bookings/:id)
```bash
GET /bookings/booking-789
Authorization: Bearer <token>
```

### Update Booking (PATCH /bookings/:id)
```bash
PATCH /bookings/booking-789
Authorization: Bearer <token>
Content-Type: application/json

{
  "estimatedCost": 280.00,
  "notes": "Extended rental period"
}
```

### Delete Booking (DELETE /bookings/:id)
```bash
DELETE /bookings/booking-789
Authorization: Bearer <token>
```

### Check Vehicle Availability (POST /bookings/check-availability)
```bash
POST /bookings/check-availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicleId": "vehicle-456",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20"
}

# Response: { available: true/false }
```

### Confirm Booking (POST /bookings/:id/confirm)
```bash
POST /bookings/booking-789/confirm
Authorization: Bearer <token>

# Changes status from pending to confirmed
```

### Start Rental (POST /bookings/:id/start)
```bash
POST /bookings/booking-789/start
Authorization: Bearer <token>

# Changes status to active (vehicle pickup)
```

### Complete Rental (POST /bookings/:id/complete)
```bash
POST /bookings/booking-789/complete
Authorization: Bearer <token>

# Changes status to completed (vehicle return)
```

### Cancel Booking (POST /bookings/:id/cancel)
```bash
POST /bookings/booking-789/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}

# Changes status to cancelled
```

---

## Authentication Flow

### Login (POST /auth/login)
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "MANAGER"
  }
}
```

### Using the Token
```bash
# Add to all subsequent requests:
Authorization: Bearer <access_token>
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists (e.g., duplicate email) |
| 500 | Internal Server Error |

---

## Common Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

---

## Pagination

For endpoints that support pagination, use these query parameters:

```bash
GET /users?page=1&pageSize=20

# page: page number (starts from 1)
# pageSize: number of items per page (default: 10, max: 100)
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

---

## Filtering and Search

Endpoints support various query filters:

```bash
# Example: Filter vehicles by status and brand
GET /vehicles?status=available&brand=Toyota&search=license-plate

# Example: Filter users by role
GET /users?role=MANAGER

# Example: Filter bookings by status
GET /bookings?status=confirmed&customerId=customer-123
```

---

## Rate Limiting

The API implements rate limiting:
- **Limit:** 100 requests per minute per IP
- **Headers:** Returns X-RateLimit-* headers

---

## Testing the Endpoints

### Using cURL
```bash
# Get all users
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/users

# Create a new customer
curl -X POST http://localhost:3000/customers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe",...}'
```

### Using Swagger UI
Navigate to: `http://localhost:3000/api/docs`

---

## Next Steps

1. **Set up authentication** with valid JWT tokens
2. **Configure database** with Prisma
3. **Run E2E tests** against a test environment
4. **Implement validation rules** for input data
5. **Add business logic** for complex operations

---

**Last Updated:** February 6, 2024
