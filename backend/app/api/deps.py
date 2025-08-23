# filepath: backend/app/api/deps.py
from typing import Generator, Annotated
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import ExpiredSignatureError
from pydantic import ValidationError
from sqlalchemy.orm import Session
import logging

from app import crud, models, schemas
from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal
from fastapi import Request

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

log = logging.getLogger(__name__)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()
        
def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> models.User:
    if not token or token.count('.') != 2:
        log.error("Invalid token format: Token must have exactly 2 dots.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token format",
        )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except ExpiredSignatureError:
        # Avoid stack trace spam for expected expiry events
        log.warning("Token expired.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.JWTError, ValidationError):
        log.error("Error decoding token or validating token schema.", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    log.info(f"Token decoded for user_id: {token_data.sub}")
    user = crud.user.get(db, id=token_data.sub)
    if not user:
        log.warning(f"User with id {token_data.sub} not found in database.")
        raise HTTPException(status_code=404, detail="User not found")
    log.info(f"User {user.email} (id: {user.id}) found in database.")
    return user


def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not crud.user.is_active(current_user):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_superuser(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not crud.user.is_active(current_user):
        raise HTTPException(status_code=400, detail="Inactive user")
    if getattr(current_user, "role", "").lower() != "admin":
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def ensure_not_viewer_for_write(request: Request, current_user: models.User = Depends(get_current_active_user)) -> None:
    """Deny non-GET methods for VIEWER accounts."""
    if request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"}:
        role = str(getattr(current_user, "role", "")).upper()
        if role == "VIEWER":
            raise HTTPException(status_code=403, detail="VIEWER cannot modify data")


def get_effective_warehouse_id(current_user: models.User = Depends(get_current_active_user)) -> uuid.UUID | None:
    """Return the warehouse_id to scope queries for non-admins; admins are global."""
    role = str(getattr(current_user, "role", "")).upper()
    if role == "ADMIN":
        return None
    return getattr(current_user, "warehouse_id", None)