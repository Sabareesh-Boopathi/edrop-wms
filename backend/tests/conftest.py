# filepath: backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.config import settings
from app.db.base import Base
from main import app

# Create a test database engine
engine = create_engine(
    str(settings.TEST_DATABASE_URL),
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Creates the test database tables before tests run, and drops them after.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    """
    Dependency override for get_db to use the test database session.
    """
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Apply the dependency override to the app
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    """
    Provides a TestClient instance for making API requests in tests.
    """
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def auth_headers(client: TestClient):
    """
    Create a test user, log in, and return authentication headers.
    """
    user_data = {
        "name": "Fixture User",
        "email": "fixture.user@example.com",
        "password": "fixturepassword"
    }
    # 1. Create user
    client.post("/api/v1/users/", json=user_data)

    # 2. Log in
    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }
    response = client.post("/api/v1/login/access-token", data=login_data)
    token_data = response.json()
    access_token = token_data["access_token"]

    # 3. Return headers
    return {"Authorization": f"Bearer {access_token}"}