"""
Script to create a super admin user
Run this once to create the initial super admin
"""
import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_super_admin():
    """Create a super admin user"""
    db: Session = SessionLocal()
    
    try:
        # Check if super admin already exists
        existing_admin = db.query(User).filter(
            User.role == UserRole.SUPER_ADMIN
        ).first()
        
        if existing_admin:
            print(f"❌ Super admin already exists: {existing_admin.email}")
            return False
        
        # Create super admin
        super_admin = User(
            email="admin@carental.tn",
            hashed_password=get_password_hash("Admin@2024"),  # Change this password!
            full_name="Super Administrator",
            phone="+216 20 000 000",
            role=UserRole.SUPER_ADMIN,
            agency_id=None,  # Super admin is not tied to any agency
            is_active=True,
            is_verified=True
        )
        
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        
        print("✅ Super admin created successfully!")
        print(f"   Email: {super_admin.email}")
        print(f"   Password: Admin@2024")
        print(f"   Role: {super_admin.role}")
        print(f"   ID: {super_admin.id}")
        print("\n⚠️  IMPORTANT: Change the password after first login!")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating super admin: {e}")
        return False
        
    finally:
        db.close()


if __name__ == "__main__":
    create_super_admin()
