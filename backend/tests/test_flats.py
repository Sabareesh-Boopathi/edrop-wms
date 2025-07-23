# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_flats.py
from fastapi.testclient import TestClient

def test_create_flat(client: TestClient, test_rwa: dict, admin_user_auth_headers: dict):
    """Test creating a Flat (admin only)."""
    flat_data = {"tower_block": "B", "flat_number": "202", "rwa_id": test_rwa["id"]}
    response = client.post("/api/v1/flats/", json=flat_data, headers=admin_user_auth_headers)
    assert response.status_code == 200
    assert response.json()["flat_number"] == flat_data["flat_number"]

def test_get_all_flats(client: TestClient, test_flat: dict):
    """Test getting all flats."""
    response = client.get("/api/v1/flats/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_flat_by_id(client: TestClient, test_flat: dict):
    """Test getting a single flat by its ID."""
    flat_id = test_flat["id"]
    response = client.get(f"/api/v1/flats/{flat_id}")
    assert response.status_code == 200
    assert response.json()["id"] == flat_id