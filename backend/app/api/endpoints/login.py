# filepath: backend/app/api/endpoints/login.py
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt

from app.api import deps
from app.core.security import create_access_token, ALGORITHM
from app.crud import crud_user
from app.schemas.token import Token
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.login")

@router.post("/login/access-token", response_model=Token)
def login_for_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    logger.info(f"ℹ️ Login attempt for user: {form_data.username}")
    try:
        user = crud_user.user.authenticate_and_validate(
            db, email=form_data.username, password=form_data.password
        )
    except ValueError as e:
        logger.warning(f"⚠️ Login failed for user: {form_data.username} - {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last_login timestamp
    user.last_login = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"✅ Successful login for user: {user.email} (ID: {user.id})")
    # Use configurable expiry (defaults to 60 minutes)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.id, expires_delta=access_token_expires)

    logger.info(f"🔑 Token created for user: {user.email} (ID: {user.id})")
    logger.debug(f"Token expiration: {datetime.utcnow() + access_token_expires}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/login/refresh-token", response_model=Token)
def refresh_access_token(
    db: Session = Depends(deps.get_db),
    token: str = Depends(deps.reusable_oauth2),
):
    """
    Issue a new access token using the provided (possibly expiring/expired) token.
    - Verifies signature and subject but ignores 'exp' during decode to inspect claims.
    - Allows a small grace window after expiration to avoid rapid 401 loops if the client is slightly late.
    """
    GRACE_SECONDS = 300  # 5 minutes grace
    try:
      # Verify signature but ignore expiration to read claims
      claims = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
      sub = claims.get("sub")
      exp_ts = claims.get("exp")
      if not sub or not exp_ts:
          raise HTTPException(status_code=403, detail="Invalid token claims")
      now = datetime.now(timezone.utc).timestamp()
      # If token expired too long ago, reject
      if now > (exp_ts + GRACE_SECONDS):
          raise HTTPException(status_code=403, detail="Token expired")
      # Ensure user still exists and is active
      user = crud_user.user.get(db, id=sub)
      if not user or not crud_user.user.is_active(user):
          raise HTTPException(status_code=403, detail="User inactive or not found")
      # Issue new token
      access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
      access_token = create_access_token(subject=sub, expires_delta=access_token_expires)
      return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
      raise
    except Exception:
      # Any signature errors or decode issues
      raise HTTPException(status_code=403, detail="Could not validate credentials")