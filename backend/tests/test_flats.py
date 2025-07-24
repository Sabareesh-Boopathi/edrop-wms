# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_flats.py
from fastapi.testclient import TestClient

def test_create_flat(client: TestClient, test_rwa: dict, superuser_auth_headers: dict):
    """Test creating a new flat as an admin."""
    flat_data = {"flat_number": "A-101", "rwa_id": test_rwa["id"]}
    response = client.post("/api/v1/flats/", headers=superuser_auth_headers, json=flat_data)
    assert response.status_code == 200
    data = response.json()
    assert data["flat_number"] == "A-101"
    assert data["rwa_id"] == test_rwa["id"]

def test_get_all_flats(client: TestClient, test_flat: dict, customer_user_auth_headers: dict):
    """Test getting all flats."""
    response = client.get("/api/v1/flats/", headers=customer_user_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_flat_by_id(client: TestClient, test_flat: dict, customer_user_auth_headers: dict):
    """Test getting a single flat by its ID."""
    flat_id = test_flat["id"]
    response = client.get(f"/api/v1/flats/{flat_id}", headers=customer_user_auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == flat_id