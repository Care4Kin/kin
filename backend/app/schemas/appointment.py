from datetime import date as Date, time as Time
from typing import Optional
from pydantic import BaseModel, field_validator

class AppointmentCreate(BaseModel):
    title: str
    date: Date
    time: Time
    location: str
    notes: Optional[str] = None

    @field_validator('date')
    @classmethod
    def date_not_in_past(cls, v):
        if v < Date.today():
            raise ValueError('Appointment date cannot be in the past')
        return v

class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[Date] = None
    time: Optional[Time] = None
    location: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('date')
    @classmethod
    def date_not_in_past(cls, v):
        if v is not None and v < Date.today():
            raise ValueError('Appointment date cannot be in the past')
        return v
