# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_customers.py
from fastapi.testclient import TestClient

def test_get_customer_me(client: TestClient, customer_user_auth_headers: dict, test_customer: dict):
    """Test retrieving the current user's customer profile."""
    response = client.get("/api/v1/customers/me", headers=customer_user_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_customer["id"]
    assert data["phone_number"] == test_customer["phone_number"]

def test_get_all_customers_as_admin(client: TestClient, admin_user_auth_headers: dict, test_customer: dict):
    """Test retrieving all customer profiles as an admin."""
    response = client.get("/api/v1/customers/", headers=admin_user_auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1

def test_customer_cannot_get_all_customers(client: TestClient, customer_user_auth_headers: dict):
    """Test that a regular customer cannot list all customer profiles."""
    response = client.get("/api/v1/customers/", headers=customer_user_auth_headers)
    assert response.status_code == 403  # Or 401, depending on implementation