
import os
import sys
from sqlalchemy import create_engine, MetaData
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env file
load_dotenv()

def get_database_url():
    """Constructs the database URL from environment variables."""
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")
    db_host = os.getenv("DB_HOST", "postgres")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_DATABASE", "postgres")
    
    # URL-encode the password to handle special characters
    encoded_password = quote_plus(db_password)
    
    return f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"

def drop_all_tables():
    """Connects to the database and drops all tables."""
    database_url = get_database_url()
    if not database_url:
        print("Error: Database URL is not configured.")
        return

    try:
        engine = create_engine(database_url)
        with engine.connect() as connection:
            print("Successfully connected to the database.")
            meta = MetaData()
            meta.reflect(bind=engine)
            print(f"Dropping tables: {list(meta.tables.keys())}")
            meta.drop_all(bind=engine)
            print("All tables dropped successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    drop_all_tables()
