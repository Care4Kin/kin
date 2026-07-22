from google import genai

from app.config import settings

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
