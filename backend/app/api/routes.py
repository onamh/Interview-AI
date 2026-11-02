from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, Interview
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
)
from app.services.resume import process_resume
from app.services.interview import (
    create_interview_session,
    save_answer,
    next_question,
    evaluate_session,
    get_user_interviews,
    get_user_stats,
    get_session,
)

router = APIRouter()


# ==================================================
# Pydantic Request Models
# ==================================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class InterviewRequest(BaseModel):
    role: str
    language: str
    experience: str
    difficulty: str
    interview_type: str
    questions: int
    follow_up: bool = True
    resume_analysis: Optional[dict] = None


class AnswerRequest(BaseModel):
    session_id: str
    answer: str


class EvaluationRequest(BaseModel):
    session_id: str


# ==================================================
# Authentication Endpoints
# ==================================================

@router.post("/auth/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = data.email.strip().lower()
    clean_name = data.name.strip()

    if not clean_name:
        raise HTTPException(status_code=400, detail="Name is required")
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    hashed = hash_password(data.password)
    user = User(
        name=clean_name,
        email=clean_email,
        password_hash=hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "name": user.name})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }


@router.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    clean_email = data.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": user.id, "email": user.email, "name": user.name})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }


@router.post("/auth/demo-login")
def demo_login(db: Session = Depends(get_db)):
    """One-click instant login for viva, presentation, and quick teacher demo."""
    demo_email = "candidate@interviewcoach.edu"
    user = db.query(User).filter(User.email == demo_email).first()

    if not user:
        user = User(
            name="Aarav Sharma (Demo Candidate)",
            email=demo_email,
            password_hash=hash_password("DemoPassword123"),
            role="Candidate"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "name": user.name})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }


@router.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user": current_user.to_dict()
    }


# ==================================================
# Candidate Dashboard & History Endpoints
# ==================================================

@router.get("/interviews/history")
def get_history(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return []
    return get_user_interviews(current_user.id, db)


@router.get("/interviews/stats")
def get_stats(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {
            "total_interviews": 0,
            "average_score": 0,
            "best_score": 0,
            "total_questions": 0,
            "technical_avg": 0,
            "communication_avg": 0,
            "strengths_summary": [],
            "weaknesses_summary": [],
            "readiness_status": "Please sign in to view your dashboard",
            "readiness_color": "neutral"
        }
    return get_user_stats(current_user.id, db)


@router.get("/interviews/{interview_id}")
def get_interview_detail(
    interview_id: str,
    db: Session = Depends(get_db)
):
    session = get_session(interview_id, db=db)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.delete("/interviews/{interview_id}")
def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Interview record not found")

    db.delete(record)
    db.commit()
    return {"message": "Interview deleted successfully"}


# ==================================================
# Interview Lifecycle Endpoints
# ==================================================

@router.post("/interview/start")
def start_interview(
    data: InterviewRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    return create_interview_session(data, user_id=user_id, db=db)


@router.post("/interview/next")
def interview_next(data: AnswerRequest, db: Session = Depends(get_db)):
    session = save_answer(data.session_id, data.answer, db=db)

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return next_question(data.session_id, db=db)


@router.post("/interview/evaluate")
def interview_evaluate(data: EvaluationRequest, db: Session = Depends(get_db)):
    evaluation = evaluate_session(data.session_id, db=db)

    if evaluation is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return evaluation


# ==================================================
# Resume Upload & Analysis
# ==================================================

@router.post("/resume/upload")
def upload_resume(file: UploadFile = File(...)):
    """
    Upload a resume PDF, extract its contents, analyze with AI,
    and return candidate skills, projects, and interview focus points.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        analysis = process_resume(file.file)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")
