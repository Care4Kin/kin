from datetime import date as Date, time as Time
from typing import Optional
from pydantic import BaseModel, field_validator

def _date_not_in_past(v):
    if v is not None and v < Date.today():
        raise ValueError('Appointment date cannot be in the past')
    return v

class AppointmentCreate(BaseModel):
    title: str
    date: Date
    time: Time
    location: str
    notes: Optional[str] = None

    _validate_date = field_validator('date')(_date_not_in_past)

class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[Date] = None
    time: Optional[Time] = None
    location: Optional[str] = None
    notes: Optional[str] = None

    _validate_date = field_validator('date')(_date_not_in_past)
