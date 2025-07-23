# filepath: backend/app/core/config.py
import os
from dotenv import load_dotenv

# This line reads your .env file and loads its variables into the environment
load_dotenv()

# We create a class to hold all our settings as attributes
class Settings:
    PROJECT_NAME: str = "eDrop WMS"
    PROJECT_VERSION: str = "1.0.0"

    # This reads DB_USER from your .env file and assigns it to POSTGRES_USER
    POSTGRES_USER: str = os.getenv("DB_USER")
    POSTGRES_PASSWORD: str = os.getenv("DB_PASSWORD")
    POSTGRES_SERVER: str = os.getenv("DB_HOST")
    POSTGRES_PORT: str = os.getenv("DB_PORT")
    POSTGRES_DB: str = os.getenv("DB_DATABASE")

    # This combines the variables above into a single database connection string,
    # which is what database libraries like SQLAlchemy expect.
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

    # This reads your JWT_SECRET from the .env file
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 1 day

# We create a single instance of our Settings class.
# The rest of our application will import this `settings` object.
settings = Settings()