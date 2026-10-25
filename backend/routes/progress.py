from fastapi import APIRouter, HTTPException
from ..database import get_db

router = APIRouter(
    prefix="/progress",
    tags=["User Progress"]
)

@router.get("/{user_id}")
def get_user_progress(user_id: int):
    conn = get_db()
    cursor = conn.cursor()

    # Total challenges
    cursor.execute("SELECT COUNT(*) FROM challenges")
    total_challenges = cursor.fetchone()[0]

    # Solved challenges
    cursor.execute("""
        SELECT COUNT(*) FROM submissions
        WHERE user_id = ? AND is_correct = 1
    """, (user_id,))
    solved = cursor.fetchone()[0]

    # Wrong submissions
    cursor.execute("""
        SELECT COUNT(*) FROM submissions
        WHERE user_id = ? AND is_correct = 0
    """, (user_id,))
    wrong = cursor.fetchone()[0]

    # Points earned
    cursor.execute("""
        SELECT COALESCE(SUM(c.points), 0)
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id = ? AND s.is_correct = 1
    """, (user_id,))
    points = cursor.fetchone()[0]

    completion = (
        round((solved / total_challenges) * 100, 2)
        if total_challenges > 0 else 0
    )

    return {
        "user_id": user_id,
        "total_challenges": total_challenges,
        "solved": solved,
        "wrong": wrong,
        "unsolved": total_challenges - solved,
        "points": points,
        "completion_percentage": completion
    }
