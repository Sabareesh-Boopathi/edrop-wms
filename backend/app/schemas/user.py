# filepath: backend/app/schemas/user.py
import uuid
from pydantic import BaseModel, EmailStr

# --- Base Schema ---
# Contains shared properties for a user.
# Other schemas will inherit from this to avoid repetition.
class UserBase(BaseModel):
    email: EmailStr
    name: str | None = None
    is_active: bool | None = True
    role: str | None = "customer"

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
    password: str | None = None

# --- Read Schema ---
# Properties to be returned by the API when reading a user.
# It should NOT include the password.
class User(UserBase):
    id: uuid.UUID

    # This tells Pydantic to read the data even if it is not a dict,
    # but an ORM model (or any other arbitrary object with attributes).
    class Config:
        from_attributes = True