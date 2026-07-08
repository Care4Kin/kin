from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, CheckConstraint, func
from app.database import Base

class Account(Base):
    __tablename__ = 'accounts'
    __table_args__ = (
        CheckConstraint("category IN ('bank', 'insurance', 'healthcare', 'government', 'pharmacy', 'other')", name='accounts_category_check'),
    )

    account_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    category = Column(Text)
    notes = Column(Text)
    last_reviewed_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
