from typing import Literal

from google import genai
from google.genai import types
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.models.bill import Bill
from app.models.subscription import Subscription
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.account import Account

def gemini_configured() -> bool:
    return bool(settings.gemini_api_key)

def generate_digest_text(prompt: str) -> str:
    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.generate_content(
        # A version-less alias -- Google points it at whatever their current
        # recommended flash-tier model is, so this doesn't go stale the way a
        # pinned snapshot (e.g. gemini-2.5-flash) can for newer API keys.
        model='gemini-flash-latest',
        contents=prompt,
    )
    return response.text.strip()

KIN_SYSTEM_INSTRUCTION = (
    "You are Ask Kin, a friendly assistant inside the Kin family app. Answer "
    "questions about the user's bills, subscriptions, appointments, "
    "prescriptions, and accounts using only the provided tools -- never guess "
    "or invent numbers or dates. If a question needs a tool that isn't "
    "available to you, say plainly that the elder hasn't shared that "
    "information with you rather than trying to answer anyway. Keep answers "
    "short (1-3 sentences), warm, and in plain language with no markdown."
)

def answer_kin_question(
    circle_id: int,
    permissions: dict,
    is_elder: bool,
    question: str,
    history: list[dict],
    db: Session,
) -> str:
    def get_bills() -> list[dict]:
        """Get the family's bills, including name, amount, due date, and whether each is paid."""
        rows = db.query(Bill).filter(Bill.circle_id == circle_id).all()
        return [{'name': b.name, 'amount': float(b.amount), 'due_date': str(b.due_date), 'is_paid': b.is_paid} for b in rows]

    def get_subscriptions() -> list[dict]:
        """Get the family's subscriptions, including name, monthly cost, and whether each is active."""
        rows = db.query(Subscription).filter(Subscription.circle_id == circle_id).all()
        return [{'name': s.name, 'monthly_cost': float(s.monthly_cost), 'is_active': s.is_active} for s in rows]

    def get_appointments() -> list[dict]:
        """Get the family's upcoming and past appointments, including title, date, time, and location."""
        rows = db.query(Appointment).filter(Appointment.circle_id == circle_id).all()
        return [{'title': a.title, 'date': str(a.date), 'time': str(a.time) if a.time else None, 'location': a.location, 'notes': a.notes} for a in rows]

    def get_prescriptions() -> list[dict]:
        """Get the family's prescriptions, including medication name, dosage, refill date, and pharmacy."""
        rows = db.query(Prescription).filter(Prescription.circle_id == circle_id).all()
        return [{'medication_name': p.medication_name, 'dosage': p.dosage, 'refill_date': str(p.refill_date) if p.refill_date else None, 'pharmacy_name': p.pharmacy_name, 'is_active': p.is_active} for p in rows]

    def get_accounts() -> list[dict]:
        """Get the family's important accounts (bank, insurance, healthcare, government, pharmacy, other), including name and category."""
        rows = db.query(Account).filter(Account.circle_id == circle_id).all()
        return [{'name': a.name, 'category': a.category} for a in rows]

    tools = [get_subscriptions, get_appointments]
    if is_elder or permissions.get('can_view_bills'):
        tools.append(get_bills)
    if is_elder or permissions.get('can_view_prescriptions'):
        tools.append(get_prescriptions)
    if is_elder or permissions.get('can_view_accounts'):
        tools.append(get_accounts)

    contents = [
        types.Content(role=h['role'], parts=[types.Part(text=h['content'])])
        for h in history[-12:]
    ]
    contents.append(types.Content(role='user', parts=[types.Part(text=question)]))

    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.generate_content(
        model='gemini-flash-latest',
        contents=contents,
        config=types.GenerateContentConfig(
            tools=tools,
            system_instruction=KIN_SYSTEM_INSTRUCTION,
        ),
    )
    return response.text.strip()

class FlagRiskAssessment(BaseModel):
    risk_level: Literal['low', 'medium', 'high']
    explanation: str
    suggested_action: str

def assess_flag_risk(flag_type: str, description: str) -> FlagRiskAssessment:
    prompt = (
        f"A family member reported this as a {flag_type}: \"{description}\". "
        "Assess how closely this matches a common scam pattern (for example a "
        "grandparent scam, tech support scam, gift card scam, or phishing "
        "attempt) in plain language a non-technical elder or caregiver can "
        "understand. If it doesn't look scam-related, say so plainly and rate "
        "it low. Give a short suggested next step."
    )
    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.generate_content(
        model='gemini-flash-latest',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type='application/json',
            response_schema=FlagRiskAssessment,
        ),
    )
    return response.parsed
