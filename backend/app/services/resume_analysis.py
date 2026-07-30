import json
import re

from app.services.gemini import _generate


def analyze_resume(resume_text: str):

    prompt = f"""
You are an expert technical recruiter.

Analyze this resume.

Resume

{resume_text}

Return ONLY valid JSON.

Format

{{
    "candidate_name":"",

    "summary":"",

    "skills":[
        ""
    ],

    "projects":[
        ""
    ],

    "experience":[
        ""
    ],

    "education":[
        ""
    ],

    "strengths":[
        ""
    ],

    "weaknesses":[
        ""
    ]
}}

Rules

Return JSON only.

No markdown.

No explanation.

No code block.
"""

    text = _generate(prompt)

    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text).strip()

    return json.loads(text)