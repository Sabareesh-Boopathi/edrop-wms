# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_warehouses.py
from fastapi.testclient import TestClient

def test_create_warehouse(client: TestClient, admin_user_auth_headers: dict):
    """Test creating a warehouse (admin only)."""
    data = {"name": "North Hub", "address": "1 North Pole", "city": "Winterfell"}
    response = client.post("/api/v1/warehouses/", json=data, headers=admin_user_auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == data["name"]

def test_get_all_warehouses(client: TestClient, test_warehouse: dict):
    """Test getting all warehouses."""
    response = client.get("/api/v1/warehouses/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1

def test_get_warehouse_by_id(client: TestClient, test_warehouse: dict):
    """Test getting a single warehouse by its ID."""
    warehouse_id = test_warehouse["id"]
    response = client.get(f"/api/v1/warehouses/{warehouse_id}")
    assert response.status_code == 200
    assert response.json()["id"] == warehouse_id