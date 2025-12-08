"""
Direct test of proprietaire endpoints without login
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("="*70)
print("  TESTING PROPRIETAIRE ENDPOINTS (No Auth)")
print("="*70)

# Test various endpoints
endpoints = [
    ("GET", "/"),
    ("GET", "/docs"),
    ("GET", "/api/v1/proprietaire/statistics"),
    ("GET", "/api/v1/proprietaire/agencies"),
    ("GET", "/api/v1/proprietaire/clients"),
    ("GET", "/api/v1/proprietaire/contracts"),
]

for method, endpoint in endpoints:
    try:
        url = f"{BASE_URL}{endpoint}"
        response = requests.get(url)
        
        status_icon = "✅" if 200 <= response.status_code < 300 else "⚠️" if response.status_code == 401 or response.status_code == 403 else "❌"
        
        print(f"\n{status_icon} {method} {endpoint}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401:
            print(f"   Note: Authentication required (expected)")
        elif response.status_code == 403:
            print(f"   Note: Forbidden (role check)")
        elif response.status_code != 200:
            print(f"   Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"\n❌ {method} {endpoint}")
        print(f"   Error: {str(e)}")

print("\n" + "="*70)
print("  Note: 401/403 responses are expected without authentication")
print("  The important thing is that the endpoints are reachable")
print("="*70 + "\n")
