from sqlalchemy import Column, Integer, Text, Numeric, Boolean, TIMESTAMP, ForeignKey, func
from app.database import Base

class Subscription(Base):
    __tablename__ = 'subscriptions'

    subscription_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    monthly_cost = Column(Numeric(10,2))
    is_active = Column(Boolean, default=True)
    last_reviewed_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
