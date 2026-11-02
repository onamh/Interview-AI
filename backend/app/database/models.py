import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Candidate")
    created_at = Column(DateTime, default=datetime.utcnow)

    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    
    role = Column(String(120), nullable=False)
    language = Column(String(80), nullable=False)
    difficulty = Column(String(50), default="Medium")
    experience = Column(String(50), default="Beginner")
    interview_type = Column(String(50), default="Technical")
    total_questions = Column(Integer, default=5)
    current_question = Column(Integer, default=1)
    status = Column(String(30), default="in_progress")  # in_progress, completed

    # JSON stored as text
    resume_analysis = Column(Text, nullable=True)
    roadmap = Column(Text, nullable=True)
    questions = Column(Text, nullable=True)
    answers = Column(Text, nullable=True)

    # Evaluation results
    overall_score = Column(Integer, default=0)
    technical_score = Column(Integer, default=0)
    communication_score = Column(Integer, default=0)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)
    overall_feedback = Column(Text, nullable=True)
    question_reviews = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="interviews")
