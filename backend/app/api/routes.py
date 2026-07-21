from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class InterviewRequest(BaseModel):
    role: str
    experience: str
    interview_type: str
    language: str
    questions: int


@router.post("/interview/start")
def start_interview(data: InterviewRequest):

    return {
        "message": "Interview session created successfully",
        "data": data
    }