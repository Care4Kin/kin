from datetime import date
from typing import Optional
from pydantic import BaseModel, field_validator

MAX_AMOUNT = 99999999.99

def _amount_not_too_large(v):
    if v is not None and v > MAX_AMOUNT:
        raise ValueError(f'That amount is too big — please enter a number under ${MAX_AMOUNT:,.2f}')
    return v

class BillCreate(BaseModel):
    name: str
    amount: float
    due_date: date
    category: Optional[str] = None

    _validate_amount = field_validator('amount')(_amount_not_too_large)

class BillUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[date] = None
    is_paid: Optional[bool] = None
    category: Optional[str] = None

    _validate_amount = field_validator('amount')(_amount_not_too_large)
