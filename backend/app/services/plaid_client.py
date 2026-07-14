import certifi
import plaid
from plaid.api import plaid_api

from app.config import settings

_ENV_HOSTS = {
    'sandbox': plaid.Environment.Sandbox,
    'production': plaid.Environment.Production,
}

def get_plaid_client():
    configuration = plaid.Configuration(
        host=_ENV_HOSTS.get(settings.plaid_env, plaid.Environment.Sandbox),
        api_key={
            'clientId': settings.plaid_client_id,
            'secret': settings.plaid_secret,
        },
        ssl_ca_cert=certifi.where(),
    )
    api_client = plaid.ApiClient(configuration)
    return plaid_api.PlaidApi(api_client)

def plaid_configured() -> bool:
    return bool(settings.plaid_client_id and settings.plaid_secret)
