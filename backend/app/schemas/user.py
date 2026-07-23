from pydantic import BaseModel
from typing import Literal, Optional

Role = Literal['elder', 'caregiver']
Theme = Literal['white-emerald', 'sage-cream', 'soft-blue-slate', 'sunset-coral', 'lavender-charcoal', 'navy-gold']

class RegisterRequest(BaseModel):
    email: str
    password: str
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

class UserProfileOut(BaseModel):
    user_id: int
    email: str
    full_name: str
    role: str
    theme: str
    phone: Optional[str] = None
    security_question: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    theme: Optional[Theme] = None

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
