# filepath: backend/app/api/endpoints/login.py
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.api import deps
from app.core.security import create_access_token
from app.crud import crud_user
from app.schemas.token import Token

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
    access_token_expires = timedelta(minutes=6)
    access_token = create_access_token(subject=user.id, expires_delta=access_token_expires)

    logger.info(f"🔑 Token created for user: {user.email} (ID: {user.id})")
    logger.debug(f"Token expiration: {datetime.utcnow() + access_token_expires}")
    logger.debug(f"Token: {access_token}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }