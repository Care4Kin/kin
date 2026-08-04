from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, UniqueConstraint, func
from app.database import Base

class PlaidDismissedSuggestion(Base):
    __tablename__ = 'plaid_dismissed_suggestions'
    __table_args__ = (UniqueConstraint('circle_id', 'source_key', name='uq_plaid_dismissed_suggestion_circle_source'),)

    dismissed_suggestion_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    source_key = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
