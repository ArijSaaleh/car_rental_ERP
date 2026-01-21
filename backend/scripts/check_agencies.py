"""Script pour vérifier la structure hiérarchique des agences"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.agency import Agency

db = SessionLocal()
agencies = db.query(Agency).all()

print('\n📊 STRUCTURE DES AGENCES:\n')
print(f'Total: {len(agencies)} agences\n')

# Trouver l'agence principale
main_agency = None
branches = []

for agency in agencies:
    if agency.parent_agency_id is None:
        main_agency = agency
        print(f'✓ AGENCE PRINCIPALE:')
        print(f'  - Nom: {agency.name}')
        print(f'  - ID: {agency.id}')
        print(f'  - Ville: {agency.city}')
        print(f'  - Email: {agency.email}')
        print(f'  - Plan: {agency.subscription_plan}')
        print()
    else:
        branches.append(agency)

if len(branches) > 0:
    print(f'✓ BRANCHES ({len(branches)}):')
    for branch in branches:
        print(f'  - {branch.name}')
        print(f'    ID: {branch.id}')
        print(f'    Ville: {branch.city}')
        print(f'    Email: {branch.email}')
        print(f'    Parent ID: {branch.parent_agency_id}')
        print(f'    Plan: {branch.subscription_plan}')
        print()

if main_agency:
    print(f'✅ Structure correcte: 1 agence principale + {len(branches)} branches')
else:
    print('❌ Erreur: Aucune agence principale trouvée!')

db.close()
