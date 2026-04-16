import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AI_Gateway"
    DEBUG: bool = True
    PORT: int = 8000
    
    # Auth Service URL (How to find the Node.js app inside Docker)
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://auth-service:3000")
    
    # Redis Settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = 6379

    class Config:
        env_file = ".env"

settings = Settings()