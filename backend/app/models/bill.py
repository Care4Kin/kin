from sqlalchemy import Column, Integer, Text, Numeric, Date, Boolean, TIMESTAMP, ForeignKey, func
from app.database import Base

class Bill(Base):
    __tablename__ = 'bills'


    bill_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    is_paid = Column(Boolean, default=False)
    category = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())