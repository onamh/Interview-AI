import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.database.models import Interview
from app.services.gemini import (
    generate_complete_interview,
    evaluate_interview,
)

# In-memory fast cache as secondary buffer
interview_sessions: Dict[str, Dict[str, Any]] = {}


def _json_dumps(val: Any) -> Optional[str]:
    if val is None:
        return None
    return json.dumps(val)


def _json_loads(val: Optional[str]) -> Any:
    if not val:
        return []
    try:
        return json.loads(val)
    except Exception:
        return []


def create_interview_session(data, user_id: Optional[str] = None, db: Optional[Session] = None):
    session_id = str(uuid.uuid4())

    interview_data = generate_complete_interview(
        role=data.role,
        language=data.language,
        experience=data.experience,
        difficulty=data.difficulty,
        interview_type=data.interview_type,
        total_questions=data.questions,
        resume_analysis=data.resume_analysis,
    )

    roadmap = interview_data["roadmap"]
    questions = interview_data["questions"]

    session_dict = {
        "id": session_id,
        "user_id": user_id,
        "role": data.role,
        "language": data.language,
        "experience": data.experience,
        "difficulty": data.difficulty,
        "interview_type": data.interview_type,
        "follow_up": getattr(data, "follow_up", True),
        "resume_analysis": data.resume_analysis,
        "current_question": 1,
        "total_questions": data.questions,
        "roadmap": roadmap,
        "questions": questions,
        "answers": [],
        "status": "in_progress",
    }

    interview_sessions[session_id] = session_dict

    # Persist in SQLite
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        record = Interview(
            id=session_id,
            user_id=user_id,
            role=data.role,
            language=data.language,
            difficulty=data.difficulty,
            experience=data.experience,
            interview_type=data.interview_type,
            total_questions=data.questions,
            current_question=1,
            status="in_progress",
            resume_analysis=_json_dumps(data.resume_analysis),
            roadmap=_json_dumps(roadmap),
            questions=_json_dumps(questions),
            answers=_json_dumps([]),
            created_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
    except Exception as e:
        print(f"Database save error during interview creation: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()

    return {
        "session_id": session_id,
        "question": questions[0] if questions else "Can you describe your background and key technical projects?",
        "current_question": 1,
        "total_questions": data.questions,
        "role": data.role,
        "language": data.language,
        "difficulty": data.difficulty,
    }


def get_session(session_id: str, db: Optional[Session] = None):
    if session_id in interview_sessions:
        return interview_sessions[session_id]

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        record = db.query(Interview).filter(Interview.id == session_id).first()
        if not record:
            return None

        cached = {
            "id": record.id,
            "user_id": record.user_id,
            "role": record.role,
            "language": record.language,
            "experience": record.experience,
            "difficulty": record.difficulty,
            "interview_type": record.interview_type,
            "current_question": record.current_question,
            "total_questions": record.total_questions,
            "resume_analysis": _json_loads(record.resume_analysis),
            "roadmap": _json_loads(record.roadmap),
            "questions": _json_loads(record.questions),
            "answers": _json_loads(record.answers),
            "status": record.status,
            "overall_score": record.overall_score,
            "technical_score": record.technical_score,
            "communication_score": record.communication_score,
            "strengths": _json_loads(record.strengths),
            "weaknesses": _json_loads(record.weaknesses),
            "suggestions": _json_loads(record.suggestions),
            "overall_feedback": record.overall_feedback,
            "question_reviews": _json_loads(record.question_reviews),
        }
        interview_sessions[session_id] = cached
        return cached
    finally:
        if close_db:
            db.close()


def save_answer(session_id: str, answer: str, db: Optional[Session] = None):
    session = get_session(session_id, db=db)
    if session is None:
        return None

    session["answers"].append(answer)

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        record = db.query(Interview).filter(Interview.id == session_id).first()
        if record:
            record.answers = _json_dumps(session["answers"])
            db.commit()
    except Exception as e:
        print(f"Error persisting answer: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()

    return session


def next_question(session_id: str, db: Optional[Session] = None):
    session = get_session(session_id, db=db)
    if session is None:
        return None

    # Check if we reached or exceeded total questions
    if session["current_question"] >= session["total_questions"]:
        evaluation = evaluate_session(session_id, db=db)
        return {
            "finished": True,
            "evaluation": evaluation,
        }

    session["current_question"] += 1
    index = session["current_question"] - 1

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        record = db.query(Interview).filter(Interview.id == session_id).first()
        if record:
            record.current_question = session["current_question"]
            db.commit()
    except Exception as e:
        print(f"Error updating question step: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()

    question_text = (
        session["questions"][index]
        if index < len(session["questions"])
        else "Do you have any questions for the interviewer or additional notes on your project experience?"
    )

    return {
        "finished": False,
        "question": question_text,
        "current_question": session["current_question"],
        "total_questions": session["total_questions"],
    }


def evaluate_session(session_id: str, db: Optional[Session] = None):
    session = get_session(session_id, db=db)
    if session is None:
        return None

    # Avoid re-evaluating if already completed
    if session.get("status") == "completed" and "overall_score" in session and session["overall_score"] > 0:
        return {
            "overall_score": session.get("overall_score", 85),
            "technical_score": session.get("technical_score", 82),
            "communication_score": session.get("communication_score", 88),
            "strengths": session.get("strengths", []),
            "weaknesses": session.get("weaknesses", []),
            "suggestions": session.get("suggestions", []),
            "overall_feedback": session.get("overall_feedback", "Great effort throughout the interview!"),
            "question_reviews": session.get("question_reviews", []),
        }

    evaluation = evaluate_interview(
        role=session["role"],
        language=session["language"],
        experience=session["experience"],
        difficulty=session["difficulty"],
        interview_type=session["interview_type"],
        resume_analysis=session.get("resume_analysis"),
        questions=session["questions"],
        answers=session["answers"],
    )

    session["status"] = "completed"
    session["overall_score"] = evaluation.get("overall_score", 80)
    session["technical_score"] = evaluation.get("technical_score", 80)
    session["communication_score"] = evaluation.get("communication_score", 80)
    session["strengths"] = evaluation.get("strengths", [])
    session["weaknesses"] = evaluation.get("weaknesses", [])
    session["suggestions"] = evaluation.get("suggestions", [])
    session["overall_feedback"] = evaluation.get("overall_feedback", "")
    session["question_reviews"] = evaluation.get("question_reviews", [])

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        record = db.query(Interview).filter(Interview.id == session_id).first()
        if record:
            record.status = "completed"
            record.overall_score = session["overall_score"]
            record.technical_score = session["technical_score"]
            record.communication_score = session["communication_score"]
            record.strengths = _json_dumps(session["strengths"])
            record.weaknesses = _json_dumps(session["weaknesses"])
            record.suggestions = _json_dumps(session["suggestions"])
            record.overall_feedback = session["overall_feedback"]
            record.question_reviews = _json_dumps(session["question_reviews"])
            record.completed_at = datetime.utcnow()
            db.commit()
    except Exception as e:
        print(f"Error persisting evaluation: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()

    return evaluation


def get_user_interviews(user_id: str, db: Session) -> List[Dict[str, Any]]:
    records = db.query(Interview).filter(
        Interview.user_id == user_id,
        Interview.status == "completed"
    ).order_by(Interview.created_at.desc()).all()

    results = []
    for r in records:
        results.append({
            "id": r.id,
            "role": r.role,
            "language": r.language,
            "difficulty": r.difficulty,
            "total_questions": r.total_questions,
            "overall_score": r.overall_score,
            "technical_score": r.technical_score,
            "communication_score": r.communication_score,
            "strengths": _json_loads(r.strengths),
            "weaknesses": _json_loads(r.weaknesses),
            "suggestions": _json_loads(r.suggestions),
            "overall_feedback": r.overall_feedback,
            "question_reviews": _json_loads(r.question_reviews),
            "date": r.created_at.strftime("%b %d, %Y - %I:%M %p") if r.created_at else "Recent",
        })
    return results


def get_user_stats(user_id: str, db: Session) -> Dict[str, Any]:
    interviews = get_user_interviews(user_id, db)
    total = len(interviews)

    if total == 0:
        return {
            "total_interviews": 0,
            "average_score": 0,
            "best_score": 0,
            "total_questions": 0,
            "technical_avg": 0,
            "communication_avg": 0,
            "strengths_summary": [],
            "weaknesses_summary": [],
            "readiness_status": "New Candidate (Needs 1 Mock Interview)",
            "readiness_color": "neutral"
        }

    scores = [it["overall_score"] for it in interviews]
    tech_scores = [it["technical_score"] for it in interviews]
    comm_scores = [it["communication_score"] for it in interviews]

    avg_score = round(sum(scores) / total)
    avg_tech = round(sum(tech_scores) / total)
    avg_comm = round(sum(comm_scores) / total)
    best_score = max(scores)
    total_q = sum(it["total_questions"] for it in interviews)

    # Aggregate strengths & weaknesses
    all_strengths = []
    all_weaknesses = []
    for it in interviews:
        all_strengths.extend(it.get("strengths", []))
        all_weaknesses.extend(it.get("weaknesses", []))

    # Pick unique representative insights
    unique_strengths = list(dict.fromkeys(all_strengths))[:5]
    unique_weaknesses = list(dict.fromkeys(all_weaknesses))[:5]

    if avg_score >= 85:
        readiness = "Placement Ready - High Probability"
        color = "success"
    elif avg_score >= 70:
        readiness = "Good Progress - Fine Tuning Recommended"
        color = "primary"
    else:
        readiness = "Needs Dedicated Practice"
        color = "warning"

    return {
        "total_interviews": total,
        "average_score": avg_score,
        "best_score": best_score,
        "total_questions": total_q,
        "technical_avg": avg_tech,
        "communication_avg": avg_comm,
        "strengths_summary": unique_strengths,
        "weaknesses_summary": unique_weaknesses,
        "readiness_status": readiness,
        "readiness_color": color
    }
