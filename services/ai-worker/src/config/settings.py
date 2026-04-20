from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    # Redis config
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis-queue:6379/0")
    TASK_QUEUE: str = "image_tasks"
    
    # Model config
    # This matches the folder name you used in predict.py
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "saved_captioner")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()