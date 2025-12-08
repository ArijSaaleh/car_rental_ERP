import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# 1. Login
print("\n=== LOGIN ===")
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "admin@carental.tn",
        "password": "Admin@2024"
    }
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.text}")
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Login successful")

# 2. Get all agencies
print("\n=== GET ALL AGENCIES ===")
agencies_response = requests.get(f"{BASE_URL}/admin/agencies", headers=headers)
if agencies_response.status_code != 200:
    print(f"❌ Failed to get agencies: {agencies_response.text}")
    exit(1)

agencies = agencies_response.json()
print(f"✅ Found {len(agencies)} agencies")

if agencies:
    first_agency = agencies[0]
    print(f"\n=== FIRST AGENCY DETAILS ===")
    print(json.dumps(first_agency, indent=2))
    
    # Check required fields
    required_fields = ["id", "name", "legal_name", "tax_id", "email", "phone", 
                      "address", "city", "postal_code", "country", "subscription_plan", 
                      "is_active", "proprietaire_id", "created_at"]
    
    print(f"\n=== FIELD CHECK ===")
    missing_fields = []
    for field in required_fields:
        if field in first_agency:
            value = first_agency[field]
            print(f"✅ {field}: {value if value is not None else 'NULL'}")
        else:
            print(f"❌ {field}: MISSING")
            missing_fields.append(field)
    
    if missing_fields:
        print(f"\n❌ Missing fields: {', '.join(missing_fields)}")
    else:
        print(f"\n✅ All required fields present!")
