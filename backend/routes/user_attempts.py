from fastapi import APIRouter, Header
import sqlite3

router = APIRouter(prefix="/user/attempts", tags=["User Attempts"])

DB = "backend/app.db"

def get_db():
    return sqlite3.connect(DB)


@router.get("/")
def attempt_history(user_id: int = Header(...)):
    conn = get_db()
    cur = conn.cursor()

    # 1. Fetch detailed attempt history
    # Join challenge_attempts with challenges and check daily_challenges
    cur.execute("""
        SELECT 
            c.title, 
            a.submitted_flag, 
            a.is_correct, 
            a.attempted_at,
            c.category,
            c.difficulty,
            c.points,
            CASE WHEN dc.id IS NOT NULL THEN 1 ELSE 0 END as is_daily
        FROM challenge_attempts a
        JOIN challenges c ON c.id = a.challenge_id
        LEFT JOIN daily_challenges dc ON dc.challenge_id = c.id 
            AND date(dc.challenge_date) = date(a.attempted_at)
        WHERE a.user_id = ?
        ORDER BY a.attempted_at DESC
    """, (user_id,))

    rows = cur.fetchall()
    
    attempts = [
        {
            "title": r[0],
            "submitted_flag": r[1],
            "is_correct": bool(r[2]),
            "attempted_at": r[3],
            "category": r[4],
            "difficulty": r[5],
            "points": r[6],
            "is_daily": bool(r[7])
        } for r in rows
    ]

    # 2. Calculate Stats
    total = len(attempts)
    completed = len([a for a in attempts if a["is_correct"]])
    failed = total - completed
    success_rate = (completed / total * 100) if total > 0 else 0

    conn.close()
    
    return {
        "stats": {
            "total": total,
            "completed": completed,
            "failed": failed,
            "success_rate": round(success_rate, 1)
        },
        "history": attempts
    }


@router.get("/{user_id}")
def attempt_history_legacy(user_id: int):
    # Keep legacy support for the old table view if needed elsewhere
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            COALESCE(s.display_title, c.title) as title,
            c.category,
            c.points,
            s.submitted_flag,
            s.is_correct,
            s.created_at
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    """, (user_id,))
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "title": r[0],
            "category": r[1],
            "points": r[2],
            "submitted_flag": r[3],
            "is_correct": bool(r[4]),
            "submitted_at": r[5]
        } for r in rows
    ]


@router.post("/log")
def log_attempt_start(data: dict):
    # Endpoint to log that a user STARTED a challenge (e.g. Daily Challenge)
    # We create a submission record with NULL submit info or a specialized status if we had one.
    # For now, we'll store it as an incorrect submission or just a placeholder?
    # Actually, usually 'attempts' implies a submission.
    # If the user just "starts" it, maybe we logging it as a view is better?
    # BUT, the user specifically asked for "Attempt History".
    # So we will insert a record that looks like an attempt but maybe with a flag like "STARTED".
    
    user_id = data.get("user_id")
    challenge_id = data.get("challenge_id")
    display_title = data.get("display_title")

    if not user_id or not challenge_id:
        return {"error": "Missing data"}

    conn = get_db()
    cur = conn.cursor()

    # Insert a record. We can set is_correct=0 and submitted_flag="STARTED" to indicate it's just a start/view event for tracking
    cur.execute("""
        INSERT INTO submissions (user_id, challenge_id, submitted_flag, is_correct, display_title)
        VALUES (?, ?, 'STARTED', 0, ?)
    """, (user_id, challenge_id, display_title))

    conn.commit()
    conn.close()

    return {"status": "logged"}
