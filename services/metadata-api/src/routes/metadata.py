from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.caption import CaptionMetadata
from src.schemas.metadata import CaptionCreate, CaptionResponse
from typing import List

router = APIRouter(prefix="/api/metadata", tags=["metadata"])

@router.post("/save", response_model=CaptionResponse)
async def save_metadata(data: CaptionCreate, db: Session = Depends(get_db)):
    # 1. Check if task already exists
    existing = db.query(CaptionMetadata).filter(CaptionMetadata.task_id == data.task_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Task metadata already recorded")

    # 2. Create the record
    new_record = CaptionMetadata(
        task_id=data.task_id,
        user_id=data.user_id,
        image_path=data.image_path,
        caption=data.caption
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@router.get("/user/{user_id}", response_model=List[CaptionResponse])
async def get_user_captions(user_id: int, db: Session = Depends(get_db)):
    # Returns all captions for a specific user
    return db.query(CaptionMetadata).filter(CaptionMetadata.user_id == user_id).all()