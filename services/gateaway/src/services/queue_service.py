import json
import logging
from datetime import datetime, timezone

import redis.asyncio as aioredis
from fastapi import Request

from src.config.settings import settings

logger = logging.getLogger(__name__)


def get_redis(request: Request) -> aioredis.Redis:
    return request.app.state.redis


async def push_image_task(
    redis: aioredis.Redis,
    *,
    task_id: str,
    image_path: str,
    user_id: str,
) -> None:
    payload = json.dumps({
        "task_id": task_id,
        "image_path": image_path,
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    await redis.rpush(settings.REDIS_QUEUE_NAME, payload)
    logger.info(
        "Task queued",
        extra={"task_id": task_id, "queue": settings.REDIS_QUEUE_NAME},
    )
