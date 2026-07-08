from datetime import date
from typing import Optional
from pydantic import BaseModel

class BillCreate(BaseModel):
    name: str
    amount: float
    due_date: date
    category: Optional[str] = None

class BillUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[date] = None
    is_paid: Optional[bool] = None
    category: Optional[str] = None
