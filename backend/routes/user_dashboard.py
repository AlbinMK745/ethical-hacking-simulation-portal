from fastapi import APIRouter, Header
import sqlite3

router = APIRouter(prefix="/user/dashboard", tags=["User Dashboard"])

DB = "backend/app.db"

def get_db():
    return sqlite3.connect(DB)

@router.get("/tutorials")
def get_tutorials(user_id: int = Header(..., alias="user-id")):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT id, title, content, category, created_at
        FROM tutorials
        ORDER BY created_at DESC
    """)

    rows = cur.fetchall()

    return [
        {
            "id": r[0],
            "title": r[1],
            "content": r[2],
            "category": r[3],
            "created_at": r[4]
        }
        for r in rows
    ]




@router.get("/stats/{user_id}")
def user_dashboard(user_id: int):
    conn = get_db()
    cur = conn.cursor()

    # Total challenges
    cur.execute("SELECT COUNT(*) FROM challenges")
    total_challenges = cur.fetchone()[0]

    # Total attempts
    cur.execute(
        "SELECT COUNT(*) FROM submissions WHERE user_id = ?",
        (user_id,)
    )
    total_attempts = cur.fetchone()[0]

    # Solved
    cur.execute(
        "SELECT COUNT(*) FROM submissions WHERE user_id = ? AND is_correct = 1",
        (user_id,)
    )
    solved = cur.fetchone()[0]

    # Wrong
    cur.execute(
        "SELECT COUNT(*) FROM submissions WHERE user_id = ? AND is_correct = 0",
        (user_id,)
    )
    wrong = cur.fetchone()[0]

    # Points earned (Challenges + Daily Bonuses)
    cur.execute("""
        SELECT (
            COALESCE((SELECT SUM(p) FROM (SELECT DISTINCT challenge_id, c.points as p FROM submissions s JOIN challenges c ON s.challenge_id = c.id WHERE s.user_id = ? AND s.is_correct = 1)), 0) +
            COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id WHERE dcc.user_id = ? AND dcc.bonus_earned = 1), 0)
        )
    """, (user_id, user_id))
    points = cur.fetchone()[0]

    # Get User Status
    cur.execute("SELECT status FROM users WHERE id = ?", (user_id,))
    status_row = cur.fetchone()
    status = status_row[0] if status_row else "active"

    conn.close()

    completion_percentage = (
        round((solved / total_challenges) * 100, 2)
        if total_challenges > 0 else 0
    )

    return {
        "user_id": user_id,
        "status": status,
        "total_challenges": total_challenges,
        "attempts": total_attempts,
        "solved": solved,
        "wrong": wrong,
        "points": points,
        "completion_percentage": completion_percentage
    }



@router.post("/recently-viewed")
def log_recently_viewed(
    data: dict,
    user_id: int = Header(..., alias="user-id")
):
    item_id = data.get("item_id")
    item_type = data.get("item_type")
    title = data.get("title", "Unknown Item")
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT id FROM recently_viewed
        WHERE user_id=? AND item_type=? AND item_id=?
    """, (user_id, item_type, item_id))

    row = cur.fetchone()

    if row:
        cur.execute("""
            UPDATE recently_viewed
            SET last_viewed_at=CURRENT_TIMESTAMP, title=?
            WHERE id=?
        """, (title, row[0]))
    else:
        cur.execute("""
            INSERT INTO recently_viewed (user_id, item_type, item_id, title)
            VALUES (?, ?, ?, ?)
        """, (user_id, item_type, item_id, title))

    conn.commit()
    conn.close()

    return {"status": "logged"}


@router.get("/recently-viewed")
def get_recently_viewed(user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Join recently_viewed with user_module_progress to get progress and completion status
    cur.execute("""
        SELECT rv.item_id, rv.item_type, rv.title, rv.last_viewed_at, 
               m.difficulty, m.category,
               COALESCE(ump.progress_percent, 0) as progress_percent,
               COALESCE(ump.completed, 0) as completed
        FROM recently_viewed rv
        LEFT JOIN modules m ON rv.item_id = m.id AND rv.item_type = 'tutorial'
        LEFT JOIN user_module_progress ump ON rv.item_id = ump.module_id AND rv.user_id = ump.user_id
        WHERE rv.user_id = ?
        ORDER BY rv.last_viewed_at DESC
        LIMIT 5
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    return [dict(r) for r in rows]
