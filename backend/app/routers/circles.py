from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.circle import FamilyCircle
from app.models.circle_member import CircleMember

router = APIRouter()

@router.get('/mine')
def get_my_circle(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user
    user_id = user.user_id

    if user.role == 'elder':
        circle = db.query(FamilyCircle).filter(FamilyCircle.elder_id == user_id).first()
    else:
        membership = db.query(CircleMember).filter(CircleMember.caregiver_id == user_id).first()
        circle = db.query(FamilyCircle).filter(
            FamilyCircle.circle_id == membership.circle_id
        ).first() if membership else None

    if not circle:
        raise HTTPException(404, 'No circle found')

    return {'circle_id': circle.circle_id, 'elder_id': circle.elder_id}
