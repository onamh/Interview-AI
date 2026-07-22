import uuid

from app.services.gemini import generate_question


def create_interview_session(data):

    session_id = str(uuid.uuid4())

    first_question = generate_question(
        role=data.role,
        language=data.language,
        experience=data.experience,
        difficulty=data.difficulty,
        interview_type=data.interview_type,
    )

    return {
        "session_id": session_id,
        "status": "started",
        "message": "Interview session created successfully",
        "first_question": first_question,
        "interview": {
            "role": data.role,
            "language": data.language,
            "experience": data.experience,
            "difficulty": data.difficulty,
            "interview_type": data.interview_type,
            "questions": data.questions,
            "follow_up": data.follow_up,
        },
    }