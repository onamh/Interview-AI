import json
import re

from google import genai
from google.genai.errors import ClientError, ServerError

from app.config import GEMINI_API_KEY, GEMINI_MODEL

from app.utils.prompts import (
    interview_start_prompt,
    interview_evaluation_prompt,
)

client = genai.Client(api_key=GEMINI_API_KEY)


# =====================================================
# Internal Helper
# =====================================================

def _generate(prompt: str) -> str:
    """
    Wrapper around Gemini API.
    """

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        return response.text.strip()

    except ServerError:
        raise Exception(
            "Gemini servers are currently busy. Please try again."
        )

    except ClientError as e:
        raise Exception(str(e))

    except Exception as e:
        raise Exception(f"Gemini Error: {e}")


# =====================================================
# Generate Complete Interview
# =====================================================

def generate_complete_interview(
    role,
    language,
    experience,
    difficulty,
    interview_type,
    total_questions,
    resume_analysis=None,
):
    """
    Generates the complete interview in one Gemini call.
    """

    prompt = interview_start_prompt(
        role=role,
        language=language,
        experience=experience,
        difficulty=difficulty,
        interview_type=interview_type,
        total_questions=total_questions,
        resume_analysis=resume_analysis,
    )

    text = _generate(prompt)

    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text).strip()

    try:
        data = json.loads(text)

    except Exception:
        raise Exception(
            "Gemini returned invalid JSON."
        )

    # Validation

    if "roadmap" not in data:
        raise Exception("Roadmap missing.")

    if "questions" not in data:
        raise Exception("Questions missing.")

    if not isinstance(data["roadmap"], list):
        raise Exception("Roadmap must be a list.")

    if not isinstance(data["questions"], list):
        raise Exception("Questions must be a list.")

    if len(data["roadmap"]) != total_questions:
        raise Exception(
            f"Expected {total_questions} roadmap topics but received {len(data['roadmap'])}."
        )

    if len(data["questions"]) != total_questions:
        raise Exception(
            f"Expected {total_questions} questions but received {len(data['questions'])}."
        )

    return data


# =====================================================
# Final Evaluation
# =====================================================

def evaluate_interview(
    role,
    language,
    experience,
    difficulty,
    interview_type,
    questions,
    answers,
    resume_analysis=None,
):
    """
    Evaluate the completed interview.
    """

    prompt = interview_evaluation_prompt(
        role=role,
        language=language,
        experience=experience,
        difficulty=difficulty,
        interview_type=interview_type,
        resume_analysis=resume_analysis,
        questions=questions,
        answers=answers,
    )

    text = _generate(prompt)

    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text).strip()

    try:
        data = json.loads(text)

    except Exception:
        raise Exception(
            "Gemini returned invalid evaluation JSON."
        )

    return data