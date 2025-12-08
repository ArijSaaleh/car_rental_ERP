"""Minimal sample data - just proprietaire and agencies"""
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.agency import Agency, SubscriptionPlan
from app.core.security import get_password_hash

db = SessionLocal()

try:
    # 1. Proprietaire
    prop = User(
        email="owner@test.com",
        hashed_password=get_password_hash("test123"),
        full_name="Ahmed Ben Ali",
        phone="+216 98 123 456",
        role=UserRole.PROPRIETAIRE,
        is_active=True
    )
    db.add(prop)
    db.flush()
    print(f"Proprietaire: {prop.email}")
    
    # 2. 3 Agencies
    agencies = [
        Agency(
            owner_id=prop.id,
            name="Rent Express Tunis",
            legal_name="Rent Express SARL",
            city="Tunis",
            address="Avenue Habib Bourguiba, Tunis 1000",
            phone="+216 71 123 456",
            email="tunis@rentexpress.tn",
            subscription_plan=SubscriptionPlan.STANDARD,
            tax_id="1234567ABC",
            is_active=True
        ),
        Agency(
            owner_id=prop.id,
            name="Rent Express Sousse",
            legal_name="Rent Express Sousse SARL",
            city="Sousse",
            address="Avenue Yasser Arafat, Sousse 4000",
            phone="+216 73 456 789",
            email="sousse@rentexpress.tn",
            subscription_plan=SubscriptionPlan.BASIQUE,
            tax_id="7654321XYZ",
            is_active=True
        ),
        Agency(
            owner_id=prop.id,
            name="Rent Express Sfax",
            legal_name="Rent Express Sfax SARL",
            city="Sfax",
            address="Avenue Majida Boulila, Sfax 3000",
            phone="+216 74 789 123",
            email="sfax@rentexpress.tn",
            subscription_plan=SubscriptionPlan.ENTREPRISE,
            tax_id="9876543DEF",
            is_active=True
        )
    ]
    
    for agency in agencies:
        db.add(agency)
    
    db.commit()
    print(f"\nSUCCESS! Created:")
    print(f"  - 1 Proprietaire: {prop.email}")
    print(f"  - 3 Agencies")
    print(f"\nLogin: owner@test.com / test123")
    
except Exception as e:
    db.rollback()
    print(f"ERROR: {e}")
finally:
    db.close()
