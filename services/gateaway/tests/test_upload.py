"""
Upload endpoint tests.

All tests use the session-scoped `client` fixture from conftest.py which:
  - mocks Redis (no external dependency)
  - overrides get_current_user (no auth service required)

File I/O is additionally mocked per-test via patch('...save_upload').
"""
import io
from unittest.mock import AsyncMock, patch


def test_upload_success(client, fake_image):
    with patch(
        "src.routes.upload.save_upload",
        new=AsyncMock(return_value="uploads/abc123.jpg"),
    ):
        res = client.post(
            "/api/gateway/upload",
            files={"file": ("photo.jpg", fake_image, "image/jpeg")},
        )

    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert "task_id" in body
    assert len(body["task_id"]) == 32  # uuid4().hex
    assert body["image_path"] == "uploads/abc123.jpg"
    assert body["user_id"] == 42


def test_upload_returns_unique_task_ids(client, fake_image):
    task_ids = set()
    with patch(
        "src.routes.upload.save_upload",
        new=AsyncMock(return_value="uploads/img.jpg"),
    ):
        for _ in range(3):
            res = client.post(
                "/api/gateway/upload",
                files={"file": ("photo.jpg", io.BytesIO(fake_image.read()), "image/jpeg")},
            )
            fake_image.seek(0)
            assert res.status_code == 200
            task_ids.add(res.json()["task_id"])

    assert len(task_ids) == 3, "Each upload must produce a unique task_id"


def test_upload_rejects_unsupported_extension(client):
    res = client.post(
        "/api/gateway/upload",
        files={"file": ("document.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")},
    )
    assert res.status_code == 415
    assert "Unsupported" in res.json()["message"]


def test_upload_rejects_wrong_content_type(client, fake_image):
    res = client.post(
        "/api/gateway/upload",
        files={"file": ("photo.jpg", fake_image, "text/plain")},
    )
    assert res.status_code == 415


def test_upload_rejects_oversized_file(client):
    oversized = io.BytesIO(b"x" * (11 * 1024 * 1024))  # 11 MB
    with patch(
        "src.services.storage_service.settings.MAX_FILE_SIZE_MB", 10
    ):
        res = client.post(
            "/api/gateway/upload",
            files={"file": ("big.jpg", oversized, "image/jpeg")},
        )
    assert res.status_code in (413, 415)


def test_upload_without_auth_returns_401():
    """Without auth override, endpoint must reject unauthenticated requests."""
    with patch("redis.asyncio.from_url", return_value=AsyncMock(aclose=AsyncMock())):
        from src.main import app

        # Use a fresh client with NO dependency overrides
        fresh_overrides = app.dependency_overrides.copy()
        app.dependency_overrides.clear()

        from fastapi.testclient import TestClient
        import io

        with TestClient(app) as c:
            res = c.post(
                "/api/gateway/upload",
                files={"file": ("photo.jpg", io.BytesIO(b"data"), "image/jpeg")},
            )

        app.dependency_overrides = fresh_overrides

    assert res.status_code == 401
