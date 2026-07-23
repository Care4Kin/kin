from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.feedback_message import FeedbackMessage
from app.schemas.feedback import FeedbackMessageCreate, FeedbackMessageOut

router = APIRouter()

@router.get('', response_model=list[FeedbackMessageOut])
def get_my_feedback(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(FeedbackMessage).filter(
        FeedbackMessage.user_id == current_user.user_id
    ).order_by(FeedbackMessage.created_at).all()

@router.post('', response_model=FeedbackMessageOut, status_code=201)
def send_feedback(body: FeedbackMessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not body.content.strip():
        raise HTTPException(400, 'Message cannot be empty')
    message = FeedbackMessage(user_id=current_user.user_id, content=body.content.strip())
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
