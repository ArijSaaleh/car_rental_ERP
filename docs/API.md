# API Endpoints Documentation

## Authentication Endpoints

### POST /api/v1/auth/login
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### POST /api/v1/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+216 12 345 678",
  "role": "manager",
  "agency_id": "uuid-here"
}
```

### POST /api/v1/auth/logout
Logout current user (client-side token removal).

---

## Vehicle (Fleet) Endpoints

All vehicle endpoints require authentication via Bearer token.

### GET /api/v1/vehicles/
List all vehicles for the current agency.

**Query Parameters:**
- `page` (int, default: 1)
- `page_size` (int, default: 20, max: 100)
- `status` (optional): disponible, loue, maintenance, hors_service
- `brand` (optional): Filter by brand name
- `search` (optional): Search in license plate, brand, model

**Response:**
```json
{
  "total": 50,
  "vehicles": [...],
  "page": 1,
  "page_size": 20
}
```

### GET /api/v1/vehicles/stats
Get vehicle statistics for the current agency.

**Response:**
```json
{
  "total": 50,
  "available": 30,
  "rented": 15,
  "maintenance": 3,
  "out_of_service": 2,
  "utilization_rate": 30.0
}
```

### GET /api/v1/vehicles/{vehicle_id}
Get a specific vehicle by ID.

### POST /api/v1/vehicles/
Create a new vehicle.

**Required Roles:** Manager, Proprietaire, Super Admin

**Request Body:**
```json
{
  "license_plate": "123-TUN-456",
  "brand": "Renault",
  "model": "Clio",
  "year": 2023,
  "fuel_type": "essence",
  "transmission": "manuelle",
  "seats": 5,
  "doors": 4,
  "mileage": 15000,
  "status": "disponible",
  "daily_rate": 80.0
}
```

### PUT /api/v1/vehicles/{vehicle_id}
Update a vehicle.

**Required Roles:** Manager, Proprietaire, Super Admin

### DELETE /api/v1/vehicles/{vehicle_id}
Delete a vehicle.

**Required Roles:** Manager, Proprietaire, Super Admin

---

## Feature Access by Subscription Plan

| Feature | Basique | Standard | Premium | Entreprise |
|---------|---------|----------|---------|------------|
| Fleet Management | ✅ | ✅ | ✅ | ✅ |
| Pricing | ❌ | ✅ | ✅ | ✅ |
| Contracts | ❌ | ✅ | ✅ | ✅ |
| OCR Automation | ❌ | ❌ | ✅ | ✅ |
| Yield Management | ❌ | ❌ | ❌ | ✅ |

---

## Error Responses

### 400 Bad Request
Invalid request data.

### 401 Unauthorized
Missing or invalid authentication token.

### 403 Forbidden
User doesn't have permission or feature not available in subscription plan.

### 404 Not Found
Resource not found.

### 422 Unprocessable Entity
Validation error.

**Example Error Response:**
```json
{
  "detail": "Email already registered"
}
```
