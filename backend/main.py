from fastapi import FastAPI
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.api.api import api_router  # <-- ADD THIS IMPORT

# Call the setup function right at the start
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

@app.get("/", tags=["Health Check"])
def read_root():
    """A simple health check endpoint."""
    return {"status": f"{settings.PROJECT_NAME} is running"}

# Include the main API router
app.include_router(api_router, prefix="/api/v1")  # <-- ADD THIS LINE
