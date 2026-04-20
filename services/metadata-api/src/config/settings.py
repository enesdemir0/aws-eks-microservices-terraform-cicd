from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    APP_NAME: str = "Metadata_API"
    
    # We remove the hardcoded string. 
    # If DATABASE_URL isn't found in env, we can provide a safe placeholder
    # but never a real password.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:pass@localhost:5433/metadata_db")
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        extra="ignore",
        env_file_encoding="utf-8"
    )

settings = Settings()