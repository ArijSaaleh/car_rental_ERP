"""Script to check proprietaire and agency data in database"""
from app.database import SessionLocal
from app.models import Agency, User

db = SessionLocal()

# Check proprietaires
props = db.query(User).filter(User.role == 'proprietaire').all()
print(f'Total Proprietaires: {len(props)}')
print()

for p in props[:5]:  # Show first 5
    agencies = db.query(Agency).filter(Agency.owner_id == p.id).all()
    print(f'Proprietaire: {p.email} (ID: {p.id})')
    print(f'  Agencies: {len(agencies)}')
    for a in agencies:
        print(f'    - {a.name} (ID: {a.id}, City: {a.city}, Active: {a.is_active})')
    print()

db.close()
