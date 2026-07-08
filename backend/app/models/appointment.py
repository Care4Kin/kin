from sqlalchemy import Column, Integer, Text, Date, Time, TIMESTAMP, ForeignKey, func
from app.database import Base

class Appointment(Base):
    __tablename__ = 'appointments'

    appointment_id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False)
    title = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    time = Column(Time)
    location = Column(Text)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
