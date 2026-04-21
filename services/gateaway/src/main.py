import logging
import os
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from src.config.settings import settings
from src.middleware.logging import RequestLoggingMiddleware
from src.routes import health, upload
from src.utils.logger import setup_logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.LOG_LEVEL)
    logger.info("Gateway starting", extra={"env": settings.NODE_ENV})

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    app.state.redis = aioredis.from_url(
        settings.REDIS_URL, encoding="utf-8", decode_responses=True
    )
    logger.info("Redis client initialised", extra={"url": settings.REDIS_URL})

    yield

    await app.state.redis.aclose()
    logger.info("Gateway shutdown complete")


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(RequestLoggingMiddleware)

app.include_router(health.router)
app.include_router(upload.router)

# Serve uploaded images — required by the frontend image proxy
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR, check_dir=False), name="uploads")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception", extra={"path": str(request.url.path)})
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error"},
    )
