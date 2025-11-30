"""
Script to manage multi-agency ownership for proprietaires
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.agency import Agency, SubscriptionPlan
from app.core.security import get_password_hash


def list_proprietaire_agencies(proprietaire_email: str):
    """List all agencies owned by a proprietaire"""
    db = SessionLocal()
    
    try:
        # Find the proprietaire user
        proprietaire = db.query(User).filter(
            User.email == proprietaire_email,
            User.role == UserRole.PROPRIETAIRE
        ).first()
        
        if not proprietaire:
            print(f"✗ Proprietaire not found: {proprietaire_email}")
            return
        
        # Get all owned agencies
        agencies = db.query(Agency).filter(Agency.owner_id == proprietaire.id).all()
        
        print(f"\n=== Agencies owned by {proprietaire.full_name} ({proprietaire.email}) ===")
        print(f"Total agencies: {len(agencies)}\n")
        
        for idx, agency in enumerate(agencies, 1):
            print(f"{idx}. {agency.name}")
            print(f"   ID: {agency.id}")
            print(f"   Tax ID: {agency.tax_id}")
            print(f"   Plan: {agency.subscription_plan.value}")
            print(f"   Active: {agency.is_active}")
            print(f"   City: {agency.city}")
            
            # Count managers in this agency
            managers = db.query(User).filter(
                User.agency_id == agency.id,
                User.role == UserRole.MANAGER
            ).all()
            print(f"   Managers: {len(managers)}")
            for manager in managers:
                print(f"      - {manager.full_name} ({manager.email})")
            print()
        
    finally:
        db.close()


def add_agency_to_proprietaire(
    proprietaire_email: str,
    agency_name: str,
    legal_name: str,
    tax_id: str,
    email: str,
    phone: str,
    address: str,
    city: str,
    subscription_plan: str = "basique"
):
    """Add a new agency to a proprietaire's portfolio"""
    db = SessionLocal()
    
    try:
        # Find the proprietaire user
        proprietaire = db.query(User).filter(
            User.email == proprietaire_email,
            User.role == UserRole.PROPRIETAIRE
        ).first()
        
        if not proprietaire:
            print(f"✗ Proprietaire not found: {proprietaire_email}")
            return
        
        # Check if tax_id already exists
        existing = db.query(Agency).filter(Agency.tax_id == tax_id).first()
        if existing:
            print(f"✗ Agency with tax_id {tax_id} already exists")
            return
        
        # Create the new agency
        new_agency = Agency(
            owner_id=proprietaire.id,
            name=agency_name,
            legal_name=legal_name,
            tax_id=tax_id,
            email=email,
            phone=phone,
            address=address,
            city=city,
            country="Tunisia",
            subscription_plan=SubscriptionPlan(subscription_plan.lower()),
            is_active=True
        )
        
        db.add(new_agency)
        db.commit()
        db.refresh(new_agency)
        
        print(f"\n✓ Successfully added agency '{agency_name}' to {proprietaire.full_name}'s portfolio")
        print(f"  Agency ID: {new_agency.id}")
        print(f"  Owner: {proprietaire.full_name} ({proprietaire.email})")
        print(f"  Plan: {new_agency.subscription_plan.value}")
        
    except Exception as e:
        print(f"✗ Error adding agency: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def assign_manager_to_agency(
    agency_id: str,
    manager_email: str,
    manager_name: str,
    manager_phone: str,
    manager_password: str = "manager123"
):
    """Assign a new manager to a specific agency"""
    db = SessionLocal()
    
    try:
        # Find the agency
        agency = db.query(Agency).filter(Agency.id == agency_id).first()
        if not agency:
            print(f"✗ Agency not found: {agency_id}")
            return
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == manager_email).first()
        if existing_user:
            print(f"✗ User with email {manager_email} already exists")
            return
        
        # Create the manager user
        manager = User(
            email=manager_email,
            hashed_password=get_password_hash(manager_password),
            full_name=manager_name,
            phone=manager_phone,
            role=UserRole.MANAGER,
            agency_id=agency.id,
            is_active=True,
            is_verified=True
        )
        
        db.add(manager)
        db.commit()
        db.refresh(manager)
        
        print(f"\n✓ Successfully assigned manager to agency '{agency.name}'")
        print(f"  Manager: {manager.full_name} ({manager.email})")
        print(f"  Agency: {agency.name}")
        print(f"  Password: {manager_password}")
        
    except Exception as e:
        print(f"✗ Error assigning manager: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def transfer_agency_ownership(agency_id: str, new_owner_email: str):
    """Transfer ownership of an agency to another proprietaire"""
    db = SessionLocal()
    
    try:
        # Find the agency
        agency = db.query(Agency).filter(Agency.id == agency_id).first()
        if not agency:
            print(f"✗ Agency not found: {agency_id}")
            return
        
        # Find the new owner
        new_owner = db.query(User).filter(
            User.email == new_owner_email,
            User.role == UserRole.PROPRIETAIRE
        ).first()
        
        if not new_owner:
            print(f"✗ Proprietaire not found: {new_owner_email}")
            return
        
        old_owner = db.query(User).filter(User.id == agency.owner_id).first()
        
        # Transfer ownership
        agency.owner_id = new_owner.id
        db.commit()
        
        print(f"\n✓ Successfully transferred agency ownership")
        print(f"  Agency: {agency.name}")
        print(f"  From: {old_owner.full_name if old_owner else 'N/A'}")
        print(f"  To: {new_owner.full_name}")
        
    except Exception as e:
        print(f"✗ Error transferring ownership: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("""
Usage:
  python manage_agencies.py list <proprietaire_email>
  python manage_agencies.py add <proprietaire_email> <agency_name> <tax_id> <email> <phone> <city>
  python manage_agencies.py assign_manager <agency_id> <manager_email> <manager_name> <manager_phone>
  python manage_agencies.py transfer <agency_id> <new_owner_email>
        """)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "list":
        if len(sys.argv) < 3:
            print("Usage: python manage_agencies.py list <proprietaire_email>")
            sys.exit(1)
        list_proprietaire_agencies(sys.argv[2])
    
    elif command == "add":
        if len(sys.argv) < 8:
            print("Usage: python manage_agencies.py add <proprietaire_email> <agency_name> <tax_id> <email> <phone> <city>")
            sys.exit(1)
        add_agency_to_proprietaire(
            proprietaire_email=sys.argv[2],
            agency_name=sys.argv[3],
            legal_name=sys.argv[3] + " SARL",
            tax_id=sys.argv[4],
            email=sys.argv[5],
            phone=sys.argv[6],
            address="123 Main Street",
            city=sys.argv[7]
        )
    
    elif command == "assign_manager":
        if len(sys.argv) < 6:
            print("Usage: python manage_agencies.py assign_manager <agency_id> <manager_email> <manager_name> <manager_phone>")
            sys.exit(1)
        assign_manager_to_agency(
            agency_id=sys.argv[2],
            manager_email=sys.argv[3],
            manager_name=sys.argv[4],
            manager_phone=sys.argv[5]
        )
    
    elif command == "transfer":
        if len(sys.argv) < 4:
            print("Usage: python manage_agencies.py transfer <agency_id> <new_owner_email>")
            sys.exit(1)
        transfer_agency_ownership(sys.argv[2], sys.argv[3])
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
