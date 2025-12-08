"""Script to create sample data for testing proprietaire features"""
import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.agency import Agency, SubscriptionPlan
from app.models.customer import Customer, CustomerType
from app.models.vehicle import Vehicle, VehicleStatus, TransmissionType, FuelType
from app.core.security import get_password_hash
from datetime import datetime, timedelta
from decimal import Decimal

db = SessionLocal()

try:
    # 1. Create proprietaire user
    print("Creating proprietaire user...")
    proprietaire = User(
        email="owner@test.com",
        hashed_password=get_password_hash("test123"),
        full_name="Ahmed Ben Ali",
        phone="+216 98 123 456",
        role=UserRole.PROPRIETAIRE,  # Use enum directly
        is_active=True
    )
    db.add(proprietaire)
    db.flush()
    print(f"[OK] Proprietaire created: {proprietaire.email} (ID: {proprietaire.id})")
    
    # 2. Create agencies
    print("\nCreating agencies...")
    agencies_data = [
        {
            "name": "Rent Express Tunis",
            "legal_name": "Rent Express SARL",
            "city": "Tunis",
            "address": "Avenue Habib Bourguiba, Tunis 1000",
            "phone": "+216 71 123 456",
            "email": "tunis@rentexpress.tn",
            "subscription_plan": SubscriptionPlan.STANDARD,
            "tax_id": "1234567ABC"
        },
        {
            "name": "Rent Express Sousse",
            "legal_name": "Rent Express Sousse SARL",
            "city": "Sousse",
            "address": "Avenue Yasser Arafat, Sousse 4000",
            "phone": "+216 73 456 789",
            "email": "sousse@rentexpress.tn",
            "subscription_plan": SubscriptionPlan.BASIQUE,
            "tax_id": "7654321XYZ"
        },
        {
            "name": "Rent Express Sfax",
            "legal_name": "Rent Express Sfax SARL",
            "city": "Sfax",
            "address": "Avenue Majida Boulila, Sfax 3000",
            "phone": "+216 74 789 123",
            "email": "sfax@rentexpress.tn",
            "subscription_plan": SubscriptionPlan.ENTREPRISE,
            "tax_id": "9876543DEF"
        }
    ]
    
    agencies = []
    for agency_data in agencies_data:
        agency = Agency(
            owner_id=proprietaire.id,
            is_active=True,
            **agency_data
        )
        db.add(agency)
        agencies.append(agency)
    
    db.flush()
    for agency in agencies:
        print(f"✅ Agency created: {agency.name} (ID: {agency.id})")
    
    # 3. Create managers for each agency
    print("\nCreating managers...")
    managers = []
    for i, agency in enumerate(agencies):
        manager = User(
            email=f"manager{i+1}@test.com",
            hashed_password=get_password_hash("test123"),
            full_name=f"Manager {agency.city}",
            phone=f"+216 20 {100+i*10:03d} 000",
            role=UserRole.MANAGER.value,  # Use .value
            agency_id=agency.id,
            is_active=True
        )
        db.add(manager)
        managers.append(manager)
    
    db.flush()
    for manager in managers:
        print(f"✅ Manager created: {manager.email}")
    
    # 4. Create employees for each agency
    print("\nCreating employees...")
    employees = []
    for i, agency in enumerate(agencies):
        for j in range(3):  # 3 employees per agency
            employee = User(
                email=f"agent{i+1}_{j+1}@test.com",
                hashed_password=get_password_hash("test123"),
                full_name=f"Agent {j+1} - {agency.city}",
                phone=f"+216 21 {200+i*10+j:03d} 000",
                role=UserRole.AGENT_COMPTOIR.value,  # Use .value
                agency_id=agency.id,
                is_active=True
            )
            db.add(employee)
            employees.append(employee)
    
    db.flush()
    print(f"✅ Created {len(employees)} employees")
    
    # 5. Create vehicles for each agency
    print("\nCreating vehicles...")
    
    vehicle_templates = [
        {"brand": "Renault", "model": "Clio 5", "year": 2023, "fuel": FuelType.ESSENCE, "transmission": TransmissionType.MANUELLE, "price": 80},
        {"brand": "Peugeot", "model": "208", "year": 2023, "fuel": FuelType.ESSENCE, "transmission": TransmissionType.MANUELLE, "price": 85},
        {"brand": "Volkswagen", "model": "Golf 8", "year": 2023, "fuel": FuelType.DIESEL, "transmission": TransmissionType.AUTOMATIQUE, "price": 120},
        {"brand": "Toyota", "model": "Corolla", "year": 2022, "fuel": FuelType.HYBRIDE, "transmission": TransmissionType.AUTOMATIQUE, "price": 130},
        {"brand": "Hyundai", "model": "i20", "year": 2023, "fuel": FuelType.ESSENCE, "transmission": TransmissionType.MANUELLE, "price": 75},
        {"brand": "Kia", "model": "Sportage", "year": 2023, "fuel": FuelType.DIESEL, "transmission": TransmissionType.AUTOMATIQUE, "price": 150},
        {"brand": "Mercedes", "model": "Classe A", "year": 2023, "fuel": FuelType.DIESEL, "transmission": TransmissionType.AUTOMATIQUE, "price": 180},
    ]
    
    vehicles = []
    for i, agency in enumerate(agencies):
        num_vehicles = 5 + i * 2  # Tunis:5, Sousse:7, Sfax:9
        for j in range(num_vehicles):
            template = vehicle_templates[j % len(vehicle_templates)]
            license_plate = f"{1000+i*100+j} TUN {2023+i}"
            vehicle = Vehicle(
                agency_id=agency.id,
                license_plate=license_plate,
                registration_number=license_plate,
                brand=template["brand"],
                model=template["model"],
                year=template["year"],
                fuel_type=template["fuel"],
                transmission=template["transmission"],
                seats=5,
                daily_rate=Decimal(str(template["price"])),
                status=VehicleStatus.DISPONIBLE,
                mileage=5000 + j * 1000
            )
            db.add(vehicle)
            vehicles.append(vehicle)
    
    db.flush()
    print(f"✅ Created {len(vehicles)} vehicles")
    
    # 6. Create customers
    print("\nCreating customers...")
    
    customers_data = [
        # Individual customers
        {"email": "mohamed.ben.salem@gmail.com", "full_name": "Mohamed Ben Salem", "phone": "+216 22 111 222", "type": CustomerType.INDIVIDUAL, "cin": "12345678"},
        {"email": "fatma.trabelsi@yahoo.fr", "full_name": "Fatma Trabelsi", "phone": "+216 22 333 444", "type": CustomerType.INDIVIDUAL, "cin": "87654321"},
        {"email": "karim.mansour@hotmail.com", "full_name": "Karim Mansour", "phone": "+216 22 555 666", "type": CustomerType.INDIVIDUAL, "cin": "11223344"},
        {"email": "salma.bouaziz@gmail.com", "full_name": "Salma Bouaziz", "phone": "+216 22 777 888", "type": CustomerType.INDIVIDUAL, "cin": "44332211"},
        {"email": "youssef.gharbi@gmail.com", "full_name": "Youssef Gharbi", "phone": "+216 22 999 000", "type": CustomerType.INDIVIDUAL, "cin": "55667788"},
        
        # Company customers
        {"email": "contact@techcorp.tn", "full_name": "Tech Corp Tunisia", "phone": "+216 71 111 222", "type": CustomerType.COMPANY, "matricule_fiscal": "1111111A/M/000"},
        {"email": "info@servicepro.tn", "full_name": "Service Pro SARL", "phone": "+216 71 333 444", "type": CustomerType.COMPANY, "matricule_fiscal": "2222222B/A/000"},
        {"email": "contact@consult-experts.tn", "full_name": "Consult Experts", "phone": "+216 71 555 666", "type": CustomerType.COMPANY, "matricule_fiscal": "3333333C/M/000"},
    ]
    
    customers = []
    for i, cust_data in enumerate(customers_data):
        # Distribute customers across agencies
        agency = agencies[i % len(agencies)]
        
        customer = Customer(
            agency_id=agency.id,
            email=cust_data["email"],
            full_name=cust_data["full_name"],
            phone=cust_data["phone"],
            customer_type=cust_data["type"],
            cin=cust_data.get("cin"),
            matricule_fiscal=cust_data.get("matricule_fiscal"),
            is_blacklisted=False
        )
        db.add(customer)
        customers.append(customer)
    
    db.flush()
    print(f"✅ Created {len(customers)} customers")
    
    # Commit all changes
    db.commit()
    
    print("\n" + "="*50)
    print("✅ SAMPLE DATA CREATED SUCCESSFULLY!")
    print("="*50)
    print(f"\nProprietaire Login:")
    print(f"  Email: owner@test.com")
    print(f"  Password: test123")
    print(f"  Agencies: {len(agencies)}")
    print(f"\nAgencies:")
    for agency in agencies:
        print(f"  - {agency.name} ({agency.city})")
    print(f"\nManagers: {len(managers)}")
    print(f"Employees: {len(employees)}")
    print(f"Vehicles: {len(vehicles)}")
    print(f"Customers: {len(customers)}")
    
except Exception as e:
    db.rollback()
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
