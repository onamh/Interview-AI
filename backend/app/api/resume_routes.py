import json
import uuid
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, Resume
from app.utils.auth import get_current_user, get_optional_user
from app.services.resume import process_resume

router = APIRouter(tags=["Resume Processing"])


@router.post("/resumes/upload")
@router.post("/resume/upload")
def upload_resume(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Upload a resume PDF, parse text with PyMuPDF/OCR, analyze skills & projects."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        analysis = process_resume(file.file)

        # If user is authenticated, persist resume to database
        resume_record = None
        if current_user:
            resume_record = Resume(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                filename=file.filename,
                candidate_name=analysis.get("candidate_name"),
                summary=analysis.get("summary"),
                skills=json.dumps(analysis.get("skills", [])),
                projects=json.dumps(analysis.get("projects", [])),
                experience=json.dumps(analysis.get("experience", [])),
                education=json.dumps(analysis.get("education", [])),
                strengths=json.dumps(analysis.get("strengths", [])),
                weaknesses=json.dumps(analysis.get("weaknesses", [])),
                extracted_text=analysis.get("extracted_text", "")
            )
            db.add(resume_record)
            db.commit()
            db.refresh(resume_record)
            analysis["resume_id"] = resume_record.id

        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


@router.get("/resumes")
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).all()

    return {
        "resumes": [r.to_dict() for r in resumes]
    }


@router.get("/resumes/{resume_id}")
def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return resume.to_dict()


@router.delete("/resumes/{resume_id}")
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.delete(resume)
    db.commit()

    return {"message": "Resume deleted successfully"}
