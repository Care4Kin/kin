from sqlalchemy import Column, Integer, Text, Boolean, TIMESTAMP, ForeignKey, CheckConstraint, func
from app.database import Base

class Flag(Base):
    __tablename__ = 'flags'
    __table_args__ = (
        CheckConstraint("type IN ('call', 'email', 'text', 'bill', 'other')", name='flags_type_check'),
        CheckConstraint("severity IN ('low', 'high')", name='flags_severity_check'),
    )

    flag_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    created_by = Column(Integer, ForeignKey('users.user_id'))
    type = Column(Text)
    description = Column(Text, nullable=False)
    severity = Column(Text, default='low')
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
