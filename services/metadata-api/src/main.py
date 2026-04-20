from fastapi import FastAPI
from src.routes import metadata
from src.config.database import init_db
from src.config.settings import settings
import logging

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME)

# Initialize Database on startup
@app.on_event("startup")
def startup_event():
    logger.info("Initializing Metadata Database...")
    init_db()

app.include_router(metadata.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "metadata-api"}