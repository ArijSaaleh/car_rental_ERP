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
print(f"Status: {login_response.status_code}")
if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print("✅ Login successful")
else:
    print(f"❌ Login failed: {login_response.text}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# 2. Create Agency
print("\n=== CREATE AGENCY ===")
import time
timestamp = int(time.time())
agency_data = {
    "agency_name": f"Debug Agency {timestamp}",
    "email": f"debug{timestamp}@agency.com",
    "phone": "+21612345678",
    "address": "123 Debug Street",
    "city": "Tunis",
    "postal_code": "1000",
    "country": "Tunisia",
    "tax_id": f"TAX{timestamp}",
    "owner_full_name": "Debug Owner",
    "owner_email": f"owner.debug{timestamp}@agency.com",
    "owner_phone": "+21698765432",
    "owner_password": "Debug123!@#",
    "subscription_plan": "basique",
    "trial_days": 14
}

print(f"Request data: {json.dumps(agency_data, indent=2)}")
create_response = requests.post(
    f"{BASE_URL}/admin/agencies/onboard",
    headers=headers,
    json=agency_data
)
print(f"Status: {create_response.status_code}")
print(f"Response: {create_response.text}")

if create_response.status_code in [200, 201]:
    print("✅ Agency created successfully")
    print(f"Data: {json.dumps(create_response.json(), indent=2)}")
else:
    print(f"❌ Failed to create agency")
