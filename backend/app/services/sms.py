from twilio.rest import Client
from app.config import settings

def send_sms(to: str, body: str):
    if not settings.twilio_account_sid:
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
