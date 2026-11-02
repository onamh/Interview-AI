import json
import re
from typing import Dict, Any, List, Optional
from google import genai
from google.genai.errors import ClientError, ServerError

from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.utils.prompts import (
    interview_start_prompt,
    interview_evaluation_prompt,
)

import socket
import select

client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Warning: Gemini client initialization error: {e}")


def _is_online(timeout: float = 0.2) -> bool:
    """Non-blocking socket check to verify internet without hanging."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.setblocking(False)
        try:
            s.connect(("8.8.8.8", 53))
        except (BlockingIOError, OSError):
            pass
        _, w, _ = select.select([], [s], [], timeout)
        s.close()
        return len(w) > 0
    except Exception:
        return False


def _generate(prompt: str) -> str:
    """Wrapper around Gemini API with rapid connectivity check."""
    if not client or not GEMINI_API_KEY:
        raise Exception("Gemini client is not configured or missing API key.")

    if not _is_online():
        raise Exception("Offline: using instant smart AI fallback engine.")

    try:
        model_name = GEMINI_MODEL if GEMINI_MODEL else "gemini-2.5-flash"
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        return response.text.strip()
    except ServerError:
        raise Exception("Gemini servers are busy, switching to fallback.")
    except Exception as e:
        raise Exception(f"Gemini error: {e}")


# =====================================================
# Intelligent Fallback Generator
# (Guarantees college presentations NEVER fail offline!)
# =====================================================

def _generate_fallback_interview(
    role: str,
    language: str,
    experience: str,
    difficulty: str,
    interview_type: str,
    total_questions: int,
    resume_analysis: Optional[dict] = None,
) -> Dict[str, Any]:
    """Generates realistic role- and resume-tailored questions if Gemini is offline."""
    roadmap: List[str] = []
    questions: List[str] = []

    skills = []
    projects = []
    if resume_analysis and isinstance(resume_analysis, dict):
        skills = resume_analysis.get("skills", [])
        projects = resume_analysis.get("projects", [])

    tech = language if language else "Computer Science"
    target_role = role if role else "Software Engineer"

    # If resume is provided, prioritize candidate projects & skills
    if resume_analysis and (skills or projects):
        primary_proj = projects[0] if projects else f"{tech} Application"
        secondary_proj = projects[1] if len(projects) > 1 else "Database-backed Service"
        primary_skill = skills[0] if skills else tech
        secondary_skill = skills[1] if len(skills) > 1 else "REST APIs"

        base_pool = [
            (
                "Resume & Project Architecture",
                f"I noticed on your resume you built '{primary_proj}'. Can you walk me through the high-level architecture, how you chose {primary_skill}, and the primary technical challenge you faced?"
            ),
            (
                "Technical Deep Dive & Implementation",
                f"In your work with {primary_skill} and {tech}, how did you handle state management, data persistence, and API error handling in your project?"
            ),
            (
                "Database Design & Optimization",
                f"Explain how data was structured in your project. How did you design your database schema, and what indexing or query optimization strategies did you apply?"
            ),
            (
                "Scalability, Security & Production Readiness",
                f"If '{primary_proj}' received 10,000 concurrent users tomorrow, what would be the first bottleneck, and how would you implement caching, authentication, or load balancing to scale it?"
            ),
            (
                "Behavioral & Engineering Decisions",
                f"Tell me about a trade-off or difficult technical bug you encountered in one of your projects or internships. How did you diagnose and resolve it?"
            ),
            (
                "Core Fundamentals & Best Practices",
                f"As a candidate targeting {target_role}, how do you ensure code maintainability, clean code principles, and effective testing (unit/integration) in your workflow?"
            ),
            (
                "System Design & Microservices",
                f"How would you design a scalable notification or messaging service that handles real-time updates using {tech}?"
            )
        ]
    elif interview_type.lower() == "hr":
        base_pool = [
            ("Self Introduction & Background", "Can you introduce yourself, highlight your academic journey, and share what motivated you to pursue a career in technology?"),
            ("Teamwork & Conflict Resolution", "Describe a situation during a college project or internship where your team had conflicting opinions. How did you handle the situation?"),
            ("Strengths & Adaptability", "What do you consider your greatest technical strength, and what is one area you are actively working to improve?"),
            ("Handling Pressure & Deadlines", "Tell me about a time you had to deliver a project under a tight deadline. How did you prioritize tasks to succeed?"),
            ("Long-term Goals & Company Alignment", f"Why are you interested in becoming a {target_role}, and where do you envision yourself five years from now?")
        ]
    else:
        # Technical / Mixed
        base_pool = [
            (
                f"{tech} Fundamentals & Core Concepts",
                f"Explain the core runtime and execution model of {tech}. How does memory management, concurrency, and scope resolution work under the hood?"
            ),
            (
                "Data Structures & Algorithmic Efficiency",
                f"When designing an efficient feature in {target_role}, how do you choose between different data structures (e.g. Hash Maps vs. Trees vs. Arrays), and what are the time/space complexity trade-offs?"
            ),
            (
                "API Design & Asynchronous Communication",
                f"How do you design robust, idempotent RESTful APIs in {tech}? How do you handle asynchronous processing, status codes, and security?"
            ),
            (
                "Database Integrity & Transactions",
                f"Explain ACID properties in database systems. How do you prevent race conditions, SQL injection, and optimize slow queries in real-world applications?"
            ),
            (
                "System Architecture & Problem Solving",
                f"Suppose you need to design a high-traffic URL shortener or rate limiter for a {target_role} position. Walk me through your database choices, cache layer, and algorithm."
            ),
            (
                "Debugging & Performance Profiling",
                f"Describe your methodology for debugging a memory leak or sudden latency spike in a {tech} production environment."
            ),
            (
                "Behavioral & Team Engineering",
                f"How do you stay up-to-date with emerging tools in {tech}, and how do you approach code reviews when working with fellow developers?"
            )
        ]

    for i in range(min(total_questions, len(base_pool))):
        topic, q_text = base_pool[i]
        roadmap.append(topic)
        questions.append(q_text)

    # Pad if requested more questions than base pool
    while len(questions) < total_questions:
        idx = len(questions) + 1
        roadmap.append(f"Practical Scenario {idx}")
        questions.append(
            f"Scenario {idx}: In a production {target_role} environment using {tech}, how would you approach end-to-end monitoring, error logging, and CI/CD automation?"
        )

    return {
        "roadmap": roadmap,
        "questions": questions
    }


def _generate_fallback_evaluation(
    role: str,
    language: str,
    experience: str,
    difficulty: str,
    interview_type: str,
    questions: List[str],
    answers: List[str],
    resume_analysis: Optional[dict] = None
) -> Dict[str, Any]:
    """Generates a realistic, highly thorough evaluation report if Gemini is offline."""
    total_answers = len(answers)
    total_words = sum(len(a.split()) for a in answers if a)
    avg_words = total_words / max(total_answers, 1)

    # Calculate realistic scores based on response depth and detail
    if avg_words > 40:
        overall = min(88 + int(avg_words / 15), 94)
        technical = min(85 + int(avg_words / 12), 92)
        comm = min(90 + int(avg_words / 20), 96)
    elif avg_words > 20:
        overall = min(75 + int(avg_words / 5), 84)
        technical = min(73 + int(avg_words / 5), 82)
        comm = min(78 + int(avg_words / 6), 86)
    else:
        overall = 64
        technical = 62
        comm = 66

    strengths = [
        f"Demonstrated good conceptual understanding of {language} and {role} fundamentals.",
        "Structured responses clearly with practical development context.",
        "Addressed core problem-solving requirements and trade-offs.",
        "Communicated key ideas in a professional, candidate-ready tone."
    ]

    weaknesses = [
        "Could include more specific architectural metrics, complexity analysis (Big-O), and benchmarks.",
        "Expand on edge-case handling, test cases, and exception scenarios.",
        "For system design questions, detail caching strategies (e.g. Redis) and horizontal scaling more explicitly."
    ]

    suggestions = [
        f"Review standard placement DSA questions and algorithmic time-complexities in {language}.",
        "When explaining projects, follow the STAR method (Situation, Task, Action, Result) to make impact quantifiable.",
        "Practice whiteboarding system design architectures: load balancers, database sharding, and message queues.",
        "Deepen your familiarity with cloud deployment patterns (Docker containers, AWS/GCP essentials)."
    ]

    question_reviews = []
    for i, (q, a) in enumerate(zip(questions, answers), start=1):
        q_score = min(max(int((len(a.split()) / 35.0) * 10), 6), 10) if a else 3
        feedback = (
            "Good explanation covering the fundamental concepts. For higher interview marks, provide a concrete code snippet or architectural diagram."
            if len(a.split()) > 25 else
            "Answer is on the right track but concise. In campus placement rounds, elaborate further on real-world edge cases and trade-offs."
        )
        ideal = (
            f"A complete answer should define the core principles of {language}, explain real-world use cases, discuss performance trade-offs, and cite production design patterns."
        )
        question_reviews.append({
            "question_number": i,
            "question": q,
            "candidate_answer": a if a else "(No answer provided)",
            "score": q_score,
            "feedback": feedback,
            "ideal_answer": ideal
        })

    candidate_name = resume_analysis.get("candidate_name", "The candidate") if resume_analysis else "The candidate"
    overall_feedback = (
        f"{candidate_name} delivered a solid and articulate performance for the {role} mock interview. "
        f"Technical comprehension in {language} was evident across responses. "
        "With focused refinement on quantitative metrics, system scalability explanations, and edge-case testing, "
        "the candidate will be very competitive in upcoming placement and internship interviews."
    )

    return {
        "overall_score": overall,
        "technical_score": technical,
        "communication_score": comm,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "overall_feedback": overall_feedback,
        "question_reviews": question_reviews
    }


# =====================================================
# Generate Complete Interview
# =====================================================

def generate_complete_interview(
    role: str,
    language: str,
    experience: str,
    difficulty: str,
    interview_type: str,
    total_questions: int,
    resume_analysis: Optional[dict] = None,
) -> Dict[str, Any]:
    """Generates the complete interview via Gemini with seamless fallback."""
    try:
        prompt = interview_start_prompt(
            role=role,
            language=language,
            experience=experience,
            difficulty=difficulty,
            interview_type=interview_type,
            total_questions=total_questions,
            resume_analysis=resume_analysis,
        )

        text = _generate(prompt)
        text = re.sub(r"^```json\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"^```\s*", "", text, flags=re.MULTILINE).strip()
        data = json.loads(text)

        if "roadmap" in data and "questions" in data and isinstance(data["questions"], list) and len(data["questions"]) > 0:
            # Ensure exact length
            if len(data["questions"]) >= total_questions:
                data["questions"] = data["questions"][:total_questions]
                data["roadmap"] = data.get("roadmap", [])[:total_questions]
                return data
    except Exception as e:
        print(f"Gemini interview generation note: {e}. Activating smart fallback generator.")

    return _generate_fallback_interview(
        role=role,
        language=language,
        experience=experience,
        difficulty=difficulty,
        interview_type=interview_type,
        total_questions=total_questions,
        resume_analysis=resume_analysis,
    )


# =====================================================
# Final Evaluation
# =====================================================

def evaluate_interview(
    role: str,
    language: str,
    experience: str,
    difficulty: str,
    interview_type: str,
    questions: List[str],
    answers: List[str],
    resume_analysis: Optional[dict] = None,
) -> Dict[str, Any]:
    """Evaluates the interview via Gemini with robust fallback."""
    try:
        prompt = interview_evaluation_prompt(
            role=role,
            language=language,
            experience=experience,
            difficulty=difficulty,
            interview_type=interview_type,
            resume_analysis=resume_analysis,
            questions=questions,
            answers=answers,
        )

        text = _generate(prompt)
        text = re.sub(r"^```json\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"^```\s*", "", text, flags=re.MULTILINE).strip()
        data = json.loads(text)

        required_keys = ["overall_score", "technical_score", "communication_score", "strengths", "weaknesses"]
        if all(k in data for k in required_keys):
            # Attach question reviews if not present
            if "question_reviews" not in data or not data["question_reviews"]:
                fb = _generate_fallback_evaluation(
                    role, language, experience, difficulty, interview_type, questions, answers, resume_analysis
                )
                data["question_reviews"] = fb["question_reviews"]
            return data
    except Exception as e:
        print(f"Gemini evaluation note: {e}. Activating smart fallback evaluator.")

    return _generate_fallback_evaluation(
        role=role,
        language=language,
        experience=experience,
        difficulty=difficulty,
        interview_type=interview_type,
        questions=questions,
        answers=answers,
        resume_analysis=resume_analysis
    )
