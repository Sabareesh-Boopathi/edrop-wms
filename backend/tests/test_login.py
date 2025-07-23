# filepath: backend/tests/test_login.py
import random
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_docs():
    """
    Tests if the API documentation is accessible.
    """
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers['content-type']

def test_user_creation_and_login(client: TestClient):
    """
    Tests creating a user, logging in, and accessing a protected route.
    """
    # 1. Create a new user
    random_suffix = random.randint(1000, 9999)
    email = f"testuser{random_suffix}@example.com"
    password = "testpassword123"

    create_user_response = client.post(
        "/api/v1/users/",
        json={"email": email, "password": password, "name": "Test User"}, # <-- CHANGE "full_name" to "name"
    )
    assert create_user_response.status_code == 200
    user_data = create_user_response.json()
    assert user_data["email"] == email

    # 2. Log in with the new user
    login_response = client.post(
        "/api/v1/login/access-token",
        data={"username": email, "password": password},
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    access_token = token_data["access_token"]

    # 3. Access a protected route with the token
    headers = {"Authorization": f"Bearer {access_token}"}
    me_response = client.get("/api/v1/users/me", headers=headers)
    
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == email
    assert me_data["id"] == user_data["id"]