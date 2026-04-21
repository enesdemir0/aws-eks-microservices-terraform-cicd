"""
End-to-end integration test: Register → Upload → Wait for caption → Verify metadata.

Prerequisites (all services must be running):
  docker compose up -d

Run:
  pytest tests/integration/ -v -s --timeout=120

Environment variables (override defaults for CI):
  AUTH_URL      default: http://localhost:3000
  GATEWAY_URL   default: http://localhost:8000
  METADATA_URL  default: http://localhost:8001
"""
import io
import os
import time
import uuid

import httpx
import pytest

AUTH_URL = os.getenv("AUTH_URL", "http://localhost:3000")
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8000")
METADATA_URL = os.getenv("METADATA_URL", "http://localhost:8001")

POLL_INTERVAL = 2       # seconds between metadata polls
MAX_WAIT_SECONDS = 90   # AI worker timeout


def _unique_user():
    suffix = uuid.uuid4().hex[:8]
    return f"testuser_{suffix}", "TestPass123!"


def _minimal_jpeg() -> bytes:
    """1×1 white-pixel JPEG for upload."""
    return (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
        b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
        b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\x1e"
        b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00"
        b"\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b"
        b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xff\xd9"
    )


@pytest.fixture(scope="module")
def http():
    with httpx.Client(timeout=10.0) as client:
        yield client


@pytest.mark.integration
def test_services_healthy(http):
    for name, url in [
        ("auth", f"{AUTH_URL}/health"),
        ("gateway", f"{GATEWAY_URL}/health"),
        ("metadata", f"{METADATA_URL}/health"),
    ]:
        res = http.get(url)
        assert res.status_code == 200, f"{name} health check failed: {res.text}"


@pytest.mark.integration
def test_full_pipeline(http):
    username, password = _unique_user()

    # ── Step 1: Register ──────────────────────────────────────────────────────
    reg = http.post(f"{AUTH_URL}/api/auth/register", json={"username": username, "password": password})
    assert reg.status_code == 201, f"Register failed: {reg.text}"

    user_id = reg.json()["data"]["user"]["id"]
    jwt_cookie = reg.cookies.get("jwt")
    assert jwt_cookie, "No jwt cookie returned after registration"

    cookies = {"jwt": jwt_cookie}

    # ── Step 2: Upload image via gateway ──────────────────────────────────────
    upload_res = http.post(
        f"{GATEWAY_URL}/api/gateway/upload",
        files={"file": ("test.jpg", io.BytesIO(_minimal_jpeg()), "image/jpeg")},
        cookies=cookies,
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"

    task_id = upload_res.json()["task_id"]
    assert task_id, "No task_id returned by gateway"

    # ── Step 3: Poll metadata API until caption appears ───────────────────────
    deadline = time.time() + MAX_WAIT_SECONDS
    caption_record = None

    while time.time() < deadline:
        meta_res = http.get(f"{METADATA_URL}/api/metadata/user/{user_id}")
        assert meta_res.status_code == 200

        for record in meta_res.json():
            if record["task_id"] == task_id:
                caption_record = record
                break

        if caption_record:
            break

        time.sleep(POLL_INTERVAL)

    assert caption_record is not None, (
        f"Caption for task {task_id} never appeared in metadata DB "
        f"after {MAX_WAIT_SECONDS}s. AI worker may not be running."
    )

    # ── Step 4: Validate the caption record ───────────────────────────────────
    assert caption_record["user_id"] == user_id
    assert caption_record["task_id"] == task_id
    assert isinstance(caption_record["caption"], str)
    assert len(caption_record["caption"]) > 0
    assert "image_path" in caption_record

    # ── Step 5: Logout ────────────────────────────────────────────────────────
    logout = http.post(f"{AUTH_URL}/api/auth/logout", cookies=cookies)
    assert logout.status_code == 200
