# filepath: backend/app/db/base_class.py
from sqlalchemy.orm import declarative_base

# This is the base class that all our models will inherit from.
Base = declarative_base()