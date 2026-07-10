from typing import Optional, Literal
from pydantic import BaseModel

FlagType = Literal['call', 'email', 'text', 'bill', 'other']
FlagSeverity = Literal['low', 'high']

class FlagCreate(BaseModel):
    type: FlagType
    description: str
    severity: FlagSeverity = 'low'

class FlagUpdate(BaseModel):
    is_resolved: Optional[bool] = None
    description: Optional[str] = None
    severity: Optional[FlagSeverity] = None
