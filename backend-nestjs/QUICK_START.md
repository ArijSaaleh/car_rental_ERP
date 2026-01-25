# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Setup database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Start the server
npm run start:dev
```

## Access Points
- 🌐 API: http://localhost:8000/api
- 📚 Swagger Docs: http://localhost:8000/api/docs
- ❤️ Health Check: http://localhost:8000/api/health

## Test Credentials
After seeding, use these credentials to test:

```
Super Admin:
  Email: admin@carrental.tn
  Password: admin123

Agency Owner:
  Email: owner@testdrive.tn
  Password: owner123

Manager:
  Email: manager@testdrive.tn
  Password: manager123
```

## Quick API Test

### 1. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@testdrive.tn","password":"manager123"}'
```

### 2. Get Vehicles (use token from login response)
```bash
curl http://localhost:8000/api/vehicles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure
```
src/
├── common/          # Shared code (guards, interceptors, decorators)
├── modules/         # Feature modules (auth, vehicles, bookings, etc.)
├── app.module.ts    # Root module
└── main.ts          # Application entry point
```

## Key Features
✅ Multi-tenant architecture
✅ JWT authentication
✅ Role-based access control
✅ Swagger documentation
✅ Prisma ORM
✅ Rate limiting
✅ Input validation

## Next Steps
1. Explore the Swagger documentation at http://localhost:8000/api/docs
2. Test the API endpoints
3. Review the code structure
4. Check out MIGRATION_GUIDE.md for detailed information

## Common Commands
```bash
npm run start:dev      # Start in development mode
npm run build          # Build for production
npm run prisma:studio  # Open database GUI
npm run lint           # Run linter
npm run format         # Format code
```

## Need Help?
- 📖 Check README.md for comprehensive documentation
- 📚 Review MIGRATION_GUIDE.md for Python → NestJS comparison
- 🌐 Visit http://localhost:8000/api/docs for API documentation

---

Happy coding! 🎉
