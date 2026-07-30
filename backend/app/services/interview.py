import uuid

from app.services.gemini import (
    generate_complete_interview,
    evaluate_interview,
)

interview_sessions = {}


# ==================================================
# Create Interview Session
# ==================================================

def create_interview_session(data):

    session_id = str(uuid.uuid4())

    interview_data = generate_complete_interview(
        role=data.role,
        language=data.language,
        experience=data.experience,
        difficulty=data.difficulty,
        interview_type=data.interview_type,
        total_questions=data.questions,
        resume_analysis=data.resume_analysis,   # NEW
    )

    roadmap = interview_data["roadmap"]
    questions = interview_data["questions"]

    interview_sessions[session_id] = {

        "role": data.role,
        "language": data.language,
        "experience": data.experience,
        "difficulty": data.difficulty,
        "interview_type": data.interview_type,
        "follow_up": data.follow_up,

        # NEW
        "resume_analysis": data.resume_analysis,

        "current_question": 1,
        "total_questions": data.questions,

        "roadmap": roadmap,
        "questions": questions,
        "answers": [],
    }

    return {
        "session_id": session_id,
        "question": questions[0],
        "current_question": 1,
        "total_questions": data.questions,
    }


# ==================================================
# Get Session
# ==================================================

def get_session(session_id):
    return interview_sessions.get(session_id)


# ==================================================
# Save Answer
# ==================================================

def save_answer(session_id, answer):

    session = interview_sessions.get(session_id)

    if session is None:
        return None

    session["answers"].append(answer)

    return session


# ==================================================
# Next Question
# ==================================================

def next_question(session_id):

    session = interview_sessions.get(session_id)

    if session is None:
        return None

    if session["current_question"] >= session["total_questions"]:

        evaluation = evaluate_session(session_id)

        return {
            "finished": True,
            "evaluation": evaluation,
        }

    session["current_question"] += 1

    index = session["current_question"] - 1

    return {
        "finished": False,
        "question": session["questions"][index],
        "current_question": session["current_question"],
        "total_questions": session["total_questions"],
    }


# ==================================================
# Final Evaluation
# ==================================================

def evaluate_session(session_id):

    session = interview_sessions.get(session_id)

    if session is None:
        return None

    evaluation = evaluate_interview(
        role=session["role"],
        language=session["language"],
        experience=session["experience"],
        difficulty=session["difficulty"],
        interview_type=session["interview_type"],

        # NEW
        resume_analysis=session["resume_analysis"],

        questions=session["questions"],
        answers=session["answers"],
    )

    return evaluation