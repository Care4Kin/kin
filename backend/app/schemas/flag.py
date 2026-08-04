from typing import Optional, Literal
from pydantic import BaseModel

FlagType = Literal['call', 'email', 'text', 'bill', 'other']
FlagSeverity = Literal['low', 'high']

class FlagCreate(BaseModel):
    type: FlagType
    description: str
    severity: FlagSeverity = 'low'
    # Opaque dedup key from a detected-bank suggestion (see plaid.py). Not
    # stored on the flag itself -- just tells the endpoint which suggestion
    # to permanently dismiss so it doesn't reappear after this flag is deleted.
    source_key: Optional[str] = None

class FlagUpdate(BaseModel):
    is_resolved: Optional[bool] = None
    type: Optional[FlagType] = None
    description: Optional[str] = None
    severity: Optional[FlagSeverity] = None
    resolution_note: Optional[str] = None
