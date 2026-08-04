from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_permission
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate
from app.services.plaid_suggestions import stage_dismiss_suggestion

router = APIRouter()
require_subscriptions_access = require_permission('can_view_subscriptions')

@router.get('/{circle_id}/subscriptions')
def get_subscriptions(circle_id: int, is_active: Optional[bool] = None, db: Session = Depends(get_db), circle=Depends(require_subscriptions_access)):
    query = db.query(Subscription).filter(Subscription.circle_id == circle_id)
    if is_active is not None:
        query = query.filter(Subscription.is_active == is_active)
    return query.order_by(Subscription.name).all()

@router.post('/{circle_id}/subscriptions', status_code=201)
def create_subscription(circle_id: int, body: SubscriptionCreate, db: Session = Depends(get_db), circle=Depends(require_subscriptions_access)):
    data = body.model_dump()
    source_key = data.pop('source_key', None)
    sub = Subscription(circle_id=circle_id, **data)
    db.add(sub)
    if source_key:
        stage_dismiss_suggestion(db, circle_id, source_key)
    db.commit()
    db.refresh(sub)
    return sub

@router.patch('/{circle_id}/subscriptions/{subscription_id}')
def update_subscription(circle_id: int, subscription_id: int, body: SubscriptionUpdate, db: Session = Depends(get_db), circle=Depends(require_subscriptions_access)):
    sub = db.query(Subscription).filter(Subscription.subscription_id == subscription_id, Subscription.circle_id == circle_id).first()
    if not sub:
        raise HTTPException(404, 'Subscription not found')
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(sub, k, v)
    db.commit()
    db.refresh(sub)
    return sub

@router.delete('/{circle_id}/subscriptions/{subscription_id}')
def delete_subscription(circle_id: int, subscription_id: int, db: Session = Depends(get_db), circle=Depends(require_subscriptions_access)):
    sub = db.query(Subscription).filter(Subscription.subscription_id == subscription_id, Subscription.circle_id == circle_id).first()
    if not sub:
        raise HTTPException(404, 'Subscription not found')
    db.delete(sub)
    db.commit()
    return {'message': 'Subscription deleted'}
