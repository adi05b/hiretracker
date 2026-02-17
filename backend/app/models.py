from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from .database import Base


class Application(Base):
    """
    Represents one job application.
    Each row in the "applications" table is one job you're tracking.
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String, nullable=False)       # e.g. "Google"
    role = Column(String, nullable=False)           # e.g. "Software Engineer"
    location = Column(String, default="")           # e.g. "Mountain View, CA"
    job_url = Column(String, default="")            # link to the job posting
    source = Column(String, default="manual")       # "manual", "linkedin", etc.
    status = Column(String, default="wishlist")     # current stage
    notes = Column(String, default="")              # your personal notes
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))