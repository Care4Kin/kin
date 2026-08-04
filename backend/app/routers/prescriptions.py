from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_permission
from app.models.prescription import Prescription
from app.models.pill_log import PillLog
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate

router = APIRouter()
require_prescriptions_access = require_permission('can_view_prescriptions')

DAY_CODES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

def _get_rx(circle_id: int, prescription_id: int, db: Session) -> Prescription:
    rx = db.query(Prescription).filter(Prescription.prescription_id == prescription_id, Prescription.circle_id == circle_id).first()
    if not rx:
        raise HTTPException(404, 'Prescription not found')
    return rx

def _week_bounds() -> tuple[date, date]:
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    return monday, monday + timedelta(days=6)

@router.get('/{circle_id}/prescriptions')
def get_prescriptions(circle_id: int, is_active: Optional[bool] = None, db: Session = Depends(get_db), circle=Depends(require_prescriptions_access)):
    query = db.query(Prescription).filter(Prescription.circle_id == circle_id)
    if is_active is not None:
        query = query.filter(Prescription.is_active == is_active)
    return query.order_by(Prescription.refill_date).all()

@router.get('/{circle_id}/prescriptions/taken-week')
def get_taken_week(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_prescriptions_access)):
    monday, sunday = _week_bounds()
    rows = db.query(PillLog.prescription_id, PillLog.taken_date).join(Prescription).filter(
        Prescription.circle_id == circle_id, PillLog.taken_date >= monday, PillLog.taken_date <= sunday
    ).all()
    return [{'prescription_id': r[0], 'taken_date': r[1]} for r in rows]

@router.get('/{circle_id}/prescriptions/streak')
def get_pill_streak(circle_id: int, db: Session = Depends(get_db), circle=Depends(require_prescriptions_access)):
    tracked = db.query(Prescription).filter(
        Prescription.circle_id == circle_id,
        Prescription.is_active.is_(True),
        Prescription.schedule_days.isnot(None),
    ).all()
    if not tracked:
        return {'current_streak': 0, 'today_complete': False, 'scheduled_today': 0, 'taken_today': 0}

    today = date.today()
    # A freshly-scheduled prescription shouldn't retroactively grant a streak
    # for days before it existed -- streaks can't reach earlier than this.
    earliest_start = min(rx.created_at.date() for rx in tracked)
    lookback_start = max(earliest_start, today - timedelta(days=365))

    rx_ids = [rx.prescription_id for rx in tracked]
    logs = db.query(PillLog.prescription_id, PillLog.taken_date).filter(
        PillLog.prescription_id.in_(rx_ids), PillLog.taken_date >= lookback_start, PillLog.taken_date <= today,
    ).all()
    taken = {(r[0], r[1]) for r in logs}

    def scheduled_on(day: date) -> list[int]:
        code = DAY_CODES[day.weekday()]
        return [rx.prescription_id for rx in tracked if code in (rx.schedule_days or '').split(',')]

    def is_complete(day: date) -> bool:
        if day < earliest_start:
            return False
        ids = scheduled_on(day)
        # Nothing scheduled that day -- vacuously fine, doesn't break the streak.
        return all((rx_id, day) in taken for rx_id in ids)

    scheduled_today_ids = scheduled_on(today)
    taken_today = sum(1 for rx_id in scheduled_today_ids if (rx_id, today) in taken)

    streak = 0
    day = today
    if is_complete(today):
        streak += 1
    day -= timedelta(days=1)
    while day >= lookback_start and is_complete(day):
        streak += 1
        day -= timedelta(days=1)

    return {
        'current_streak': streak,
        'today_complete': is_complete(today),
        'scheduled_today': len(scheduled_today_ids),
        'taken_today': taken_today,
    }

@router.post('/{circle_id}/prescriptions', status_code=201)
def create_prescription(circle_id: int, body: PrescriptionCreate, db: Session = Depends(get_db), circle=Depends(require_prescriptions_access)):
    rx = Prescription(circle_id=circle_id, **body.model_dump())
    db.add(rx)
    db.commit()
    db.refresh(rx)
    return rx

@router.patch('/{circle_id}/prescriptions/{prescription_id}')
def update_prescription(circle_id: int, prescription_id: int, body: PrescriptionUpdate, db: Session = Depends(get_db), circle=Depends(require_prescriptions_access)):
    rx = _get_rx(circle_id, prescription_id, db)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(rx, k, v)
    db.commit()
    db.refresh(rx)
    return rx

@router.delete('/{circle_id}/prescriptions/{prescription_id}')
def delete_prescription(circle_id: int, prescription_id: int, db: Session = Depends(get_db), circle=Depends(require_prescriptions_access)):
    rx = _get_rx(circle_id, prescription_id, db)
    db.delete(rx)
    db.commit()
    return {'message': 'Prescription deleted'}

@router.post('/{circle_id}/prescriptions/{prescription_id}/taken', status_code=201)
def mark_taken(circle_id: int, prescription_id: int, taken_date: Optional[date] = None, db: Session = Depends(get_db), circle=Depends(require_prescriptions_access)):
    _get_rx(circle_id, prescription_id, db)
    target = taken_date or date.today()
    monday, sunday = _week_bounds()
    if not (monday - timedelta(days=1) <= target <= sunday + timedelta(days=1)):
        raise HTTPException(400, 'Date must be within the current week')
    existing = db.query(PillLog).filter(PillLog.prescription_id == prescription_id, PillLog.taken_date == target).first()
    if not existing:
        db.add(PillLog(prescription_id=prescription_id, taken_date=target))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
    return {'message': 'Marked as taken'}

@router.delete('/{circle_id}/prescriptions/{prescription_id}/taken')
def unmark_taken(circle_id: int, prescription_id: int, taken_date: Optional[date] = None, db: Session = Depends(get_db), circle=Depends(require_prescriptions_access)):
    _get_rx(circle_id, prescription_id, db)
    target = taken_date or date.today()
    monday, sunday = _week_bounds()
    if not (monday - timedelta(days=1) <= target <= sunday + timedelta(days=1)):
        raise HTTPException(400, 'Date must be within the current week')
    db.query(PillLog).filter(PillLog.prescription_id == prescription_id, PillLog.taken_date == target).delete()
    db.commit()
    return {'message': 'Unmarked'}
