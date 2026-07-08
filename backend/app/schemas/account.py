from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AccountCreate(BaseModel):
    name: str
    category: str
    notes: Optional[str] = None

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    last_reviewed_at: Optional[datetime] = None
