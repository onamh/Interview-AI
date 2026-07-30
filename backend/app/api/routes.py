from typing import Optional

from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

from app.services.resume import process_resume

from app.services.interview import (
    create_interview_session,
    save_answer,
    next_question,
    evaluate_session,
)

router = APIRouter()


# ==================================================
# Request Models
# ==================================================

class InterviewRequest(BaseModel):
    role: str
    language: str
    experience: str
    difficulty: str
    interview_type: str
    questions: int
    follow_up: bool

    # Optional resume analysis
    resume_analysis: Optional[dict] = None


class AnswerRequest(BaseModel):
    session_id: str
    answer: str


class EvaluationRequest(BaseModel):
    session_id: str


# ==================================================
# Interview Start
# ==================================================

@router.post("/interview/start")
def start_interview(data: InterviewRequest):
    return create_interview_session(data)


# ==================================================
# Next Question
# ==================================================

@router.post("/interview/next")
def interview_next(data: AnswerRequest):

    session = save_answer(
        data.session_id,
        data.answer,
    )

    if session is None:
        return {
            "error": "Session not found"
        }

    return next_question(data.session_id)


# ==================================================
# Final Evaluation
# ==================================================

@router.post("/interview/evaluate")
def interview_evaluate(data: EvaluationRequest):

    evaluation = evaluate_session(data.session_id)

    if evaluation is None:
        return {
            "error": "Session not found"
        }

    return evaluation


# ==================================================
# Resume Upload
# ==================================================

@router.post("/resume/upload")
def upload_resume(file: UploadFile = File(...)):
    """
    Upload a resume, extract its text,
    analyze it with Gemini,
    and return the structured analysis.
    """

    analysis = process_resume(file.file)

    return analysis