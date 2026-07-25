import uuid

from app.services.gemini import generate_complete_interview
from app.services.gemini import evaluate_interview

interview_sessions = {}


def create_interview_session(data):

    session_id = str(uuid.uuid4())

    interview_data = generate_complete_interview(
        role=data.role,
        language=data.language,
        experience=data.experience,
        difficulty=data.difficulty,
        interview_type=data.interview_type,
        total_questions=data.questions,
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


def get_session(session_id):
    return interview_sessions.get(session_id)


def save_answer(session_id, answer):

    session = interview_sessions.get(session_id)

    if not session:
        return None

    session["answers"].append(answer)

    return session


def next_question(session_id):

    session = interview_sessions.get(session_id)

    if not session:
        return None

    # Interview completed
    if session["current_question"] >= session["total_questions"]:
        evaluation=evaluate_session(session_id)
        return {
            "finished": True,
            "evaluation": evaluation
        }

    session["current_question"] += 1

    next_index = session["current_question"] - 1

    # Safety check
    if next_index >= len(session["questions"]):
        return {
            "finished": True
        }

    return {
        "finished": False,
        "question": session["questions"][next_index],
        "current_question": session["current_question"],
        "total_questions": session["total_questions"],
    }


def evaluate_session(session_id):

    session = interview_sessions.get(session_id)

    if not session:
        return None

    evaluation = evaluate_interview(
        role=session["role"],
        language=session["language"],
        experience=session["experience"],
        difficulty=session["difficulty"],
        interview_type=session["interview_type"],
        questions=session["questions"],
        answers=session["answers"],
    )

    return evaluation