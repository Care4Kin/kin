from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.flag import Flag

router = APIRouter()

@router.get('/{circle_id}/flags')
def get_flags(circle_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Flag).filter(Flag.circle_id == circle_id).order_by(Flag.created_at.desc()).all()
