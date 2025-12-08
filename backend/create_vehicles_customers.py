"""
Script pour créer des données de test complètes:
- Véhicules dans chaque agence
- Clients  
- Contrats/Réservations
"""
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.models.vehicle import Vehicle, VehicleStatus, FuelType, TransmissionType
from app.models.customer import Customer
from app.models.agency import Agency
from uuid import UUID

def create_sample_data():
    """Create comprehensive sample data"""
    
    db = SessionLocal()
    
    try:
        print("🚗 Creating sample vehicles and customers...")
        
        # Get all agencies
        agencies = db.query(Agency).all()
        print(f"\n✅ Found {len(agencies)} agencies")
        
        if not agencies:
            print("❌ No agencies found! Run migration first.")
            return
        
        # Vehicle data templates
        vehicles_data = [
            # Tunis (or first main agency)
            {"license_plate": "123TU1234", "brand": "Renault", "model": "Clio 5", "year": 2023, "color": "Blanche", 
             "fuel_type": FuelType.ESSENCE, "transmission": TransmissionType.MANUELLE, "mileage": 5000, 
             "status": VehicleStatus.DISPONIBLE, "daily_rate": 80.0, "seats": 5, "doors": 5},
            
            {"license_plate": "123TU5678", "brand": "Peugeot", "model": "208", "year": 2022, "color": "Grise", 
             "fuel_type": FuelType.DIESEL, "transmission": TransmissionType.MANUELLE, "mileage": 15000, 
             "status": VehicleStatus.DISPONIBLE, "daily_rate": 75.0, "seats": 5, "doors": 5},
            
            {"license_plate": "123TU9012", "brand": "Volkswagen", "model": "Golf 8", "year": 2023, "color": "Noire", 
             "fuel_type": FuelType.ESSENCE, "transmission": TransmissionType.AUTOMATIQUE, "mileage": 8000, 
             "status": VehicleStatus.DISPONIBLE, "daily_rate": 120.0, "seats": 5, "doors": 5},
            
            {"license_plate": "123TU3456", "brand": "Hyundai", "model": "i20", "year": 2021, "color": "Rouge", 
             "fuel_type": FuelType.ESSENCE, "transmission": TransmissionType.MANUELLE, "mileage": 25000, 
             "status": VehicleStatus.LOUE, "daily_rate": 65.0, "seats": 5, "doors": 5},
            
            {"license_plate": "123TU7890", "brand": "Kia", "model": "Picanto", "year": 2022, "color": "Bleue", 
             "fuel_type": FuelType.ESSENCE, "transmission": TransmissionType.MANUELLE, "mileage": 12000, 
             "status": VehicleStatus.DISPONIBLE, "daily_rate": 55.0, "seats": 4, "doors": 5},
        ]
        
        # Customer data
        customers_data = [
            {"first_name": "Ahmed", "last_name": "Ben Ali", "email": "ahmed.benali@email.tn", 
             "phone": "+216 98 123 456", "cin_number": "12345678", "license_number": "TN123456", 
             "address": "Avenue Habib Bourguiba, Tunis", "city": "Tunis", "postal_code": "1000"},
            
            {"first_name": "Fatma", "last_name": "Gharbi", "email": "fatma.gharbi@email.tn", 
             "phone": "+216 22 234 567", "cin_number": "23456789", "license_number": "TN234567", 
             "address": "Rue de la Liberté, Sousse", "city": "Sousse", "postal_code": "4000"},
            
            {"first_name": "Mohamed", "last_name": "Trabelsi", "email": "med.trabelsi@email.tn", 
             "phone": "+216 55 345 678", "cin_number": "34567890", "license_number": "TN345678", 
             "address": "Avenue Farhat Hached, Sfax", "city": "Sfax", "postal_code": "3000"},
            
            {"first_name": "Amira", "last_name": "Jlassi", "email": "amira.jlassi@email.tn", 
             "phone": "+216 24 456 789", "cin_number": "45678901", "license_number": "TN456789", 
             "address": "Boulevard du 20 Mars, Tunis", "city": "Tunis", "postal_code": "1001"},
            
            {"first_name": "Karim", "last_name": "Sassi", "email": "karim.sassi@email.tn", 
             "phone": "+216 99 567 890", "cin_number": "56789012", "license_number": "TN567890", 
             "address": "Rue Ibn Khaldoun, Sousse", "city": "Sousse", "postal_code": "4002"},
        ]
        
        # Create vehicles for each agency
        total_vehicles = 0
        for agency in agencies:
            # First agency gets all vehicles, others get 2-3 each
            num_vehicles = len(vehicles_data) if total_vehicles == 0 else min(3, len(vehicles_data))
            
            for i in range(num_vehicles):
                vehicle_template = vehicles_data[total_vehicles % len(vehicles_data)].copy()
                
                # Make license plate unique per agency
                plate_suffix = f"{agency.city[:2].upper()}{total_vehicles:04d}"
                vehicle_template['license_plate'] = f"123{plate_suffix}"
                
                # Check if vehicle already exists
                existing = db.query(Vehicle).filter(
                    Vehicle.license_plate == vehicle_template['license_plate']
                ).first()
                
                if not existing:
                    vehicle = Vehicle(
                        agency_id=agency.id,
                        **vehicle_template
                    )
                    db.add(vehicle)
                    total_vehicles += 1
                    print(f"  ✅ Created vehicle: {vehicle_template['brand']} {vehicle_template['model']} ({vehicle_template['license_plate']}) for {agency.name}")
        
        db.commit()
        print(f"\n✅ Created {total_vehicles} vehicles")
        
        # Create customers for each agency
        total_customers = 0
        for agency in agencies:
            # Each agency gets 2-3 customers
            num_customers = min(3, len(customers_data))
            
            for i in range(num_customers):
                customer_template = customers_data[total_customers % len(customers_data)].copy()
                
                # Make email unique
                email_parts = customer_template['email'].split('@')
                customer_template['email'] = f"{email_parts[0]}.{agency.city.lower()}@{email_parts[1]}"
                
                # Make CIN number unique per customer (add counter)
                base_cin = customer_template['cin_number']
                customer_template['cin_number'] = f"{base_cin}{total_customers:02d}"
                
                # Check if customer exists
                existing = db.query(Customer).filter(
                    Customer.email == customer_template['email']
                ).first()
                
                if not existing:
                    customer = Customer(
                        agency_id=agency.id,
                        **customer_template
                    )
                    db.add(customer)
                    total_customers += 1
                    print(f"  ✅ Created customer: {customer_template['first_name']} {customer_template['last_name']} for {agency.name}")
        
        db.commit()
        print(f"\n✅ Created {total_customers} customers")
        
        # Verify totals
        print("\n📊 Final Statistics:")
        print(f"  Total Agencies: {len(agencies)}")
        print(f"  Total Vehicles: {db.query(Vehicle).count()}")
        print(f"  Total Customers: {db.query(Customer).count()}")
        print(f"  Available Vehicles: {db.query(Vehicle).filter(Vehicle.status == VehicleStatus.DISPONIBLE).count()}")
        print(f"  Rented Vehicles: {db.query(Vehicle).filter(Vehicle.status == VehicleStatus.LOUE).count()}")
        
        print("\n🎉 Sample data created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()
