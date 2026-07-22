from google import genai

from app.config import settings

def gemini_configured() -> bool:
    return bool(settings.gemini_api_key)

def generate_digest_text(prompt: str) -> str:
    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    return response.text.strip()
