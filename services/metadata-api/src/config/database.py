from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.config.settings import settings
import logging

logger = logging.getLogger(__name__)

# Create engine
engine = create_engine(settings.DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from src.models.caption import Base
    try:
        # NOTICE: No 'create_all' import. We call it on Base.metadata
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Metadata Database tables initialized!")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")