# filepath: backend/app/core/config.py
from urllib.parse import quote_plus
from pydantic import root_validator
from pydantic_settings import BaseSettings
from typing import Dict, Any

class Settings(BaseSettings):
    """
    Pydantic model for application settings.
    It automatically reads environment variables.
    """
    # Core application settings
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    PROJECT_NAME: str = "eDrop WMS"
    PROJECT_VERSION: str = "1.0.0"

    # Backend CORS origins
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Individual database components read from .env
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: str
    DB_DATABASE: str
    DB_TEST_DATABASE: str

    # These fields will be populated by the root_validator below
    DATABASE_URL: str = ""
    TEST_DATABASE_URL: str = ""

    # --- SUPERUSER bootstrap (optional) ---
    SUPERUSER_EMAIL: str | None = None
    SUPERUSER_PASSWORD: str | None = None
    SUPERUSER_NAME: str | None = None
    SUPERUSER_ROLE: str = "ADMIN"
    SUPERUSER_STATUS: str = "ACTIVE"
    SUPERUSER_PHONE: str | None = None
    SUPERUSER_ADDRESS: str | None = None

    @root_validator(pre=False, skip_on_failure=True)
    def assemble_db_urls(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assembles the database connection strings from individual parts,
        URL-encoding the password to handle special characters safely.
        This method is compatible with Pydantic V1.
        """
        password = quote_plus(v.get("DB_PASSWORD", ""))
        user = v.get("DB_USER")
        host = v.get("DB_HOST")
        port = v.get("DB_PORT")
        
        # Build main database URL
        db_name = v.get("DB_DATABASE")
        v["DATABASE_URL"] = f"postgresql://{user}:{password}@{host}:{port}/{db_name}"
        
        # Build test database URL
        test_db_name = v.get("DB_TEST_DATABASE")
        v["TEST_DATABASE_URL"] = f"postgresql://{user}:{password}@{host}:{port}/{test_db_name}"
        
        return v

    class Config:
        # This tells Pydantic to read from a .env file
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore" # <-- ADD THIS LINE

# Create a single, reusable instance of the settings
settings = Settings()