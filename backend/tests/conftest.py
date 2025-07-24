# filepath: backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import random
import logging

from app.api.deps import get_db
from app.core.config import settings
from app.db.base import Base
from main import app
from app import crud
from app.schemas.user import UserCreate
from app.schemas.rwa import RWACreate
from app.schemas.flat import FlatCreate
from app.schemas.customer import CustomerCreate
from app.schemas.vendor import VendorCreate
from app.schemas.warehouse import WarehouseCreate
from app.schemas.product import ProductCreate
from tests.utils import random_email, random_lower_string

# --- Test Database Setup ---
engine = create_engine(str(settings.TEST_DATABASE_URL), poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Creates the test database tables before tests run, and drops them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db() -> Session:
    """Provides a clean database session for each test function."""
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

@pytest.fixture(scope="function")
def client(db: Session) -> TestClient:
    """Provides a TestClient instance with the database dependency overridden."""
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# --- Object Creation Fixtures ---

@pytest.fixture(scope="function")
def test_rwa(db: Session) -> dict:
    """Creates a test RWA in the database and returns it as a dictionary."""
    rwa = crud.rwa.create(db, obj_in=RWACreate(name=random_lower_string(), address=random_lower_string(), city=random_lower_string()))
    return {"id": str(rwa.id), "name": rwa.name}

@pytest.fixture(scope="function")
def test_flat(db: Session, test_rwa: dict) -> dict:
    """Creates a test flat in the database and returns it as a dictionary."""
    flat = crud.flat.create(db, obj_in=FlatCreate(flat_number=random_lower_string(), rwa_id=test_rwa["id"]))
    return {"id": str(flat.id), "flat_number": flat.flat_number, "rwa_id": test_rwa["id"]}

@pytest.fixture(scope="function")
def test_customer(db: Session, test_flat: dict) -> dict:
    """Creates a test customer and returns it as a dictionary."""
    name = random_lower_string()
    user = crud.user.create(db, obj_in=UserCreate(name=name, email=random_email(), password=random_lower_string(), role="customer"))
    customer = crud.customer.create(db, obj_in=CustomerCreate(user_id=user.id, flat_id=test_flat["id"], phone_number=str(random.randint(1000000000, 9999999999))))
    return {"id": str(customer.id), "phone_number": customer.phone_number, "user_id": str(user.id), "name": name}

@pytest.fixture(scope="function")
def test_vendor(db: Session) -> dict:
    """Creates a test vendor and returns it as a dictionary."""
    user = crud.user.create(db, obj_in=UserCreate(name=random_lower_string(), email=random_email(), password=random_lower_string(), role="vendor"))
    vendor = crud.vendor.create(db, obj_in=VendorCreate(user_id=user.id, business_name=random_lower_string(), address=random_lower_string()))
    return {"id": str(vendor.id), "business_name": vendor.business_name, "user_id": str(user.id)}

@pytest.fixture(scope="function")
def test_product(db: Session, test_vendor: dict) -> dict:
    """Creates a test product and returns it as a dictionary."""
    product = crud.product.create(db, obj_in=ProductCreate(
        name=random_lower_string(),
        description=random_lower_string(),
        price=random.uniform(10.0, 100.0),
        vendor_id=test_vendor["id"],
        sku=random_lower_string(10).upper()
    ))
    return {"id": str(product.id), "name": product.name, "price": product.price}

@pytest.fixture(scope="function")
def test_warehouse(db: Session) -> dict:
    """Creates a test warehouse and returns it as a dictionary."""
    manager_user = crud.user.create(db, obj_in=UserCreate(name=random_lower_string(), email=random_email(), password=random_lower_string(), role="warehouse_manager"))
    # FIX: Added required 'city' field
    warehouse = crud.warehouse.create(db, obj_in=WarehouseCreate(name=random_lower_string(), address=random_lower_string(), city=random_lower_string(), manager_id=manager_user.id))
    return {"id": str(warehouse.id), "name": warehouse.name, "manager_id": str(manager_user.id)}

@pytest.fixture(scope="function")
def test_customer_with_order(db: Session, client: TestClient, test_product: dict, test_warehouse: dict):
    """Creates a customer, logs them in, creates an order for them, and returns all relevant info."""
    # Create user and customer
    email = random_email()
    password = random_lower_string()
    user = crud.user.create(db, obj_in=UserCreate(name=random_lower_string(), email=email, password=password, role="customer"))
    rwa = crud.rwa.create(db, obj_in=RWACreate(name=random_lower_string(), address=random_lower_string(), city=random_lower_string()))
    flat = crud.flat.create(db, obj_in=FlatCreate(flat_number=random_lower_string(), rwa_id=rwa.id))
    customer = crud.customer.create(db, obj_in=CustomerCreate(user_id=user.id, flat_id=flat.id, phone_number=str(random.randint(1000000000, 9999999999))))
    # Login
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data={"username": email, "password": password})
    token = r.json()['access_token']
    auth_headers = {"Authorization": f"Bearer {token}"}
    # Create order for this customer
    order_data = {
        "customer_id": str(customer.id),
        "warehouse_id": str(test_warehouse["id"]),
        "items": [{
            "product_id": str(test_product["id"]),
            "quantity": 2,
            "price": float(test_product["price"])
        }]
    }
    client.post("/api/v1/orders/", json=order_data, headers=auth_headers)
    return {
        "customer": customer,
        "user": user,
        "auth_headers": auth_headers
    }

# --- Authentication Header Fixtures ---

@pytest.fixture(scope="function")
def superuser_auth_headers(client: TestClient, db: Session) -> dict:
    email = random_email()
    password = random_lower_string()
    log.info(f"Creating admin user with email={email}")
    user = crud.user.create(
        db,
        obj_in=UserCreate(
            name=random_lower_string(),
            email=email,
            password=password,
            role="admin",
            is_active=True
        )
    )
    log.info(f"Admin user created: id={user.id}, role={user.role}, is_active={user.is_active}")
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data={"username": email, "password": password})
    if r.status_code != 200:
        log.error(f"Failed to authenticate admin user: {r.status_code} {r.text}")
    else:
        log.info(f"Admin user authenticated, token: {r.json().get('access_token', '')[:15]}...")
    return {"Authorization": f"Bearer {r.json()['access_token']}"}

@pytest.fixture(scope="function")
def customer_user_auth_headers(client: TestClient, db: Session) -> dict:
    """Logs in the test_customer and returns their auth headers."""
    email = random_email()
    password = random_lower_string()
    user = crud.user.create(db, obj_in=UserCreate(name=random_lower_string(), email=email, password=password, role="customer"))
    rwa = crud.rwa.create(db, obj_in=RWACreate(name=random_lower_string(), address=random_lower_string(), city=random_lower_string()))
    flat = crud.flat.create(db, obj_in=FlatCreate(flat_number=random_lower_string(), rwa_id=rwa.id))
    customer = crud.customer.create(db, obj_in=CustomerCreate(user_id=user.id, flat_id=flat.id, phone_number=str(random.randint(1000000000, 9999999999))))
    log.info(f"Created test user (id: {user.id}) and customer (id: {customer.id}) for login.")
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data={"username": email, "password": password})
    token = r.json()['access_token']
    log.info(f"User {email} logged in with token: Bearer {token[:15]}...")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def vendor_user_auth_headers(client: TestClient, db: Session) -> dict:
    """Creates a user with a 'vendor' profile and returns their auth headers."""
    email = random_email()
    password = random_lower_string()
    user = crud.user.create(db, obj_in=UserCreate(name=random_lower_string(), email=email, password=password, role="vendor"))
    crud.vendor.create(db, obj_in=VendorCreate(user_id=user.id, business_name=random_lower_string(), address=random_lower_string()))

    login_data = {"username": email, "password": password}
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    response = r.json()
    return {"Authorization": f"Bearer {response['access_token']}"}

@pytest.fixture(scope="function")
def warehouse_manager_auth_headers(client: TestClient, db: Session) -> dict:
    """Creates a user with a 'warehouse_manager' profile and returns their auth headers."""
    email = random_email()
    password = random_lower_string()
    user = crud.user.create(db, obj_in=UserCreate(name=random_lower_string(), email=email, password=password, role="warehouse_manager"))
    crud.warehouse.create(db, obj_in=WarehouseCreate(name=random_lower_string(), address=random_lower_string(), city=random_lower_string(), manager_id=user.id))

    login_data = {"username": email, "password": password}
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    response = r.json()
    return {"Authorization": f"Bearer {response['access_token']}"}

@pytest.fixture(scope="function")
def vendor_user_with_profile(db: Session, client: TestClient):
    """Creates a vendor user, vendor profile, logs in, and returns all relevant info."""
    email = random_email()
    password = random_lower_string()
    user = crud.user.create(db, obj_in=UserCreate(name=random_lower_string(), email=email, password=password, role="vendor"))
    # Login to get token
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data={"username": email, "password": password})
    token = r.json()['access_token']
    auth_headers = {"Authorization": f"Bearer {token}"}
    # Create vendor profile via API
    vendor_payload = {
        "user_id": str(user.id),
        "business_name": random_lower_string(),
        "address": random_lower_string()
    }
    r_vendor = client.post(f"{settings.API_V1_STR}/vendors", json=vendor_payload, headers=auth_headers)
    if r_vendor.status_code == 200:
        vendor = r_vendor.json()
    else:
        print(f"Failed to create vendor profile: {r_vendor.status_code} {r_vendor.text}")
        vendor = None
    return {
        "vendor": vendor,
        "user": user,
        "auth_headers": auth_headers
    }