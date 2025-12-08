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

# 2. Get first agency
print("\n=== GET FIRST AGENCY ===")
agencies_response = requests.get(f"{BASE_URL}/admin/agencies", headers=headers)
if agencies_response.status_code != 200:
    print(f"❌ Failed to get agencies: {agencies_response.text}")
    exit(1)

agencies = agencies_response.json()
if not agencies:
    print("❌ No agencies found")
    exit(1)

agency = agencies[0]
agency_id = agency["id"]
print(f"✅ Found agency: {agency['name']} (ID: {agency_id})")
print(f"   Current city: {agency.get('city', 'N/A')}")
print(f"   Current postal_code: {agency.get('postal_code', 'N/A')}")

# 3. Update agency
print("\n=== UPDATE AGENCY ===")
update_data = {
    "name": f"{agency['name']} - UPDATED",
    "city": "Sfax Updated",
    "postal_code": "3000",
    "phone": "+21699888777",
    "address": "Updated Address 999"
}

print(f"Sending update: {json.dumps(update_data, indent=2)}")

update_response = requests.put(
    f"{BASE_URL}/admin/agencies/{agency_id}",
    headers=headers,
    json=update_data
)

print(f"Status: {update_response.status_code}")
print(f"Response: {update_response.text}")

if update_response.status_code == 200:
    print("✅ Agency updated successfully")
else:
    print(f"❌ Failed to update agency")
    exit(1)

# 4. Verify update
print("\n=== VERIFY UPDATE ===")
details_response = requests.get(
    f"{BASE_URL}/admin/agencies/{agency_id}",
    headers=headers
)

if details_response.status_code == 200:
    updated_agency = details_response.json()
    print(f"✅ Verified updates:")
    print(f"   Name: {updated_agency['name']}")
    print(f"   City: {updated_agency['city']}")
    print(f"   Postal Code: {updated_agency.get('postal_code', 'N/A')}")
    print(f"   Phone: {updated_agency['phone']}")
    print(f"   Address: {updated_agency['address']}")
    
    # Check if values match
    if updated_agency['city'] == "Sfax Updated":
        print("✅ City updated correctly")
    else:
        print(f"❌ City not updated (expected 'Sfax Updated', got '{updated_agency['city']}')")
    
    if updated_agency.get('postal_code') == "3000":
        print("✅ Postal code updated correctly")
    else:
        print(f"❌ Postal code not updated (expected '3000', got '{updated_agency.get('postal_code')}')")
else:
    print(f"❌ Failed to get updated agency: {details_response.text}")
