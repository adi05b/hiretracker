import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# Test database
engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def create_user_and_login():
    """Helper: register a user and return the auth header."""
    resp = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "testpass123",
        "name": "Test User",
    })
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ─── Auth Tests ──────────────────────────────────────────────────────────────

def test_register():
    resp = client.post("/api/auth/register", json={
        "email": "new@example.com",
        "password": "pass123",
        "name": "New User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new@example.com"


def test_register_duplicate_email():
    client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "pass123",
        "name": "User 1",
    })
    resp = client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "pass456",
        "name": "User 2",
    })
    assert resp.status_code == 409


def test_register_short_password():
    resp = client.post("/api/auth/register", json={
        "email": "short@example.com",
        "password": "123",
        "name": "User",
    })
    assert resp.status_code == 400


def test_login_success():
    client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "pass123",
        "name": "User",
    })
    resp = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "pass123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password():
    client.post("/api/auth/register", json={
        "email": "wrong@example.com",
        "password": "pass123",
        "name": "User",
    })
    resp = client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpass",
    })
    assert resp.status_code == 401


def test_login_nonexistent_email():
    resp = client.post("/api/auth/login", json={
        "email": "noone@example.com",
        "password": "pass123",
    })
    assert resp.status_code == 401


def test_email_normalization():
    client.post("/api/auth/register", json={
        "email": "  Test@Example.COM  ",
        "password": "pass123",
        "name": "User",
    })
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "pass123",
    })
    assert resp.status_code == 200


# ─── Application CRUD Tests ─────────────────────────────────────────────────

def test_create_application():
    headers = create_user_and_login()
    resp = client.post("/api/applications", json={
        "company": "Google",
        "role": "SWE",
    }, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["company"] == "Google"


def test_list_applications():
    headers = create_user_and_login()
    client.post("/api/applications", json={"company": "Google", "role": "SWE"}, headers=headers)
    client.post("/api/applications", json={"company": "Meta", "role": "SDE"}, headers=headers)
    resp = client.get("/api/applications", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_application():
    headers = create_user_and_login()
    create_resp = client.post("/api/applications", json={"company": "Stripe", "role": "SWE"}, headers=headers)
    app_id = create_resp.json()["id"]
    resp = client.get(f"/api/applications/{app_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["company"] == "Stripe"


def test_update_application():
    headers = create_user_and_login()
    create_resp = client.post("/api/applications", json={"company": "Old", "role": "SWE"}, headers=headers)
    app_id = create_resp.json()["id"]
    resp = client.put(f"/api/applications/{app_id}", json={"company": "New"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["company"] == "New"


def test_update_status():
    headers = create_user_and_login()
    create_resp = client.post("/api/applications", json={"company": "Test", "role": "SWE"}, headers=headers)
    app_id = create_resp.json()["id"]
    resp = client.patch(f"/api/applications/{app_id}/status", json={"status": "applied"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "applied"


def test_delete_application():
    headers = create_user_and_login()
    create_resp = client.post("/api/applications", json={"company": "Del", "role": "SWE"}, headers=headers)
    app_id = create_resp.json()["id"]
    resp = client.delete(f"/api/applications/{app_id}", headers=headers)
    assert resp.status_code == 204


def test_filter_by_status():
    headers = create_user_and_login()
    client.post("/api/applications", json={"company": "A", "role": "SWE", "status": "applied"}, headers=headers)
    client.post("/api/applications", json={"company": "B", "role": "SWE", "status": "wishlist"}, headers=headers)
    resp = client.get("/api/applications?status=applied", headers=headers)
    assert len(resp.json()) == 1
    assert resp.json()[0]["company"] == "A"


def test_search():
    headers = create_user_and_login()
    client.post("/api/applications", json={"company": "Google", "role": "SWE"}, headers=headers)
    client.post("/api/applications", json={"company": "Meta", "role": "SDE"}, headers=headers)
    resp = client.get("/api/applications?search=google", headers=headers)
    assert len(resp.json()) == 1


def test_unauthorized_access():
    resp = client.get("/api/applications")
    assert resp.status_code == 401


def test_user_isolation():
    """User A cannot see User B's applications."""
    # User A
    resp_a = client.post("/api/auth/register", json={
        "email": "a@example.com", "password": "pass123", "name": "A",
    })
    headers_a = {"Authorization": f"Bearer {resp_a.json()['access_token']}"}
    client.post("/api/applications", json={"company": "Secret", "role": "SWE"}, headers=headers_a)

    # User B
    resp_b = client.post("/api/auth/register", json={
        "email": "b@example.com", "password": "pass123", "name": "B",
    })
    headers_b = {"Authorization": f"Bearer {resp_b.json()['access_token']}"}

    # User B should see 0 applications
    resp = client.get("/api/applications", headers=headers_b)
    assert len(resp.json()) == 0


# ─── Analytics Tests ─────────────────────────────────────────────────────────

def test_analytics_summary():
    headers = create_user_and_login()
    client.post("/api/applications", json={"company": "A", "role": "SWE", "status": "applied"}, headers=headers)
    client.post("/api/applications", json={"company": "B", "role": "SWE", "status": "interview"}, headers=headers)
    resp = client.get("/api/analytics/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert data["response_rate"] == 50.0


def test_analytics_funnel():
    headers = create_user_and_login()
    client.post("/api/applications", json={"company": "A", "role": "SWE", "status": "applied"}, headers=headers)
    resp = client.get("/api/analytics/funnel", headers=headers)
    assert resp.status_code == 200
    stages = {item["stage"]: item["count"] for item in resp.json()}
    assert stages["applied"] == 1
    assert stages["wishlist"] == 0