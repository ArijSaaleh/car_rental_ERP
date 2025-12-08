"""
Test script for all Proprietaire endpoints
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Test credentials - you should replace these with actual credentials
PROPRIETAIRE_EMAIL = "owner@test.com"
PROPRIETAIRE_PASSWORD = "password123"

def print_header(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_result(endpoint, method, status_code, response_data=None, error=None):
    status_icon = "✅" if 200 <= status_code < 300 else "❌"
    print(f"\n{status_icon} {method} {endpoint}")
    print(f"   Status: {status_code}")
    
    if error:
        print(f"   Error: {error}")
    elif response_data:
        if isinstance(response_data, list):
            print(f"   Items: {len(response_data)}")
            if response_data:
                print(f"   Sample: {json.dumps(response_data[0], indent=2)[:200]}...")
        elif isinstance(response_data, dict):
            print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
        else:
            print(f"   Response: {response_data}")

def login():
    """Authenticate and get access token"""
    print_header("AUTHENTICATION")
    
    payload = {
        "username": PROPRIETAIRE_EMAIL,
        "password": PROPRIETAIRE_PASSWORD
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print_result("/auth/login", "POST", response.status_code, response.json())
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"\n✅ Logged in successfully as {PROPRIETAIRE_EMAIL}")
            return token
        else:
            print(f"\n❌ Login failed. Please check credentials.")
            print("   Using test credentials:")
            print(f"   Email: {PROPRIETAIRE_EMAIL}")
            print(f"   Password: {PROPRIETAIRE_PASSWORD}")
            return None
            
    except Exception as e:
        print_result("/auth/login", "POST", 0, error=str(e))
        return None

def test_statistics(headers):
    """Test GET /proprietaire/statistics"""
    print_header("1. DASHBOARD STATISTICS")
    
    try:
        response = requests.get(f"{BASE_URL}/proprietaire/statistics", headers=headers)
        print_result("/proprietaire/statistics", "GET", response.status_code, response.json())
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print_result("/proprietaire/statistics", "GET", 0, error=str(e))
        return None

def test_agencies(headers):
    """Test GET /proprietaire/agencies"""
    print_header("2. GET AGENCIES")
    
    try:
        response = requests.get(f"{BASE_URL}/proprietaire/agencies", headers=headers)
        print_result("/proprietaire/agencies", "GET", response.status_code, response.json())
        
        agencies = response.json() if response.status_code == 200 else []
        return agencies
    except Exception as e:
        print_result("/proprietaire/agencies", "GET", 0, error=str(e))
        return []

def test_employees(headers, agency_id):
    """Test employee endpoints"""
    print_header("3. EMPLOYEE MANAGEMENT")
    
    # GET employees
    try:
        response = requests.get(
            f"{BASE_URL}/proprietaire/agencies/{agency_id}/employees",
            headers=headers
        )
        print_result(
            f"/proprietaire/agencies/{agency_id}/employees",
            "GET",
            response.status_code,
            response.json()
        )
    except Exception as e:
        print_result(f"/proprietaire/agencies/{agency_id}/employees", "GET", 0, error=str(e))
    
    # GET employees filtered by role
    try:
        response = requests.get(
            f"{BASE_URL}/proprietaire/agencies/{agency_id}/employees?role=manager",
            headers=headers
        )
        print_result(
            f"/proprietaire/agencies/{agency_id}/employees?role=manager",
            "GET",
            response.status_code,
            response.json()
        )
    except Exception as e:
        print_result(f"/proprietaire/agencies/{agency_id}/employees?role=manager", "GET", 0, error=str(e))

def test_clients(headers):
    """Test client endpoints"""
    print_header("4. CLIENT MANAGEMENT")
    
    # GET all clients
    try:
        response = requests.get(f"{BASE_URL}/proprietaire/clients", headers=headers)
        print_result("/proprietaire/clients", "GET", response.status_code, response.json())
        
        clients = response.json() if response.status_code == 200 else []
        
        # Test rental history for first client
        if clients:
            client_id = clients[0]["id"]
            try:
                response = requests.get(
                    f"{BASE_URL}/proprietaire/clients/{client_id}/rentals",
                    headers=headers
                )
                print_result(
                    f"/proprietaire/clients/{client_id}/rentals",
                    "GET",
                    response.status_code,
                    response.json()
                )
            except Exception as e:
                print_result(f"/proprietaire/clients/{client_id}/rentals", "GET", 0, error=str(e))
        
    except Exception as e:
        print_result("/proprietaire/clients", "GET", 0, error=str(e))

def test_contracts(headers):
    """Test contract endpoints"""
    print_header("5. CONTRACT MANAGEMENT")
    
    # GET all contracts
    try:
        response = requests.get(f"{BASE_URL}/proprietaire/contracts", headers=headers)
        print_result("/proprietaire/contracts", "GET", response.status_code, response.json())
        
        contracts = response.json() if response.status_code == 200 else []
        
        # Try to generate PDF for first contract
        if contracts:
            print("\n📄 PDF Generation Test:")
            print("   To test PDF generation, you need to provide complete contract data.")
            print("   This requires lessor info, vehicle details, etc.")
            print("   Skipping PDF generation test (requires full form data).")
        
    except Exception as e:
        print_result("/proprietaire/contracts", "GET", 0, error=str(e))

def test_agency_summary(headers, agency_id):
    """Test GET /proprietaire/agencies/{id}"""
    print_header("6. AGENCY SUMMARY")
    
    try:
        response = requests.get(
            f"{BASE_URL}/proprietaire/agencies/{agency_id}",
            headers=headers
        )
        print_result(
            f"/proprietaire/agencies/{agency_id}",
            "GET",
            response.status_code,
            response.json()
        )
    except Exception as e:
        print_result(f"/proprietaire/agencies/{agency_id}", "GET", 0, error=str(e))

def main():
    print("\n" + "🚀 "*35)
    print("  TESTING PROPRIETAIRE ENDPOINTS")
    print("🚀 "*35)
    
    # Login
    token = login()
    if not token:
        print("\n❌ Cannot proceed without authentication token")
        print("\nPlease create a proprietaire user first:")
        print("1. Go to http://127.0.0.1:8000/docs")
        print("2. Use POST /auth/register to create a user with role='proprietaire'")
        print("3. Update PROPRIETAIRE_EMAIL and PROPRIETAIRE_PASSWORD in this script")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test statistics
    stats = test_statistics(headers)
    
    # Test agencies
    agencies = test_agencies(headers)
    
    if not agencies:
        print("\n⚠️  No agencies found for this proprietaire")
        print("   Please create an agency first to test other endpoints")
        return
    
    agency_id = agencies[0]["id"]
    print(f"\n📍 Using agency ID: {agency_id}")
    
    # Test agency summary
    test_agency_summary(headers, agency_id)
    
    # Test employees
    test_employees(headers, agency_id)
    
    # Test clients
    test_clients(headers)
    
    # Test contracts
    test_contracts(headers)
    
    # Summary
    print_header("TEST SUMMARY")
    print("\n✅ Endpoints tested:")
    print("   1. GET  /proprietaire/statistics")
    print("   2. GET  /proprietaire/agencies")
    print("   3. GET  /proprietaire/agencies/{id}")
    print("   4. GET  /proprietaire/agencies/{id}/employees")
    print("   5. GET  /proprietaire/agencies/{id}/employees?role={role}")
    print("   6. GET  /proprietaire/clients")
    print("   7. GET  /proprietaire/clients/{id}/rentals")
    print("   8. GET  /proprietaire/contracts")
    print("\n📝 Note: CRUD operations (POST/PUT/DELETE) not tested to avoid data changes")
    print("   You can test these manually via the frontend or Swagger UI\n")

if __name__ == "__main__":
    main()
