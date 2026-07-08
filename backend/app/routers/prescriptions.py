from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_circle_access
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate

router = APIRouter()

@router.get('/{circle_id}/prescriptions')
def get_prescriptions(circle_id: int, is_active: Optional[bool] = None, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    query = db.query(Prescription).filter(Prescription.circle_id == circle_id)
    if is_active is not None:
        query = query.filter(Prescription.is_active == is_active)
    return query.order_by(Prescription.refill_date).all()

@router.post('/{circle_id}/prescriptions', status_code=201)
def create_prescription(circle_id: int, body: PrescriptionCreate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    rx = Prescription(circle_id=circle_id, **body.model_dump())
    db.add(rx)
    db.commit()
    db.refresh(rx)
    return rx

@router.patch('/{circle_id}/prescriptions/{prescription_id}')
def update_prescription(circle_id: int, prescription_id: int, body: PrescriptionUpdate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    rx = db.query(Prescription).filter(Prescription.prescription_id == prescription_id, Prescription.circle_id == circle_id).first()
    if not rx:
        raise HTTPException(404, 'Prescription not found')
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(rx, k, v)
    db.commit()
    db.refresh(rx)
    return rx

@router.delete('/{circle_id}/prescriptions/{prescription_id}')
def delete_prescription(circle_id: int, prescription_id: int, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    rx = db.query(Prescription).filter(Prescription.prescription_id == prescription_id, Prescription.circle_id == circle_id).first()
    if not rx:
        raise HTTPException(404, 'Prescription not found')
    db.delete(rx)
    db.commit()
    return {'message': 'Prescription deleted'}
