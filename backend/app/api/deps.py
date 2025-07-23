# filepath: backend/app/api/deps.py
from app.db.session import SessionLocal

def get_db():
    """
    Dependency function that yields a new database session
    for each request and ensures it's closed afterward.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()