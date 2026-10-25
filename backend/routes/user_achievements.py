from fastapi import APIRouter
import sqlite3
from datetime import datetime

router = APIRouter(
    prefix="/user/achievements",
    tags=["User Achievements"]
)

DB_PATH = "backend/app.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# 1️⃣ GET ALL ACHIEVEMENTS WITH USER PROGRESS
@router.get("/{user_id}")
def get_achievements(user_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            a.id,
            a.title,
            a.description,
            a.points,
            a.icon,
            a.target,
            ua.progress,
            ua.unlocked_at
        FROM achievements a
        LEFT JOIN user_achievements ua
          ON a.id = ua.achievement_id
         AND ua.user_id = ?
        ORDER BY a.id
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "points": r["points"],
            "icon": r["icon"],
            "target": r["target"],
            "progress": r["progress"] or 0,
            "unlocked": r["unlocked_at"] is not None,
            "unlocked_at": r["unlocked_at"]
        }
        for r in rows
    ]
