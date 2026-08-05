from datetime import date
from typing import Optional
from pydantic import BaseModel, field_validator

MAX_AMOUNT = 99999999.99

def _amount_not_too_large(v):
    if v is not None and v > MAX_AMOUNT:
        raise ValueError(f'That amount is too big — please enter a number under ${MAX_AMOUNT:,.2f}')
    if v is not None and v < 0:
        raise ValueError('Amount cannot be negative.')
    return v

class BillCreate(BaseModel):
    name: str
    amount: float
    due_date: date
    category: Optional[str] = None
    # Opaque dedup key from a detected-bank suggestion (see plaid.py). Not stored
    # on the bill itself — just tells the endpoint which suggestion to permanently
    # dismiss so it doesn't reappear after this bill is renamed or deleted.
    source_key: Optional[str] = None

    _validate_amount = field_validator('amount')(_amount_not_too_large)

class BillUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[date] = None
    is_paid: Optional[bool] = None
    category: Optional[str] = None

    _validate_amount = field_validator('amount')(_amount_not_too_large)
