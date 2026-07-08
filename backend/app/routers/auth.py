from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.user import User
from app.schemas.user import RegisterRequest, LoginRequest, UserOut, LoginOut
from app.config import settings

router = APIRouter()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

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
