from sqlalchemy import Column, Integer, Boolean, Text, TIMESTAMP, ForeignKey, CheckConstraint
from app.database import Base

class CircleMember(Base):
    __tablename__ = 'circle_members'
    __table_args__ = (
        CheckConstraint(
            "digest_frequency IN ('off', 'daily', 'weekly', 'biweekly', 'monthly')",
            name='circle_members_digest_frequency_check',
        ),
    )

    membership_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    caregiver_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    can_view_bills = Column(Boolean, default=True)
    can_view_prescriptions = Column(Boolean, default=True)
    can_view_accounts = Column(Boolean, default=True)
    can_view_flags = Column(Boolean, default=True)
    accepted_at = Column(TIMESTAMP)
    digest_frequency = Column(Text, nullable=False, server_default='weekly')
    last_digest_sent_at = Column(TIMESTAMP)