# filepath: backend/app/api/endpoints/login.py
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import create_access_token, verify_password
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
    user = crud_user.user.get_by_email(db, email=form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"⚠️ Failed login attempt for user: {form_data.username}")
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        logger.warning(f"⚠️ Inactive user '{form_data.username}' attempted to login.")
        raise HTTPException(status_code=400, detail="Inactive user")

    logger.info(f"✅ Successful login for user: {user.email} (ID: {user.id})")
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }