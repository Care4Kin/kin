from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.circle import FamilyCircle
from app.models.circle_member import CircleMember

bearer = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int = payload.get('sub')
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

    user = db.query(User).filter(User.user_id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    return user

def require_circle_access(
    circle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FamilyCircle:
    circle = db.query(FamilyCircle).filter(FamilyCircle.circle_id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Circle not found')

    if circle.elder_id == current_user.user_id:
        return circle

    is_member = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.caregiver_id == current_user.user_id,
    ).first()
    if not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not a member of this circle')

    return circle

def require_elder(circle: FamilyCircle, current_user: User):
    if circle.elder_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only the elder can do this')

def require_permission(permission: str):
    def dependency(
        circle_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> FamilyCircle:
        circle = db.query(FamilyCircle).filter(FamilyCircle.circle_id == circle_id).first()
        if not circle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Circle not found')

        if circle.elder_id == current_user.user_id:
            return circle

        member = db.query(CircleMember).filter(
            CircleMember.circle_id == circle_id,
            CircleMember.caregiver_id == current_user.user_id,
        ).first()
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not a member of this circle')
        if not getattr(member, permission):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='The elder has not shared this with you')

        return circle
    return dependency

