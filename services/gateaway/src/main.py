from fastapi import FastAPI
from src.config.settings import settings
import logging

# Professional Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME)

@app.get("/health")
async def health_check():
    logger.info("Gateway health check triggered")
    return {"status": "healthy", "service": "gateway", "version": "1.0.0"}