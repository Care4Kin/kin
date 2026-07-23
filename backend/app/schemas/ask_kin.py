from pydantic import BaseModel

class AskKinMessage(BaseModel):
    role: str
    content: str

class AskKinRequest(BaseModel):
    message: str
    history: list[AskKinMessage] = []
