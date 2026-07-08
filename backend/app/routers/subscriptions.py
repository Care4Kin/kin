from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_circle_access
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate

router = APIRouter()

@router.get('/{circle_id}/subscriptions')
def get_subscriptions(circle_id: int, is_active: Optional[bool] = None, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    query = db.query(Subscription).filter(Subscription.circle_id == circle_id)
    if is_active is not None:
        query = query.filter(Subscription.is_active == is_active)
    return query.order_by(Subscription.name).all()

@router.post('/{circle_id}/subscriptions', status_code=201)
def create_subscription(circle_id: int, body: SubscriptionCreate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    sub = Subscription(circle_id=circle_id, **body.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.patch('/{circle_id}/subscriptions/{subscription_id}')
def update_subscription(circle_id: int, subscription_id: int, body: SubscriptionUpdate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    sub = db.query(Subscription).filter(Subscription.subscription_id == subscription_id, Subscription.circle_id == circle_id).first()
    if not sub:
        raise HTTPException(404, 'Subscription not found')
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(sub, k, v)
    db.commit()
    db.refresh(sub)
    return sub

@router.delete('/{circle_id}/subscriptions/{subscription_id}')
def delete_subscription(circle_id: int, subscription_id: int, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    sub = db.query(Subscription).filter(Subscription.subscription_id == subscription_id, Subscription.circle_id == circle_id).first()
    if not sub:
        raise HTTPException(404, 'Subscription not found')
    db.delete(sub)
    db.commit()
    return {'message': 'Subscription deleted'}
