# filepath: backend/app/schemas/user.py
import uuid
from pydantic import BaseModel, EmailStr
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    OPERATOR = "OPERATOR"
    VIEWER = "VIEWER"

class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"

# --- Base Schema ---
# Contains shared properties for a user.
# Other schemas will inherit from this to avoid repetition.
class UserBase(BaseModel):
    email: EmailStr
    name: str | None = None
    role: UserRole = UserRole.VIEWER
    status: UserStatus = UserStatus.PENDING
    phone_number: str | None = None
    address: str | None = None

# --- Create Schema ---
# Properties required when creating a new user via the API.
# It inherits from UserBase and adds the password field.
class UserCreate(UserBase):
    password: str

# --- Update Schema ---
# Properties that can be updated. All are optional.
class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None # Optional password
    role: UserRole | None = None
    status: UserStatus | None = None
    phone_number: str | None = None
    address: str | None = None

# --- Read Schema ---
# Properties to be returned by the API when reading a user.
# It should NOT include the password.
class User(UserBase):
    id: uuid.UUID
    last_login: datetime | None = None

    # This tells Pydantic to read the data even if it is not a dict,
    # but an ORM model (or any other arbitrary object with attributes).
    class Config:
        from_attributes = True