from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, require_circle_access
from app.models.circle_member import CircleMember
from app.models.user import User
from app.schemas.ask_kin import AskKinRequest
from app.services.gemini_client import answer_kin_question, gemini_configured

router = APIRouter()

@router.post('/{circle_id}/ask-kin')
def ask_kin(circle_id: int, body: AskKinRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    if not gemini_configured():
        raise HTTPException(503, 'Ask Kin is not available right now')

    is_elder = current_user.user_id == circle.elder_id
    if is_elder:
        permissions = {'can_view_bills': True, 'can_view_prescriptions': True, 'can_view_accounts': True}
    else:
        member = db.query(CircleMember).filter(
            CircleMember.circle_id == circle_id,
            CircleMember.caregiver_id == current_user.user_id,
        ).first()
        permissions = {
            'can_view_bills': member.can_view_bills,
            'can_view_prescriptions': member.can_view_prescriptions,
            'can_view_accounts': member.can_view_accounts,
        }

    try:
        reply = answer_kin_question(
            circle_id=circle_id,
            permissions=permissions,
            is_elder=is_elder,
            question=body.message,
            history=[h.model_dump() for h in body.history],
            db=db,
        )
    except Exception as e:
        print(f'ask_kin failed for circle {circle_id}: {e}')
        raise HTTPException(503, 'Ask Kin is having trouble answering right now')

    return {'reply': reply}
