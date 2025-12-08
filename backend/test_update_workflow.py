import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

print("\n" + "="*70)
print("TEST END-TO-END: AGENCY UPDATE WORKFLOW")
print("="*70)

# 1. Login
print("\n[1/5] LOGIN")
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

# 2. List agencies (simulate loading page)
print("\n[2/5] LIST AGENCIES (Frontend loads page)")
agencies_response = requests.get(f"{BASE_URL}/admin/agencies", headers=headers)
if agencies_response.status_code != 200:
    print(f"❌ Failed to get agencies: {agencies_response.text}")
    exit(1)

agencies = agencies_response.json()
print(f"✅ Loaded {len(agencies)} agencies")

if not agencies:
    print("❌ No agencies to test")
    exit(1)

# Pick the first agency
agency = agencies[0]
agency_id = agency["id"]
print(f"\n📋 Selected agency for editing:")
print(f"   ID: {agency_id}")
print(f"   Name: {agency['name']}")
print(f"   City: {agency['city']}")
print(f"   Postal Code: {agency.get('postal_code', 'N/A')}")

# 3. Simulate opening edit dialog (frontend would populate form with these values)
print(f"\n[3/5] OPEN EDIT DIALOG (Frontend populates form)")
print(f"✅ Form populated with:")
print(f"   name: {agency['name']}")
print(f"   legal_name: {agency['legal_name']}")
print(f"   tax_id: {agency['tax_id']}")
print(f"   email: {agency['email']}")
print(f"   phone: {agency['phone']}")
print(f"   address: {agency['address']}")
print(f"   city: {agency['city']}")
print(f"   postal_code: {agency.get('postal_code', '')}")
print(f"   country: {agency['country']}")
print(f"   subscription_plan: {agency['subscription_plan']}")

# 4. User edits some fields and submits
print(f"\n[4/5] USER EDITS AND SUBMITS")
new_values = {
    "name": agency['name'],  # Keep same
    "legal_name": agency['legal_name'],  # Keep same
    "tax_id": agency['tax_id'],  # Keep same
    "email": agency['email'],  # Keep same
    "phone": "+21677777777",  # CHANGED
    "address": "New Address 123 Test Street",  # CHANGED
    "city": "Sousse",  # CHANGED
    "postal_code": "4000",  # CHANGED
    "country": "Tunisia",  # Keep same
    "subscription_plan": agency['subscription_plan'],  # Keep same
}

print(f"User changed:")
print(f"   phone: {agency['phone']} → {new_values['phone']}")
print(f"   address: {agency['address']} → {new_values['address']}")
print(f"   city: {agency['city']} → {new_values['city']}")
print(f"   postal_code: {agency.get('postal_code', 'N/A')} → {new_values['postal_code']}")

update_response = requests.put(
    f"{BASE_URL}/admin/agencies/{agency_id}",
    headers=headers,
    json=new_values
)

if update_response.status_code != 200:
    print(f"❌ Update failed: {update_response.text}")
    exit(1)

print(f"✅ Update request successful: {update_response.json()['message']}")

# 5. Reload agencies to verify (what frontend does after successful update)
print(f"\n[5/5] RELOAD AGENCIES (Frontend refreshes list)")
agencies_response = requests.get(f"{BASE_URL}/admin/agencies", headers=headers)
if agencies_response.status_code != 200:
    print(f"❌ Failed to reload agencies: {agencies_response.text}")
    exit(1)

agencies = agencies_response.json()
updated_agency = next((a for a in agencies if a["id"] == agency_id), None)

if not updated_agency:
    print(f"❌ Agency not found in reloaded list")
    exit(1)

print(f"✅ Agency reloaded from list")

# Verify changes
print(f"\n" + "="*70)
print("VERIFICATION")
print("="*70)

all_correct = True

if updated_agency['phone'] == new_values['phone']:
    print(f"✅ Phone updated: {updated_agency['phone']}")
else:
    print(f"❌ Phone NOT updated: expected {new_values['phone']}, got {updated_agency['phone']}")
    all_correct = False

if updated_agency['address'] == new_values['address']:
    print(f"✅ Address updated: {updated_agency['address']}")
else:
    print(f"❌ Address NOT updated: expected {new_values['address']}, got {updated_agency['address']}")
    all_correct = False

if updated_agency['city'] == new_values['city']:
    print(f"✅ City updated: {updated_agency['city']}")
else:
    print(f"❌ City NOT updated: expected {new_values['city']}, got {updated_agency['city']}")
    all_correct = False

if updated_agency.get('postal_code') == new_values['postal_code']:
    print(f"✅ Postal code updated: {updated_agency['postal_code']}")
else:
    print(f"❌ Postal code NOT updated: expected {new_values['postal_code']}, got {updated_agency.get('postal_code')}")
    all_correct = False

print(f"\n" + "="*70)
if all_correct:
    print("✅✅✅ ALL TESTS PASSED - UPDATE WORKFLOW WORKS CORRECTLY ✅✅✅")
else:
    print("❌ SOME TESTS FAILED")
print("="*70)
