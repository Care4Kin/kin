from twilio.rest import Client
from app.config import settings

def twilio_configured() -> bool:
    return bool(settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_phone_number)

def send_sms(to: str, body: str):
    if not twilio_configured():
        return
    try:
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(
            body=body,
            from_=settings.twilio_phone_number,
            to=to,
        )
    except Exception as e:
        print(f'send_sms failed: {e}')
