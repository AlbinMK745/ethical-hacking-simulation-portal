"""
XP Routes — Expose XP/level data and log to the frontend.
"""

from fastapi import APIRouter, HTTPException, Header
from backend.services.xp_service import (
    get_user_xp_summary,
    award_xp,
    handle_daily_login,
    get_level_info,
    LEVEL_TABLE,
    XP_REWARDS,
)
from backend.database import get_db

router = APIRouter(prefix="/xp", tags=["XP & Levels"])


# ── GET: Full XP summary for current user ─────────────────────────────────────
@router.get("/summary")
def xp_summary(user_id: int = Header(...)):
    data = get_user_xp_summary(user_id)
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return data


# ── GET: Leaderboard with XP ──────────────────────────────────────────────────
@router.get("/leaderboard")
def xp_leaderboard(limit: int = 20, offset: int = 0):
    conn = get_db()
    cur  = conn.cursor()

    rows = cur.execute("""
        SELECT id, username, avatar, xp, level, streak
        FROM users
        WHERE role = 'user'
        ORDER BY xp DESC
        LIMIT ? OFFSET ?
    """, (limit, offset)).fetchall()

    total = cur.execute("SELECT COUNT(*) FROM users WHERE role='user'").fetchone()[0]
    conn.close()

    result = []
    for i, r in enumerate(rows):
        info = get_level_info(r["xp"] or 0)
        result.append({
            "rank":     offset + i + 1,
            "user_id":  r["id"],
            "username": r["username"],
            "avatar":   r["avatar"],
            "xp":       r["xp"] or 0,
            "level":    r["level"] or 1,
            "title":    info["title"],
            "streak":   r["streak"] or 0,
        })

    return {"total": total, "users": result}


# ── GET: XP history for current user ─────────────────────────────────────────
@router.get("/history")
def xp_history(user_id: int = Header(...), limit: int = 20):
    conn = get_db()
    cur  = conn.cursor()

    rows = cur.execute("""
        SELECT amount, reason, source_id, created_at
        FROM xp_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (user_id, limit)).fetchall()
    conn.close()

    return [
        {
            "amount":    r["amount"],
            "reason":    r["reason"],
            "source_id": r["source_id"],
            "at":        r["created_at"],
        }
        for r in rows
    ]


# ── POST: Award XP manually (admin use) ──────────────────────────────────────
@router.post("/award")
def award_xp_endpoint(user_id: int, amount: int, reason: str, source_id: int = None):
    result = award_xp(user_id, amount, reason, source_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ── POST: Handle daily login XP + streak ─────────────────────────────────────
@router.post("/login-reward")
def login_reward(user_id: int = Header(...)):
    result = handle_daily_login(user_id)
    return result


# ── GET: Level table ─────────────────────────────────────────────────────────
@router.get("/levels")
def level_table():
    return [
        {"min_xp": min_xp, "level": lvl, "title": title}
        for min_xp, lvl, title in LEVEL_TABLE
    ]


# ── GET: XP rewards table ─────────────────────────────────────────────────────
@router.get("/rewards-table")
def rewards_table():
    return XP_REWARDS
