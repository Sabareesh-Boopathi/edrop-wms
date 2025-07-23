# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\tests\test_users.py
import random
from fastapi.testclient import TestClient

def test_create_user(client: TestClient):
    """
    Test creating a new user successfully.
    """
    random_suffix = random.randint(1000, 9999)
    email = f"test.create.{random_suffix}@example.com"
    user_data = {
        "name": "Test Create User",
        "email": email,
        "password": "a_secure_password"
    }
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["email"] == email
    assert "id" in created_user
    assert "hashed_password" not in created_user

def test_create_user_existing_email(client: TestClient, auth_headers: dict):
    """
    Test error when creating a user with an existing email.
    """
    user_data = {
        "name": "Duplicate User",
        "email": "fixture.user@example.com",  # This email is created in conftest.py
        "password": "another_password"
    }
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "The user with this email already exists in the system."

def test_read_users_me(client: TestClient, auth_headers: dict):
    """
    Test fetching the current user's data.
    """
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    current_user = response.json()
    assert current_user["email"] == "fixture.user@example.com"
    assert current_user["name"] == "Fixture User"

def test_create_user_without_email(client: TestClient):
    """
    Test error when creating a user without an email.
    """
    user_data = {
        "name": "No Email User",
        "password": "securepassword"
    }
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 422  # Unprocessable Entity
    assert response.json()["detail"][0]["msg"] == "field required"

def test_create_user_with_invalid_email(client: TestClient):
    """
    Test error when creating a user with an invalid email.
    """
    user_data = {
        "name": "Invalid Email User",
        "email": "invalid-email-format",
        "password": "securepassword"
    }
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 422  # Unprocessable Entity
    assert response.json()["detail"][0]["msg"] == "value is not a valid email address"

def test_create_user_without_password(client: TestClient):
    """
    Test error when creating a user without a password.
    """
    user_data = {
        "name": "No Password User",
        "email": "no.password@example.com"
    }
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 422  # Unprocessable Entity
    assert response.json()["detail"][0]["msg"] == "field required"

def test_read_users_me_unauthenticated(client: TestClient):
    """
    Test error when fetching the current user's data without authentication.
    """
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401  # Unauthorized
    assert response.json()["detail"] == "Not authenticated"

def test_create_user_duplicate(client: TestClient, auth_headers: dict):
    """
    Test error when creating a duplicate user.
    """
    user_data = {
        "name": "Duplicate User",
        "email": "fixture.user@example.com",  # This email is created in conftest.py
        "password": "another_password"
    }
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "The user with this email already exists in the system."

def test_update_user_me(client: TestClient, auth_headers: dict):
    """
    Test updating the current user's data.
    """
    new_name = "Updated Name"
    response = client.put("/api/v1/users/me", headers=auth_headers, json={"name": new_name})
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["name"] == new_name

def test_update_user_me_unauthenticated(client: TestClient):
    """
    Test error when updating the current user's data without authentication.
    """
    response = client.put("/api/v1/users/me", json={"name": "New Name"})
    assert response.status_code == 401  # Unauthorized
    assert response.json()["detail"] == "Not authenticated"

def test_read_user_by_id(client: TestClient, auth_headers: dict):
    """
    Test fetching a user's data by ID (admin only).
    """
    response = client.get("/api/v1/users/1", headers=auth_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["id"] == 1

def test_read_user_by_id_unauthorized(client: TestClient, auth_headers: dict):
    """
    Test error when fetching a user's data by ID without admin rights.
    """
    response = client.get("/api/v1/users/1")
    assert response.status_code == 403  # Forbidden
    assert response.json()["detail"] == "Not enough permissions"

def test_update_user_by_id(client: TestClient, auth_headers: dict):
    """
    Test updating a user's data by ID (admin only).
    """
    new_data = {"name": "Admin Updated Name"}
    response = client.put("/api/v1/users/1", headers=auth_headers, json=new_data)
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["name"] == new_data["name"]

def test_update_user_by_id_unauthorized(client: TestClient, auth_headers: dict):
    """
    Test error when updating a user's data by ID without admin rights.
    """
    new_data = {"name": "Hacker Name Change"}
    response = client.put("/api/v1/users/1", json=new_data)
    assert response.status_code == 403  # Forbidden
    assert response.json()["detail"] == "Not enough permissions"

def test_delete_user_me(client: TestClient, auth_headers: dict):
    """
    Test deleting the current user (soft delete).
    """
    response = client.delete("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["detail"] == "User deleted successfully."

def test_delete_user_me_unauthenticated(client: TestClient):
    """
    Test error when deleting the current user without authentication.
    """
    response = client.delete("/api/v1/users/me")
    assert response.status_code == 401  # Unauthorized
    assert response.json()["detail"] == "Not authenticated"

def test_restore_user_me(client: TestClient, auth_headers: dict):
    """
    Test restoring the current user (soft delete).
    """
    response = client.post("/api/v1/users/me/restore", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["detail"] == "User restored successfully."

def test_restore_user_me_unauthenticated(client: TestClient):
    """
    Test error when restoring the current user without authentication.
    """
    response = client.post("/api/v1/users/me/restore")
    assert response.status_code == 401  # Unauthorized
    assert response.json()["detail"] == "Not authenticated"

def test_create_user_with_role(client: TestClient):
    """
    Test creating a user with a specific role (admin).
    """
    random_suffix = random.randint(1000, 9999)
    email = f"test.role.{random_suffix}@example.com"
    user_data = {
        "name": "Test Role User",
        "email": email,
        "password": "securepassword",
        "role": "admin"
    }
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["email"] == email
    assert created_user["role"] == "admin"
    assert "id" in created_user
    assert "hashed_password" not in created_user