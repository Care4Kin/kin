import json
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.circle import FamilyCircle
from app.models.circle_member import CircleMember
from app.models.user import User
from app.models.bill import Bill
from app.models.subscription import Subscription
from app.models.prescription import Prescription
from app.models.flag import Flag
from app.models.account import Account
from app.models.appointment import Appointment
from app.services.gemini_client import generate_digest_text, gemini_configured
from app.services.email import send_email
from app.utils import utcnow, as_aware

LOOKBACK_DAYS = 7
RX_URGENT_DAYS = 10

def _gather_circle_data(circle_id: int, permissions: dict, db: Session) -> dict:
    since = utcnow() - timedelta(days=LOOKBACK_DAYS)
    today = date.today()
    data = {}

    if permissions['can_view_bills']:
        bills = db.query(Bill).filter(Bill.circle_id == circle_id).all()
        unpaid = [b for b in bills if not b.is_paid]
        overdue = [b for b in unpaid if b.due_date < today]
        due_soon = [b for b in unpaid if 0 <= (b.due_date - today).days <= 7]
        new = [b for b in bills if as_aware(b.created_at) >= since]
        data['bills'] = {
            'unpaid_count': len(unpaid),
            'unpaid_total': float(sum((b.amount for b in unpaid), Decimal('0'))),
            'overdue': [{'name': b.name, 'amount': float(b.amount), 'due_date': str(b.due_date)} for b in overdue],
            'due_within_7_days': [{'name': b.name, 'amount': float(b.amount), 'due_date': str(b.due_date)} for b in due_soon],
            'added_this_week': [b.name for b in new],
        }

    if permissions['can_view_flags']:
        flags = db.query(Flag).filter(Flag.circle_id == circle_id).all()
        open_flags = [f for f in flags if not f.is_resolved]
        new_flags = [f for f in flags if as_aware(f.created_at) >= since]
        data['suspicious_activity'] = {
            'open_count': len(open_flags),
            'new_this_week': [{'type': f.type, 'description': f.description, 'severity': f.severity} for f in new_flags],
        }

    if permissions['can_view_prescriptions']:
        rxs = db.query(Prescription).filter(Prescription.circle_id == circle_id, Prescription.is_active.is_(True)).all()
        refill_due_soon = [r for r in rxs if r.refill_date and (r.refill_date - today).days <= RX_URGENT_DAYS]
        data['prescriptions'] = {
            'active_count': len(rxs),
            'refill_due_soon': [{'name': r.medication_name, 'refill_date': str(r.refill_date)} for r in refill_due_soon],
        }

    if permissions['can_view_accounts']:
        accounts = db.query(Account).filter(Account.circle_id == circle_id).all()
        new_accounts = [a for a in accounts if as_aware(a.created_at) >= since]
        data['accounts'] = {
            'total_count': len(accounts),
            'added_this_week': [a.name for a in new_accounts],
        }

    # Subscriptions, appointments, and notes are shared with every circle
    # member by design (no per-caregiver permission gate), same as the rest
    # of the app.
    subs = db.query(Subscription).filter(Subscription.circle_id == circle_id, Subscription.is_active.is_(True)).all()
    new_subs = [s for s in subs if as_aware(s.created_at) >= since]
    data['subscriptions'] = {
        'active_count': len(subs),
        'monthly_total': float(sum((s.monthly_cost for s in subs), Decimal('0'))),
        'added_this_week': [s.name for s in new_subs],
    }

    upcoming = db.query(Appointment).filter(
        Appointment.circle_id == circle_id, Appointment.date >= today
    ).order_by(Appointment.date).all()
    data['appointments'] = {
        'upcoming_count': len(upcoming),
        'next': {'title': upcoming[0].title, 'date': str(upcoming[0].date)} if upcoming else None,
    }

    data['as_of_date'] = str(today)
    return data

def _build_prompt(elder_name: str, data: dict) -> str:
    return (
        f"Write a short weekly email update for a family caregiver helping {elder_name}. "
        "Use only the JSON data below -- do not invent details. The 'as_of_date' field is "
        "today's date, for judging what counts as overdue, due soon, or upcoming. "
        "Only mention a topic if its data is present. Keep it to 120-180 words, plain prose "
        "(no markdown headers or bullet lists), warm but factual, and lead with anything that "
        "needs attention (overdue/urgent items) before routine status. "
        f"Sign off is handled separately, so end right after the summary.\n\n"
        f"Data: {json.dumps(data, default=str)}"
    )

def _render_digest_email(elder_name: str, summary_text: str) -> str:
    return (
        f"Hi,\n\n"
        f"Here's this week's Kin update for {elder_name}:\n\n"
        f"{summary_text}\n\n"
        f"Log in to Kin for the full picture.\n\n"
        f"— The Kin Team"
    )

def generate_and_send_digests(db: Session) -> dict:
    """Send one AI-generated weekly digest email per accepted caregiver,
    scoped to only the sections that caregiver's permissions allow them to
    see. Returns counts for the caller to report back."""
    if not gemini_configured():
        return {'sent': 0, 'skipped': 0, 'reason': 'Gemini API key not configured'}

    sent = 0
    skipped = 0
    circles = db.query(FamilyCircle).all()
    for circle in circles:
        elder = db.query(User).filter(User.user_id == circle.elder_id).first()
        if not elder:
            continue
        # accepted_at is only ever set for members who joined via a claimed
        # invitation -- it stays NULL for existing users added directly, and
        # isn't used as an access gate anywhere else in the app either.
        members = db.query(CircleMember).filter(CircleMember.circle_id == circle.circle_id).all()
        for member in members:
            caregiver = db.query(User).filter(User.user_id == member.caregiver_id).first()
            if not caregiver:
                continue
            permissions = {
                'can_view_bills': member.can_view_bills,
                'can_view_flags': member.can_view_flags,
                'can_view_prescriptions': member.can_view_prescriptions,
                'can_view_accounts': member.can_view_accounts,
            }
            data = _gather_circle_data(circle.circle_id, permissions, db)
            prompt = _build_prompt(elder.full_name, data)
            try:
                summary_text = generate_digest_text(prompt)
            except Exception as e:
                print(f'digest generation failed for circle {circle.circle_id}, caregiver {caregiver.user_id}: {e}')
                skipped += 1
                continue

            send_email(
                to=caregiver.email,
                subject=f'Your weekly Kin update for {elder.full_name}',
                body=_render_digest_email(elder.full_name, summary_text),
            )
            sent += 1

    return {'sent': sent, 'skipped': skipped}
