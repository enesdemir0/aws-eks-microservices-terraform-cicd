import logging
import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile

from src.config.settings import settings

logger = logging.getLogger(__name__)

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


async def save_upload(file: UploadFile) -> str:
    """Validates and saves an upload. Returns the path string."""
    _validate(file)

    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    dest = Path(settings.UPLOAD_DIR) / f"{uuid.uuid4().hex}.{ext}"
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

    logger.info("File saved", extra={"path": str(dest), "size_bytes": bytes_written})
    return str(dest)


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
