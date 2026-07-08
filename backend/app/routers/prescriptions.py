from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.prescription import Prescription

router = APIRouter()

@router.get('/{circle_id}/prescriptions')
def get_prescriptions(circle_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Prescription).filter(Prescription.circle_id == circle_id).order_by(Prescription.refill_date).all()
