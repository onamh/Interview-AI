from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = data.email.strip().lower()
    clean_name = data.name.strip()

    if not clean_name:
        raise HTTPException(status_code=400, detail="Name is required")
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    hashed = hash_password(data.password)
    user = User(
        name=clean_name,
        email=clean_email,
        password_hash=hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "name": user.name})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }


@router.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    clean_email = data.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": user.id, "email": user.email, "name": user.name})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }


@router.post("/auth/demo-login")
def demo_login(db: Session = Depends(get_db)):
    """One-click instant login for viva, presentation, and quick teacher demo."""
    demo_email = "candidate@interviewcoach.edu"
    user = db.query(User).filter(User.email == demo_email).first()

    if not user:
        user = User(
            name="Aarav Sharma (Demo Candidate)",
            email=demo_email,
            password_hash=hash_password("DemoPassword123"),
            role="Candidate",
            target_role="Full Stack Engineer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "name": user.name})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
        "is_demo": True
    }


@router.post("/auth/logout")
def logout():
    return {"message": "Logged out successfully"}


@router.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user": current_user.to_dict()
    }
