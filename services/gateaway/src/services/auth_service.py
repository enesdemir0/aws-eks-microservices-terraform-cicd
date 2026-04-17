import logging

import httpx
from fastapi import HTTPException, Request

from src.config.settings import settings

logger = logging.getLogger(__name__)


async def get_current_user(request: Request) -> dict:
    token = _extract_token(request)

    try:
        async with httpx.AsyncClient(timeout=settings.AUTH_SERVICE_TIMEOUT) as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {token}"},
                cookies={"jwt": token},
            )
    except httpx.TimeoutException:
        logger.error("Auth service timed out", extra={"url": settings.AUTH_SERVICE_URL})
        raise HTTPException(status_code=504, detail="Auth service timed out")
    except httpx.RequestError as exc:
        logger.error("Auth service unreachable", extra={"error": str(exc)})
        raise HTTPException(status_code=503, detail="Auth service unavailable")

    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if response.status_code != 200:
        logger.warning(
            "Auth service unexpected response",
            extra={"status_code": response.status_code},
        )
        raise HTTPException(status_code=502, detail="Auth service error")

    try:
        return response.json()["data"]["user"]
    except (KeyError, ValueError) as exc:
        logger.error("Malformed auth service response", extra={"error": str(exc)})
        raise HTTPException(status_code=502, detail="Auth service returned invalid data")


def _extract_token(request: Request) -> str:
    token: str | None = request.cookies.get("jwt")
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return token
