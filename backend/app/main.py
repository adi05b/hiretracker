from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .auth import create_access_token, get_current_user, hash_password, verify_password
from .database import Base, engine, get_db
from .models import Application, User
from .parser_service import parse_job_html
from .schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    Status,
    StatusUpdate,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HireTrack API",
    description="Job application tracker API",
    version="0.3.0",
)

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


# ─── AUTH ────────────────────────────────────────────────────────────────────
@app.post("/api/auth/register", response_model=TokenResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    from .auth import normalize_email, validate_password

    email = normalize_email(payload.email)
    validate_password(payload.password)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Log in and get an access token."""
    from .auth import normalize_email

    email = normalize_email(payload.email)

    # Generic error — don't reveal if email exists or password is wrong
    invalid_error = HTTPException(status_code=401, detail="Invalid email or password")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise invalid_error
    if not verify_password(payload.password, user.password_hash):
        raise invalid_error

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the current logged-in user."""
    return current_user


# ─── CREATE ──────────────────────────────────────────────────────────────────

@app.post("/api/applications", response_model=ApplicationResponse, status_code=201)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new job application."""
    application = Application(**payload.model_dump(), user_id=current_user.id)
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
    current_user: User = Depends(get_current_user),
):
    """List all applications for the current user."""
    query = db.query(Application).filter(Application.user_id == current_user.id)

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
def get_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single application by its ID."""
    application = db.query(Application).filter(
        Application.id == app_id, Application.user_id == current_user.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


# ─── UPDATE (full) ───────────────────────────────────────────────────────────

@app.put("/api/applications/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update any fields on an application."""
    application = db.query(Application).filter(
        Application.id == app_id, Application.user_id == current_user.id
    ).first()
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
    app_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change just the status of an application."""
    application = db.query(Application).filter(
        Application.id == app_id, Application.user_id == current_user.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.status = payload.status.value
    application.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(application)
    return application


# ─── DELETE ──────────────────────────────────────────────────────────────────

@app.delete("/api/applications/{app_id}", status_code=204)
def delete_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an application."""
    application = db.query(Application).filter(
        Application.id == app_id, Application.user_id == current_user.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(application)
    db.commit()
    return None


# ─── ANALYTICS ───────────────────────────────────────────────────────────────

@app.get("/api/analytics/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get summary stats for the current user."""
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    total = len(apps)

    if total == 0:
        return {
            "total": 0,
            "response_rate": 0,
            "by_status": {},
            "by_source": {},
        }

    by_status = {}
    by_source = {}
    responded = 0

    for a in apps:
        by_status[a.status] = by_status.get(a.status, 0) + 1
        source = a.source or "manual"
        by_source[source] = by_source.get(source, 0) + 1
        if a.status in ("oa", "interview", "offer"):
            responded += 1

    return {
        "total": total,
        "response_rate": round((responded / total) * 100, 1),
        "by_status": by_status,
        "by_source": by_source,
    }


@app.get("/api/analytics/funnel")
def analytics_funnel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get funnel data: how many apps at each stage."""
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()

    stages = ["wishlist", "applied", "oa", "interview", "offer", "rejected"]
    funnel = []
    for s in stages:
        count = sum(1 for a in apps if a.status == s)
        funnel.append({"stage": s, "count": count})

    return funnel


# ─── PARSER ──────────────────────────────────────────────────────────────────

from pydantic import BaseModel as PydanticBaseModel


class ParseRequest(PydanticBaseModel):
    html: str
    url: str


@app.post("/api/parser/extract-html")
def extract_from_html(payload: ParseRequest):
    """Parse job details from raw HTML."""
    result = parse_job_html(payload.html, payload.url)
    if result is None:
        raise HTTPException(status_code=422, detail="Could not parse job details from HTML")
    return result