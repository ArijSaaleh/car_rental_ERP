"""Script pour vérifier la liaison owner -> agences"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.agency import Agency

db = SessionLocal()

owner = db.query(User).filter(User.email == 'arij@owner.com').first()
if not owner:
    print("❌ Owner non trouvé!")
else:
    print(f"✓ Owner trouvé:")
    print(f"  - Email: {owner.email}")
    print(f"  - ID: {owner.id}")
    print(f"  - Role: {owner.role}")
    print()

    agencies = db.query(Agency).filter(Agency.owner_id == owner.id).all()
    print(f"✓ Agences liées à cet owner: {len(agencies)}")
    for agency in agencies:
        print(f"  - {agency.name} (owner_id: {agency.owner_id})")

db.close()
