from sqlalchemy import Column, Integer, Date, TIMESTAMP, ForeignKey, UniqueConstraint, func
from app.database import Base

class PillLog(Base):
    __tablename__ = 'pill_logs'
    __table_args__ = (UniqueConstraint('prescription_id', 'taken_date', name='uq_pill_logs_prescription_date'),)

    log_id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey('prescriptions.prescription_id', ondelete='CASCADE'), nullable=False)
    taken_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
