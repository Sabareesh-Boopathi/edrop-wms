# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_vendor_profiles.py
from fastapi.testclient import TestClient

def test_get_vendor_me(client: TestClient, vendor_user_auth_headers: dict, test_vendor_profile: dict):
    """Test retrieving the current user's vendor profile."""
    response = client.get("/api/v1/vendors/me", headers=vendor_user_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_vendor_profile["id"]
    assert data["business_name"] == "Reliable Retail"

def test_update_vendor_me(client: TestClient, vendor_user_auth_headers: dict, test_vendor_profile: dict):
    """Test updating the current user's vendor profile."""
    update_data = {"business_name": "Reliable Retail Inc."}
    response = client.put("/api/v1/vendors/me", json=update_data, headers=vendor_user_auth_headers)
    assert response.status_code == 200
    assert response.json()["business_name"] == "Reliable Retail Inc."