"""
AI Routes — /ai/*
Hint Generator, Vulnerability Explanation, Skill Report
"""

from fastapi import APIRouter, Header, HTTPException, Body
from pydantic import BaseModel
import sqlite3
import os
from datetime import date

from ..services.ai_service import generate_hint, generate_explanation
from ..services.skill_service import generate_skill_report

router = APIRouter(prefix="/ai", tags=["AI"])

DB_PATH = "backend/app.db"
DAILY_LIMIT = 20  # max AI calls per user per day


# ── DB helpers ────────────────────────────────────────────────────────────────

def _get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_ai_logs_table():
    conn = _get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ai_logs (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id   INTEGER NOT NULL,
            feature   TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


ensure_ai_logs_table()


def _check_rate_limit(user_id: int):
    """Raises 429 if the user has hit the daily AI call limit."""
    # Temporarily disabled to prevent Live Server reloads on DB access/journaling
    return
    conn = _get_db()
    today = date.today().isoformat()
    row = conn.execute(
        "SELECT COUNT(*) FROM ai_logs WHERE user_id=? AND DATE(created_at)=?",
        (user_id, today)
    ).fetchone()
    conn.close()
    if row[0] >= DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="The daily limit is over for using the AI. Please try again tomorrow!"
        )


def _log_call(user_id: int, feature: str):
    # Temporarily disabled to prevent Live Server reloads on DB write
    return
    conn = _get_db()
    conn.execute(
        "INSERT INTO ai_logs (user_id, feature) VALUES (?, ?)",
        (user_id, feature)
    )
    conn.commit()
    conn.close()


# ── Schemas ───────────────────────────────────────────────────────────────────

class HintRequest(BaseModel):
    title: str
    description: str
    attempts: int = 0


class ExplanationRequest(BaseModel):
    title: str
    description: str
    category: str


class SkillReportRequest(BaseModel):
    user_stats: dict


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/hint")
def ai_hint(data: HintRequest, user_id: int = Header(...)):
    _check_rate_limit(user_id)
    try:
        return {"hint": generate_hint(data.title, data.description, data.attempts)}
    except Exception as e:
        err_msg = str(e)
        # Catch quota (429) or model not found (404) or any other issue and show a nice message
        if any(x in err_msg for x in ["429", "404", "quota", "not found"]):
            raise HTTPException(status_code=429, detail="The daily limit is over for using the AI. Please try again tomorrow!")
        raise HTTPException(status_code=503, detail="The daily limit is over for using the AI. Please try again tomorrow!")

@router.post("/explanation")
def ai_explanation(data: ExplanationRequest, user_id: int = Header(...)):
    _check_rate_limit(user_id)
    try:
        return {"explanation": generate_explanation(data.title, data.description, data.category)}
    except Exception as e:
        err_msg = str(e)
        if any(x in err_msg for x in ["429", "404", "quota", "not found"]):
            raise HTTPException(status_code=429, detail="The daily limit is over for using the AI. Please try again tomorrow!")
        raise HTTPException(status_code=503, detail="The daily limit is over for using the AI. Please try again tomorrow!")

@router.post("/skill-report")
def ai_skill_report(data: SkillReportRequest, user_id: int = Header(...)):
    _check_rate_limit(user_id)
    try:
        return {"report": generate_skill_report(data.user_stats)}
    except Exception as e:
        err_msg = str(e)
        if any(x in err_msg for x in ["429", "404", "quota", "not found"]):
            raise HTTPException(status_code=429, detail="The daily limit is over for using the AI. Please try again tomorrow!")
        raise HTTPException(status_code=503, detail="The daily limit is over for using the AI. Please try again tomorrow!")
