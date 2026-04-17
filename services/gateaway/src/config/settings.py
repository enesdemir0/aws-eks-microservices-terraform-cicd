from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "AI_Gateway"
    NODE_ENV: str = "development"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # Auth Service
    AUTH_SERVICE_URL: str = "http://localhost:3000"
    AUTH_SERVICE_TIMEOUT: float = 5.0

    # Storage
    STORAGE_TYPE: str = "local"
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,webp"
    AWS_S3_BUCKET: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_QUEUE_NAME: str = "image_tasks"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_file_encoding="utf-8",
    )

    @property
    def allowed_extensions_set(self) -> set[str]:
        return {ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",")}


settings = Settings()
