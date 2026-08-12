from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, UniqueConstraint, func
from app.database import Base

class TrustedDevice(Base):
    __tablename__ = 'trusted_devices'
    __table_args__ = (UniqueConstraint('user_id', 'device_id', name='uq_trusted_device_user_device'),)

    trusted_device_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    device_id = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
