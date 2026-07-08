from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.user import (
    RegisterRequest, LoginRequest, UserOut, LoginOut,
    SecurityQuestionOut, ResetPasswordRequest,
    UserProfileOut, ProfileUpdateRequest, ChangePasswordRequest, SecurityQuestionUpdateRequest,
)
from app.config import settings

router = APIRouter()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def normalize_answer(answer: str) -> str:
    return answer.strip().lower()

def make_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({'sub': str(user_id), 'exp': expire}, settings.secret_key, algorithm=settings.algorithm)

@router.post('/register', response_model=UserOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if body.role not in ('elder', 'caregiver'):
        raise HTTPException(400, 'role must be elder or caregiver')
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(409, 'Email already registered')
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        phone=body.phone,
        security_question=body.security_question,
        security_answer_hash=hash_password(normalize_answer(body.security_answer)) if body.security_answer else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post('/login', response_model=LoginOut)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, 'Invalid email or password')
    return {'token': make_token(user.user_id), 'user_id': user.user_id, 'role': user.role, 'full_name': user.full_name}

@router.post('/logout')
def logout():
    return {'message': 'Logged out'}

@router.get('/security-question', response_model=SecurityQuestionOut)
def get_security_question(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.security_question:
        raise HTTPException(404, 'No security question found for that email')
    return {'security_question': user.security_question}

@router.post('/reset-password')
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.security_answer_hash:
        raise HTTPException(404, 'No security question found for that email')
    if not verify_password(normalize_answer(body.security_answer), user.security_answer_hash):
        raise HTTPException(401, 'That answer does not match')
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {'message': 'Password updated'}

@router.get('/me', response_model=UserProfileOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch('/me', response_model=UserProfileOut)
def update_me(body: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(current_user, k, v)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post('/change-password')
def change_password(body: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(401, 'Current password is incorrect')
    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return {'message': 'Password updated'}

@router.patch('/security-question')
def update_security_question(body: SecurityQuestionUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.security_question = body.security_question
    current_user.security_answer_hash = hash_password(normalize_answer(body.security_answer))
    db.commit()
    return {'message': 'Security question updated'}
