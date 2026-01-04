"""
Pytest fixtures for testing
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.agency import Agency, SubscriptionPlan
from app.models.vehicle import Vehicle, VehicleStatus, VehicleCategory, FuelType, TransmissionType
from faker import Faker
from uuid import uuid4

fake = Faker()

# Test database URL (in-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database session for each test
    """
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a test client with overridden database dependency
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_agency(db_session):
    """
    Create a test agency
    """
    agency = Agency(
        id=uuid4(),
        name="Test Agency",
        legal_name="Test Agency SARL",
        email="agency@test.com",
        phone="+21612345678",
        address="123 Test Street",
        city="Tunis",
        postal_code="1000",
        country="Tunisia",
        tax_id="1234567X",
        subscription_plan=SubscriptionPlan.PRO,
        is_active=True
    )
    db_session.add(agency)
    db_session.commit()
    db_session.refresh(agency)
    return agency


@pytest.fixture
def test_super_admin(db_session):
    """
    Create a test super admin user
    """
    user = User(
        id=uuid4(),
        email="admin@test.com",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_proprietaire(db_session, test_agency):
    """
    Create a test proprietaire user
    """
    user = User(
        id=uuid4(),
        email="owner@test.com",
        hashed_password=get_password_hash("Owner@123"),
        full_name="Agency Owner",
        role=UserRole.PROPRIETAIRE,
        agency_id=test_agency.id,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    
    # Set agency owner
    test_agency.owner_id = user.id
    
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_manager(db_session, test_agency):
    """
    Create a test manager user
    """
    user = User(
        id=uuid4(),
        email="manager@test.com",
        hashed_password=get_password_hash("Manager@123"),
        full_name="Test Manager",
        role=UserRole.MANAGER,
        agency_id=test_agency.id,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_vehicle(db_session, test_agency):
    """
    Create a test vehicle
    """
    vehicle = Vehicle(
        id=uuid4(),
        agency_id=test_agency.id,
        license_plate="123TU456",
        brand="Toyota",
        model="Corolla",
        year=2023,
        category=VehicleCategory.SEDAN,
        fuel_type=FuelType.GASOLINE,
        transmission=TransmissionType.AUTOMATIC,
        seats=5,
        daily_rate=120.0,
        status=VehicleStatus.AVAILABLE,
        mileage=15000
    )
    db_session.add(vehicle)
    db_session.commit()
    db_session.refresh(vehicle)
    return vehicle


@pytest.fixture
def auth_headers_super_admin(client, test_super_admin):
    """
    Get authentication headers for super admin
    """
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "Admin@123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_proprietaire(client, test_proprietaire):
    """
    Get authentication headers for proprietaire
    """
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "owner@test.com",
            "password": "Owner@123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_manager(client, test_manager):
    """
    Get authentication headers for manager
    """
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "manager@test.com",
            "password": "Manager@123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
