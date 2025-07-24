# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_rwas.py
from fastapi.testclient import TestClient

def test_create_rwa(client: TestClient, superuser_auth_headers: dict):
    """Test creating a new RWA as an admin."""
    rwa_data = {"name": "Greenwood Society", "address": "123 Park Lane", "city": "Metropolis"}
    response = client.post("/api/v1/rwas/", headers=superuser_auth_headers, json=rwa_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Greenwood Society"
    assert "id" in data

def test_get_all_rwas(client: TestClient, test_rwa: dict, superuser_auth_headers: dict):
    """Test getting all RWAs (admin only)."""
    response = client.get("/api/v1/rwas/", headers=superuser_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_rwa_by_id(client: TestClient, test_rwa: dict, superuser_auth_headers: dict):
    """Test getting a single RWA by its ID (admin only)."""
    rwa_id = test_rwa["id"]
    response = client.get(f"/api/v1/rwas/{rwa_id}", headers=superuser_auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == rwa_id