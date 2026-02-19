from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from .database import Base


class Application(Base):
    """Represents one job application."""
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    location = Column(String, default="")
    job_url = Column(String, default="")
    source = Column(String, default="manual")
    status = Column(String, default="wishlist")
    notes = Column(String, default="")
    tags = Column(String, default="")
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_text = Column(String, default="")
    job_description = Column(Text, default="")
    applied_date = Column(DateTime, nullable=True)
    response_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))