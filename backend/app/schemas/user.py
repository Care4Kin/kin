from pydantic import BaseModel
from typing import Literal, Optional

Role = Literal['elder', 'caregiver']
Theme = Literal['white-emerald', 'sage-cream', 'soft-blue-slate', 'sunset-coral', 'lavender-charcoal', 'navy-gold']

class RegisterRequest(BaseModel):
    email: str
    # Optional so a user can sign up without a password -- e.g. via phone
    # sign-in or their security question -- instead of memorizing one. A
    # random one is generated server-side when omitted, same as Google signup.
    password: Optional[str] = None
    full_name: str
    role: Role
    phone: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    user_id: int
    email: str
    full_name: str
    role: str

class LoginOut(BaseModel):
    token: str
    user_id: int
    role: str
    full_name: str
    email: str

class SecurityQuestionOut(BaseModel):
    security_question: str

class ResetPasswordRequest(BaseModel):
    email: str
    security_answer: str
    new_password: str

class SecurityLoginRequest(BaseModel):
    email: str
    security_answer: str

class UserProfileOut(BaseModel):
    user_id: int
    email: str
    full_name: str
    role: str
    theme: str
    phone: Optional[str] = None
    security_question: Optional[str] = None
    has_seen_onboarding: bool

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    theme: Optional[Theme] = None
    has_seen_onboarding: Optional[bool] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class SecurityQuestionUpdateRequest(BaseModel):
    security_question: str
    security_answer: str

class PhoneSendCodeRequest(BaseModel):
    phone: str

class PhoneVerifyCodeRequest(BaseModel):
    phone: str
    code: str

class GoogleAuthRequest(BaseModel):
    id_token: str

class GoogleCompleteRequest(BaseModel):
    id_token: str
    role: Role
    security_question: Optional[str] = None
    security_answer: Optional[str] = None
