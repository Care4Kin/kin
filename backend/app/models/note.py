from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, func
from app.database import Base

class Note(Base):
    __tablename__ = 'notes'

    note_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    author_id = Column(Integer, ForeignKey('users.user_id'))
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
