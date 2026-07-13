from sqlalchemy import Column, Integer, Text, Boolean, TIMESTAMP, ForeignKey, func
from app.database import Base

class CircleInvitation(Base):
    __tablename__ = 'circle_invitations'

    invitation_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    email = Column(Text, nullable=False)
    can_view_bills = Column(Boolean, default=True)
    can_view_prescriptions = Column(Boolean, default=True)
    can_view_accounts = Column(Boolean, default=True)
    can_view_flags = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    accepted_at = Column(TIMESTAMP)
