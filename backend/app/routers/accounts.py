from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.account import Account

router = APIRouter()

@router.get('/{circle_id}/accounts')
def get_accounts(circle_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Account).filter(Account.circle_id == circle_id).order_by(Account.category, Account.name).all()
