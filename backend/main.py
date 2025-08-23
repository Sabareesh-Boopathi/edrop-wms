from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from fastapi.exceptions import ResponseValidationError
from fastapi import Request
from app.api.api import api_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db.session import SessionLocal
from app.crud.crud_user import user as crud_user
from app.schemas.user import UserCreate, UserRole, UserStatus
import logging
from jose import jwt
from app.core import security

# Try to import Pydantic v2 core exceptions if available
try:
    from pydantic_core import PydanticSerializationError
except Exception:  # pragma: no cover - fallback if import path changes
    class PydanticSerializationError(Exception):
        pass

from pydantic import ValidationError as PydanticValidationError

# Call the setup function right at the start
setup_logging()
logger = logging.getLogger("app")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"/api/v1/openapi.json"
)

# Set all CORS enabled origins (fallback to permissive for local dev)
origins = settings.BACKEND_CORS_ORIGINS or [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# If wildcard requested, allow all
allow_all = any(o == "*" for o in origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Global middleware to enforce VIEWER read-only
@app.middleware("http")
async def viewer_read_only_middleware(request, call_next):
    try:
        # Only enforce for modifying methods and API routes
        if request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"} and str(request.url.path).startswith("/api/v1"):
            # Allow auth endpoints
            if request.url.path.endswith("/login/access-token") or request.url.path.endswith("/login/refresh-token"):
                return await call_next(request)
            auth = request.headers.get("Authorization", "")
            if auth.lower().startswith("bearer "):
                token = auth.split(" ", 1)[1]
                try:
                    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
                    role = str(payload.get("role") or payload.get("rol") or "").upper()
                    # If token doesn't include role, downstream deps will catch; be lenient here
                    if role == "VIEWER":
                        return JSONResponse(status_code=403, content={"detail": "VIEWER cannot modify data"})
                except Exception:
                    # If token invalid, let downstream auth handlers respond
                    pass
        return await call_next(request)
    except Exception as e:
        logger.exception("Middleware error: %s", e)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Bootstrap superuser on startup (idempotent)
@app.on_event("startup")
def create_superuser_if_missing():
    if not settings.SUPERUSER_EMAIL or not settings.SUPERUSER_PASSWORD:
        return
    db = SessionLocal()
    try:
        existing = crud_user.get_by_email(db, email=settings.SUPERUSER_EMAIL)
        if existing:
            return
        # Superuser is always a global ADMIN and does not belong to any warehouse
        obj = UserCreate(
            email=settings.SUPERUSER_EMAIL,
            name=settings.SUPERUSER_NAME or "Admin",
            password=settings.SUPERUSER_PASSWORD,
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            phone_number=settings.SUPERUSER_PHONE,
            address=settings.SUPERUSER_ADDRESS,
            warehouse_id=None,
        )
        created = crud_user.create(db, obj_in=obj)
        logger.info("Superuser created: %s (role=%s, warehouse_id=%s)", obj.email, "ADMIN", None)
    finally:
        db.close()

# Custom OpenAPI schema to ensure Bearer Authentication is visible
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        description="eDrop WMS API",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter JWT token"
        }
    }
    # Apply the security scheme to all paths that need it
    for path_item in openapi_schema["paths"].values():
        for operation in path_item.values():
            # Find endpoints that have a security dependency
            if any("current_user" in str(param) for param in operation.get("parameters", [])):
                 operation["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.get("/", tags=["Health Check"])
def read_root():
    """A simple health check endpoint."""
    return {"status": f"{settings.PROJECT_NAME} is running"}

# ------------------------
# Global exception handlers
# ------------------------

@app.exception_handler(ResponseValidationError)
async def handle_response_validation_error(request: Request, exc: ResponseValidationError):
    logger.exception("Response validation error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Response validation error",
            "errors": exc.errors(),
        },
    )

@app.exception_handler(PydanticValidationError)
async def handle_pydantic_validation_error(request: Request, exc: PydanticValidationError):
    logger.exception("Pydantic validation error: %s", exc)
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
        },
    )

@app.exception_handler(PydanticSerializationError)
async def handle_pydantic_serialization_error(request: Request, exc: PydanticSerializationError):
    logger.exception("Pydantic serialization error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Serialization error: {str(exc)}",
        },
    )

@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    # Let FastAPI's default HTTPException handler do its job; this is for unexpected exceptions
    logger.exception("Unhandled server error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "message": str(exc)})
