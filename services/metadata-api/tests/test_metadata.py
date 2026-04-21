"""
Tests for metadata-api endpoints:
  POST /api/metadata/save
  GET  /api/metadata/user/{user_id}
  GET  /health
"""


# ─── Health ───────────────────────────────────────────────────────────────────

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


# ─── POST /api/metadata/save ──────────────────────────────────────────────────

def test_save_metadata_success(client, sample_payload):
    res = client.post("/api/metadata/save", json=sample_payload)
    assert res.status_code == 200
    body = res.json()
    assert body["task_id"] == sample_payload["task_id"]
    assert body["user_id"] == sample_payload["user_id"]
    assert body["caption"] == sample_payload["caption"]
    assert "id" in body
    assert "created_at" in body


def test_save_metadata_returns_full_record(client, sample_payload):
    res = client.post("/api/metadata/save", json=sample_payload)
    body = res.json()
    assert body["image_path"] == sample_payload["image_path"]
    assert isinstance(body["id"], int)


def test_save_metadata_duplicate_task_id_returns_400(client, sample_payload):
    client.post("/api/metadata/save", json=sample_payload)
    res = client.post("/api/metadata/save", json=sample_payload)
    assert res.status_code == 400
    assert "already recorded" in res.json()["detail"]


def test_save_metadata_missing_fields_returns_422(client):
    res = client.post("/api/metadata/save", json={"task_id": "only-this"})
    assert res.status_code == 422


def test_save_metadata_multiple_different_tasks(client):
    for i in range(3):
        payload = {
            "task_id": f"task{i:032d}",
            "user_id": 1,
            "image_path": f"/app/uploads/img{i}.jpg",
            "caption": f"caption number {i}",
        }
        res = client.post("/api/metadata/save", json=payload)
        assert res.status_code == 200


# ─── GET /api/metadata/user/{user_id} ────────────────────────────────────────

def test_get_user_captions_empty(client):
    res = client.get("/api/metadata/user/999")
    assert res.status_code == 200
    assert res.json() == []


def test_get_user_captions_returns_only_their_data(client, sample_payload):
    # user 1 saves a caption
    client.post("/api/metadata/save", json=sample_payload)

    # user 2 saves a different caption
    other = {**sample_payload, "task_id": "other00000000000000000000000000", "user_id": 2}
    client.post("/api/metadata/save", json=other)

    user1_res = client.get("/api/metadata/user/1")
    user2_res = client.get("/api/metadata/user/2")

    assert len(user1_res.json()) == 1
    assert len(user2_res.json()) == 1
    assert user1_res.json()[0]["user_id"] == 1
    assert user2_res.json()[0]["user_id"] == 2


def test_get_user_captions_returns_all_entries(client):
    for i in range(5):
        payload = {
            "task_id": f"bulk{i:032d}",
            "user_id": 10,
            "image_path": f"/uploads/img{i}.jpg",
            "caption": f"scene {i}",
        }
        client.post("/api/metadata/save", json=payload)

    res = client.get("/api/metadata/user/10")
    assert res.status_code == 200
    assert len(res.json()) == 5


def test_get_user_captions_schema(client, sample_payload):
    client.post("/api/metadata/save", json=sample_payload)
    items = client.get(f"/api/metadata/user/{sample_payload['user_id']}").json()
    item = items[0]
    for field in ("id", "task_id", "user_id", "image_path", "caption", "created_at"):
        assert field in item, f"Missing field: {field}"
