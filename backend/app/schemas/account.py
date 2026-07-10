from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel

AccountCategory = Literal['bank', 'insurance', 'healthcare', 'government', 'pharmacy', 'other']

class AccountCreate(BaseModel):
    name: str
    category: AccountCategory
    notes: Optional[str] = None

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[AccountCategory] = None
    notes: Optional[str] = None
    last_reviewed_at: Optional[datetime] = None
