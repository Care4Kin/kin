from datetime import datetime
from pydantic import BaseModel

class FeedbackMessageCreate(BaseModel):
    content: str

class FeedbackMessageOut(BaseModel):
    message_id: int
    content: str
    created_at: datetime
