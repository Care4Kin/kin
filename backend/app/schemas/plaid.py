from typing import Optional
from pydantic import BaseModel

class LinkTokenOut(BaseModel):
    link_token: str

class ExchangeTokenRequest(BaseModel):
    public_token: str
    institution_name: Optional[str] = None
