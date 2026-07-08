from pydantic import BaseModel
from typing import Optional

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
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
    phone: Optional[str] = None
    security_question: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

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
    role: Optional[str] = None
