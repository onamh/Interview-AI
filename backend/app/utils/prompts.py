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

    if resume_analysis:
        resume_section = f"""

Candidate Resume Analysis

{resume_analysis}

Instructions for Resume-Based Interview

- Use the resume as the primary source of interview questions.
- Ask questions about:
  • Projects
  • Internship / Experience
  • Technical Skills
  • Tools & Technologies
  • Education (if relevant)
- Ask the candidate to explain decisions made in their projects.
- Ask practical questions based on the technologies mentioned.
- If the resume contains insufficient information, then generate normal role-based interview questions.
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
   - At least 70% of the questions should come from the resume.
   - Focus on projects, internship, skills and technologies.
   - Ask the candidate to explain design decisions and implementation.
   - Ask follow-up style technical questions based on their projects.

8. If no resume is provided:
   - Generate a normal interview using the selected role and technology.

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

Comment on:

- Resume quality
- Project explanations
- Technical depth
- Skill alignment
"""

    return f"""
You are a senior software engineering interviewer.

Evaluate the complete interview.

Candidate

Role: {role}
Technology: {language}
Experience: {experience}
Difficulty: {difficulty}
Interview Type: {interview_type}

{resume_section}

Interview

{interview_history}

Return ONLY JSON.

Format

{{
    "overall_score":85,
    "technical_score":82,
    "communication_score":90,

    "strengths":[
        "...",
        "..."
    ],

    "weaknesses":[
        "...",
        "..."
    ],

    "suggestions":[
        "...",
        "..."
    ],

    "overall_feedback":"..."
}}

Rules

1. Scores between 0 and 100.

2. Evaluate the interview as a whole.

3. If a resume exists:
   - Evaluate how well the candidate explained projects.
   - Check consistency between the resume and answers.
   - Comment on technical skills mentioned in the resume.

4. Mention strengths.

5. Mention weaknesses.

6. Give actionable suggestions.

7. Overall feedback should be 4-6 sentences.

8. Return ONLY JSON.

9. No markdown.

10. No explanations.

11. No code block.
"""