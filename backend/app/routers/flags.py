from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, require_permission
from app.models.flag import Flag
from app.models.user import User
from app.schemas.flag import FlagCreate, FlagUpdate
from app.services.gemini_client import assess_flag_risk, gemini_configured
from app.utils import utcnow

router = APIRouter()
require_flags_access = require_permission('can_view_flags')

@router.get('/{circle_id}/flags')
def get_flags(circle_id: int, is_resolved: Optional[bool] = None, db: Session = Depends(get_db), circle=Depends(require_flags_access)):
    query = db.query(Flag).filter(Flag.circle_id == circle_id)
    if is_resolved is not None:
        query = query.filter(Flag.is_resolved == is_resolved)
    return query.order_by(Flag.created_at.desc()).all()

@router.post('/{circle_id}/flags', status_code=201)
def create_flag(circle_id: int, body: FlagCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), circle=Depends(require_flags_access)):
    flag = Flag(circle_id=circle_id, created_by=current_user.user_id, **body.model_dump())
    if gemini_configured():
        try:
            assessment = assess_flag_risk(flag.type, flag.description)
            flag.ai_risk_level = assessment.risk_level
            flag.ai_explanation = assessment.explanation
            flag.ai_suggested_action = assessment.suggested_action
            flag.ai_assessed_at = utcnow()
        except Exception as e:
            print(f'flag risk assessment failed for circle {circle_id}: {e}')
    db.add(flag)
    db.commit()
    db.refresh(flag)
    return flag

@router.patch('/{circle_id}/flags/{flag_id}')
def update_flag(circle_id: int, flag_id: int, body: FlagUpdate, db: Session = Depends(get_db), circle=Depends(require_flags_access)):
    flag = db.query(Flag).filter(Flag.flag_id == flag_id, Flag.circle_id == circle_id).first()
    if not flag:
        raise HTTPException(404, 'Flag not found')
    updates = body.model_dump(exclude_unset=True)
    if 'is_resolved' in updates:
        if updates['is_resolved'] and not flag.is_resolved:
            flag.resolved_at = utcnow()
        elif not updates['is_resolved']:
            flag.resolved_at = None
    for k, v in updates.items():
        setattr(flag, k, v)
    db.commit()
    db.refresh(flag)
    return flag

@router.delete('/{circle_id}/flags/{flag_id}')
def delete_flag(circle_id: int, flag_id: int, db: Session = Depends(get_db), circle=Depends(require_flags_access)):
    flag = db.query(Flag).filter(Flag.flag_id == flag_id, Flag.circle_id == circle_id).first()
    if not flag:
        raise HTTPException(404, 'Flag not found')
    db.delete(flag)
    db.commit()
    return {'message': 'Flag deleted'}
