from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, func
from app.database import Base

class FamilyCircle(Base):
    __tablename__ = 'family_circles'

    circle_id = Column(Integer, primary_key=True, index=True)
    elder_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
