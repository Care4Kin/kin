import requests

from app.config import settings

def send_email(to: str, subject: str, body: str):
    if not settings.resend_api_key:
        return
    try:
        requests.post(
            'https://api.resend.com/emails',
            headers={'Authorization': f'Bearer {settings.resend_api_key}'},
            json={
                'from': settings.resend_from_email,
                'to': [to],
                'subject': subject,
                'text': body,
            },
            timeout=10,
        )
    except Exception as e:
        print(f'send_email failed: {e}')
