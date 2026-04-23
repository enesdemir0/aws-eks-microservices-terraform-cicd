import logging
import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile

from src.config.settings import settings

logger = logging.getLogger(__name__)

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


async def save_upload(file: UploadFile) -> str:
    """Validates and saves an upload. Returns a storage path/key string.

    Local mode  → writes to UPLOAD_DIR, returns absolute filesystem path.
    S3 mode     → streams to S3, returns the S3 object key (uploads/{uuid}.ext).
    IRSA provides AWS credentials automatically — no keys are hardcoded.
    """
    _validate(file)

    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    key = f"uploads/{uuid.uuid4().hex}.{ext}"

    if settings.STORAGE_TYPE == "s3":
        return await _save_to_s3(file, key)
    return await _save_to_local(file, key)


async def _save_to_local(file: UploadFile, key: str) -> str:
    dest = Path(settings.UPLOAD_DIR) / Path(key).name
    dest.parent.mkdir(parents=True, exist_ok=True)

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    bytes_written = 0

    async with aiofiles.open(dest, "wb") as out:
        while chunk := await file.read(65_536):
            bytes_written += len(chunk)
            if bytes_written > max_bytes:
                dest.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB",
                )
            await out.write(chunk)

    logger.info("File saved locally", extra={"path": str(dest), "size_bytes": bytes_written})
    return str(dest)


async def _save_to_s3(file: UploadFile, key: str) -> str:
    import aioboto3  # imported lazily — not installed in local Docker Compose

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    chunks: list[bytes] = []
    total = 0

    while chunk := await file.read(65_536):
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB",
            )
        chunks.append(chunk)

    body = b"".join(chunks)

    session = aioboto3.Session()
    async with session.client("s3", region_name=settings.AWS_REGION) as s3:
        await s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=key,
            Body=body,
            ContentType=file.content_type or "application/octet-stream",
        )

    logger.info("File uploaded to S3", extra={"bucket": settings.AWS_S3_BUCKET, "key": key, "size_bytes": total})
    return key


def _validate(file: UploadFile) -> None:
    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    if ext not in settings.allowed_extensions_set:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file extension '.{ext}'. Allowed: {', '.join(sorted(settings.allowed_extensions_set))}",
        )
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported content type '{file.content_type}'",
        )
