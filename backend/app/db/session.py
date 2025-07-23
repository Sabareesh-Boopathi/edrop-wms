# filepath: backend/app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# This import is crucial. It ensures that all models that inherit from Base
# are registered with SQLAlchemy's metadata before the session is used.
from app.db import base  # noqa

engine = create_engine(str(settings.DATABASE_URL), pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)