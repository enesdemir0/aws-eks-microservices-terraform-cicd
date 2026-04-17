import httpx
from fastapi import Request, HTTPException
from src.config.settings import settings # Import our settings
import logging

logger = logging.getLogger(__name__)

async def get_current_user(request: Request):
    # 1. Try to find the token in Cookies or Authorization Header
    token = request.cookies.get("jwt")
    
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        logger.warning("No authentication token provided")
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 2. Call the Auth Service using our SETTINGS
    try:
        async with httpx.AsyncClient() as client:
            # We target the /me endpoint of the Auth Service
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {token}"},
                # We send the cookie too, just in case
                cookies={"jwt": token}
            )
            
        if response.status_code != 200:
            logger.warning(f"Auth service rejected token. Status: {response.status_code}")
            raise HTTPException(status_code=401, detail="Invalid token")

        # 3. Return the user data to the Gateway
        return response.json()["data"]["user"]

    except httpx.RequestError as e:
        logger.error(f"Network error connecting to Auth Service at {settings.AUTH_SERVICE_URL}: {e}")
        raise HTTPException(status_code=503, detail="Auth Service unavailable")