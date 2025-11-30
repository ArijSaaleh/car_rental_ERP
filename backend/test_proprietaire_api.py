"""
Test script for proprietaire API endpoints
"""
import requests
import json

API_URL = "http://localhost:8000/api/v1"

# Step 1: Login as proprietaire
print("=" * 50)
print("Step 1: Login as proprietaire")
print("=" * 50)

login_response = requests.post(
    f"{API_URL}/auth/login",
    json={
        "email": "proprietaire@example.com",
        "password": "proprietaire123"
    }
)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print("✅ Login successful")
    print(f"Token: {token[:50]}...")
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

headers = {
    "Authorization": f"Bearer {token}"
}

# Step 2: Get owned agencies
print("\n" + "=" * 50)
print("Step 2: Get owned agencies")
print("=" * 50)

agencies_response = requests.get(
    f"{API_URL}/proprietaire/agencies",
    headers=headers
)

if agencies_response.status_code == 200:
    agencies = agencies_response.json()
    print(f"✅ Found {len(agencies)} agency(ies)")
    for agency in agencies:
        print(f"   - {agency['name']} (ID: {agency['id']})")
        print(f"     Plan: {agency['subscription_plan']}, Active: {agency['is_active']}")
        print(f"     Managers: {agency['manager_count']}, Vehicles: {agency['vehicle_count']}")
else:
    print(f"❌ Failed to get agencies: {agencies_response.status_code}")
    print(agencies_response.text)
    exit(1)

# Step 3: Get multi-agency statistics
print("\n" + "=" * 50)
print("Step 3: Get multi-agency statistics")
print("=" * 50)

stats_response = requests.get(
    f"{API_URL}/proprietaire/statistics",
    headers=headers
)

if stats_response.status_code == 200:
    stats = stats_response.json()
    print(f"✅ Statistics retrieved successfully")
    print(f"   Total Agencies: {stats['total_agencies']}")
    print(f"   Active Agencies: {stats['active_agencies']}")
    print(f"   Total Users: {stats['total_users']}")
    print(f"   Total Vehicles: {stats['total_vehicles']}")
    print(f"   Total Customers: {stats['total_customers']}")
    print(f"   Total Bookings: {stats['total_bookings']}")
    print(f"   Total Revenue: ${stats['total_revenue']:.2f}")
else:
    print(f"❌ Failed to get statistics: {stats_response.status_code}")
    print(stats_response.text)

# Step 4: Get agency details (if agencies exist)
if agencies:
    agency_id = agencies[0]['id']
    print("\n" + "=" * 50)
    print(f"Step 4: Get details for agency: {agencies[0]['name']}")
    print("=" * 50)
    
    details_response = requests.get(
        f"{API_URL}/proprietaire/agencies/{agency_id}",
        headers=headers
    )
    
    if details_response.status_code == 200:
        details = details_response.json()
        print(f"✅ Agency details retrieved")
        print(f"   Legal Name: {details['legal_name']}")
        print(f"   Tax ID: {details['tax_id']}")
        print(f"   Email: {details['email']}")
        print(f"   City: {details['city']}, {details['country']}")
        print(f"   Managers: {len(details['managers'])}")
        for manager in details['managers']:
            print(f"      - {manager['full_name']} ({manager['email']})")
    else:
        print(f"❌ Failed to get agency details: {details_response.status_code}")
        print(details_response.text)

# Step 5: Get managers for agency
if agencies:
    agency_id = agencies[0]['id']
    print("\n" + "=" * 50)
    print(f"Step 5: Get managers for agency: {agencies[0]['name']}")
    print("=" * 50)
    
    managers_response = requests.get(
        f"{API_URL}/proprietaire/agencies/{agency_id}/managers",
        headers=headers
    )
    
    if managers_response.status_code == 200:
        managers = managers_response.json()
        print(f"✅ Found {len(managers)} manager(s)")
        for manager in managers:
            print(f"   - {manager['full_name']} ({manager['email']})")
            print(f"     Active: {manager['is_active']}, Last Login: {manager['last_login']}")
    else:
        print(f"❌ Failed to get managers: {managers_response.status_code}")
        print(managers_response.text)

print("\n" + "=" * 50)
print("✅ All tests completed successfully!")
print("=" * 50)
