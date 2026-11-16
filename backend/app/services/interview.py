import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.database.models import User, Resume, Interview, Question, Answer, Evaluation
from app.services.gemini import (
    generate_complete_interview,
    evaluate_interview,
    generate_follow_up_question,
    _is_meaningful_answer,
)

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


# ==================================================
# Create Interview Session (Populates 6 Normalized Tables)
# ==================================================

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

    # In-memory session tracking for real-time speed
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

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        resume_id = None
        # 1. Populate Resumes table if resume_analysis provided
        if data.resume_analysis and isinstance(data.resume_analysis, dict):
            resume_record = Resume(
                id=str(uuid.uuid4()),
                user_id=user_id,
                filename="Candidate_Resume.pdf",
                candidate_name=data.resume_analysis.get("candidate_name", "Candidate"),
                summary=data.resume_analysis.get("summary", ""),
                skills=_json_dumps(data.resume_analysis.get("skills", [])),
                projects=_json_dumps(data.resume_analysis.get("projects", [])),
                experience=_json_dumps(data.resume_analysis.get("experience", [])),
                education=_json_dumps(data.resume_analysis.get("education", [])),
                strengths=_json_dumps(data.resume_analysis.get("strengths", [])),
                weaknesses=_json_dumps(data.resume_analysis.get("weaknesses", []))
            )
            db.add(resume_record)
            db.flush()
            resume_id = resume_record.id

        # 2. Populate Interviews table
        interview_record = Interview(
            id=session_id,
            user_id=user_id,
            resume_id=resume_id,
            role=data.role,
            language=data.language,
            experience=data.experience,
            difficulty=data.difficulty,
            interview_type=data.interview_type,
            total_questions=data.questions,
            current_question=1,
            status="in_progress",
            created_at=datetime.utcnow()
        )
        db.add(interview_record)
        db.flush()

        # 3. Populate Questions table (normalized rows for each question)
        for i, q_text in enumerate(questions, start=1):
            topic_text = roadmap[i - 1] if (i - 1) < len(roadmap) else f"Topic {i}"
            q_record = Question(
                id=str(uuid.uuid4()),
                interview_id=session_id,
                sequence=i,
                topic=topic_text,
                question_text=q_text
            )
            db.add(q_record)

        db.commit()
    except Exception as e:
        print(f"Database error during normalized interview creation: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()

    return {
        "session_id": session_id,
        "question": questions[0] if questions else "Please describe your background and core technical projects.",
        "current_question": 1,
        "total_questions": data.questions,
        "role": data.role,
        "language": data.language,
        "difficulty": data.difficulty,
    }


# ==================================================
# Get Session
# ==================================================

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

        questions_list = [q.question_text for q in record.questions] if record.questions else []
        roadmap_list = [q.topic for q in record.questions] if record.questions else []
        answers_list = [a.submitted_answer for a in record.answers] if record.answers else []

        eval_obj = record.evaluation
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
            "roadmap": roadmap_list,
            "questions": questions_list,
            "answers": answers_list,
            "status": record.status,
            "overall_score": eval_obj.overall_score if eval_obj else 0,
            "technical_score": eval_obj.technical_score if eval_obj else 0,
            "communication_score": eval_obj.communication_score if eval_obj else 0,
            "strengths": _json_loads(eval_obj.strengths) if eval_obj else [],
            "weaknesses": _json_loads(eval_obj.weaknesses) if eval_obj else [],
            "suggestions": _json_loads(eval_obj.suggestions) if eval_obj else [],
            "overall_feedback": eval_obj.overall_feedback if eval_obj else "",
            "question_reviews": _json_loads(eval_obj.question_critiques) if eval_obj else [],
        }
        interview_sessions[session_id] = cached
        return cached
    finally:
        if close_db:
            db.close()


# ==================================================
# Save Answer (Populates Answers Table)
# ==================================================

def save_answer(session_id: str, answer_text: str, db: Optional[Session] = None):
    session = get_session(session_id, db=db)
    if session is None:
        return None

    session["answers"].append(answer_text)
    curr_seq = session["current_question"]

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Find corresponding question record
        q_record = db.query(Question).filter(
            Question.interview_id == session_id,
            Question.sequence == curr_seq
        ).first()

        q_id = q_record.id if q_record else str(uuid.uuid4())
        ans_record = Answer(
            id=str(uuid.uuid4()),
            interview_id=session_id,
            question_id=q_id,
            submitted_answer=answer_text,
            word_count=len(answer_text.split()),
            submitted_at=datetime.utcnow()
        )
        db.add(ans_record)
        db.commit()
    except Exception as e:
        print(f"Error persisting answer row: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()

    return session


# ==================================================
# Next Question
# ==================================================

def next_question(session_id: str, db: Optional[Session] = None):
    session = get_session(session_id, db=db)
    if session is None:
        return None

    if session["current_question"] >= session["total_questions"]:
        evaluation = evaluate_session(session_id, db=db)
        return {
            "finished": True,
            "evaluation": evaluation,
        }

    session["current_question"] += 1
    index = session["current_question"] - 1

    # Check if follow-up question should be generated based on previous answer
    should_follow_up = session.get("follow_up", True)
    if should_follow_up and len(session.get("answers", [])) >= index:
        prev_idx = index - 1
        prev_q = session["questions"][prev_idx] if prev_idx < len(session["questions"]) else ""
        prev_a = session["answers"][prev_idx] if prev_idx < len(session["answers"]) else ""

        # If candidate provided a substantive answer (not empty/punctuation), formulate dynamic follow-up
        if _is_meaningful_answer(prev_a):
            curr_q = session["questions"][index] if index < len(session["questions"]) else None
            follow_up_q = generate_follow_up_question(
                role=session.get("role", "Software Engineer"),
                language=session.get("language", "Technical"),
                previous_question=prev_q,
                previous_answer=prev_a,
                resume_analysis=session.get("resume_analysis"),
                default_next_question=curr_q,
            )
            if follow_up_q:
                if index < len(session["questions"]):
                    session["questions"][index] = follow_up_q
                else:
                    session["questions"].append(follow_up_q)

                # Persist updated question text in database
                close_inner = False
                db_sess = db
                if db_sess is None:
                    db_sess = SessionLocal()
                    close_inner = True
                try:
                    q_rec = db_sess.query(Question).filter(
                        Question.interview_id == session_id,
                        Question.sequence == session["current_question"]
                    ).first()
                    if q_rec:
                        q_rec.question_text = follow_up_q
                        q_rec.topic = "Follow-up Question"
                        db_sess.commit()
                except Exception as ex:
                    print(f"Error persisting follow-up question: {ex}")
                finally:
                    if close_inner:
                        db_sess.close()

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
        print(f"Error advancing question: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()

    question_text = (
        session["questions"][index]
        if index < len(session["questions"])
        else "Are there any additional technical frameworks or projects you'd like to highlight?"
    )

    return {
        "finished": False,
        "question": question_text,
        "current_question": session["current_question"],
        "total_questions": session["total_questions"],
    }


# ==================================================
# Final Evaluation (Populates Evaluations Table)
# ==================================================

def evaluate_session(session_id: str, db: Optional[Session] = None):
    session = get_session(session_id, db=db)
    if session is None:
        return None

    if session.get("status") == "completed" and session.get("overall_score", 0) > 0:
        return {
            "overall_score": session.get("overall_score", 85),
            "technical_score": session.get("technical_score", 82),
            "communication_score": session.get("communication_score", 88),
            "strengths": session.get("strengths", []),
            "weaknesses": session.get("weaknesses", []),
            "suggestions": session.get("suggestions", []),
            "overall_feedback": session.get("overall_feedback", "Solid performance."),
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
        # 1. Update Interview status
        interview_rec = db.query(Interview).filter(Interview.id == session_id).first()
        if interview_rec:
            interview_rec.status = "completed"
            interview_rec.completed_at = datetime.utcnow()

        # 2. Upsert Evaluation record in evaluations table
        eval_rec = db.query(Evaluation).filter(Evaluation.interview_id == session_id).first()
        if not eval_rec:
            eval_rec = Evaluation(
                id=str(uuid.uuid4()),
                interview_id=session_id,
                overall_score=session["overall_score"],
                technical_score=session["technical_score"],
                communication_score=session["communication_score"],
                strengths=_json_dumps(session["strengths"]),
                weaknesses=_json_dumps(session["weaknesses"]),
                suggestions=_json_dumps(session["suggestions"]),
                overall_feedback=session["overall_feedback"],
                question_critiques=_json_dumps(session["question_reviews"]),
                created_at=datetime.utcnow()
            )
            db.add(eval_rec)
        else:
            eval_rec.overall_score = session["overall_score"]
            eval_rec.technical_score = session["technical_score"]
            eval_rec.communication_score = session["communication_score"]
            eval_rec.strengths = _json_dumps(session["strengths"])
            eval_rec.weaknesses = _json_dumps(session["weaknesses"])
            eval_rec.suggestions = _json_dumps(session["suggestions"])
            eval_rec.overall_feedback = session["overall_feedback"]
            eval_rec.question_critiques = _json_dumps(session["question_reviews"])

        db.commit()
    except Exception as e:
        print(f"Error persisting evaluation row: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()

    return evaluation


# ==================================================
# Candidate History & Stats (Relational Queries)
# ==================================================

def get_user_interviews(user_id: str, db: Session) -> List[Dict[str, Any]]:
    records = db.query(Interview).filter(
        Interview.user_id == user_id,
        Interview.status == "completed"
    ).order_by(Interview.created_at.desc()).all()

    results = []
    for r in records:
        eval_obj = r.evaluation
        results.append({
            "id": r.id,
            "role": r.role,
            "language": r.language,
            "difficulty": r.difficulty,
            "total_questions": r.total_questions,
            "overall_score": eval_obj.overall_score if eval_obj else 0,
            "technical_score": eval_obj.technical_score if eval_obj else 0,
            "communication_score": eval_obj.communication_score if eval_obj else 0,
            "strengths": _json_loads(eval_obj.strengths) if eval_obj else [],
            "weaknesses": _json_loads(eval_obj.weaknesses) if eval_obj else [],
            "suggestions": _json_loads(eval_obj.suggestions) if eval_obj else [],
            "overall_feedback": eval_obj.overall_feedback if eval_obj else "",
            "question_reviews": _json_loads(eval_obj.question_critiques) if eval_obj else [],
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
            "score_history": [],
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

    all_strengths = []
    all_weaknesses = []
    for it in interviews:
        all_strengths.extend(it.get("strengths", []))
        all_weaknesses.extend(it.get("weaknesses", []))

    unique_strengths = list(dict.fromkeys(all_strengths))[:5]
    unique_weaknesses = list(dict.fromkeys(all_weaknesses))[:5]

    # Chronological score trend for Recharts
    score_history = []
    for i, it in enumerate(reversed(interviews), start=1):
        score_history.append({
            "session": f"Mock #{i}",
            "score": it["overall_score"],
            "technical": it.get("technical_score", it["overall_score"]),
            "communication": it.get("communication_score", it["overall_score"]),
            "role": it["role"]
        })

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
        "score_history": score_history,
        "readiness_status": readiness,
        "readiness_color": color
    }
