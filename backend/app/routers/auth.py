from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
import jwt
import secrets
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.flag import Flag
from app.models.note import Note
from app.models.trusted_device import TrustedDevice
from app.schemas.user import (
    RegisterRequest, LoginRequest, UserOut, LoginOut,
    SecurityQuestionOut, ResetPasswordRequest, SecurityLoginRequest,
    UserProfileOut, ProfileUpdateRequest, ChangePasswordRequest, SecurityQuestionUpdateRequest,
    PhoneSendCodeRequest, PhoneVerifyCodeRequest, GoogleAuthRequest, GoogleCompleteRequest,
    DeleteAccountRequest, TrustDeviceRequest, TrustDeviceOut,
)
from app.config import settings
from app.services.sms import send_sms, twilio_configured
from app.services.invitations import claim_invitations

router = APIRouter()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def normalize_answer(answer: str) -> str:
    return answer.strip().lower()

def normalize_email(email: str) -> str:
    return email.strip().lower()

def normalize_phone(phone: str) -> str:
    digits = ''.join(c for c in phone if c.isdigit())
    if phone.strip().startswith('+'):
        return '+' + digits
    if len(digits) == 10:
        return '+1' + digits
    return '+' + digits

def make_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({'sub': str(user_id), 'exp': expire}, settings.secret_key, algorithm=settings.algorithm)

MAX_SECURITY_ATTEMPTS = 5
SECURITY_LOCKOUT_MINUTES = 15

# The security question is meant as a fallback for a device that's already
# proven itself (a password/phone/Google login, or the moment the account was
# created) -- not a way to sign in to someone's account from anywhere on the
# strength of a guessable answer alone. Every other login method registers
# the calling device as trusted; the security question just checks for one.
def _is_known_device(user: User, device_id: str | None, db: Session) -> bool:
    if not device_id:
        return False
    return db.query(TrustedDevice).filter(
        TrustedDevice.user_id == user.user_id, TrustedDevice.device_id == device_id
    ).first() is not None

def _register_device(user: User, device_id: str | None, db: Session):
    if not device_id or _is_known_device(user, device_id, db):
        return
    db.add(TrustedDevice(user_id=user.user_id, device_id=device_id))
    db.commit()

def _require_known_device(user: User, device_id: str | None, db: Session):
    if not _is_known_device(user, device_id, db):
        raise HTTPException(
            403,
            "For your safety, signing in with your security question only works on a device "
            "you've used before. Please log in with your password or a text code first.",
        )

def _check_security_lockout(user: User):
    if user.security_question_locked_until:
        locked_until = user.security_question_locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(429, 'Too many incorrect answers. Please try again later.')

def _record_failed_security_attempt(user: User, db: Session):
    user.security_question_attempts = (user.security_question_attempts or 0) + 1
    if user.security_question_attempts >= MAX_SECURITY_ATTEMPTS:
        user.security_question_locked_until = datetime.now(timezone.utc) + timedelta(minutes=SECURITY_LOCKOUT_MINUTES)
    db.commit()

def _clear_security_attempts(user: User, db: Session):
    user.security_question_attempts = 0
    user.security_question_locked_until = None
    db.commit()

@router.post('/register', response_model=UserOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    email = normalize_email(body.email)
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, 'Email already registered')
    if not body.password and not (body.phone or '').strip() and not (body.security_answer or '').strip():
        raise HTTPException(400, 'Choose a password, or provide a phone number or security question so you can sign back in')
    user = User(
        email=email,
        # No password given -- e.g. signing up via phone or security question
        # instead -- gets a random one nobody needs to remember, same as Google signup.
        password_hash=hash_password(body.password) if body.password else hash_password(secrets.token_urlsafe(32)),
        full_name=body.full_name,
        role=body.role,
        phone=normalize_phone(body.phone) if body.phone else None,
        security_question=body.security_question,
        security_answer_hash=hash_password(normalize_answer(body.security_answer)) if (body.security_answer or '').strip() else None,
        has_seen_onboarding=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    claim_invitations(user, db)
    # The device creating the account is inherently trusted -- this is what
    # lets a brand-new security-question-only signup immediately log itself
    # in afterward (see Register.jsx) without tripping the device check below.
    _register_device(user, body.device_id, db)
    return user

@router.post('/login', response_model=LoginOut)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == normalize_email(body.email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, 'Invalid email or password')
    _register_device(user, body.device_id, db)
    return {'token': make_token(user.user_id), 'user_id': user.user_id, 'role': user.role, 'full_name': user.full_name, 'email': user.email}

@router.post('/logout')
def logout():
    return {'message': 'Logged out'}

@router.post('/phone/send-code')
def send_phone_code(body: PhoneSendCodeRequest, db: Session = Depends(get_db)):
    if not twilio_configured():
        raise HTTPException(400, 'Phone sign-in is not set up for this app yet')
    phone = normalize_phone(body.phone)
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(404, 'No account found with that phone number')
    code = f'{secrets.randbelow(1_000_000):06d}'
    user.phone_verification_code_hash = hash_password(code)
    user.phone_verification_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db.commit()
    sent = send_sms(phone, f'Your Kin verification code is {code}. It expires in 5 minutes.')
    if not sent:
        raise HTTPException(502, 'We could not send that text — please check the number and try again')
    return {'message': 'Code sent'}

@router.post('/phone/verify-code', response_model=LoginOut)
def verify_phone_code(body: PhoneVerifyCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == normalize_phone(body.phone)).first()
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
    _register_device(user, body.device_id, db)
    return {'token': make_token(user.user_id), 'user_id': user.user_id, 'role': user.role, 'full_name': user.full_name, 'email': user.email}

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
    email = normalize_email(idinfo['email'])

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {'needs_setup': True, 'email': email, 'full_name': idinfo.get('name', email)}

    if not user.google_sub:
        user.google_sub = idinfo['sub']
        db.commit()

    _register_device(user, body.device_id, db)
    return {'token': make_token(user.user_id), 'user_id': user.user_id, 'role': user.role, 'full_name': user.full_name, 'email': user.email}

@router.post('/google/complete', response_model=LoginOut)
def google_complete(body: GoogleCompleteRequest, db: Session = Depends(get_db)):
    """Finish a new Google sign-up once the user has chosen a role (and
    optionally a security question). Re-verifies the token before creating."""
    idinfo = _verify_google_token(body.id_token)
    email = normalize_email(idinfo['email'])

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, 'Account already exists — please sign in instead')

    user = User(
        email=email,
        password_hash=hash_password(secrets.token_urlsafe(32)),
        full_name=idinfo.get('name', email),
        role=body.role,
        google_sub=idinfo['sub'],
        security_question=body.security_question,
        security_answer_hash=hash_password(normalize_answer(body.security_answer)) if (body.security_answer or '').strip() else None,
        has_seen_onboarding=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    claim_invitations(user, db)
    _register_device(user, body.device_id, db)

    return {'token': make_token(user.user_id), 'user_id': user.user_id, 'role': user.role, 'full_name': user.full_name, 'email': user.email}

@router.get('/security-question', response_model=SecurityQuestionOut)
def get_security_question(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == normalize_email(email)).first()
    if not user or not user.security_question:
        raise HTTPException(404, 'No security question found for that email')
    return {'security_question': user.security_question}

@router.post('/reset-password')
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == normalize_email(body.email)).first()
    if not user or not user.security_answer_hash:
        raise HTTPException(404, 'No security question found for that email')
    _require_known_device(user, body.device_id, db)
    _check_security_lockout(user)
    if not verify_password(normalize_answer(body.security_answer), user.security_answer_hash):
        _record_failed_security_attempt(user, db)
        raise HTTPException(401, 'That answer does not match')
    _clear_security_attempts(user, db)
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {'message': 'Password updated'}

@router.post('/security-question/login', response_model=LoginOut)
def login_with_security_question(body: SecurityLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == normalize_email(body.email)).first()
    if not user or not user.security_answer_hash:
        raise HTTPException(404, 'No security question found for that email')
    _require_known_device(user, body.device_id, db)
    _check_security_lockout(user)
    if not verify_password(normalize_answer(body.security_answer), user.security_answer_hash):
        _record_failed_security_attempt(user, db)
        raise HTTPException(401, 'That answer does not match')
    _clear_security_attempts(user, db)
    return {'token': make_token(user.user_id), 'user_id': user.user_id, 'role': user.role, 'full_name': user.full_name, 'email': user.email}

@router.get('/me', response_model=UserProfileOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch('/me', response_model=UserProfileOut)
def update_me(body: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    updates = body.model_dump(exclude_unset=True)
    if 'phone' in updates:
        updates['phone'] = normalize_phone(updates['phone']) if updates['phone'] else None
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
        # 403, not 401 -- see delete_account for why: api.js force-logs-out
        # on any 401 with a token present, which would fire here instead of
        # showing the form error for what is just a failed re-auth check.
        raise HTTPException(403, 'Current password is incorrect')
    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return {'message': 'Password updated'}

@router.delete('/me')
def delete_account(body: DeleteAccountRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, current_user.password_hash):
        # 403, not 401 -- api.js treats any 401 on an authenticated request as
        # "your session token is invalid" and force-reloads/logs the user out
        # before the form ever sees the error. A wrong password here is a
        # failed re-auth check, not an invalid session, so it must not 401.
        raise HTTPException(403, 'Current password is incorrect')
    # These two FKs have no cascade rule, unlike everything else tied to a
    # user/circle -- null them out so a flag/note survives the author's
    # account deletion instead of blocking it with a FK violation.
    db.query(Flag).filter(Flag.created_by == current_user.user_id).update({'created_by': None})
    db.query(Note).filter(Note.author_id == current_user.user_id).update({'author_id': None})
    db.delete(current_user)
    db.commit()
    return {'message': 'Account deleted'}

@router.patch('/security-question')
def update_security_question(body: SecurityQuestionUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.security_question = body.security_question
    current_user.security_answer_hash = hash_password(normalize_answer(body.security_answer))
    db.commit()
    return {'message': 'Security question updated'}

# These three let an already-signed-in user directly manage whether *this*
# browser can use their security question to sign in later -- the normal
# path is automatic (any password/phone/Google login trusts the device that
# did it), but a device can end up untrusted in ways that aren't obvious
# from the outside (private browsing, a cleared localStorage, signing in
# from a device other than the one attempting the security-question login).
# Being logged in at all is already proof of the same thing a password
# login would prove, so no re-auth is required here.
@router.get('/trust-device', response_model=TrustDeviceOut)
def get_device_trust(device_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {'trusted': _is_known_device(current_user, device_id, db)}

@router.post('/trust-device', response_model=TrustDeviceOut)
def add_device_trust(body: TrustDeviceRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _register_device(current_user, body.device_id, db)
    return {'trusted': True}

@router.delete('/trust-device', response_model=TrustDeviceOut)
def remove_device_trust(device_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(TrustedDevice).filter(
        TrustedDevice.user_id == current_user.user_id, TrustedDevice.device_id == device_id
    ).delete()
    db.commit()
    return {'trusted': False}
