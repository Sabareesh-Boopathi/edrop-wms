# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_rwas.py
from fastapi.testclient import TestClient

def test_create_rwa(client: TestClient, admin_user_auth_headers: dict):
    """Test creating an RWA (admin only)."""
    rwa_data = {"name": "Sunshine Towers", "address": "456 Suburbia Lane", "city": "Metropolis"}
    response = client.post("/api/v1/rwas/", json=rwa_data, headers=admin_user_auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == rwa_data["name"]

def test_get_all_rwas(client: TestClient, test_rwa: dict):
    """Test getting all RWAs (no auth required)."""
    response = client.get("/api/v1/rwas/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_rwa_by_id(client: TestClient, test_rwa: dict):
    """Test getting a single RWA by its ID."""
    rwa_id = test_rwa["id"]
    response = client.get(f"/api/v1/rwas/{rwa_id}")
    assert response.status_code == 200
    assert response.json()["id"] == rwa_id