from fastapi import APIRouter, Header
from backend.database import get_db

router = APIRouter(prefix="/user/profile", tags=["User Profile"])


@router.get("/")
def get_profile(user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()

    # 1️⃣ USER BASIC INFO
    cur.execute("""
        SELECT username, email, points, level, bio, created_at,
               avatar, github_url, portfolio_url, htb_profile, thm_profile,
               skills, theme_color, country, hacker_title, twitter_url, linkedin_url,
               streak, last_active, xp
        FROM users
        WHERE id = ?
    """, (user_id,))


    user = dict(cur.fetchone())

    # 1b. Calculate TRUE points from submissions + daily bonuses (same formula as dashboard)
    cur.execute("""
        SELECT (
            COALESCE((SELECT SUM(p) FROM (SELECT DISTINCT challenge_id, c.points as p FROM submissions s JOIN challenges c ON s.challenge_id = c.id WHERE s.user_id = ? AND s.is_correct = 1)), 0) +
            COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id WHERE dcc.user_id = ? AND dcc.bonus_earned = 1), 0)
        ) AS real_points
    """, (user_id, user_id))
    real_points = cur.fetchone()["real_points"] or 0

    # Override stale stored values with calculated ones
    user["points"] = real_points
    user["level"] = (real_points // 100) + 1

    # Keep the users table in sync
    cur.execute("UPDATE users SET points = ?, level = ? WHERE id = ?", (real_points, user["level"], user_id))
    conn.commit()

    # 2️⃣ CHALLENGES SOLVED
    cur.execute("""
        SELECT COUNT(*) AS solved
        FROM submissions
        WHERE user_id = ? AND is_correct = 1
    """, (user_id,))

    challenges_solved = cur.fetchone()["solved"]

    # 3️⃣ BADGES COUNT
    cur.execute("""
        SELECT COUNT(*) AS badges
        FROM user_achievements
        WHERE user_id = ? AND unlocked_at IS NOT NULL
    """, (user_id,))
    badges_count = cur.fetchone()["badges"]

    # 4️⃣ USER RANK (POINTS BASED)
    cur.execute("""
        SELECT COUNT(*) + 1 AS rank
        FROM users
        WHERE points > ?
    """, (user["points"],))
    rank = cur.fetchone()["rank"]

    # 5️⃣ RECENT ACHIEVEMENTS
    cur.execute("""
        SELECT a.title, a.description, ua.unlocked_at
        FROM user_achievements ua
        JOIN achievements a ON a.id = ua.achievement_id
        WHERE ua.user_id = ?
        ORDER BY ua.unlocked_at DESC
        LIMIT 3
    """, (user_id,))
    recent_achievements = [dict(r) for r in cur.fetchall()]

    # 6️⃣ POINTS OVER TIME (LAST 6 WEEKS)
    cur.execute("""
        SELECT strftime('%W', s.created_at) AS week,
            COALESCE(SUM(c.points), 0) AS total
        FROM submissions s
        JOIN challenges c ON c.id = s.challenge_id
        WHERE s.user_id = ? AND s.is_correct = 1
        GROUP BY week
        ORDER BY week DESC
        LIMIT 6
    """, (user_id,))

    points_over_time = list(reversed([
        r["total"] for r in cur.fetchall()
    ]))

    # 7️⃣ SKILLS BREAKDOWN (CATEGORY %)
    cur.execute("""
        SELECT c.category, COUNT(*) * 100.0 /
            (SELECT COUNT(*) FROM submissions WHERE user_id = ?) AS percent
        FROM submissions s
        JOIN challenges c ON c.id = s.challenge_id
        WHERE s.user_id = ?
        GROUP BY c.category
    """, (user_id, user_id))
    skills = {r["category"]: int(r["percent"]) for r in cur.fetchall()}

    conn.close()

    return {
        "user": user,
        "challenges_solved": challenges_solved,
        "badges_count": badges_count,
        "rank": rank,
        "recent_achievements": recent_achievements,
        "points_over_time": points_over_time,
        "skills": skills
    }
