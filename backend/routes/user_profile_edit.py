from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import sqlite3

from backend.database import get_db

router = APIRouter(prefix="/user", tags=["User Profile"])
DB_PATH = "backend/app.db"


# Pydantic models for request bodies
class UpdateProfileRequest(BaseModel):
    username: str
    email: str
    avatar: str = 'default'
    bio: str = ''
    github_url: str = ''
    portfolio_url: str = ''
    htb_profile: str = ''
    thm_profile: str = ''
    skills: str = '[]'  # JSON string
    theme_color: str = '#00ffbf'
    country: str = ''
    hacker_title: str = ''
    twitter_url: str = ''
    linkedin_url: str = ''


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.put("/update-profile")
def update_profile(
    profile_data: UpdateProfileRequest,
    user_id: int = Header(...)
):
    """Update user profile with enhanced fields"""
    db = get_db()
    cur = db.cursor()
    
    # Check if new username/email already exists (for other users)
    existing = cur.execute("""
        SELECT id FROM users 
        WHERE (username = ? OR email = ?) AND id != ?
    """, (profile_data.username, profile_data.email, user_id)).fetchone()
    
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Username or email already taken")
    
    # Update the profile with all new fields
    cur.execute("""
        UPDATE users
        SET username = ?, 
            email = ?,
            avatar = ?,
            bio = ?,
            github_url = ?,
            portfolio_url = ?,
            htb_profile = ?,
            thm_profile = ?,
            skills = ?,
            theme_color = ?,
            country = ?,
            hacker_title = ?,
            twitter_url = ?,
            linkedin_url = ?
        WHERE id = ?
    """, (
        profile_data.username, 
        profile_data.email,
        profile_data.avatar,
        profile_data.bio,
        profile_data.github_url,
        profile_data.portfolio_url,
        profile_data.htb_profile,
        profile_data.thm_profile,
        profile_data.skills,
        profile_data.theme_color,
        profile_data.country,
        profile_data.hacker_title,
        profile_data.twitter_url,
        profile_data.linkedin_url,
        user_id
    ))
    
    db.commit()
    db.close()
    
    return {"success": True, "message": "Profile updated successfully"}


@router.put("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    user_id: int = Header(...)
):
    """Change user password"""
    db = get_db()
    cur = db.cursor()
    
    # Get current password
    user = cur.execute("""
        SELECT password FROM users WHERE id = ?
    """, (user_id,)).fetchone()
    
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password (plain text comparison)
    if password_data.current_password != user[0]:
        db.close()
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Update the password (store as plain text)
    cur.execute("""
        UPDATE users
        SET password = ?
        WHERE id = ?
    """, (password_data.new_password, user_id))
    
    db.commit()
    db.close()
    
    return {"success": True, "message": "Password changed successfully"}

