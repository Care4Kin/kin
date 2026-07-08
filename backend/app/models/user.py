from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func
from app.database import Base

class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)
    phone = Column(Text)
    security_question = Column(Text)
    security_answer_hash = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
