from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class CaptionMetadata(Base):
    __tablename__ = "captions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(100), unique=True, nullable=False)
    user_id = Column(Integer, nullable=False)
    image_path = Column(Text, nullable=False)
    caption = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)