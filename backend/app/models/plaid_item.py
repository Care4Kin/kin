from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, func
from app.database import Base

class PlaidItem(Base):
    __tablename__ = 'plaid_items'

    plaid_item_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    item_id = Column(Text, unique=True, nullable=False)
    access_token = Column(Text, nullable=False)
    institution_name = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
