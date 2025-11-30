"""
Script to create a proprietaire user with an agency
"""
import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.agency import Agency, SubscriptionPlan
from app.core.security import get_password_hash


def create_proprietaire():
    """Create a proprietaire user with agency"""
    db = SessionLocal()
    
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Check if agency already exists
        existing_agency = db.query(Agency).filter(Agency.email == "agency@example.com").first()
        
        if existing_agency:
            print(f"Agency already exists: {existing_agency.name}")
            agency = existing_agency
        else:
            # Create agency
            agency = Agency(
                name="Test Agency",
                legal_name="Test Agency SARL",
                tax_id="1234567A",
                email="agency@example.com",
                phone="+216 12 345 678",
                address="123 Main Street",
                city="Tunis",
                country="Tunisia",
                subscription_plan=SubscriptionPlan.PREMIUM,
                is_active=True
            )
            db.add(agency)
            db.flush()
            print(f"✓ Created agency: {agency.name} (ID: {agency.id})")
        
        # Check if proprietaire already exists
        existing_user = db.query(User).filter(User.email == "proprietaire@example.com").first()
        
        if existing_user:
            print(f"Proprietaire user already exists: {existing_user.email}")
            print(f"  - Full Name: {existing_user.full_name}")
            print(f"  - Role: {existing_user.role}")
            print(f"  - Agency: {agency.name}")
            print(f"  - Active: {existing_user.is_active}")
        else:
            # Create proprietaire user
            proprietaire = User(
                email="proprietaire@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="John Proprietaire",
                phone="+216 98 765 432",
                role=UserRole.PROPRIETAIRE,
                agency_id=agency.id,
                is_active=True,
                is_verified=True
            )
            db.add(proprietaire)
            db.flush()
            
            # Set the proprietaire as the owner of the agency
            agency.owner_id = proprietaire.id
            db.commit()
            
            print(f"\n✓ Created proprietaire user successfully!")
            print(f"\n=== Login Credentials ===")
            print(f"Email: proprietaire@example.com")
            print(f"Password: password123")
            print(f"Role: PROPRIETAIRE")
            print(f"Agency: {agency.name}")
            print(f"========================\n")
        
        db.commit()
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_proprietaire()
