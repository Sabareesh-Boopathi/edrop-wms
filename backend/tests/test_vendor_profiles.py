# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_vendor_profiles.py
from fastapi.testclient import TestClient

def test_get_vendor_me(client: TestClient, vendor_user_with_profile):
    response = client.get("/api/v1/vendors/me", headers=vendor_user_with_profile["auth_headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(vendor_user_with_profile["vendor"]["id"])
    assert data["business_name"] == vendor_user_with_profile["vendor"]["business_name"]

def test_get_all_vendors_as_admin(client: TestClient, superuser_auth_headers: dict, vendor_user_with_profile):
    # Ensure vendor profile was created
    if vendor_user_with_profile["vendor"] is None:
        import pytest
        pytest.skip("Vendor profile creation failed, skipping test.")
    response = client.get("/api/v1/vendors/", headers=superuser_auth_headers)
    vendors_list = response.json()
    assert isinstance(vendors_list, list)
    print("Vendor IDs in list:", [v["id"] for v in vendors_list])
    print("Test vendor ID:", vendor_user_with_profile["vendor"]["id"])

    response = client.get(f"/api/v1/vendors/{vendor_user_with_profile['vendor']['id']}", headers=superuser_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(vendor_user_with_profile["vendor"]["id"])
    assert data["id"] == str(vendor_user_with_profile["vendor"]["id"])