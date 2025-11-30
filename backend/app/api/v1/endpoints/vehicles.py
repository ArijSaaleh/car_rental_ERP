from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, get_current_tenant
from app.models.user import User, UserRole
from app.models.agency import Agency
from app.models.vehicle import VehicleStatus
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleListResponse
from app.services.vehicle import VehicleService
from app.middleware.feature_flags import FeatureFlags, require_feature


router = APIRouter(prefix="/vehicles", tags=["Fleet Management"])


@router.get("/", response_model=VehicleListResponse)
async def list_vehicles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[VehicleStatus] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    List all vehicles for the current agency with pagination and filtering
    
    Requires: Fleet Management feature (available in all plans)
    Roles: Manager, Proprietaire, Super Admin
    """
    # Verify feature access
    FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    skip = (page - 1) * page_size
    
    vehicles, total = VehicleService.get_vehicles(
        db=db,
        agency_id=agency.id,
        skip=skip,
        limit=page_size,
        status=status,
        brand=brand,
        search=search
    )
    
    return {
        "total": total,
        "vehicles": vehicles,
        "page": page,
        "page_size": page_size
    }


@router.get("/stats")
async def get_vehicle_stats(
    current_user: User = Depends(get_current_user),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get vehicle statistics for the current agency
    
    Requires: Fleet Management feature
    Roles: Manager, Proprietaire, Super Admin
    """
    FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    stats = VehicleService.get_vehicle_stats(db, agency.id)
    return stats


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: UUID,
    current_user: User = Depends(get_current_user),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get a specific vehicle by ID
    
    Requires: Fleet Management feature
    Roles: Manager, Proprietaire, Super Admin
    """
    FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    vehicle = VehicleService.get_vehicle_by_id(db, vehicle_id, agency.id)
    return vehicle


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_data: VehicleCreate,
    current_user: User = Depends(require_role([UserRole.MANAGER, UserRole.PROPRIETAIRE, UserRole.SUPER_ADMIN])),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Create a new vehicle
    
    Requires: Fleet Management feature
    Roles: Manager, Proprietaire, Super Admin
    """
    FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    vehicle = VehicleService.create_vehicle(db, vehicle_data, agency.id)
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: UUID,
    vehicle_data: VehicleUpdate,
    current_user: User = Depends(require_role([UserRole.MANAGER, UserRole.PROPRIETAIRE, UserRole.SUPER_ADMIN])),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Update a vehicle
    
    Requires: Fleet Management feature
    Roles: Manager, Proprietaire, Super Admin
    """
    FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    vehicle = VehicleService.update_vehicle(db, vehicle_id, vehicle_data, agency.id)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: UUID,
    current_user: User = Depends(require_role([UserRole.MANAGER, UserRole.PROPRIETAIRE, UserRole.SUPER_ADMIN])),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Delete a vehicle
    
    Requires: Fleet Management feature
    Roles: Manager, Proprietaire, Super Admin
    """
    FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    VehicleService.delete_vehicle(db, vehicle_id, agency.id)
    return None
