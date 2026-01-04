"""
Tests for authentication endpoints
"""
import pytest
from fastapi import status


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_success(self, client, test_super_admin):
        """Test successful login"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@test.com",
                "password": "Admin@123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client, test_super_admin):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@test.com",
                "password": "WrongPassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "Password123"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user(self, client, auth_headers_super_admin):
        """Test getting current user info"""
        response = client.get(
            "/api/v1/auth/me",
            headers=auth_headers_super_admin
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "admin@test.com"
        assert data["role"] == "SUPER_ADMIN"
    
    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without authentication"""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_logout(self, client, auth_headers_super_admin):
        """Test logout endpoint"""
        response = client.post(
            "/api/v1/auth/logout",
            headers=auth_headers_super_admin
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
