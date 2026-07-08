from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.note import Note

router = APIRouter()

@router.get('/{circle_id}/notes')
def get_notes(circle_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Note).filter(Note.circle_id == circle_id).order_by(Note.created_at.desc()).all()
