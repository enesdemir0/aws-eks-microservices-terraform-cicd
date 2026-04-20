from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# This defines what the AI-Worker must send to us
class CaptionCreate(BaseModel):
    task_id: str
    user_id: int
    image_path: str
    caption: str

# This defines what we send back to the user
class CaptionResponse(CaptionCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True # Tells Pydantic to work with SQLAlchemy models