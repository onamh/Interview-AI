from google import genai

from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.utils.prompts import interview_question_prompt

client = genai.Client(api_key=GEMINI_API_KEY)


def generate_question(
    role,
    language,
    experience,
    difficulty,
    interview_type,
):
    prompt = interview_question_prompt(
        role,
        language,
        experience,
        difficulty,
        interview_type,
    )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    return response.text.strip()