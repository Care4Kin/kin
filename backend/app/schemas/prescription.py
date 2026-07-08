from datetime import date
from typing import Optional
from pydantic import BaseModel

class PrescriptionCreate(BaseModel):
    medication_name: str
    dosage: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    pharmacy_name: Optional[str] = None
    refill_date: Optional[date] = None
    notes: Optional[str] = None

class PrescriptionUpdate(BaseModel):
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    pharmacy_name: Optional[str] = None
    refill_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
