import json
import re

from google import genai
from google.genai.errors import ClientError, ServerError

from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.utils.prompts import interview_start_prompt

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
):
    """
    Generates the entire interview in ONE Gemini API call.
    """

    prompt = interview_start_prompt(
        role=role,
        language=language,
        experience=experience,
        difficulty=difficulty,
        interview_type=interview_type,
        total_questions=total_questions,
    )

    text = _generate(prompt)

    # Remove markdown if Gemini adds it
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text).strip()

    try:
        data = json.loads(text)

    except Exception:
        raise Exception(
            "Gemini returned invalid JSON."
        )

    # -----------------------------
    # Validation
    # -----------------------------

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
# Final Interview Evaluation
# =====================================================

def evaluate_interview(
    role,
    language,
    experience,
    difficulty,
    interview_type,
    questions,
    answers,
):
    """
    Evaluate the complete interview after the candidate
    finishes every question.
    """

    interview_history = ""

    for i, (question, answer) in enumerate(
        zip(questions, answers),
        start=1,
    ):
        interview_history += f"""
Question {i}
{question}

Candidate Answer
{answer}

"""

    prompt = f"""
You are a senior technical interviewer.

Evaluate the completed interview.

Candidate

Role: {role}
Technology: {language}
Experience: {experience}
Difficulty: {difficulty}
Interview Type: {interview_type}

Interview Transcript

{interview_history}

Return ONLY valid JSON.

Format

{{
    "overall_score": 85,
    "technical_score": 82,
    "communication_score": 90,

    "strengths": [
        "...",
        "..."
    ],

    "weaknesses": [
        "...",
        "..."
    ],

    "suggestions": [
        "...",
        "..."
    ],

    "overall_feedback": "..."
}}

Rules

1. Scores must be between 0 and 100.

2. Evaluate based on all answers together.

3. Do NOT evaluate each question separately.

4. Mention strengths.

5. Mention weaknesses.

6. Give practical improvement suggestions.

7. Overall feedback should be 4-6 sentences.

8. Return ONLY JSON.

9. No markdown.

10. No explanation.

11. No code block.
"""

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