from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class Status(str, Enum):
    wishlist = "wishlist"
    applied = "applied"
    oa = "oa"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"


class ApplicationCreate(BaseModel):
    company: str
    role: str
    location: str = ""
    job_url: str = ""
    source: str = "manual"
    status: Status = Status.wishlist
    notes: str = ""
    tags: str = ""
    salary_min: int | None = None
    salary_max: int | None = None


class ApplicationUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    location: str | None = None
    job_url: str | None = None
    source: str | None = None
    status: Status | None = None
    notes: str | None = None
    tags: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None


class StatusUpdate(BaseModel):
    status: Status


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    role: str
    location: str
    job_url: str
    source: str
    status: Status
    notes: str
    tags: str
    salary_min: int | None
    salary_max: int | None
    applied_date: datetime | None
    response_date: datetime | None
    created_at: datetime
    updated_at: datetime

# ─── Auth Schemas ────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    name: str = ""


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse