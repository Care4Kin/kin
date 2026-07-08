from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SubscriptionCreate(BaseModel):
    name: str
    monthly_cost: float

class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    monthly_cost: Optional[float] = None
    is_active: Optional[bool] = None
    last_reviewed_at: Optional[datetime] = None
