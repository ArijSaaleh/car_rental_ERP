"""
Script de seed pour générer des données de test complètes
Utilise les comptes existants: arij@admin.com et arij@owner.com (password: password123)
"""
import sys
import os
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
import random
from uuid import uuid4

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.agency import Agency, SubscriptionPlan
from app.models.vehicle import Vehicle, VehicleStatus, FuelType, TransmissionType
from app.models.customer import Customer
from app.models.booking import Booking, BookingStatus, PaymentStatus
from app.models.contract import Contract, ContractStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus as PaymentPaymentStatus
from app.core.security import get_password_hash


# Données des gouvernorats et villes de Tunisie
TUNISIA_LOCATIONS = [
    {"governorate": "Tunis", "city": "Tunis"},
    {"governorate": "Ariana", "city": "Ariana"},
    {"governorate": "Ben Arous", "city": "Ben Arous"},
    {"governorate": "Manouba", "city": "Manouba"},
    {"governorate": "Nabeul", "city": "Nabeul"},
    {"governorate": "Nabeul", "city": "Hammamet"},
    {"governorate": "Sousse", "city": "Sousse"},
    {"governorate": "Monastir", "city": "Monastir"},
    {"governorate": "Mahdia", "city": "Mahdia"},
    {"governorate": "Sfax", "city": "Sfax"},
    {"governorate": "Gabès", "city": "Gabès"},
    {"governorate": "Médenine", "city": "Djerba"},
    {"governorate": "Tozeur", "city": "Tozeur"},
]

# Noms d'agences
AGENCY_NAMES = [
    "AutoRent Tunisia", "Drive & Go", "Elite Car Rental", "TunisiaCar",
    "Med Car Location", "Sahara Rent", "Coastal Cars", "Desert Drive",
    "Premium Auto", "Smart Rental"
]

# Marques et modèles de véhicules
VEHICLE_DATA = [
    {"brand": "Renault", "model": "Clio", "seats": 5, "doors": 4},
    {"brand": "Peugeot", "model": "208", "seats": 5, "doors": 4},
    {"brand": "Fiat", "model": "Tipo", "seats": 5, "doors": 4},
    {"brand": "Volkswagen", "model": "Golf", "seats": 5, "doors": 4},
    {"brand": "Toyota", "model": "Corolla", "seats": 5, "doors": 4},
    {"brand": "Mercedes-Benz", "model": "Classe C", "seats": 5, "doors": 4},
    {"brand": "BMW", "model": "Série 3", "seats": 5, "doors": 4},
    {"brand": "Renault", "model": "Kangoo", "seats": 5, "doors": 4},
    {"brand": "Peugeot", "model": "Partner", "seats": 5, "doors": 4},
    {"brand": "Ford", "model": "Transit", "seats": 9, "doors": 4},
    {"brand": "Hyundai", "model": "Tucson", "seats": 5, "doors": 4},
    {"brand": "Dacia", "model": "Duster", "seats": 5, "doors": 4},
]

# Noms de clients tunisiens
TUNISIAN_FIRST_NAMES = [
    "Mohamed", "Ahmed", "Ali", "Karim", "Youssef", "Amine", "Mehdi", "Riadh",
    "Fatma", "Amira", "Salma", "Leila", "Nour", "Rim", "Sarra", "Asma"
]

TUNISIAN_LAST_NAMES = [
    "Ben Salah", "Trabelsi", "Gharbi", "Hamdi", "Bouazizi", "Jebali", 
    "Mahmoudi", "Mejri", "Oueslati", "Saidi", "Turki", "Zouari"
]


def create_superadmin(db: Session) -> User:
    """Créer le super admin si n'existe pas"""
    admin = db.query(User).filter(User.email == "arij@admin.com").first()
    if not admin:
        admin = User(
            email="arij@admin.com",
            hashed_password=get_password_hash("password123"),
            full_name="Arij Admin",
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("✓ Super admin créé: arij@admin.com")
    else:
        print("✓ Super admin existe déjà")
    return admin


def create_owner(db: Session) -> User:
    """Créer le propriétaire si n'existe pas"""
    owner = db.query(User).filter(User.email == "arij@owner.com").first()
    if not owner:
        owner = User(
            email="arij@owner.com",
            hashed_password=get_password_hash("password123"),
            full_name="Arij Owner",
            role=UserRole.PROPRIETAIRE,
            is_active=True
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        print("✓ Propriétaire créé: arij@owner.com")
    else:
        print("✓ Propriétaire existe déjà")
    return owner


def create_agencies(db: Session, owner: User, count: int = 5) -> list[Agency]:
    """Créer une agence principale + branches pour le propriétaire"""
    # Vérifier si des agences existent déjà pour ce propriétaire
    existing = db.query(Agency).filter(Agency.owner_id == owner.id).all()
    if len(existing) > 0:
        print(f"✓ {len(existing)} agences existent déjà pour ce propriétaire")
        return existing
    
    agencies = []
    
    # 1. Créer l'agence PRINCIPALE (parent_agency_id = None)
    main_location = TUNISIA_LOCATIONS[0]  # Tunis comme siège principal
    main_name = AGENCY_NAMES[0]
    
    main_agency = Agency(
        id=uuid4(),
        name=f"{main_name} - Siège Principal",
        legal_name=f"{main_name} SARL",
        tax_id=f"TN{random.randint(100000, 999999):06d}",
        email=f"contact.{main_name.lower().replace(' ', '')}@example.tn",
        phone=f"+216 {random.randint(20, 99)} {random.randint(100, 999)} {random.randint(100, 999)}",
        address=f"{random.randint(1, 200)} Avenue Habib Bourguiba",
        city=main_location['city'],
        postal_code=f"{random.randint(1000, 9999)}",
        country="Tunisia",
        subscription_plan=SubscriptionPlan.PREMIUM,  # L'agence principale a le plan premium
        is_active=True,
        owner_id=owner.id,
        parent_agency_id=None  # Agence principale
    )
    db.add(main_agency)
    db.flush()  # Pour obtenir l'ID de l'agence principale
    agencies.append(main_agency)
    print(f"✓ Agence principale créée: {main_agency.name}")
    
    # 2. Créer des BRANCHES (parent_agency_id = main_agency.id)
    for i in range(1, count):
        location = TUNISIA_LOCATIONS[i % len(TUNISIA_LOCATIONS)]
        # Nettoyer le nom de ville pour l'email (remplacer espaces par tirets)
        city_email = location['city'].lower().replace(' ', '-').replace('é', 'e').replace('è', 'e')
        
        branch = Agency(
            id=uuid4(),
            name=f"{main_name} - Branche {location['city']}",
            legal_name=f"{main_name} SARL - Succursale {location['city']}",
            tax_id=f"TN{random.randint(100000, 999999):06d}",
            email=f"branche.{city_email}@example.tn",
            phone=f"+216 {random.randint(20, 99)} {random.randint(100, 999)} {random.randint(100, 999)}",
            address=f"{random.randint(1, 200)} Avenue {random.choice(['de la Liberté', 'Mohamed V', '7 Novembre'])}",
            city=location['city'],
            postal_code=f"{random.randint(1000, 9999)}",
            country="Tunisia",
            subscription_plan=random.choice([SubscriptionPlan.BASIQUE, SubscriptionPlan.STANDARD]),
            is_active=True,
            owner_id=owner.id,
            parent_agency_id=main_agency.id  # Référence à l'agence principale
        )
        db.add(branch)
        agencies.append(branch)
        print(f"✓ Branche créée: {branch.name}")
    
    db.commit()
    print(f"✓ Total: 1 agence principale + {count-1} branches = {count} agences")
    return agencies


def create_vehicles(db: Session, agencies: list[Agency], count_per_agency: int = 10) -> list[Vehicle]:
    """Créer des véhicules pour chaque agence"""
    # Vérifier si des véhicules existent déjà
    existing = db.query(Vehicle).count()
    if existing > 0:
        print(f"✓ {existing} véhicules existent déjà, on les récupère")
        return db.query(Vehicle).all()
    
    vehicles = []
    
    for agency in agencies:
        for i in range(count_per_agency):
            vehicle_data = random.choice(VEHICLE_DATA)
            year = random.randint(2018, 2024)
            
            vehicle = Vehicle(
                id=uuid4(),
                agency_id=agency.id,
                license_plate=f"TN{random.randint(1000, 9999)}TU{random.randint(100, 999)}",
                brand=vehicle_data["brand"],
                model=vehicle_data["model"],
                year=year,
                color=random.choice(["Blanc", "Noir", "Gris", "Bleu", "Rouge", "Argent"]),
                vin=f"VF{random.randint(10000000000000, 99999999999999)}",
                fuel_type=random.choice([FuelType.ESSENCE, FuelType.DIESEL, FuelType.HYBRIDE]),
                transmission=random.choice([TransmissionType.MANUELLE, TransmissionType.AUTOMATIQUE]),
                seats=vehicle_data["seats"],
                doors=vehicle_data["doors"],
                mileage=random.randint(5000, 150000),
                daily_rate=float(random.randint(50, 300)),
                status=random.choice([VehicleStatus.DISPONIBLE, VehicleStatus.LOUE, VehicleStatus.MAINTENANCE])
            )
            db.add(vehicle)
            vehicles.append(vehicle)
    
    db.commit()
    print(f"✓ {len(vehicles)} véhicules créés")
    return vehicles


def create_customers(db: Session, agencies: list[Agency], count: int = 30) -> list[Customer]:
    """Créer des clients"""
    # Vérifier si des clients existent déjà
    existing = db.query(Customer).count()
    if existing > 0:
        print(f"✓ {existing} clients existent déjà, on les récupère")
        return db.query(Customer).all()
    
    customers = []
    
    for i in range(count):
        agency = random.choice(agencies)
        first_name = random.choice(TUNISIAN_FIRST_NAMES)
        last_name = random.choice(TUNISIAN_LAST_NAMES)
        
        customer = Customer(
            agency_id=agency.id,
            first_name=first_name,
            last_name=last_name,
            email=f"{first_name.lower()}.{last_name.lower().replace(' ', '')}@example.tn",
            phone=f"+216 {random.randint(20, 99)} {random.randint(100, 999)} {random.randint(100, 999)}",
            address=f"{random.randint(1, 150)} Rue {random.choice(['de la République', 'Ibn Khaldoun', 'Farhat Hached'])}",
            license_number=f"TN{random.randint(100000, 999999)}",
            license_expiry_date=datetime.now() + timedelta(days=random.randint(365, 3650)),
            cin_number=f"{random.randint(10000000, 99999999)}"
        )
        db.add(customer)
        customers.append(customer)
    
    db.commit()
    print(f"✓ {count} clients créés")
    return customers


def create_bookings(db: Session, agencies: list[Agency], vehicles: list[Vehicle], 
                   customers: list[Customer], owner: User, count: int = 50) -> list[Booking]:
    """Créer des réservations"""
    # Vérifier si des réservations existent déjà
    existing = db.query(Booking).count()
    if existing > 0:
        print(f"✓ {existing} réservations existent déjà, on les récupère")
        return db.query(Booking).all()
    
    bookings = []
    
    for i in range(count):
        agency = random.choice(agencies)
        # Filtrer véhicules de cette agence
        agency_vehicles = [v for v in vehicles if v.agency_id == agency.id]
        if not agency_vehicles:
            continue
            
        vehicle = random.choice(agency_vehicles)
        # Filtrer clients de cette agence
        agency_customers = [c for c in customers if c.agency_id == agency.id]
        if not agency_customers:
            continue
            
        customer = random.choice(agency_customers)
        
        # Dates de réservation
        start_date = datetime.now() - timedelta(days=random.randint(-30, 60))
        duration = random.randint(1, 14)
        end_date = start_date + timedelta(days=duration)
        
        booking = Booking(
            booking_number=f"BK-{datetime.now().year}-{random.randint(10000, 99999)}",
            agency_id=agency.id,
            vehicle_id=vehicle.id,
            customer_id=customer.id,
            created_by_user_id=owner.id,
            start_date=start_date.date(),
            end_date=end_date.date(),
            daily_rate=vehicle.daily_rate,
            duration_days=duration,
            subtotal=vehicle.daily_rate * duration,
            total_amount=vehicle.daily_rate * duration,
            status=random.choice([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, BookingStatus.CANCELLED]),
            payment_status=random.choice([PaymentStatus.PENDING, PaymentStatus.PARTIALLY_PAID, PaymentStatus.PAID])
        )
        db.add(booking)
        bookings.append(booking)
    
    db.commit()
    print(f"✓ {len(bookings)} réservations créées")
    return bookings


def create_contracts(db: Session, bookings: list[Booking]) -> list[Contract]:
    """Créer des contrats pour les réservations confirmées"""
    # Vérifier si des contrats existent déjà
    existing = db.query(Contract).count()
    if existing > 0:
        print(f"✓ {existing} contrats existent déjà, on les récupère")
        return db.query(Contract).all()
    
    contracts = []
    
    for booking in bookings:
        if booking.status in [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED]:
            contract = Contract(
                contract_number=f"CT-{datetime.now().year}-{random.randint(1000, 9999)}",
                agency_id=booking.agency_id,
                booking_id=booking.id,
                status=ContractStatus.SIGNED if booking.status == BookingStatus.IN_PROGRESS else ContractStatus.COMPLETED,
                terms_and_conditions="Conditions générales de location. Le locataire s'engage à respecter le code de la route et à restituer le véhicule dans l'état initial."
            )
            db.add(contract)
            contracts.append(contract)
    
    db.commit()
    print(f"✓ {len(contracts)} contrats créés")
    return contracts


def create_payments(db: Session, bookings: list[Booking]) -> list[Payment]:
    """Créer des paiements pour les réservations"""
    # Sauter les paiements pour l'instant - problème de schéma BD
    print("⚠ Paiements sautés (problème de schéma BD - invoice_id manquant)")
    return []


def main():
    """Fonction principale"""
    print("\n" + "="*50)
    print("🌱 SEED DATABASE - CAR RENTAL ERP")
    print("="*50 + "\n")
    
    db = SessionLocal()
    
    try:
        # 1. Créer utilisateurs
        print("📝 Création des utilisateurs...")
        admin = create_superadmin(db)
        owner = create_owner(db)
        
        # 2. Créer agences
        print("\n🏢 Création des agences...")
        agencies = create_agencies(db, owner, count=5)
        
        # 3. Créer véhicules
        print("\n🚗 Création des véhicules...")
        vehicles = create_vehicles(db, agencies, count_per_agency=10)
        
        # 4. Créer clients
        print("\n👥 Création des clients...")
        customers = create_customers(db, agencies, count=30)
        
        # 5. Créer réservations
        print("\n📅 Création des réservations...")
        bookings = create_bookings(db, agencies, vehicles, customers, owner, count=50)
        
        # 6. Créer contrats
        print("\n📄 Création des contrats...")
        contracts = create_contracts(db, bookings)
        
        # 7. Créer paiements
        print("\n💳 Création des paiements...")
        payments = create_payments(db, bookings)
        
        print("\n" + "="*50)
        print("✅ SEED TERMINÉ AVEC SUCCÈS!")
        print("="*50)
        print(f"""
📊 Résumé:
   - Utilisateurs: 2 (admin + owner)
   - Agences: {len(agencies)}
   - Véhicules: {len(vehicles)}
   - Clients: {len(customers)}
   - Réservations: {len(bookings)}
   - Contrats: {len(contracts)}
   - Paiements: {len(payments)}

🔐 Identifiants:
   Super Admin: arij@admin.com / password123
   Propriétaire: arij@owner.com / password123
        """)
        
    except Exception as e:
        print(f"\n❌ Erreur: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
