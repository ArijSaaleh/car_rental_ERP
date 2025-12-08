"""
Script de test pour tous les endpoints admin
Teste le CRUD complet pour la gestion des agences
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Token super admin (à obtenir via login)
TOKEN = None

def login():
    """Login en tant que super admin"""
    global TOKEN
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "admin@carental.com",
            "password": "admin123"
        }
    )
    if response.status_code == 200:
        TOKEN = response.json()["access_token"]
        print("✅ Login réussi")
        return True
    else:
        print(f"❌ Login échoué: {response.status_code} - {response.text}")
        return False

def get_headers():
    """Retourne les headers avec le token"""
    return {"Authorization": f"Bearer {TOKEN}"}

def test_create_agency():
    """Test POST /admin/agencies/onboard - Créer une nouvelle agence"""
    print("\n📝 Test: Créer une nouvelle agence")
    
    payload = {
        "agency_name": "Test Agency " + datetime.now().strftime("%H%M%S"),
        "email": f"test.agency.{datetime.now().strftime('%H%M%S')}@example.com",
        "phone": "+216 71 123 456",
        "address": "123 Avenue Habib Bourguiba",
        "city": "Tunis",
        "postal_code": "1000",
        "country": "Tunisia",
        "tax_id": f"TAX{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "owner_full_name": "Ahmed Ben Ali",
        "owner_email": f"ahmed.{datetime.now().strftime('%H%M%S')}@example.com",
        "owner_phone": "+216 98 765 432",
        "owner_password": "SecurePass123!",
        "subscription_plan": "basique",
        "trial_days": 14
    }
    
    response = requests.post(
        f"{BASE_URL}/admin/agencies/onboard",
        headers=get_headers(),
        json=payload
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Agence créée: {data.get('agency_name')} (ID: {data.get('agency_id')})")
        return data.get('agency_id')
    else:
        print(f"❌ Échec création: {response.status_code}")
        print(f"   Erreur: {response.text}")
        return None

def test_list_agencies():
    """Test GET /admin/agencies - Lister toutes les agences"""
    print("\n📋 Test: Lister toutes les agences")
    
    response = requests.get(
        f"{BASE_URL}/admin/agencies",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        agencies = response.json()
        print(f"✅ {len(agencies)} agence(s) trouvée(s)")
        for agency in agencies[:3]:  # Afficher les 3 premières
            print(f"   - {agency.get('name')} ({agency.get('city')}) - {agency.get('subscription_plan')}")
        return agencies
    else:
        print(f"❌ Échec liste: {response.status_code} - {response.text}")
        return []

def test_get_agency(agency_id):
    """Test GET /admin/agencies/{id} - Obtenir les détails d'une agence"""
    print(f"\n🔍 Test: Obtenir détails agence {agency_id}")
    
    response = requests.get(
        f"{BASE_URL}/admin/agencies/{agency_id}",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        agency = response.json()
        print(f"✅ Détails: {agency.get('name')}")
        print(f"   Email: {agency.get('email')}")
        print(f"   Ville: {agency.get('city')}")
        print(f"   Plan: {agency.get('subscription_plan')}")
        if 'statistics' in agency:
            stats = agency['statistics']
            print(f"   Stats: {stats.get('total_users')} users, {stats.get('total_vehicles')} vehicles, {stats.get('total_bookings')} bookings")
        return agency
    else:
        print(f"❌ Échec détails: {response.status_code} - {response.text}")
        return None

def test_update_agency(agency_id):
    """Test PUT /admin/agencies/{id} - Mettre à jour une agence"""
    print(f"\n✏️  Test: Mettre à jour agence {agency_id}")
    
    response = requests.put(
        f"{BASE_URL}/admin/agencies/{agency_id}",
        headers=get_headers(),
        params={
            "name": "Updated Test Agency",
            "city": "Sousse",
            "subscription_plan": "standard"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Agence mise à jour: {data.get('message')}")
        return True
    else:
        print(f"❌ Échec mise à jour: {response.status_code} - {response.text}")
        return False

def test_toggle_agency_status(agency_id):
    """Test PATCH /admin/agencies/{id}/toggle-status - Activer/désactiver"""
    print(f"\n🔄 Test: Basculer statut agence {agency_id}")
    
    response = requests.patch(
        f"{BASE_URL}/admin/agencies/{agency_id}/toggle-status",
        headers=get_headers(),
        params={"reason": "Test de basculement de statut"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Statut basculé: {data.get('message')}")
        print(f"   Actif: {data.get('is_active')}")
        return True
    else:
        print(f"❌ Échec toggle: {response.status_code} - {response.text}")
        return False

def test_list_users():
    """Test GET /admin/users - Lister tous les utilisateurs"""
    print("\n👥 Test: Lister tous les utilisateurs")
    
    response = requests.get(
        f"{BASE_URL}/admin/users",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        users = response.json()
        print(f"✅ {len(users)} utilisateur(s) trouvé(s)")
        for user in users[:5]:  # Afficher les 5 premiers
            print(f"   - {user.get('email')} ({user.get('role')}) - {user.get('full_name')}")
        return users
    else:
        print(f"❌ Échec liste users: {response.status_code} - {response.text}")
        return []

def test_get_statistics():
    """Test GET /admin/statistics - Obtenir les statistiques"""
    print("\n📊 Test: Obtenir les statistiques de la plateforme")
    
    response = requests.get(
        f"{BASE_URL}/admin/statistics",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        stats = response.json()
        print("✅ Statistiques:")
        print(f"   Agences totales: {stats.get('total_agencies')}")
        print(f"   Agences actives: {stats.get('active_agencies')}")
        print(f"   Utilisateurs: {stats.get('total_users')}")
        print(f"   Véhicules: {stats.get('total_vehicles')}")
        print(f"   Réservations: {stats.get('total_bookings')}")
        return stats
    else:
        print(f"❌ Échec stats: {response.status_code} - {response.text}")
        return None

def run_all_tests():
    """Exécute tous les tests dans l'ordre"""
    print("="*60)
    print("🧪 DÉBUT DES TESTS ENDPOINTS ADMIN")
    print("="*60)
    
    # Login
    if not login():
        print("\n❌ Impossible de continuer sans authentification")
        return
    
    # Test liste initiale
    test_list_agencies()
    
    # Test création
    agency_id = test_create_agency()
    if not agency_id:
        print("\n⚠️  Impossible de continuer les tests sans agence créée")
        return
    
    # Test get détails
    test_get_agency(agency_id)
    
    # Test update
    test_update_agency(agency_id)
    
    # Vérifier les changements
    test_get_agency(agency_id)
    
    # Test toggle status
    test_toggle_agency_status(agency_id)
    
    # Vérifier le changement de statut
    test_get_agency(agency_id)
    
    # Test liste users
    test_list_users()
    
    # Test statistics
    test_get_statistics()
    
    # Test liste finale
    test_list_agencies()
    
    print("\n" + "="*60)
    print("✅ TOUS LES TESTS TERMINÉS")
    print("="*60)

if __name__ == "__main__":
    run_all_tests()
