from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    APP_NAME: str = "Metadata_API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:super-secure-local-password-123@localhost:5432/auth_db")
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()