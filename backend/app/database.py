from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite stores everything in a single file — zero setup needed.
# The file "hiretrack.db" will be created automatically in the backend/ folder.
SQLALCHEMY_DATABASE_URL = "sqlite:///./hiretrack.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency that provides a database session per request.
    FastAPI calls this automatically for every endpoint that needs the DB.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()