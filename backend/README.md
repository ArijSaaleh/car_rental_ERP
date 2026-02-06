# Car Rental Backend - NestJS Migration

This is the complete NestJS migration of the Car Rental SaaS Multi-Tenant backend from Python/FastAPI.

## 🚀 Features

- ✅ **Multi-Tenant Architecture** - Complete data isolation by agency
- ✅ **JWT Authentication** - Secure authentication with refresh tokens
- ✅ **Role-Based Access Control** - 6 user roles with fine-grained permissions
- ✅ **Prisma ORM** - Type-safe database access
- ✅ **Swagger Documentation** - Auto-generated API docs
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Vehicle Fleet Management** - CRUD operations with availability checking
- ✅ **Booking System** - Reservation management with conflict detection
- ✅ **Payment Integration** - Support for Tunisian gateways (Paymee, ClicToPay)
- ✅ **Contract Management** - PDF generation and e-signatures
- ✅ **Comprehensive Validation** - class-validator decorators

## 📋 Prerequisites

- Node.js 18+ or higher
- PostgreSQL 12+
- npm or yarn
- Redis (optional, for caching)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

## 🚀 Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Watch mode
npm start:watch
```

The API will be available at:
- **API**: http://localhost:8000/api
- **Swagger Docs**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/api/health

## 📚 Project Structure

```
src/
├── common/                    # Shared utilities
│   ├── decorators/           # Custom decorators (@CurrentUser, @Roles, etc.)
│   ├── filters/              # Exception filters
│   ├── guards/               # Auth guards (JWT, Roles)
│   ├── interceptors/         # Request/Response interceptors (Tenant, Transform)
│   ├── enums/                # TypeScript enums
│   └── prisma/               # Prisma service
├── modules/                   # Feature modules
│   ├── auth/                 # Authentication & JWT
│   ├── users/                # User management
│   ├── agencies/             # Agency/Tenant management
│   ├── vehicles/             # Fleet management
│   ├── bookings/             # Reservations
│   ├── contracts/            # Contract & PDF management
│   ├── payments/             # Payment processing
│   ├── customers/            # Customer management
│   ├── reports/              # Analytics & reporting
│   └── health/               # Health check
├── app.module.ts             # Root module
└── main.ts                   # Application entry point
```

## 🔐 Authentication

### Login
```bash
POST /api/auth/login
{
  "email": "manager@agency.com",
  "password": "password123"
}
```

### Register
```bash
POST /api/auth/register
{
  "email": "user@agency.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "MANAGER",
  "agencyId": "uuid-of-agency"
}
```

## 🏢 Multi-Tenant Features

### Automatic Tenant Isolation
All requests are automatically filtered by `agencyId` using the **TenantInterceptor**:

```typescript
// Automatic filtering in controllers
@Get()
findAll(@TenantContext() tenant: any) {
  return this.vehiclesService.findAll(tenant.agencyId);
}
```

### Super Admin Override
Super admins can access data across all agencies by providing `agencyId` in the request.

## 🔒 Role-Based Access Control

Available roles:
- `SUPER_ADMIN` - Platform administrator
- `PROPRIETAIRE` - Agency owner
- `MANAGER` - Agency manager
- `AGENT_COMPTOIR` - Counter agent
- `AGENT_PARC` - Fleet agent
- `CLIENT` - Customer (future)

Example usage:
```typescript
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
@Post()
create(@Body() createDto: CreateDto) {
  // Only accessible by specified roles
}
```

## 📊 Database

### Prisma Commands
```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (DB GUI)
npm run prisma:studio

# Reset database (DEV ONLY!)
npx prisma migrate reset
```

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Vehicles
- `GET /api/vehicles` - List vehicles (with filters)
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Create vehicle
- `PATCH /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `GET /api/vehicles/:id/availability` - Check availability
- `GET /api/vehicles/statistics` - Get fleet statistics

### Bookings
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/cancel` - Cancel booking

### Agencies
- `GET /api/agencies` - List agencies (Super Admin)
- `GET /api/agencies/:id` - Get agency details
- `POST /api/agencies` - Create agency (Super Admin)
- `PATCH /api/agencies/:id` - Update agency

## 🌍 Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `REDIS_HOST` - Redis host for caching
- `PAYMEE_API_KEY` - Paymee payment gateway key
- `CLICTOPAY_API_KEY` - ClicToPay payment gateway key

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Docker
```bash
# Build image
docker build -t car-rental-backend .

# Run container
docker run -p 8000:8000 car-rental-backend
```

## 📄 License

Proprietary - All rights reserved

## 🙏 Credits

Migrated from Python/FastAPI to NestJS/TypeScript for improved type safety and developer experience.

---

**Powered by NestJS, Prisma, and PostgreSQL**
