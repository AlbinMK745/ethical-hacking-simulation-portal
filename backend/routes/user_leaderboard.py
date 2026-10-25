from fastapi import APIRouter
from ..database import get_db

router = APIRouter(
    prefix="/user/leaderboard-data",
    tags=["User Leaderboard"]
)


@router.get("")
def leaderboard():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            u.id AS user_id,
            u.username,
            (
                COALESCE((SELECT SUM(p) FROM (SELECT DISTINCT challenge_id, c.points as p FROM submissions s JOIN challenges c ON s.challenge_id=c.id WHERE s.user_id=u.id AND s.is_correct=1)), 0) +
                COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id=dc.id WHERE dcc.user_id=u.id AND dcc.bonus_earned=1), 0)
            ) AS total_points,
            COUNT(DISTINCT s.challenge_id) AS solved_challenges
        FROM users u
        LEFT JOIN submissions s
            ON u.id = s.user_id AND s.is_correct = 1
        WHERE u.role = 'user'
        GROUP BY u.id
        ORDER BY total_points DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    leaderboard = []
    rank = 1

    for row in rows:
        leaderboard.append({
            "rank": rank,
            "user_id": row["user_id"],
            "username": row["username"],
            "points": row["total_points"],
            "solved": row["solved_challenges"]
        })
        rank += 1

    return leaderboard
