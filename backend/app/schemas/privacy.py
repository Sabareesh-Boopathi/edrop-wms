from __future__ import annotations

from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class UnmaskRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class UnmaskResponse(BaseModel):
    id: uuid.UUID
    name: str | None = None
    phone_number: str | None = None
    email: str | None = None
    entity_type: str
    entity_id: str
    revealed_at: datetime
