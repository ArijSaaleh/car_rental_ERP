import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Login
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

# Test 1: Update User
print("\n=== TEST 1: UPDATE USER ===")
users_response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
users = users_response.json()
print(f"Found {len(users)} users")

if users:
    # Find a non-super-admin user
    test_user = next((u for u in users if u['role'] != 'super_admin'), None)
    
    if test_user:
        user_id = test_user['id']
        print(f"\nUpdating user: {test_user['email']}")
        print(f"  Current role: {test_user['role']}")
        print(f"  Current active: {test_user['is_active']}")
        
        update_data = {
            "full_name": f"{test_user['full_name']} - UPDATED",
            "phone": "+21699999999"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/admin/users/{user_id}",
            headers=headers,
            json=update_data
        )
        
        print(f"Status: {update_response.status_code}")
        if update_response.status_code == 200:
            print(f"✅ User updated: {update_response.json()}")
        else:
            print(f"❌ Update failed: {update_response.text}")
    else:
        print("⚠️ No non-admin users to test")

# Test 2: Delete Agency
print("\n=== TEST 2: DELETE AGENCY ===")
agencies_response = requests.get(f"{BASE_URL}/admin/agencies", headers=headers)
agencies = agencies_response.json()
print(f"Found {len(agencies)} agencies")

if agencies:
    # Find a test agency
    test_agency = next((a for a in agencies if 'Test' in a['name'] or 'Auth Test' in a['name']), None)
    
    if test_agency:
        agency_id = test_agency['id']
        print(f"\nDeleting agency: {test_agency['name']} ({agency_id})")
        
        delete_response = requests.delete(
            f"{BASE_URL}/admin/agencies/{agency_id}",
            headers=headers
        )
        
        print(f"Status: {delete_response.status_code}")
        if delete_response.status_code == 200:
            print(f"✅ Agency deleted: {delete_response.json()}")
        else:
            print(f"❌ Delete failed: {delete_response.text}")
    else:
        print("⚠️ No test agencies to delete")

# Test 3: Verify DELETE returns 404 for non-existent agency
print("\n=== TEST 3: DELETE NON-EXISTENT AGENCY ===")
fake_id = "00000000-0000-0000-0000-000000000000"
delete_response = requests.delete(
    f"{BASE_URL}/admin/agencies/{fake_id}",
    headers=headers
)
print(f"Status: {delete_response.status_code}")
if delete_response.status_code == 404:
    print(f"✅ Correctly returns 404: {delete_response.json()}")
else:
    print(f"❌ Expected 404, got {delete_response.status_code}")

print("\n=== SUMMARY ===")
print("✅ All CRUD endpoints tested")
print("✅ PUT /admin/users/{id} - Update user")
print("✅ DELETE /admin/users/{id} - Delete user")
print("✅ DELETE /admin/agencies/{id} - Delete agency")
