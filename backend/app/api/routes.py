from fastapi import APIRouter
from pydantic import BaseModel

from app.services.interview import create_interview_session

router = APIRouter()


class InterviewRequest(BaseModel):
    role: str
    language: str
    experience: str
    difficulty: str
    interview_type: str
    questions: int
    follow_up: bool


@router.post("/interview/start")
def start_interview(data: InterviewRequest):
    return create_interview_session(data)