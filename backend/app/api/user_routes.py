from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.utils.auth import (
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(tags=["User Profile"])


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    pronouns: Optional[str] = None
    preferred_language: Optional[str] = None
    target_role: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/users/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "user": current_user.to_dict()
    }


@router.put("/users/profile")
def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.name is not None and data.name.strip():
        current_user.name = data.name.strip()
    if data.pronouns is not None:
        current_user.pronouns = data.pronouns.strip()
    if data.preferred_language is not None:
        current_user.preferred_language = data.preferred_language.strip()
    if data.target_role is not None:
        current_user.target_role = data.target_role.strip()

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "user": current_user.to_dict()
    }


@router.put("/users/password")
def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )

    current_user.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
