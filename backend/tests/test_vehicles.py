"""
Tests for vehicle endpoints
"""
import pytest
from fastapi import status


class TestVehicleEndpoints:
    """Test vehicle management endpoints"""
    
    def test_list_vehicles_as_manager(self, client, auth_headers_manager, test_vehicle):
        """Test listing vehicles as manager"""
        response = client.get(
            "/api/v1/vehicles",
            headers=auth_headers_manager
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["license_plate"] == "123TU456"
    
    def test_get_vehicle_by_id(self, client, auth_headers_manager, test_vehicle):
        """Test getting specific vehicle"""
        response = client.get(
            f"/api/v1/vehicles/{test_vehicle.id}",
            headers=auth_headers_manager
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["license_plate"] == "123TU456"
        assert data["brand"] == "Toyota"
        assert data["model"] == "Corolla"
    
    def test_create_vehicle_as_manager(self, client, auth_headers_manager, test_agency):
        """Test creating a vehicle as manager"""
        vehicle_data = {
            "license_plate": "789TU012",
            "brand": "Renault",
            "model": "Clio",
            "year": 2024,
            "category": "COMPACT",
            "fuel_type": "DIESEL",
            "transmission": "MANUAL",
            "seats": 5,
            "daily_rate": 100.0,
            "status": "AVAILABLE",
            "mileage": 5000
        }
        
        response = client.post(
            "/api/v1/vehicles",
            headers=auth_headers_manager,
            json=vehicle_data
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["license_plate"] == "789TU012"
        assert data["brand"] == "Renault"
    
    def test_update_vehicle(self, client, auth_headers_manager, test_vehicle):
        """Test updating vehicle"""
        update_data = {
            "daily_rate": 150.0,
            "mileage": 16000
        }
        
        response = client.put(
            f"/api/v1/vehicles/{test_vehicle.id}",
            headers=auth_headers_manager,
            json=update_data
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["daily_rate"] == 150.0
        assert data["mileage"] == 16000
    
    def test_delete_vehicle(self, client, auth_headers_manager, test_vehicle):
        """Test deleting vehicle"""
        response = client.delete(
            f"/api/v1/vehicles/{test_vehicle.id}",
            headers=auth_headers_manager
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify deletion
        get_response = client.get(
            f"/api/v1/vehicles/{test_vehicle.id}",
            headers=auth_headers_manager
        )
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_vehicle_stats(self, client, auth_headers_manager, test_vehicle):
        """Test vehicle statistics endpoint"""
        response = client.get(
            "/api/v1/vehicles/stats",
            headers=auth_headers_manager
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total" in data
        assert "available" in data
        assert data["total"] >= 1
