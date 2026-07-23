from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.services.digest import generate_and_send_digests

router = APIRouter()

def _require_internal_secret(x_internal_secret: str = Header(None)):
    if not settings.internal_task_secret or x_internal_secret != settings.internal_task_secret:
        raise HTTPException(401, 'Invalid or missing internal secret')

@router.post('/digests/send')
def send_weekly_digests(db: Session = Depends(get_db), _=Depends(_require_internal_secret)):
    return generate_and_send_digests(db)
