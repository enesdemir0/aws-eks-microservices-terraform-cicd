"""
Shared fixtures for metadata-api tests.

Uses an in-memory SQLite database so no real Postgres is required.
Tables are created fresh before each test function and dropped after.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_URL = "sqlite:///./test_metadata.db"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_tables():
    from src.models.caption import Base
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    from src.main import app
    from src.config.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture
def sample_payload():
    return {
        "task_id": "aabbccdd11223344aabbccdd11223344",
        "user_id": 1,
        "image_path": "/app/uploads/test.jpg",
        "caption": "a dog sitting on a grassy field",
    }
