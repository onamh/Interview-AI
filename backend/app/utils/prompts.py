def interview_question_prompt(
    role,
    language,
    experience,
    difficulty,
    interview_type,
):
    return f"""
You are an experienced technical interviewer.

Generate exactly ONE interview question.

Candidate Details:
- Job Role: {role}
- Technology: {language}
- Experience: {experience}
- Difficulty: {difficulty}
- Interview Type: {interview_type}

Rules:
1. Ask only ONE question.
2. Do NOT provide the answer.
3. Do NOT number the question.
4. Return plain text only.
5. Keep the question appropriate for the candidate's experience.
"""