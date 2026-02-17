from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class Status(str, Enum):
    """All possible application statuses."""
    wishlist = "wishlist"
    applied = "applied"
    oa = "oa"               # online assessment
    interview = "interview"
    offer = "offer"
    rejected = "rejected"


class ApplicationCreate(BaseModel):
    """What you send when creating a new application."""
    company: str
    role: str
    location: str = ""
    job_url: str = ""
    source: str = "manual"
    status: Status = Status.wishlist
    notes: str = ""


class ApplicationUpdate(BaseModel):
    """What you send when updating an application. All fields optional."""
    company: str | None = None
    role: str | None = None
    location: str | None = None
    job_url: str | None = None
    source: str | None = None
    status: Status | None = None
    notes: str | None = None


class StatusUpdate(BaseModel):
    """What you send when changing just the status."""
    status: Status


class ApplicationResponse(BaseModel):
    """What the API returns for an application."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    role: str
    location: str
    job_url: str
    source: str
    status: Status
    notes: str
    created_at: datetime
    updated_at: datetime