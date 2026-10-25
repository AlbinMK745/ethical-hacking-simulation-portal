from fastapi import APIRouter, HTTPException
import sqlite3

from fastapi.params import Header

from backend.database import get_db

router = APIRouter(prefix="/user", tags=["User"])

DB_PATH = "backend/app.db"

# ---------------- PROFILE ----------------
@router.get("/profile")
def get_user_profile(user_id: int = Header(...)):
    db = get_db()
    cur = db.cursor()

    # --- USER CORE DATA ---
    user = cur.execute("""
        SELECT id, username, email, avatar, bio, github_url, portfolio_url, 
               htb_profile, thm_profile, skills, theme_color, created_at
        FROM users
        WHERE id = ?
    """, (user_id,)).fetchone()

    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")

    # --- CALCULATE POINTS & LEVEL FROM SUBMISSIONS ---
    # --- CALCULATE POINTS & LEVEL FROM SUBMISSIONS + DAILY CHALLENGES ---
    points_result = cur.execute("""
        SELECT 
            COALESCE((SELECT SUM(c.points) FROM submissions s JOIN challenges c ON c.id = s.challenge_id WHERE s.user_id = ? AND s.is_correct = 1), 0) +
            COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id=dc.id WHERE dcc.user_id = ? AND dcc.bonus_earned = 1), 0)
    """, (user_id, user_id)).fetchone()
    points = points_result[0] if points_result else 0

    # --- CHALLENGES SOLVED ---
    challenges_solved = cur.execute("""
        SELECT COUNT(*)
        FROM submissions
        WHERE user_id = ? AND is_correct = 1
    """, (user_id,)).fetchone()[0]

    # --- CALCULATE LEVEL (1 point per level) ---
    level = max(1, points // 100 + 1) if points else 1

    # --- BADGES COUNT ---
    badges_count = cur.execute("""
        SELECT COUNT(*)
        FROM user_achievements
        WHERE user_id = ?
    """, (user_id,)).fetchone()[0]

    # --- RECENT ACHIEVEMENTS ---
    achievements = cur.execute("""
        SELECT a.title, a.description
        FROM user_achievements ua
        JOIN achievements a ON a.id = ua.achievement_id
        WHERE ua.user_id = ?
        LIMIT 3
    """, (user_id,)).fetchall()

    # --- POINTS OVER TIME (CHART DATA) ---
    points_over_time = cur.execute("""
        SELECT day, SUM(points) as points
        FROM (
            SELECT DATE(s.created_at) as day, c.points
            FROM submissions s
            JOIN challenges c ON c.id = s.challenge_id
            WHERE s.user_id = ? AND s.is_correct = 1
            
            UNION ALL
            
            SELECT DATE(dcc.completed_at) as day, dc.bonus_points
            FROM daily_challenge_completions dcc
            JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id
            WHERE dcc.user_id = ? AND dcc.bonus_earned = 1
        )
        GROUP BY day
        ORDER BY day
        LIMIT 6
    """, (user_id, user_id)).fetchall()

    db.close()

    return {
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "avatar": user["avatar"],
            "bio": user["bio"],
            "github_url": user["github_url"],
            "portfolio_url": user["portfolio_url"],
            "htb_profile": user["htb_profile"],
            "thm_profile": user["thm_profile"],
            "skills": user["skills"],
            "theme_color": user["theme_color"],
            "created_at": user["created_at"],
            "points": points,
            "level": level
        },
        "challenges_solved": challenges_solved,
        "badges_count": badges_count,
        "recent_achievements": [
            {
                "title": a[0],
                "description": a[1]
            } for a in achievements
        ],
        "points_over_time": [
            {
                "date": p[0],
                "points": p[1]
            } for p in points_over_time
        ],
        "rank": 1
    }


@router.get("/dashboard/stats/{user_id}")
def get_dashboard_stats(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM challenges")
    total = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM submissions
        WHERE user_id=?
    """, (user_id,))
    attempts = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM submissions
        WHERE user_id=? AND is_correct=1
    """, (user_id,))
    solved = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM submissions
        WHERE user_id=? AND is_correct=0
    """, (user_id,))
    wrong = cursor.fetchone()[0]

    cursor.execute("""
        SELECT 
            COALESCE((SELECT SUM(c.points) FROM submissions s JOIN challenges c ON c.id = s.challenge_id WHERE s.user_id = ? AND s.is_correct = 1), 0) +
            COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id=dc.id WHERE dcc.user_id = ? AND dcc.bonus_earned = 1), 0)
    """, (user_id, user_id))
    points = cursor.fetchone()[0]

    conn.close()

    return {
        "max_challenges": total,
        "attempts": attempts,
        "solved": solved,
        "wrong": wrong,
        "points": points,
        "completion_percentage": round((solved / total) * 100, 2) if total else 0
    }

@router.get("/activity/{user_id}")
def user_activity(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT strftime('%H', created_at) AS hour,
               COUNT(*) 
        FROM submissions
        WHERE user_id=?
        GROUP BY hour
        ORDER BY hour
    """, (user_id,))

    data = [{"hour": r[0], "count": r[1]} for r in cursor.fetchall()]
    conn.close()

    return data


@router.get("/leaderboard")
def leaderboard(limit: int = None, offset: int = 0):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # total users count for pagination
    cursor.execute("SELECT COUNT(*) AS total FROM users")
    total = cursor.fetchone()["total"]

    base_sql = """
        SELECT u.id, u.username, COALESCE(SUM(c.points), 0) AS points,
               COUNT(DISTINCT s.challenge_id) AS solved
        FROM users u
        LEFT JOIN submissions s ON u.id = s.user_id AND s.is_correct=1
        LEFT JOIN challenges c ON s.challenge_id = c.id
        GROUP BY u.id
        ORDER BY points DESC
    """

    if limit is not None:
        cursor.execute(base_sql + " LIMIT ? OFFSET ?", (limit, offset))
    else:
        cursor.execute(base_sql)

    rows = cursor.fetchall()
    rows = cursor.fetchall()
    data = [{"user_id": r["id"], "username": r["username"], "points": r["points"], "rank": i+1, "solved": r["solved"]} for i, r in enumerate(rows)]
    conn.close()

    return data


@router.get("/challenges")
def list_challenges():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, title, difficulty, points
        FROM challenges
    """)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "title": r[1],
            "difficulty": r[2],
            "points": r[3]
        } for r in rows
    ]

DB = "backend/app.db"


@router.get("/{user_id}/activity")
def user_activity(user_id: int):
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("""
        SELECT strftime('%H', created_at) AS hour,
               COUNT(*) 
        FROM submissions
        WHERE user_id = ?
          AND created_at >= datetime('now', '-1 day')
        GROUP BY hour
        ORDER BY hour
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    return [
        {"hour": int(hour), "count": count}
        for hour, count in rows
    ]





@router.get("/{user_id}/dashboard")
def user_dashboard(user_id: int):
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("""
        SELECT
          COUNT(*) AS attempts,
          SUM(is_correct) AS solved
        FROM submissions
        WHERE user_id = ?
    """, (user_id,))

    row = cur.fetchone()
    conn.close()

    attempts = row[0] or 0
    solved = row[1] or 0

    accuracy = round((solved / attempts) * 100, 2) if attempts else 0

    return {
        "total_attempts": attempts,
        "solved": solved,
        "accuracy": accuracy
    }


# ---------------- ATTEMPT HISTORY ----------------
@router.get("/attempts/{user_id}")
def attempt_history(user_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT challenge_id, is_correct, submitted_flag
        FROM submissions
        WHERE user_id=?
        ORDER BY id DESC
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "challenge_id": r[0],
            "is_correct": bool(r[1]),
            "flag": r[2]
        }
        for r in rows
    ]


@router.get("/progress-graph")
def user_progress_graph(user_id: int = Header(...)):
    db = get_db()
    cur = db.cursor()

    # --- TOTAL CHALLENGES ATTEMPTED (DISTINCT CHALLENGES) ---
    total_challenges = cur.execute("""
        SELECT COUNT(DISTINCT challenge_id)
        FROM submissions
        WHERE user_id = ?
    """, (user_id,)).fetchone()[0]

    # --- TOTAL POINTS (SUM FROM CORRECT SUBMISSIONS + DAILY BONUSES) ---
    total_points = cur.execute("""
        SELECT 
            COALESCE((SELECT SUM(c.points) FROM submissions s JOIN challenges c ON c.id = s.challenge_id WHERE s.user_id = ? AND s.is_correct = 1), 0) +
            COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id=dc.id WHERE dcc.user_id = ? AND dcc.bonus_earned = 1), 0)
    """, (user_id, user_id)).fetchone()[0]

    # --- SUCCESS RATE ---
    total_submissions = cur.execute("""
        SELECT COUNT(*)
        FROM submissions
        WHERE user_id = ?
    """, (user_id,)).fetchone()[0]

    correct_submissions = cur.execute("""
        SELECT COUNT(*)
        FROM submissions
        WHERE user_id = ? AND is_correct = 1
    """, (user_id,)).fetchone()[0]

    success_rate = int((correct_submissions / total_submissions) * 100) if total_submissions else 0

    # --- CURRENT STREAK (CONSECUTIVE DAYS WITH AT LEAST ONE CORRECT SUBMISSION) ---
    streak_rows = cur.execute("""
        SELECT DATE(created_at) as day
        FROM submissions
        WHERE user_id = ? AND is_correct = 1
        GROUP BY DATE(created_at)
        ORDER BY day DESC
    """, (user_id,)).fetchall()

    streak = 0
    from datetime import datetime, timedelta

    today = datetime.today().date()
    for i, row in enumerate(streak_rows):
        row_date = datetime.fromisoformat(row[0]).date() if isinstance(row[0], str) else row[0]
        if today - timedelta(days=i) == row_date:
            streak += 1
        else:
            break

    # --- POINTS OVER TIME (BY DATE) ---
    points_over_time = cur.execute("""
        SELECT day, SUM(points) as points
        FROM (
            SELECT DATE(s.created_at) as day, c.points
            FROM submissions s
            JOIN challenges c ON c.id = s.challenge_id
            WHERE s.user_id = ? AND s.is_correct = 1
            
            UNION ALL
            
            SELECT DATE(dcc.completed_at) as day, dc.bonus_points
            FROM daily_challenge_completions dcc
            JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id
            WHERE dcc.user_id = ? AND dcc.bonus_earned = 1
        )
        GROUP BY day
        ORDER BY day DESC
        LIMIT 7
    """, (user_id, user_id)).fetchall()

    # --- WEEKLY ACTIVITY (SUBMISSIONS PER DAY OF WEEK) ---
    weekly = cur.execute("""
        SELECT CASE CAST(strftime('%w', created_at) AS INTEGER)
                WHEN 0 THEN 'Sun'
                WHEN 1 THEN 'Mon'
                WHEN 2 THEN 'Tue'
                WHEN 3 THEN 'Wed'
                WHEN 4 THEN 'Thu'
                WHEN 5 THEN 'Fri'
                WHEN 6 THEN 'Sat'
               END as weekday,
               COUNT(*) as count
        FROM submissions
        WHERE user_id = ? AND is_correct = 1
        GROUP BY strftime('%w', created_at)
    """, (user_id,)).fetchall()

    # --- CATEGORY PROGRESS (With Percentage) ---
    # 1. Get total challenges per category
    total_per_cat = {}
    cat_rows = cur.execute("SELECT category, COUNT(*) FROM challenges GROUP BY category").fetchall()
    for row in cat_rows:
        total_per_cat[row[0]] = row[1]

    # 2. Get solved per category
    solved_per_cat = {}
    solved_rows = cur.execute("""
        SELECT c.category, COUNT(DISTINCT s.challenge_id)
        FROM submissions s
        JOIN challenges c ON c.id = s.challenge_id
        WHERE s.user_id = ? AND s.is_correct = 1
        GROUP BY c.category
    """, (user_id,)).fetchall()
    for row in solved_rows:
        solved_per_cat[row[0]] = row[1]

    # 3. Build list
    category_progress = []
    for cat, total in total_per_cat.items():
        solved = solved_per_cat.get(cat, 0)
        percent = int((solved / total) * 100) if total > 0 else 0
        category_progress.append({
            "category": cat,
            "value": percent,
            "solved": solved,
            "total": total
        })

    db.close()

    return {
        "stats": {
            "total_challenges": total_challenges,
            "total_points": total_points,
            "success_rate": success_rate,
            "current_streak": streak,
            "weekly_progress": 0 # Placeholder if needed
        },
        "points_over_time": [
            {"date": p[0], "points": p[1]}
            for p in points_over_time
        ],
        "weekly_activity": [
            {"day": w[0], "count": w[1]}
            for w in weekly
        ],
        "category_progress": category_progress
    }

