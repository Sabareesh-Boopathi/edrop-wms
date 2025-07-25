# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_orders.py
from fastapi.testclient import TestClient
def test_create_order(client: TestClient, customer_user_auth_headers: dict, test_product: dict, test_customer: dict, test_warehouse: dict):
    """Test creating an order as a logged-in customer."""
    order_data = {
        "customer_id": test_customer["id"],
        "warehouse_id": test_warehouse["id"],
        "items": [{
            "product_id": test_product["id"],
            "quantity": 2,
            "price": float(test_product["price"])
        }]
    }
    response = client.post("/api/v1/orders/", json=order_data, headers=customer_user_auth_headers)
    assert response.status_code == 200 or response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == test_product["id"]

def test_get_my_orders(client: TestClient, test_customer_with_order, test_product: dict, test_warehouse: dict):
    """Test that a customer can retrieve their own orders."""
    response = client.get("/api/v1/orders/me", headers=test_customer_with_order["auth_headers"])
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # Assumes the previous test ran
def test_get_all_orders_as_admin(client: TestClient, superuser_auth_headers: dict):
    """Test that an admin can retrieve all orders from all users."""
    response = client.get("/api/v1/orders/", headers=superuser_auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_customer_cannot_get_all_orders(client: TestClient, customer_user_auth_headers: dict):
    """Test that a regular customer cannot access the all-orders endpoint."""
    response = client.get("/api/v1/orders/", headers=customer_user_auth_headers)
    assert response.status_code == 403  # Or 401, depending on your auth logic