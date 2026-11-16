from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.utils.auth import get_current_user
from app.services.interview import (
    get_user_stats,
    get_user_interviews,
)

router = APIRouter(tags=["Candidate Dashboard"])


@router.get("/dashboard/overview")
@router.get("/interviews/stats")
def dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stats = get_user_stats(current_user.id, db=db)
    return stats


@router.get("/dashboard/analytics")
def dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stats = get_user_stats(current_user.id, db=db)
    return {
        "score_history": stats.get("score_history", []),
        "strengths": stats.get("strengths", []),
        "weaknesses": stats.get("weaknesses", []),
        "technical_average": stats.get("technical_average", 0),
        "communication_average": stats.get("communication_average", 0),
        "average_score": stats.get("average_score", 0),
        "highest_score": stats.get("highest_score", 0)
    }


@router.get("/dashboard/recent-interviews")
@router.get("/interviews/history")
def dashboard_recent_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interviews = get_user_interviews(current_user.id, db=db)
    return {
        "interviews": interviews
    }
