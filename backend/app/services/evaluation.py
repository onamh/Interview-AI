from typing import Dict, Any, List, Optional
from app.services.gemini import evaluate_interview

def process_evaluation(
    role: str,
    language: str,
    experience: str,
    difficulty: str,
    interview_type: str,
    questions: List[str],
    answers: List[str],
    resume_analysis: Optional[dict] = None
) -> Dict[str, Any]:
    """Evaluates candidate performance across technical and communication competencies."""
    return evaluate_interview(
        role=role,
        language=language,
        experience=experience,
        difficulty=difficulty,
        interview_type=interview_type,
        questions=questions,
        answers=answers,
        resume_analysis=resume_analysis
    )
