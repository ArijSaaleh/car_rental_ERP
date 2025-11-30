from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, vehicles, bookings, contracts, payments, reports, 
    admin, users, agency, customers, proprietaire
)


api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, tags=["User Management"])
api_router.include_router(agency.router, tags=["Agency Management"])
api_router.include_router(customers.router, tags=["Customer Management"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reporting"])
api_router.include_router(admin.router, prefix="/admin", tags=["Super Admin"])
api_router.include_router(proprietaire.router, prefix="/proprietaire", tags=["Multi-Agency Management"])
