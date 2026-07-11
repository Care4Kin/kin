import json
import urllib.request

from app.config import settings

def send_email(to: str, subject: str, body: str):
    if not settings.resend_api_key:
        return
    payload = json.dumps({
        'from': settings.resend_from_email,
        'to': [to],
        'subject': subject,
        'text': body,
    }).encode()
    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=payload,
        headers={
            'Authorization': f'Bearer {settings.resend_api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f'send_email failed: {e}')
