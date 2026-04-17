from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    APP_NAME: str = "AI_Gateway"
    
    # This will be 'http://localhost:3000' for now, 
    # but 'http://auth-app:3000' in Docker!
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:3000")
    
    # We will need these soon for Redis!
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = 6379

    class Config:
        env_file = ".env"

settings = Settings()