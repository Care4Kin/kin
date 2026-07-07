from pydantic import BaseModel
from typing import Optional

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    phone: Optional[str] = None

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
