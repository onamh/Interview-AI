from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, Interview
from app.utils.auth import get_current_user
from app.services.interview import get_user_interviews

router = APIRouter(tags=["Interview History"])


@router.get("/history")
def get_history(
    role: Optional[str] = Query(None),
    interview_type: Optional[str] = Query(None),
    sort: Optional[str] = Query("date_desc"),  # "date_desc", "date_asc", "score_desc", "score_asc"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Interview).filter(
        Interview.user_id == current_user.id,
        Interview.status == "completed"
    )

    if isinstance(role, str) and role.strip():
        query = query.filter(Interview.role.ilike(f"%{role.strip()}%"))

    if isinstance(interview_type, str) and interview_type.strip():
        query = query.filter(Interview.interview_type.ilike(f"%{interview_type.strip()}%"))

    if isinstance(sort, str) and sort == "date_asc":
        query = query.order_by(Interview.created_at.asc())
    else:
        query = query.order_by(Interview.created_at.desc())

    records = query.all()
    results = []
    for r in records:
        eval_obj = r.evaluation
        results.append({
            "id": r.id,
            "role": r.role,
            "language": r.language,
            "experience": r.experience,
            "difficulty": r.difficulty,
            "interview_type": r.interview_type,
            "total_questions": r.total_questions,
            "date": r.created_at.strftime("%b %d, %Y - %I:%M %p") if r.created_at else "",
            "overall_score": eval_obj.overall_score if eval_obj else 0,
            "technical_score": eval_obj.technical_score if eval_obj else 0,
            "communication_score": eval_obj.communication_score if eval_obj else 0,
            "clarity_score": eval_obj.clarity_score if eval_obj else 0,
            "structure_score": eval_obj.structure_score if eval_obj else 0,
            "confidence_score": eval_obj.confidence_score if eval_obj else 0,
            "strengths": eval_obj.to_dict().get("strengths", []) if eval_obj else [],
            "weaknesses": eval_obj.to_dict().get("weaknesses", []) if eval_obj else [],
            "suggestions": eval_obj.to_dict().get("suggestions", []) if eval_obj else [],
            "overall_feedback": eval_obj.overall_feedback if eval_obj else "",
            "question_reviews": eval_obj.to_dict().get("question_reviews", []) if eval_obj else [],
        })

    if sort == "score_desc":
        results.sort(key=lambda x: x["overall_score"], reverse=True)
    elif sort == "score_asc":
        results.sort(key=lambda x: x["overall_score"])

    return {
        "interviews": results,
        "total": len(results)
    }


@router.delete("/history/{interview_id}")
@router.delete("/interviews/{interview_id}")
def delete_history_item(
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

    return {"message": "Interview session deleted successfully"}
