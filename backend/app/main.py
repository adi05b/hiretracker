from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Application
from .parser_service import parse_job_html
from .schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    Status,
    StatusUpdate,
)

# Create the database tables when the app starts
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HireTrack API",
    description="Job application tracker API",
    version="0.2.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"^chrome-extension://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health Check ────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "HireTrack API is running"}


# ─── CREATE ──────────────────────────────────────────────────────────────────

@app.post("/api/applications", response_model=ApplicationResponse, status_code=201)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    """Create a new job application."""
    application = Application(**payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


# ─── READ (list) ─────────────────────────────────────────────────────────────

@app.get("/api/applications", response_model=list[ApplicationResponse])
def list_applications(
    status: Status | None = Query(None, description="Filter by status"),
    search: str | None = Query(None, description="Search company or role"),
    tag: str | None = Query(None, description="Filter by tag"),
    db: Session = Depends(get_db),
):
    """List all applications, optionally filtered by status, search term, or tag."""
    query = db.query(Application)

    if status:
        query = query.filter(Application.status == status.value)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Application.company.ilike(pattern) | Application.role.ilike(pattern)
        )

    if tag:
        query = query.filter(Application.tags.ilike(f"%{tag}%"))

    return query.order_by(Application.updated_at.desc()).all()


# ─── READ (single) ──────────────────────────────────────────────────────────

@app.get("/api/applications/{app_id}", response_model=ApplicationResponse)
def get_application(app_id: int, db: Session = Depends(get_db)):
    """Get a single application by its ID."""
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


# ─── UPDATE (full) ───────────────────────────────────────────────────────────

@app.put("/api/applications/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: int, payload: ApplicationUpdate, db: Session = Depends(get_db)
):
    """Update any fields on an application."""
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)

    application.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(application)
    return application


# ─── UPDATE (status only) ───────────────────────────────────────────────────

@app.patch("/api/applications/{app_id}/status", response_model=ApplicationResponse)
def update_status(
    app_id: int, payload: StatusUpdate, db: Session = Depends(get_db)
):
    """Change just the status of an application."""
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.status = payload.status.value
    application.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(application)
    return application


# ─── DELETE ──────────────────────────────────────────────────────────────────

@app.delete("/api/applications/{app_id}", status_code=204)
def delete_application(app_id: int, db: Session = Depends(get_db)):
    """Delete an application."""
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(application)
    db.commit()
    return None


# ─── PARSER ──────────────────────────────────────────────────────────────────

from pydantic import BaseModel as PydanticBaseModel


class ParseRequest(PydanticBaseModel):
    html: str
    url: str


@app.post("/api/parser/extract-html")
def extract_from_html(payload: ParseRequest):
    """Parse job details from raw HTML. Used as a fallback for client-side detection."""
    result = parse_job_html(payload.html, payload.url)
    if result is None:
        raise HTTPException(status_code=422, detail="Could not parse job details from HTML")
    return result