import os
from dotenv import load_dotenv
from urllib.parse import quote_plus  # <-- ADD THIS IMPORT

from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# --- ADD THIS SECTION ---
# Load environment variables from .env file
load_dotenv()

# Get the database URL from environment variables
DB_USER = os.getenv("DB_USER")
# URL-encode the password to handle special characters
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD"))  # <-- WRAP THIS
DB_HOST = os.getenv("DB_HOST", "postgres")  # Default to 'postgres' for Docker
DB_PORT = os.getenv("DB_PORT", 5432)
DB_DATABASE = os.getenv("DB_DATABASE")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_DATABASE}"
# --- END OF ADDED SECTION ---

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# --- THIS IS THE KEY MODIFICATION ---
# Add project root to the Python path to allow imports from 'app'
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[1]))

# Import your app's Base model
from app.db.base_class import Base  # Base class
# IMPORTANT: import app.db.base so all models are registered on Base.metadata
import app.db.base  # noqa: F401
from app.core.config import settings # noqa

# --- THIS IS THE FIX ---
# To prevent configparser from interpreting '%' as an interpolation character,
# we must escape it by replacing it with '%%'.
safe_database_url = settings.DATABASE_URL.replace("%", "%%")

# Set the sqlalchemy.url in the config object programmatically.
# This will override the value in alembic.ini, ensuring migrations
# run against the correct database with the correctly encoded password.
config.set_main_option("sqlalchemy.url", safe_database_url)
# --- END OF FIX ---

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the Base model as the target for autogeneration
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


# Dynamically set DATABASE_URL based on NODE_ENV
NODE_ENV = os.getenv("NODE_ENV", "development")
if NODE_ENV == "development":
    DB_HOST = os.getenv("DB_HOST", "localhost")
else:
    DB_HOST = os.getenv("DB_HOST", "postgres")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_DATABASE}"
config.set_main_option("sqlalchemy.url", DATABASE_URL.replace("%", "%%"))

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
