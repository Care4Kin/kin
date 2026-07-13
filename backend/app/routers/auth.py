from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
import jwt
import secrets
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.user import (
    RegisterRequest, LoginRequest, UserOut, LoginOut,
    SecurityQuestionOut, ResetPasswordRequest,
    UserProfileOut, ProfileUpdateRequest, ChangePasswordRequest, SecurityQuestionUpdateRequest,
    PhoneSendCodeRequest, PhoneVerifyCodeRequest, GoogleAuthRequest, GoogleCompleteRequest,
)
from app.config import settings
from app.services.sms import send_sms
from app.services.invitations import claim_invitations

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
    claim_invitations(user, db)
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

@router.post('/phone/send-code')
def send_phone_code(body: PhoneSendCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == body.phone).first()
    if not user:
        raise HTTPException(404, 'No account found with that phone number')
    code = f'{secrets.randbelow(1_000_000):06d}'
    user.phone_verification_code_hash = hash_password(code)
    user.phone_verification_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db.commit()
    send_sms(body.phone, f'Your Kin verification code is {code}. It expires in 5 minutes.')
    return {'message': 'Code sent'}

@router.post('/phone/verify-code', response_model=LoginOut)
def verify_phone_code(body: PhoneVerifyCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == body.phone).first()
    if not user or not user.phone_verification_code_hash or not user.phone_verification_expires_at:
        raise HTTPException(401, 'Invalid or expired code')
    expires_at = user.phone_verification_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(401, 'Invalid or expired code')
    if not verify_password(body.code, user.phone_verification_code_hash):
        raise HTTPException(401, 'Invalid or expired code')

    user.phone_verified = True
    user.phone_verification_code_hash = None
    user.phone_verification_expires_at = None
    db.commit()
    return {'token': make_token(user.user_id), 'user_id': user.user_id, 'role': user.role, 'full_name': user.full_name}

def _verify_google_token(id_token_str: str) -> dict:
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    try:
        idinfo = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(401, 'Invalid Google token')

    if not idinfo.get('email_verified'):
        raise HTTPException(401, 'Google account email is not verified')

    return idinfo

@router.post('/google')
def google_auth(body: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Sign in with an existing Google-linked (or email-matched) account.
    For an unknown email, returns needs_setup so the client can collect a
    role + security question before the account is created."""
    idinfo = _verify_google_token(body.id_token)
    email = idinfo['email']

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {'needs_setup': True, 'email': email, 'full_name': idinfo.get('name', email)}

    if not user.google_sub:
        user.google_sub = idinfo['sub']
        db.commit()

    return {'token': make_token(user.user_id), 'user_id': user.user_id, 'role': user.role, 'full_name': user.full_name}

@router.post('/google/complete', response_model=LoginOut)
def google_complete(body: GoogleCompleteRequest, db: Session = Depends(get_db)):
    """Finish a new Google sign-up once the user has chosen a role (and
    optionally a security question). Re-verifies the token before creating."""
    if body.role not in ('elder', 'caregiver'):
        raise HTTPException(400, 'role must be elder or caregiver')

    idinfo = _verify_google_token(body.id_token)
    email = idinfo['email']

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, 'Account already exists — please sign in instead')

    user = User(
        email=email,
        password_hash=hash_password(secrets.token_urlsafe(32)),
        full_name=idinfo.get('name', email),
        role=body.role,
        google_sub=idinfo['sub'],
        security_question=body.security_question,
        security_answer_hash=hash_password(normalize_answer(body.security_answer)) if body.security_answer else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    claim_invitations(user, db)

    return {'token': make_token(user.user_id), 'user_id': user.user_id, 'role': user.role, 'full_name': user.full_name}

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
    updates = body.model_dump(exclude_unset=True)
    if 'phone' in updates and updates['phone'] != current_user.phone:
        if updates['phone'] and db.query(User).filter(
            User.phone == updates['phone'], User.user_id != current_user.user_id
        ).first():
            raise HTTPException(409, 'That phone number is already in use')
        current_user.phone_verified = False
    for k, v in updates.items():
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
