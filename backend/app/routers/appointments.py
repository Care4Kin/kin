from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_circle_access
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

router = APIRouter()

@router.get('/{circle_id}/appointments')
def get_appointments(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    return db.query(Appointment).filter(Appointment.circle_id == circle_id).order_by(Appointment.date, Appointment.time).all()

@router.post('/{circle_id}/appointments', status_code=201)
def create_appointment(circle_id: int, body: AppointmentCreate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    appointment = Appointment(circle_id=circle_id, **body.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.patch('/{circle_id}/appointments/{appointment_id}')
def update_appointment(circle_id: int, appointment_id: int, body: AppointmentUpdate, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id, Appointment.circle_id == circle_id
    ).first()
    if not appointment:
        raise HTTPException(404, 'Appointment not found')
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(appointment, k, v)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete('/{circle_id}/appointments/{appointment_id}')
def delete_appointment(circle_id: int, appointment_id: int, db: Session = Depends(get_db), circle=Depends(require_circle_access)):
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id, Appointment.circle_id == circle_id
    ).first()
    if not appointment:
        raise HTTPException(404, 'Appointment not found')
    db.delete(appointment)
    db.commit()
    return {'message': 'Appointment deleted'}
