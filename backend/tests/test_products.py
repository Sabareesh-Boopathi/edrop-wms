# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_products.py
from fastapi.testclient import TestClient

def test_vendor_can_create_product(client: TestClient, vendor_user_auth_headers: dict, test_vendor: dict):
    """Test a vendor can create a product."""
    product_data = {
        "name": "Vendor's Gadget",
        "price": 49.99,
        "sku": "VEND-GADGET-01",
        "vendor_id": test_vendor["id"]
    }
    response = client.post("/api/v1/products/", json=product_data, headers=vendor_user_auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == product_data["name"]

def test_get_all_products(client: TestClient, test_product: dict, vendor_user_auth_headers: dict):
    """Test retrieving all products (auth required)."""
    response = client.get("/api/v1/products/", headers=vendor_user_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_one_product(client: TestClient, test_product: dict, vendor_user_auth_headers: dict):
    """Test retrieving a single product by its ID (auth required)."""
    response = client.get(f"/api/v1/products/{test_product['id']}", headers=vendor_user_auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == test_product["name"]

def test_vendor_can_update_own_product(client: TestClient, test_product: dict, vendor_user_auth_headers: dict):
    """Test a vendor can update a product they own."""
    update_data = {"price": 25.99}
    response = client.put(f"/api/v1/products/{test_product['id']}", json=update_data, headers=vendor_user_auth_headers)
    assert response.status_code == 200
    assert float(response.json()["price"]) == 25.99

def test_admin_can_delete_product(client: TestClient, test_product: dict, superuser_auth_headers: dict):
    """Test that an admin can delete a product."""
    response = client.delete(f"/api/v1/products/{test_product['id']}", headers=superuser_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == test_product["name"]