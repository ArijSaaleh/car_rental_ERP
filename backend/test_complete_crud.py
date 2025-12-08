import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_admin_crud():
    """Test all admin CRUD endpoints"""
    
    # 1. Login
    print("\n" + "="*60)
    print("TEST 1: LOGIN AS SUPER ADMIN")
    print("="*60)
    
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "admin@carental.tn",
            "password": "Admin@2024"
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return False
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")
    
    # 2. List agencies (before creation)
    print("\n" + "="*60)
    print("TEST 2: LIST ALL AGENCIES (BEFORE)")
    print("="*60)
    
    list_response = requests.get(f"{BASE_URL}/admin/agencies", headers=headers)
    if list_response.status_code == 200:
        agencies_before = list_response.json()
        print(f"✅ Found {len(agencies_before)} agencies")
    else:
        print(f"❌ Failed to list agencies: {list_response.text}")
        return False
    
    # 3. Create new agency
    print("\n" + "="*60)
    print("TEST 3: CREATE NEW AGENCY")
    print("="*60)
    
    timestamp = int(time.time())
    agency_data = {
        "agency_name": f"Test Agency {timestamp}",
        "email": f"test{timestamp}@agency.com",
        "phone": "+21612345678",
        "address": "123 Test Street",
        "city": "Tunis",
        "postal_code": "1000",
        "country": "Tunisia",
        "tax_id": f"TAX{timestamp}",
        "owner_full_name": "Test Owner",
        "owner_email": f"owner.test{timestamp}@agency.com",
        "owner_phone": "+21698765432",
        "owner_password": "Test123!@#",
        "subscription_plan": "basique",
        "trial_days": 14
    }
    
    create_response = requests.post(
        f"{BASE_URL}/admin/agencies/onboard",
        headers=headers,
        json=agency_data
    )
    
    if create_response.status_code in [200, 201]:
        created_agency = create_response.json()
        agency_id = created_agency["agency_id"]
        print(f"✅ Agency created: {created_agency['agency_name']}")
        print(f"   ID: {agency_id}")
        print(f"   Owner: {created_agency['owner_email']}")
    else:
        print(f"❌ Failed to create agency: {create_response.text}")
        return False
    
    # 4. Get agency details
    print("\n" + "="*60)
    print("TEST 4: GET AGENCY DETAILS")
    print("="*60)
    
    details_response = requests.get(
        f"{BASE_URL}/admin/agencies/{agency_id}",
        headers=headers
    )
    
    if details_response.status_code == 200:
        details = details_response.json()
        print(f"✅ Agency details retrieved")
        print(f"   Name: {details['name']}")
        print(f"   Email: {details['email']}")
        print(f"   Status: {'Active' if details['is_active'] else 'Inactive'}")
        print(f"   Total users: {details['statistics']['total_users']}")
        print(f"   Total vehicles: {details['statistics']['total_vehicles']}")
    else:
        print(f"❌ Failed to get agency details: {details_response.text}")
        return False
    
    # 5. Update agency
    print("\n" + "="*60)
    print("TEST 5: UPDATE AGENCY")
    print("="*60)
    
    update_data = {
        "name": f"Updated Agency {timestamp}",
        "phone": "+21699999999",
        "address": "456 Updated Street",
        "city": "Sousse"
    }
    
    update_response = requests.put(
        f"{BASE_URL}/admin/agencies/{agency_id}",
        headers=headers,
        json=update_data
    )
    
    if update_response.status_code == 200:
        updated = update_response.json()
        print(f"✅ Agency updated")
        print(f"   Name: {updated['name']}")
        print(f"   Message: {updated['message']}")
    else:
        print(f"❌ Failed to update agency: {update_response.text}")
        return False
    
    # 6. Toggle agency status
    print("\n" + "="*60)
    print("TEST 6: TOGGLE AGENCY STATUS")
    print("="*60)
    
    toggle_response = requests.patch(
        f"{BASE_URL}/admin/agencies/{agency_id}/toggle-status",
        headers=headers
    )
    
    if toggle_response.status_code == 200:
        toggled = toggle_response.json()
        print(f"✅ Status toggled")
        print(f"   New status: {'Active' if toggled['is_active'] else 'Inactive'}")
    else:
        print(f"❌ Failed to toggle status: {toggle_response.text}")
        return False
    
    # Toggle back
    toggle_back_response = requests.patch(
        f"{BASE_URL}/admin/agencies/{agency_id}/toggle-status",
        headers=headers
    )
    
    if toggle_back_response.status_code == 200:
        print(f"✅ Status toggled back to active")
    else:
        print(f"❌ Failed to toggle back: {toggle_back_response.text}")
    
    # 7. List all users
    print("\n" + "="*60)
    print("TEST 7: LIST ALL USERS")
    print("="*60)
    
    users_response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    
    if users_response.status_code == 200:
        users = users_response.json()
        print(f"✅ Found {len(users)} users")
        print(f"   Super admins: {sum(1 for u in users if u['role'] == 'SUPER_ADMIN')}")
        print(f"   Proprietaires: {sum(1 for u in users if u['role'] == 'PROPRIETAIRE')}")
    else:
        print(f"❌ Failed to list users: {users_response.text}")
        return False
    
    # 8. Get platform statistics
    print("\n" + "="*60)
    print("TEST 8: GET PLATFORM STATISTICS")
    print("="*60)
    
    stats_response = requests.get(f"{BASE_URL}/admin/statistics", headers=headers)
    
    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(f"✅ Statistics retrieved")
        print(f"   Total agencies: {stats['total_agencies']}")
        print(f"   Active agencies: {stats['active_agencies']}")
        print(f"   Total users: {stats['total_users']}")
        print(f"   Total vehicles: {stats['total_vehicles']}")
        print(f"   Total bookings: {stats['total_bookings']}")
    else:
        print(f"❌ Failed to get statistics: {stats_response.text}")
        return False
    
    # 9. List agencies (after creation)
    print("\n" + "="*60)
    print("TEST 9: LIST ALL AGENCIES (AFTER)")
    print("="*60)
    
    list_after_response = requests.get(f"{BASE_URL}/admin/agencies", headers=headers)
    
    if list_after_response.status_code == 200:
        agencies_after = list_after_response.json()
        print(f"✅ Found {len(agencies_after)} agencies")
        print(f"   New agencies created: {len(agencies_after) - len(agencies_before)}")
    else:
        print(f"❌ Failed to list agencies: {list_after_response.text}")
        return False
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print("✅ All CRUD operations completed successfully!")
    print(f"✅ Created agency ID: {agency_id}")
    return True


if __name__ == "__main__":
    success = test_admin_crud()
    if not success:
        exit(1)
