from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = 'HS256'
    access_token_expire_minutes: int = 60 * 24 * 7
    twilio_account_sid: str = ''
    twilio_auth_token: str = ''
    twilio_phone_number: str = ''
    resend_api_key: str = ''
    resend_from_email: str = 'Kin <invites@ishtiaqakanda.dev>'
    frontend_url: str = 'http://localhost:5173'
    google_client_id: str = ''

    class Config:
        env_file = '.env'

settings = Settings()
