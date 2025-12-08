"""
Simple test to verify backend is accessible
"""
import requests

try:
    # Test root
    response = requests.get("http://127.0.0.1:8000/")
    print(f"GET / -> Status: {response.status_code}")
    
    # Test docs
    response = requests.get("http://127.0.0.1:8000/docs")
    print(f"GET /docs -> Status: {response.status_code}")
    
    # Test OpenAPI
    response = requests.get("http://127.0.0.1:8000/openapi.json")
    print(f"GET /openapi.json -> Status: {response.status_code}")
    
    if response.status_code == 200:
        api_spec = response.json()
        print(f"\nAPI Title: {api_spec.get('info', {}).get('title')}")
        print(f"Version: {api_spec.get('info', {}).get('version')}")
        
        # List proprietaire endpoints
        print("\n🔍 Proprietaire Endpoints:")
        for path, methods in api_spec.get('paths', {}).items():
            if 'proprietaire' in path:
                for method in methods.keys():
                    print(f"  {method.upper()} {path}")
    
except Exception as e:
    print(f"Error: {e}")
