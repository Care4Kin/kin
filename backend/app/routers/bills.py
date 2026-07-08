from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.bill import Bill

router = APIRouter()

@router.get('/{circle_id}/bills')
def get_bills(circle_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Bill).filter(Bill.circle_id == circle_id).order_by(Bill.due_date).all()

@router.patch('/{circle_id}/bills/{bill_id}')
def update_bill(circle_id: int, bill_id: int, body: dict, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    bill = db.query(Bill).filter(Bill.bill_id == bill_id, Bill.circle_id == circle_id).first()
    if not bill:
        raise HTTPException(404, 'Bill not found')
    for k, v in body.items():
        setattr(bill, k, v)
    db.commit()
    db.refresh(bill)
    return bill
