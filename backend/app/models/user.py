from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, func
from app.database import Base

class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)
    theme = Column(String(30), nullable=False, default='sage-cream')
    phone = Column(Text)
    security_question = Column(Text)
    security_answer_hash = Column(Text)
    phone_verified = Column(Boolean, nullable=False, server_default='false')
    phone_verification_code_hash = Column(Text)
    phone_verification_expires_at = Column(TIMESTAMP(timezone=True))
    google_sub = Column(Text, unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
