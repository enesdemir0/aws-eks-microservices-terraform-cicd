import logging
import uuid

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, File, UploadFile

from src.services.auth_service import get_current_user
from src.services.queue_service import get_redis, push_image_task
from src.services.storage_service import save_upload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/gateway", tags=["gateway"])


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    redis: aioredis.Redis = Depends(get_redis),
):
    task_id = uuid.uuid4().hex
    image_path = await save_upload(file)

    await push_image_task(
        redis,
        task_id=task_id,
        image_path=image_path,
        user_id=str(user["id"]),
    )

    logger.info("Upload processed", extra={"task_id": task_id, "user_id": user["id"]})

    return {
        "status": "success",
        "task_id": task_id,
        "image_path": image_path,
        "user_id": user["id"],
    }
