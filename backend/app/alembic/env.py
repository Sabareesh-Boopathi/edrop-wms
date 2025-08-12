from app.db.base import Base  # noqa
# Import models to register with metadata
import app.models.system_config  # noqa: F401
import app.models.warehouse_config  # noqa: F401