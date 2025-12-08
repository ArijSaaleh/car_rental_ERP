import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Test with super admin
print("\n=== TEST SUPER ADMIN ===")
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "admin@carental.tn",
        "password": "Admin@2024"
    }
)

if login_response.status_code == 200:
    print("✅ Super admin login successful")
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get user info
    me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if me_response.status_code == 200:
        user_info = me_response.json()
        print(f"\nUser Info:")
        print(f"  Email: {user_info.get('email')}")
        print(f"  Role: {user_info.get('role')}")
        print(f"  Full Name: {user_info.get('full_name')}")
        print(f"  Is Active: {user_info.get('is_active')}")
        
        if user_info.get('role') == 'SUPER_ADMIN':
            print("\n✅ User has SUPER_ADMIN role")
        else:
            print(f"\n❌ User does NOT have SUPER_ADMIN role (has: {user_info.get('role')})")
    else:
        print(f"❌ Failed to get user info: {me_response.text}")
    
    # Try to create agency
    print("\n=== TEST CREATE AGENCY ===")
    import time
    timestamp = int(time.time())
    agency_data = {
        "agency_name": f"Auth Test {timestamp}",
        "email": f"authtest{timestamp}@agency.com",
        "phone": "+21612345678",
        "address": "Test Address",
        "city": "Tunis",
        "postal_code": "1000",
        "country": "Tunisia",
        "tax_id": f"TAX{timestamp}",
        "owner_full_name": "Test Owner",
        "owner_email": f"owner{timestamp}@test.com",
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
    
    print(f"Status: {create_response.status_code}")
    if create_response.status_code == 200:
        print("✅ Agency creation successful with super admin")
        print(f"Response: {json.dumps(create_response.json(), indent=2)}")
    elif create_response.status_code == 401:
        print("❌ UNAUTHORIZED - Token or role issue")
        print(f"Response: {create_response.text}")
    elif create_response.status_code == 403:
        print("❌ FORBIDDEN - User doesn't have SUPER_ADMIN role")
        print(f"Response: {create_response.text}")
    else:
        print(f"❌ Failed with status {create_response.status_code}")
        print(f"Response: {create_response.text}")
else:
    print(f"❌ Super admin login failed: {login_response.text}")

# Now check if there's a different admin user
print("\n\n=== CHECKING DATABASE FOR USERS ===")
print("Run this SQL to check users:")
print("SELECT id, email, role, full_name, is_active FROM users WHERE role = 'SUPER_ADMIN';")
