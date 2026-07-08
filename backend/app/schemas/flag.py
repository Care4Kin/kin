from typing import Optional
from pydantic import BaseModel

class FlagCreate(BaseModel):
    type: str
    description: str
    severity: str = 'low'

class FlagUpdate(BaseModel):
    is_resolved: Optional[bool] = None
    description: Optional[str] = None
    severity: Optional[str] = None
