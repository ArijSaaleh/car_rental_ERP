"""
Reporting endpoints for business analytics
"""
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, check_permission
from app.models.user import User, UserRole
from app.services.reporting_service import ReportingService

router = APIRouter()


@router.get("/dashboard/summary")
async def get_dashboard_summary(
    current_user: User = Depends(check_permission(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Résumé complet pour le dashboard du manager
    KPIs: Taux d'occupation, CA mensuel, état flotte, réservations
    """
    summary = ReportingService.get_dashboard_summary(db, current_user.agency_id)
    return summary


@router.get("/occupancy-rate")
async def get_occupancy_rate(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(check_permission(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Taux d'occupation de la flotte pour une période donnée
    """
    occupancy = ReportingService.get_occupancy_rate(
        db=db,
        agency_id=current_user.agency_id,
        start_date=start_date,
        end_date=end_date
    )
    return occupancy


@router.get("/revenue")
async def get_revenue_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(check_permission(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Rapport de chiffre d'affaires pour une période
    """
    revenue = ReportingService.get_revenue_report(
        db=db,
        agency_id=current_user.agency_id,
        start_date=start_date,
        end_date=end_date
    )
    return revenue


@router.get("/revenue/monthly")
async def get_monthly_revenue(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    current_user: User = Depends(check_permission(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Chiffre d'affaires mensuel
    """
    revenue = ReportingService.get_monthly_revenue(
        db=db,
        agency_id=current_user.agency_id,
        year=year,
        month=month
    )
    return revenue


@router.get("/fleet-status")
async def get_fleet_status(
    current_user: User = Depends(check_permission(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """
    État actuel de la flotte (disponible, loué, maintenance, etc.)
    """
    fleet_status = ReportingService.get_fleet_status(db, current_user.agency_id)
    return fleet_status


@router.get("/top-vehicles")
async def get_top_vehicles(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(check_permission(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Véhicules les plus rentables
    """
    top_vehicles = ReportingService.get_top_vehicles(
        db=db,
        agency_id=current_user.agency_id,
        limit=limit
    )
    return {"top_vehicles": top_vehicles}
