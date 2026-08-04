from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator

MAX_AMOUNT = 99999999.99

def _amount_not_too_large(v):
    if v is not None and v > MAX_AMOUNT:
        raise ValueError(f'That amount is too big — please enter a number under ${MAX_AMOUNT:,.2f}')
    return v

class SubscriptionCreate(BaseModel):
    name: str
    monthly_cost: float

    _validate_monthly_cost = field_validator('monthly_cost')(_amount_not_too_large)

class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    monthly_cost: Optional[float] = None
    is_active: Optional[bool] = None
    last_reviewed_at: Optional[datetime] = None

    _validate_monthly_cost = field_validator('monthly_cost')(_amount_not_too_large)
