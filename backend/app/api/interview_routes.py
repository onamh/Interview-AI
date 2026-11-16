from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, Interview
from app.utils.auth import get_optional_user, get_current_user
from app.services.interview import (
    create_interview_session,
    save_answer,
    next_question,
    evaluate_session,
    get_session,
)

router = APIRouter(tags=["Interview Lifecycle"])


class InterviewRequest(BaseModel):
    role: str
    language: str
    experience: str
    difficulty: str
    interview_type: str
    questions: int
    follow_up: bool = True
    job_description: Optional[str] = None
    resume_analysis: Optional[dict] = None
    resume_id: Optional[str] = None


class AnswerRequest(BaseModel):
    session_id: Optional[str] = None
    answer: str


class EvaluationRequest(BaseModel):
    session_id: str


@router.post("/interviews/start")
@router.post("/interview/start")
def start_interview(
    data: InterviewRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    return create_interview_session(data, user_id=user_id, db=db)


@router.get("/interviews/{interview_id}")
def get_interview(
    interview_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    session = get_session(interview_id, db=db)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.post("/interviews/{interview_id}/answer")
@router.post("/interview/next")
def submit_answer_and_advance(
    data: AnswerRequest,
    interview_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_id = interview_id or data.session_id
    if not target_id:
        raise HTTPException(status_code=400, detail="session_id or interview_id is required")

    session = save_answer(target_id, data.answer, db=db)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")

    return next_question(target_id, db=db)


@router.post("/interviews/{interview_id}/complete")
@router.post("/interview/evaluate")
def complete_interview(
    interview_id: Optional[str] = None,
    data: Optional[EvaluationRequest] = None,
    db: Session = Depends(get_db)
):
    target_id = interview_id or (data.session_id if data else None)
    if not target_id:
        raise HTTPException(status_code=400, detail="Interview session ID is required")

    evaluation = evaluate_session(target_id, db=db)
    if evaluation is None:
        raise HTTPException(status_code=404, detail="Interview session not found")

    return evaluation


@router.get("/interviews/{interview_id}/evaluation")
def get_interview_evaluation(
    interview_id: str,
    db: Session = Depends(get_db)
):
    record = db.query(Interview).filter(Interview.id == interview_id).first()
    if not record or not record.evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found for this interview")

    return record.evaluation.to_dict()
