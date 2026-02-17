SAMPLE_APP = {
    "company": "Google",
    "role": "Software Engineer",
    "location": "Mountain View, CA",
    "job_url": "https://careers.google.com/jobs/123",
    "source": "linkedin",
    "status": "applied",
    "notes": "Referred by a friend",
}


def _create(client, data=None):
    return client.post("/api/applications", json=data or SAMPLE_APP)


def test_create_application(client):
    resp = _create(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["company"] == "Google"
    assert body["status"] == "applied"
    assert body["id"] is not None


def test_create_minimal_application(client):
    resp = client.post("/api/applications", json={"company": "Meta", "role": "SWE"})
    assert resp.status_code == 201
    assert resp.json()["status"] == "wishlist"
    assert resp.json()["source"] == "manual"


def test_create_rejects_missing_fields(client):
    resp = client.post("/api/applications", json={"company": "Meta"})
    assert resp.status_code == 422


def test_list_applications(client):
    _create(client)
    _create(client, {**SAMPLE_APP, "company": "Meta", "status": "interview"})
    resp = client.get("/api/applications")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_filter_by_status(client):
    _create(client)
    _create(client, {**SAMPLE_APP, "company": "Meta", "status": "interview"})
    resp = client.get("/api/applications?status=applied")
    assert len(resp.json()) == 1
    assert resp.json()[0]["company"] == "Google"


def test_search(client):
    _create(client)
    _create(client, {**SAMPLE_APP, "company": "Meta", "role": "Data Scientist"})
    resp = client.get("/api/applications?search=data")
    assert len(resp.json()) == 1
    assert resp.json()[0]["company"] == "Meta"


def test_get_single(client):
    app_id = _create(client).json()["id"]
    resp = client.get(f"/api/applications/{app_id}")
    assert resp.status_code == 200
    assert resp.json()["company"] == "Google"


def test_get_nonexistent_returns_404(client):
    assert client.get("/api/applications/9999").status_code == 404


def test_update_application(client):
    app_id = _create(client).json()["id"]
    resp = client.put(f"/api/applications/{app_id}", json={"notes": "Updated"})
    assert resp.status_code == 200
    assert resp.json()["notes"] == "Updated"
    assert resp.json()["company"] == "Google"


def test_update_status(client):
    app_id = _create(client).json()["id"]
    resp = client.patch(
        f"/api/applications/{app_id}/status", json={"status": "interview"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "interview"


def test_delete_application(client):
    app_id = _create(client).json()["id"]
    assert client.delete(f"/api/applications/{app_id}").status_code == 204
    assert client.get(f"/api/applications/{app_id}").status_code == 404