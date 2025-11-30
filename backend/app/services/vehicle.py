from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from uuid import UUID

from app.models.vehicle import Vehicle, VehicleStatus
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


class VehicleService:
    """
    Service for vehicle (fleet) management operations
    Implements Multi-Tenant data isolation
    """
    
    @staticmethod
    def get_vehicles(
        db: Session,
        agency_id: UUID,
        skip: int = 0,
        limit: int = 100,
        status: Optional[VehicleStatus] = None,
        brand: Optional[str] = None,
        search: Optional[str] = None
    ) -> tuple[List[Vehicle], int]:
        """
        Get all vehicles for an agency with filtering and pagination
        CRITICAL: Always filter by agency_id for multi-tenant isolation
        """
        query = db.query(Vehicle).filter(Vehicle.agency_id == agency_id)
        
        # Apply filters
        if status:
            query = query.filter(Vehicle.status == status)
        
        if brand:
            query = query.filter(Vehicle.brand.ilike(f"%{brand}%"))
        
        if search:
            query = query.filter(
                or_(
                    Vehicle.license_plate.ilike(f"%{search}%"),
                    Vehicle.brand.ilike(f"%{search}%"),
                    Vehicle.model.ilike(f"%{search}%"),
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        vehicles = query.offset(skip).limit(limit).all()
        
        return vehicles, total
    
    @staticmethod
    def get_vehicle_by_id(db: Session, vehicle_id: UUID, agency_id: UUID) -> Vehicle:
        """
        Get a specific vehicle by ID
        CRITICAL: Always verify agency_id for multi-tenant isolation
        """
        vehicle = db.query(Vehicle).filter(
            and_(
                Vehicle.id == vehicle_id,
                Vehicle.agency_id == agency_id
            )
        ).first()
        
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found"
            )
        
        return vehicle
    
    @staticmethod
    def create_vehicle(db: Session, vehicle_data: VehicleCreate, agency_id: UUID) -> Vehicle:
        """
        Create a new vehicle
        CRITICAL: Always set agency_id for multi-tenant isolation
        """
        # Check if license plate already exists (globally, not just for this agency)
        existing_vehicle = db.query(Vehicle).filter(
            Vehicle.license_plate == vehicle_data.license_plate
        ).first()
        
        if existing_vehicle:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="License plate already exists"
            )
        
        # Create vehicle with agency_id
        db_vehicle = Vehicle(
            **vehicle_data.model_dump(),
            agency_id=agency_id
        )
        
        db.add(db_vehicle)
        db.commit()
        db.refresh(db_vehicle)
        
        return db_vehicle
    
    @staticmethod
    def update_vehicle(
        db: Session,
        vehicle_id: UUID,
        vehicle_data: VehicleUpdate,
        agency_id: UUID
    ) -> Vehicle:
        """
        Update a vehicle
        CRITICAL: Always verify agency_id for multi-tenant isolation
        """
        vehicle = VehicleService.get_vehicle_by_id(db, vehicle_id, agency_id)
        
        # Check license plate uniqueness if it's being updated
        if vehicle_data.license_plate and vehicle_data.license_plate != vehicle.license_plate:
            existing_vehicle = db.query(Vehicle).filter(
                Vehicle.license_plate == vehicle_data.license_plate
            ).first()
            
            if existing_vehicle:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="License plate already exists"
                )
        
        # Update vehicle fields
        update_data = vehicle_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(vehicle, field, value)
        
        db.commit()
        db.refresh(vehicle)
        
        return vehicle
    
    @staticmethod
    def delete_vehicle(db: Session, vehicle_id: UUID, agency_id: UUID) -> bool:
        """
        Delete a vehicle
        CRITICAL: Always verify agency_id for multi-tenant isolation
        """
        vehicle = VehicleService.get_vehicle_by_id(db, vehicle_id, agency_id)
        
        db.delete(vehicle)
        db.commit()
        
        return True
    
    @staticmethod
    def get_vehicle_stats(db: Session, agency_id: UUID) -> dict:
        """
        Get vehicle statistics for an agency
        """
        total_vehicles = db.query(Vehicle).filter(Vehicle.agency_id == agency_id).count()
        
        available = db.query(Vehicle).filter(
            and_(
                Vehicle.agency_id == agency_id,
                Vehicle.status == VehicleStatus.DISPONIBLE
            )
        ).count()
        
        rented = db.query(Vehicle).filter(
            and_(
                Vehicle.agency_id == agency_id,
                Vehicle.status == VehicleStatus.LOUE
            )
        ).count()
        
        maintenance = db.query(Vehicle).filter(
            and_(
                Vehicle.agency_id == agency_id,
                Vehicle.status == VehicleStatus.MAINTENANCE
            )
        ).count()
        
        out_of_service = db.query(Vehicle).filter(
            and_(
                Vehicle.agency_id == agency_id,
                Vehicle.status == VehicleStatus.HORS_SERVICE
            )
        ).count()
        
        return {
            "total": total_vehicles,
            "available": available,
            "rented": rented,
            "maintenance": maintenance,
            "out_of_service": out_of_service,
            "utilization_rate": (rented / total_vehicles * 100) if total_vehicles > 0 else 0
        }
