import json
from typing import Literal

from groq import Groq, BadRequestError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.models.bill import Bill
from app.models.subscription import Subscription
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.account import Account

MODEL = 'llama-3.3-70b-versatile'

def groq_configured() -> bool:
    return bool(settings.groq_api_key)

def generate_digest_text(prompt: str) -> str:
    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{'role': 'user', 'content': prompt}],
    )
    return response.choices[0].message.content.strip()

KIN_SYSTEM_INSTRUCTION = (
    "You are Ask Kin, a friendly assistant inside the Kin family app. Answer "
    "questions about the user's bills, subscriptions, appointments, "
    "prescriptions, and accounts using only the provided tools -- never guess "
    "or invent numbers or dates. If a question needs a tool that isn't "
    "available to you, say plainly that the elder hasn't shared that "
    "information with you rather than trying to answer anyway. Keep answers "
    "short (1-3 sentences), warm, and in plain language with no markdown."
)

# llama-3.3-70b-versatile occasionally emits a malformed tool call (e.g. a raw
# `<function=...>` tag) instead of a real JSON tool_call, which Groq rejects
# with a 400 tool_use_failed -- retrying the same request works almost every
# time since the failure isn't tied to the input, just sampling noise.
def _complete_with_tool_retry(client, **kwargs):
    for attempt in range(5):
        try:
            return client.chat.completions.create(**kwargs)
        except BadRequestError as e:
            body = e.body if isinstance(e.body, dict) else {}
            if body.get('error', {}).get('code') != 'tool_use_failed' or attempt == 4:
                raise

def _tool_schema(func) -> dict:
    return {
        'type': 'function',
        'function': {
            'name': func.__name__,
            'description': (func.__doc__ or '').strip(),
            'parameters': {'type': 'object', 'properties': {}, 'required': []},
        },
    }

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

    tools_by_name = {t.__name__: t for t in tools}
    tool_schemas = [_tool_schema(t) for t in tools]

    messages = [{'role': 'system', 'content': KIN_SYSTEM_INSTRUCTION}]
    for h in history[-12:]:
        role = 'assistant' if h['role'] == 'model' else h['role']
        messages.append({'role': role, 'content': h['content']})
    messages.append({'role': 'user', 'content': question})

    client = Groq(api_key=settings.groq_api_key)
    for _ in range(5):
        response = _complete_with_tool_retry(
            client,
            model=MODEL,
            messages=messages,
            tools=tool_schemas,
        )
        message = response.choices[0].message
        if not message.tool_calls:
            return message.content.strip()

        messages.append({
            'role': 'assistant',
            'content': message.content or '',
            'tool_calls': [tc.model_dump() for tc in message.tool_calls],
        })
        for tc in message.tool_calls:
            func = tools_by_name[tc.function.name]
            messages.append({
                'role': 'tool',
                'tool_call_id': tc.id,
                'content': json.dumps(func()),
            })

    return "Sorry, I'm having trouble answering that right now."

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
        "it low. Give a short suggested next step.\n\n"
        "Respond with ONLY a JSON object matching this exact shape, no other text: "
        '{"risk_level": "low" | "medium" | "high", "explanation": string, "suggested_action": string}'
    )
    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{'role': 'user', 'content': prompt}],
        response_format={'type': 'json_object'},
    )
    return FlagRiskAssessment.model_validate_json(response.choices[0].message.content)
