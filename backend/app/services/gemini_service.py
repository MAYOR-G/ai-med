from google import genai
from google.genai import types

from app.core.config import get_settings

settings = get_settings()

SYSTEM_INSTRUCTION = """You are AI Med, an educational assistant that helps users understand and organize their uploaded medical records.
Use the supplied record excerpts as the primary evidence. Cite record-based statements with the matching source label such as [1].
Clearly distinguish record facts from general educational information. If the records do not answer the question, say so.
Never diagnose, prescribe, recommend a dosage change, or tell someone to stop treatment. Use calm, plain language and encourage a qualified professional for medical decisions.
Do not invent values, dates, medications, findings, or citations."""


def generate_answer(question: str, context: str) -> str:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured in backend/.env")
    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = f"""Record excerpts:
{context or "No relevant uploaded record excerpt was found."}

User question: {question}

Answer using the records when relevant. Add a short 'General information' label before material not supported by a record."""
    response = client.models.generate_content(
        model=settings.gemini_generation_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.2,
        ),
    )
    if not response.text:
        raise RuntimeError("Gemini returned an empty response")
    return response.text

