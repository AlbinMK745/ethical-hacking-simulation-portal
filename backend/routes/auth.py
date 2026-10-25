from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3

router = APIRouter(prefix="/auth", tags=["Auth"])

DB_PATH = "backend/app.db"

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(data: LoginRequest):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            id,
            username,
            email,
            role
        FROM users
        WHERE username = ? AND password = ?
    """, (data.username, data.password))

    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "user_id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],

        # ✅ DEFAULTS (FRONTEND EXPECTS THESE)
        "level": 1,
        "points": 0
    }

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

@router.post("/register")
def register(data: RegisterRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if username exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (data.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")

    # Check if email exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (data.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already exists")

    try:
        cursor.execute("""
            INSERT INTO users (username, email, password, role, status, level, points, created_at)
            VALUES (?, ?, ?, 'user', 'active', 1, 0, datetime('now'))
        """, (data.username, data.email, data.password))
        
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()

        return {
            "message": "Identity Forged Successfully",
            "user_id": user_id,
            "username": data.username
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
