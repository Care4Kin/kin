from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, func
from app.database import Base

class FeedbackMessage(Base):
    __tablename__ = 'feedback_messages'

    message_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
