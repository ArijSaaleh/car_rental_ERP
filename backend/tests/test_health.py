"""
Tests for health check endpoints
"""
import pytest
from fastapi import status


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_basic_health_check(self, client):
        """Test basic health check endpoint"""
        response = client.get("/api/v1/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_detailed_health_check(self, client):
        """Test detailed health check with database"""
        response = client.get("/api/v1/health/detailed")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "status" in data
        assert "checks" in data
        assert "database" in data["checks"]
        assert data["checks"]["database"]["status"] == "healthy"
    
    def test_readiness_probe(self, client):
        """Test Kubernetes readiness probe"""
        response = client.get("/api/v1/health/readiness")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "ready"
    
    def test_liveness_probe(self, client):
        """Test Kubernetes liveness probe"""
        response = client.get("/api/v1/health/liveness")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "alive"
