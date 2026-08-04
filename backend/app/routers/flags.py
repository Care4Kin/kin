from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, require_permission
from app.models.circle import FamilyCircle
from app.models.circle_member import CircleMember
from app.models.flag import Flag
from app.models.user import User
from app.schemas.flag import FlagCreate, FlagUpdate
from app.services.email import send_email
from app.services.groq_client import assess_flag_risk, groq_configured
from app.services.plaid_suggestions import stage_dismiss_suggestion
from app.utils import utcnow

router = APIRouter()
require_flags_access = require_permission('can_view_flags')

@router.get('/{circle_id}/flags')
def get_flags(circle_id: int, is_resolved: Optional[bool] = None, db: Session = Depends(get_db), circle=Depends(require_flags_access)):
    query = db.query(Flag).filter(Flag.circle_id == circle_id)
    if is_resolved is not None:
        query = query.filter(Flag.is_resolved == is_resolved)
    return query.order_by(Flag.created_at.desc()).all()

def _notify_high_risk_flag(circle_id: int, flag: Flag, current_user_id: int, db: Session):
    """Immediate email, separate from the routine digest -- a high-risk scam
    flag is urgent enough to send right away, but still respects a caregiver's
    digest_frequency preference (skipped entirely if they've turned it off).
    The elder has no digest preference of their own, so they're always notified."""
    circle = db.query(FamilyCircle).filter(FamilyCircle.circle_id == circle_id).first()
    if not circle:
        return
    recipients = []
    if circle.elder_id != current_user_id:
        elder = db.query(User).filter(User.user_id == circle.elder_id).first()
        if elder:
            recipients.append(elder.email)
    members = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.can_view_flags.is_(True),
        CircleMember.caregiver_id != current_user_id,
    ).all()
    for member in members:
        if member.digest_frequency == 'off':
            continue
        caregiver = db.query(User).filter(User.user_id == member.caregiver_id).first()
        if caregiver:
            recipients.append(caregiver.email)

    for email in recipients:
        send_email(
            to=email,
            subject='Kin: a high-risk item was just flagged',
            body=(
                "Someone in your Kin circle just flagged something as high risk:\n\n"
                f"\"{flag.description}\"\n\n"
                f"{flag.ai_explanation or ''}\n\n"
                "Log in to Kin to see the full details and suggested next step."
            ),
        )

@router.post('/{circle_id}/flags', status_code=201)
def create_flag(circle_id: int, body: FlagCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), circle=Depends(require_flags_access)):
    data = body.model_dump()
    source_key = data.pop('source_key', None)
    flag = Flag(circle_id=circle_id, created_by=current_user.user_id, **data)
    if groq_configured():
        try:
            assessment = assess_flag_risk(flag.type, flag.description)
            flag.ai_risk_level = assessment.risk_level
            flag.ai_explanation = assessment.explanation
            flag.ai_suggested_action = assessment.suggested_action
            flag.ai_assessed_at = utcnow()
        except Exception as e:
            print(f'flag risk assessment failed for circle {circle_id}: {e}')
    db.add(flag)
    if source_key:
        stage_dismiss_suggestion(db, circle_id, source_key)
    db.commit()
    db.refresh(flag)
    if flag.ai_risk_level == 'high':
        try:
            _notify_high_risk_flag(circle_id, flag, current_user.user_id, db)
        except Exception as e:
            print(f'high-risk flag notification failed for circle {circle_id}: {e}')
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
            flag.resolution_note = None
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
