from sqlalchemy import Column, Integer, Text, Date, Boolean, TIMESTAMP, ForeignKey, func
from app.database import Base

class Prescription(Base):
    __tablename__ = 'prescriptions'

    prescription_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    medication_name = Column(Text, nullable=False)
    dosage = Column(Text)
    prescribing_doctor = Column(Text)
    pharmacy_name = Column(Text)
    pharmacy_phone = Column(Text)
    schedule_days = Column(Text)  # comma-separated day codes: mon,tue,wed,thu,fri,sat,sun; null = not tracked on the weekly board
    refill_date = Column(Date)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
