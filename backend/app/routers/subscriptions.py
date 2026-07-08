from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.subscription import Subscription

router = APIRouter()

@router.get('/{circle_id}/subscriptions')
def get_subscriptions(circle_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Subscription).filter(Subscription.circle_id == circle_id).order_by(Subscription.name).all()
