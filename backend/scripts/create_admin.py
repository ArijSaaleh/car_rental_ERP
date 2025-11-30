"""
Script to create a super admin user
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_super_admin():
    """Create a super admin user"""
    db = SessionLocal()
    
    try:
        # Check if super admin already exists
        existing_admin = db.query(User).filter(
            User.role == UserRole.SUPER_ADMIN
        ).first()
        
        if existing_admin:
            print(f"⚠️  Super admin already exists: {existing_admin.email}")
            return
        
        # Get admin details
        email = input("Enter super admin email: ")
        password = input("Enter super admin password: ")
        full_name = input("Enter super admin full name: ")
        
        # Create super admin
        admin = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"\n✅ Super admin created successfully!")
        print(f"   Email: {admin.email}")
        print(f"   ID: {admin.id}")
        
    except Exception as e:
        print(f"\n❌ Error creating super admin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_super_admin()
