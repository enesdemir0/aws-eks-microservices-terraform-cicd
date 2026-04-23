from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    REDIS_URL:  str = "redis://task-queue:6379/0"
    TASK_QUEUE: str = "image_tasks"
    METADATA_API_URL: str = "http://metadata-api:8001/api/metadata/save"

    MODEL_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "saved_captioner",
    )

    # Storage — set to "s3" in EKS, keep "local" for Docker Compose
    STORAGE_TYPE:    str = "local"
    AWS_S3_BUCKET:   Optional[str] = None
    AWS_REGION:      str = "us-east-1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
