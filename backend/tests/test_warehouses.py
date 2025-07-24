# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_warehouses.py
from fastapi.testclient import TestClient

def test_create_warehouse(client: TestClient, superuser_auth_headers: dict):
    """Test creating a warehouse (admin only)."""
    data = {"name": "North Hub", "address": "1 North Pole", "city": "Winterfell"}
    response = client.post("/api/v1/warehouses/", headers=superuser_auth_headers, json=data)
    assert response.status_code == 200
    assert response.json()["name"] == data["name"]

def test_get_all_warehouses(client: TestClient, test_warehouse: dict, superuser_auth_headers: dict):
    """Test getting all warehouses (admin only)."""
    response = client.get("/api/v1/warehouses/", headers=superuser_auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1

def test_get_warehouse_by_id(client: TestClient, test_warehouse: dict, superuser_auth_headers: dict):
    """Test getting a single warehouse by its ID (admin only)."""
    warehouse_id = test_warehouse["id"]
    response = client.get(f"/api/v1/warehouses/{warehouse_id}", headers=superuser_auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == warehouse_id