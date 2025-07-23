# filepath: backend/app/core/config.py
from pydantic import validator
from pydantic_settings import BaseSettings
from urllib.parse import quote_plus

class Settings(BaseSettings):
    """
    Pydantic model for application settings.
    It automatically reads environment variables.
    """
    PROJECT_NAME: str = "eDrop WMS"
    PROJECT_VERSION: str = "1.0.0"

    # Database component settings
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: str
    DB_DATABASE: str
    DB_TEST_DATABASE: str

    # Assembled URLs - will be populated by validators
    DATABASE_URL: str | None = None
    TEST_DATABASE_URL: str | None = None

    # JWT settings
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: str | None, values: dict[str, any]) -> any:
        """
        Assembles the database connection string from individual parts,
        URL-encoding the password to handle special characters safely.
        """
        if isinstance(v, str):
            return v
        
        # URL-encode the password to handle special characters like @, (, )
        password = quote_plus(values.get('DB_PASSWORD', ''))
        
        return (
            f"postgresql://{values.get('DB_USER')}:{password}@"
            f"{values.get('DB_HOST')}:{values.get('DB_PORT')}/"
            f"{values.get('DB_DATABASE')}"
        )

    @validator("TEST_DATABASE_URL", pre=True)
    def assemble_test_db_connection(cls, v: str | None, values: dict[str, any]) -> any:
        """
        Assembles the test database connection string from individual parts,
        URL-encoding the password to handle special characters safely.
        """
        if isinstance(v, str):
            return v
        
        # URL-encode the password to handle special characters like @, (, )
        password = quote_plus(values.get('DB_PASSWORD', ''))
        
        return (
            f"postgresql://{values.get('DB_USER')}:{password}@"
            f"{values.get('DB_HOST')}:{values.get('DB_PORT')}/"
            f"{values.get('DB_TEST_DATABASE')}"
        )

    class Config:
        # This tells Pydantic to read from a .env file
        env_file = ".env"
        case_sensitive = True
        extra = "ignore" # <-- ADD THIS LINE

# Create a single, reusable instance of the settings
settings = Settings()