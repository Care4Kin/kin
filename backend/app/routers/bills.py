from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_circle_access
from app.models.bill import Bill
from app.schemas.bill import BillCreate, BillUpdate

router = APIRouter()

@router.get('/{circle_id}/bills')
def get_bills(circle_id: int, is_paid: Optional[bool] = None, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    query = db.query(Bill).filter(Bill.circle_id == circle_id)
    if is_paid is not None:
        query = query.filter(Bill.is_paid == is_paid)
    return query.order_by(Bill.due_date).all()

@router.post('/{circle_id}/bills', status_code=201)
def create_bill(circle_id: int, body: BillCreate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    bill = Bill(circle_id=circle_id, **body.model_dump())
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill

@router.patch('/{circle_id}/bills/{bill_id}')
def update_bill(circle_id: int, bill_id: int, body: BillUpdate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    bill = db.query(Bill).filter(Bill.bill_id == bill_id, Bill.circle_id == circle_id).first()
    if not bill:
        raise HTTPException(404, 'Bill not found')
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(bill, k, v)
    db.commit()
    db.refresh(bill)
    return bill

@router.delete('/{circle_id}/bills/{bill_id}')
def delete_bill(circle_id: int, bill_id: int, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    bill = db.query(Bill).filter(Bill.bill_id == bill_id, Bill.circle_id == circle_id).first()
    if not bill:
        raise HTTPException(404, 'Bill not found')
    db.delete(bill)
    db.commit()
    return {'message': 'Bill deleted'}
