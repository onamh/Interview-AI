import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

# ==================================================
# 1. Users Table
# ==================================================
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Candidate")
    profile_picture = Column(String(255), nullable=True)
    preferred_language = Column(String(50), default="English")
    pronouns = Column(String(50), nullable=True)
    target_role = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "profile_picture": self.profile_picture,
            "preferred_language": self.preferred_language,
            "pronouns": self.pronouns,
            "target_role": self.target_role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ==================================================
# 2. Resumes Table
# ==================================================
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    candidate_name = Column(String(120), nullable=True)
    summary = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)          # JSON list of detected skills
    projects = Column(Text, nullable=True)        # JSON list of detected projects
    experience = Column(Text, nullable=True)      # JSON list of experience
    education = Column(Text, nullable=True)       # JSON list of education
    strengths = Column(Text, nullable=True)       # JSON list of candidate strengths
    weaknesses = Column(Text, nullable=True)      # JSON list of candidate weaknesses
    extracted_text = Column(Text, nullable=True)  # Raw extracted text
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    interviews = relationship("Interview", back_populates="resume")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "candidate_name": self.candidate_name,
            "summary": self.summary,
            "skills": json.loads(self.skills) if self.skills else [],
            "projects": json.loads(self.projects) if self.projects else [],
            "experience": json.loads(self.experience) if self.experience else [],
            "education": json.loads(self.education) if self.education else [],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ==================================================
# 3. Interviews Table
# ==================================================
class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True, index=True)

    role = Column(String(120), nullable=False)
    language = Column(String(80), nullable=False)
    experience = Column(String(50), default="Beginner")
    difficulty = Column(String(50), default="Medium")
    interview_type = Column(String(50), default="Technical")
    total_questions = Column(Integer, default=5)
    current_question = Column(Integer, default=1)
    follow_up = Column(Boolean, default=True)
    job_description = Column(Text, nullable=True)
    status = Column(String(30), default="in_progress")  # "in_progress", "completed"

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="interviews")
    resume = relationship("Resume", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan", order_by="Question.sequence")
    answers = relationship("Answer", back_populates="interview", cascade="all, delete-orphan")
    evaluation = relationship("Evaluation", back_populates="interview", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "resume_id": self.resume_id,
            "role": self.role,
            "language": self.language,
            "experience": self.experience,
            "difficulty": self.difficulty,
            "interview_type": self.interview_type,
            "total_questions": self.total_questions,
            "current_question": self.current_question,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "score": self.evaluation.overall_score if self.evaluation else None,
            "technical_score": self.evaluation.technical_score if self.evaluation else None,
            "communication_score": self.evaluation.communication_score if self.evaluation else None,
        }


# ==================================================
# 4. Questions Table
# ==================================================
class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String(36), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_question_id = Column(String(36), nullable=True)
    sequence = Column(Integer, nullable=False)          # 1, 2, 3...
    topic = Column(String(150), nullable=True)          # Roadmap topic
    question_text = Column(Text, nullable=False)
    is_follow_up = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")


# ==================================================
# 5. Answers Table
# ==================================================
class Answer(Base):
    __tablename__ = "answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String(36), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_answer = Column(Text, nullable=False)
    word_count = Column(Integer, default=0)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="answers")
    question = relationship("Question", back_populates="answers")


# ==================================================
# 6. Evaluations Table
# ==================================================
class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String(36), ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    overall_score = Column(Integer, default=0)
    technical_score = Column(Integer, default=0)
    communication_score = Column(Integer, default=0)
    clarity_score = Column(Integer, default=0)
    structure_score = Column(Integer, default=0)
    confidence_score = Column(Integer, default=0)
    strengths = Column(Text, nullable=True)             # JSON list of strengths
    weaknesses = Column(Text, nullable=True)            # JSON list of weaknesses
    suggestions = Column(Text, nullable=True)           # JSON list of suggestions
    overall_feedback = Column(Text, nullable=True)
    question_critiques = Column(Text, nullable=True)    # JSON array of per-question review
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="evaluation")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "overall_score": self.overall_score,
            "technical_score": self.technical_score,
            "communication_score": self.communication_score,
            "clarity_score": self.clarity_score or self.communication_score,
            "structure_score": self.structure_score or self.technical_score,
            "confidence_score": self.confidence_score or max(60, self.overall_score - 5),
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "weaknesses": json.loads(self.weaknesses) if self.weaknesses else [],
            "suggestions": json.loads(self.suggestions) if self.suggestions else [],
            "overall_feedback": self.overall_feedback,
            "question_reviews": json.loads(self.question_critiques) if self.question_critiques else [],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
