from sqlalchemy import create_all, create_engine
from sqlalchemy.orm import sessionmaker
from src.config.settings import settings
import logging

logger = logging.getLogger(__name__)

# 1. Create the engine
# Note: In Docker, we talk to 'metadata-db'. Locally, we talk to 'localhost:5433'
engine = create_engine(settings.DATABASE_URL)

# 2. Create a Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency for FastAPI routes to get a DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Creates the tables if they don't exist"""
    from src.models.caption import Base
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Metadata Database tables initialized!")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")