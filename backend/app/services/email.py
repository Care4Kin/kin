import smtplib
from email.message import EmailMessage

from app.config import settings

def send_email(to: str, subject: str, body: str):
    if not settings.gmail_user or not settings.gmail_app_password:
        return
    message = EmailMessage()
    message['Subject'] = subject
    message['From'] = settings.gmail_user
    message['To'] = to
    message.set_content(body)

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(settings.gmail_user, settings.gmail_app_password)
            smtp.send_message(message)
    except Exception as e:
        print(f'send_email failed: {e}')
