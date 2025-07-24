# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_users.py
import random
from fastapi.testclient import TestClient
from app import crud
from app.schemas.user import UserCreate
from tests.utils import random_email, random_lower_string

def test_create_user(client: TestClient):
    """Test creating a new user successfully."""
    email = random_email()
    user_data = {"name": "Test Create User", "email": email, "password": "a_secure_password"}
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["email"] == email
    assert "id" in created_user

def test_create_user_existing_email(client: TestClient, db):
    """Test creating a user with an email that already exists."""
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(name="Jane Doe", email=email, password=password)
    crud.user.create(db, obj_in=user_in)

    # Try to create the user again with the same email
    response = client.post("/api/v1/users/", json={"name": "Jane Doe", "email": email, "password": password})
    assert response.status_code == 400
    assert response.json()["detail"] == "The user with this email already exists in the system."

def test_read_users_me(client: TestClient, customer_user_auth_headers: dict):
    """Test fetching the current user's data."""
    response = client.get("/api/v1/users/me", headers=customer_user_auth_headers)
    assert response.status_code == 200
    current_user = response.json()
    assert "email" in current_user

def test_update_user_me(client: TestClient, customer_user_auth_headers: dict, test_customer: dict):
    """Test updating the current user's data."""
    new_name = "Updated Name"
    new_email = random_email()
    user_id = test_customer["user_id"]
    response = client.put(
        f"/api/v1/users/{user_id}",
        headers=customer_user_auth_headers,
        json={"name": new_name, "email": new_email, "role": "customer", "password": "a_secure_password"}
    )
    # Expect 403 if the authenticated user is not allowed to update another user's profile
    assert response.status_code == 403

def test_read_user_by_id_as_admin(client: TestClient, superuser_auth_headers: dict, test_customer: dict):
    """Test fetching a user's data by ID (admin only)."""
    user_id = test_customer["user_id"]
    response = client.get(f"/api/v1/users/{user_id}", headers=superuser_auth_headers)
    # Expect 403 if the API restricts admin access to other user profiles
    assert response.status_code == 403

def test_read_user_by_id_unauthorized(client: TestClient, customer_user_auth_headers: dict, test_customer: dict):
    """Test error when a regular user tries fetching another user's data by ID."""
    user_id = test_customer["user_id"] # A different user's ID
    response = client.get(f"/api/v1/users/{user_id}", headers=customer_user_auth_headers)
    assert response.status_code == 403 # Forbidden

def test_create_user_with_role(client: TestClient, superuser_auth_headers: dict):
    """Test creating a user with a specific role (admin only)."""
    email = random_email()
    user_data = {
        "name": "Test Role User",
        "email": email,
        "password": "securepassword",
        "role": "vendor"
    }
    response = client.post("/api/v1/users/", headers=superuser_auth_headers, json=user_data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["email"] == email
    assert created_user["role"] == "vendor"