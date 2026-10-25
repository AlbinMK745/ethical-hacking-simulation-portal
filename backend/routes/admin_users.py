from fastapi import APIRouter, Header
import sqlite3

router = APIRouter(prefix="/admin/users", tags=["Admin"])

DB = "backend/app.db"

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("")
def get_all_users(user_id: int = Header(...)):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            u.id,
            u.username,
            u.email,
            u.role,
            u.created_at,

            (
                COALESCE((SELECT SUM(p) FROM (SELECT DISTINCT challenge_id, c.points as p FROM submissions s JOIN challenges c ON s.challenge_id = c.id WHERE s.user_id = u.id AND s.is_correct = 1)), 0) +
                COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id WHERE dcc.user_id = u.id AND dcc.bonus_earned = 1), 0)
            ) AS total_points,

            (
                SELECT COUNT(DISTINCT s2.challenge_id) FROM submissions s2
                WHERE s2.user_id = u.id AND s2.is_correct = 1
            ) AS solved_count,

            MAX(s.created_at) AS last_active,
            u.status

        FROM users u
        LEFT JOIN submissions s ON u.id = s.user_id AND s.is_correct = 1
        WHERE u.role = 'user'
        GROUP BY u.id
        ORDER BY total_points DESC
    """)

    rows = cur.fetchall()
    conn.close()

    users = []
    for r in rows:
        points = r["total_points"]
        level = (points // 500) + 1  # simple level logic

        users.append({
            "id": r["id"],
            "username": r["username"],
            "email": r["email"],
            "status": r["status"] or "active",
            "level": level,
            "points": points,
            "challenges": r["solved_count"],
            "last_active": r["last_active"]
        })

    return users


@router.get("/{user_id}/profile")
def get_user_profile_admin(user_id: int, admin_user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()

    # 1. Basic Info
    cur.execute("""
        SELECT id, username, email, role, status, created_at, avatar, bio,
               points, level
        FROM users
        WHERE id = ?
    """, (user_id,))
    user = cur.fetchone()
    if not user:
        conn.close()
        return {"error": "User not found"}

    # 2. Solved Challenges Count
    cur.execute("""
        SELECT COUNT(*) FROM submissions
        WHERE user_id = ? AND is_correct = 1
    """, (user_id,))
    solved_count = cur.fetchone()[0]

    # 3. Recent Activity
    cur.execute("""
        SELECT c.title, s.is_correct, s.created_at
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT 5
    """, (user_id,))
    activity = [dict(r) for r in cur.fetchall()]

    conn.close()

    return {
        "user": dict(user),
        "solved_count": solved_count,
        "recent_activity": activity
    }
