def interview_start_prompt(
    role,
    language,
    experience,
    difficulty,
    interview_type,
    total_questions,
    resume_analysis=None,
):

    resume_section = ""

    if resume_analysis and isinstance(resume_analysis, dict):
        skills = resume_analysis.get("skills", [])
        projects = resume_analysis.get("projects", [])
        experience_items = resume_analysis.get("experience", [])
        cand_name = resume_analysis.get("candidate_name", "Candidate")
        summary = resume_analysis.get("summary", "")

        skills_fmt = ", ".join(skills) if skills else language
        projects_fmt = "\n".join([f"  • {p}" for p in projects]) if projects else "Software development project"
        exp_fmt = "\n".join([f"  • {e}" for e in experience_items]) if experience_items else "Academic project development"

        resume_section = f"""
CANDIDATE RESUME PROFILE:
- Name: {cand_name}
- Extracted Technical Stack & Skills: {skills_fmt}
- Featured Projects:
{projects_fmt}
- Experience / Coursework:
{exp_fmt}
- Profile Summary: {summary}

MANDATORY RESUME QUESTION INSTRUCTIONS:
- Directly ask questions about the SPECIFIC projects listed above by name.
- Ask how the candidate architected their project, why they selected specific tools/frameworks ({skills_fmt}), and what technical hurdles or database design choices they made.
- Test in-depth understanding of the candidate's exact tech stack ({skills_fmt}).
"""
    elif resume_analysis:
        resume_section = f"""
Candidate Resume Analysis:
{resume_analysis}

Instructions for Resume-Based Interview:
- Formulate questions directly derived from the projects, technologies, and skills mentioned in this resume.
- Ask the candidate to explain architectural choices, trade-offs, and practical implementations from their listed projects.
"""

    return f"""
You are a senior technical interviewer at a top software company.

Your task is to create a complete interview before it begins.

Candidate Details

Job Role: {role}
Technology: {language}
Experience: {experience}
Difficulty: {difficulty}
Interview Type: {interview_type}

{resume_section}

The interview must contain exactly {total_questions} questions.

Return ONLY valid JSON.

Format:

{{
    "roadmap":[
        "...",
        "...",
        "..."
    ],

    "questions":[
        "...",
        "...",
        "..."
    ]
}}

Rules

1. Roadmap must contain exactly {total_questions} topics.

2. Questions must contain exactly {total_questions} questions.

3. Questions must follow the roadmap.

4. Increase the difficulty gradually.

5. Do not repeat concepts.

6. Do not repeat questions.

7. If a resume is provided:
   - At least 70% to 100% of the questions MUST be based on the candidate's specific resume projects and technical skills.
   - Questions 1 and 2 MUST explicitly ask about the projects listed on the resume by name (e.g. "On your resume you listed [Project Name]...").
   - Ask how they structured the data, APIs, error handling, and component architecture in those projects.
   - Subsequent questions must explore the candidate's exact tech stack.

8. If no resume is provided:
   - Generate a structured role-based interview covering core concepts, system design, and practical scenarios for {role} using {language}.

9. If Difficulty is Easy:
   - Start with fundamentals.
   - End with beginner interview questions.

10. If Difficulty is Medium:
   - Start easy.
   - Finish with practical intermediate questions.

11. If Difficulty is Hard:
   - Start intermediate.
   - Finish with advanced real-world questions.

12. HR Interview:
   - HR questions only.

13. Technical Interview:
   - Technical questions only.

14. Mixed Interview:
   - Approximately 70% technical and 30% HR.

15. Do NOT provide answers.

16. Do NOT number the questions.

17. Return ONLY JSON.

18. No markdown.

19. No explanations.

20. No code block.
"""


# ============================================================
# Evaluation Prompt
# ============================================================

def interview_evaluation_prompt(
    role,
    language,
    experience,
    difficulty,
    interview_type,
    resume_analysis,
    questions,
    answers,
):

    interview_history = ""

    for i, (question, answer) in enumerate(
        zip(questions, answers),
        start=1,
    ):
        interview_history += f"""

Question {i}

{question}

Answer

{answer}

"""

    resume_section = ""

    if resume_analysis:
        resume_section = f"""

Candidate Resume

{resume_analysis}

Evaluate whether the candidate's interview answers
are consistent with the resume.
"""

    return f"""
You are an engineering interviewer conducting a realistic student mock interview evaluation.

Evaluate the complete interview.

Candidate Details
Role: {role}
Technology: {language}
Experience: {experience}
Difficulty: {difficulty}
Interview Type: {interview_type}

{resume_section}

Interview Transcript
{interview_history}

Return ONLY valid JSON.

Format:
{{
    "overall_score": 75,
    "technical_score": 70,
    "communication_score": 78,
    "strengths": [
        "...",
        "..."
    ],
    "weaknesses": [
        "...",
        "..."
    ],
    "suggestions": [
        "...",
        "..."
    ],
    "overall_feedback": "...",
    "question_reviews": [
        {{
            "question_number": 1,
            "question": "...",
            "candidate_answer": "...",
            "score": 7,
            "feedback": "...",
            "ideal_answer": "..."
        }}
    ]
}}

STRICT EVALUATION RULES:
1. Punctuation only, empty, or non-answers (e.g. "..", "...", "?", ".", "idk", single letters, blank):
   - You MUST give a score of EXACTLY 0 out of 10 for that question!
   - In feedback, write: "No answer provided. Candidate entered only punctuation or blank characters instead of an explanation."
   - If ALL answers are punctuation or empty, overall_score, technical_score, and communication_score MUST BE 0!
   - In strengths, write: "None recorded. No substantive answers were provided."
2. Real technical answers:
   - Score fairly from 1 to 10 based on conceptual accuracy, clarity, and depth.
3. Be helpful, constructive, and realistic for a candidate mock interview.
4. Return ONLY JSON, no markdown blocks.
"""
