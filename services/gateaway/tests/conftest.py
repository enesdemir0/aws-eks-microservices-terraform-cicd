"""
Shared fixtures for gateway tests.

Strategy:
- Override get_current_user dependency → no real auth service needed.
- Mock redis.asyncio.from_url via patch → no real Redis needed.
- Mock save_upload via patch → no real filesystem needed.
"""
import io
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def mock_redis():
    m = AsyncMock()
    m.rpush = AsyncMock(return_value=1)
    m.aclose = AsyncMock()
    return m


@pytest.fixture(scope="session")
def client(mock_redis):
    with patch("redis.asyncio.from_url", return_value=mock_redis):
        from src.main import app
        from src.services.auth_service import get_current_user

        async def fake_auth():
            return {"id": 42, "username": "testuser"}

        app.dependency_overrides[get_current_user] = fake_auth

        with TestClient(app) as c:
            yield c

        app.dependency_overrides.clear()


@pytest.fixture
def fake_image() -> io.BytesIO:
    """Minimal valid JPEG bytes (1×1 white pixel)."""
    # Smallest valid JPEG
    data = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
        b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
        b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\x1e"
        b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00"
        b"\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b"
        b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xff\xd9"
    )
    return io.BytesIO(data)
