from fastapi import APIRouter, Header
from backend.database import get_db
from datetime import datetime, timedelta

router = APIRouter(prefix="/user/profile", tags=["User Profile Extended"])


@router.get("/activity-heatmap")
def get_activity_heatmap(user_id: int = Header(..., alias="user-id")):
    """Returns daily activity counts for last 180 days (for GitHub-style heatmap)"""
    conn = get_db()
    cur = conn.cursor()

    since = (datetime.utcnow() - timedelta(days=180)).strftime("%Y-%m-%d")

    # Submission activity
    cur.execute("""
        SELECT DATE(submitted_at) as day, COUNT(*) as count
        FROM submissions
        WHERE user_id = ? AND submitted_at >= ?
        GROUP BY day
    """, (user_id, since))
    submission_rows = {r["day"]: r["count"] for r in cur.fetchall()}

    # Daily challenge activity
    cur.execute("""
        SELECT DATE(completed_at) as day, COUNT(*) as count
        FROM daily_challenge_completions
        WHERE user_id = ? AND completed_at >= ?
        GROUP BY day
    """, (user_id, since))
    daily_rows = {}
    for r in cur.fetchall():
        d = r["day"]
        daily_rows[d] = r["count"]

    # Merge
    merged = {}
    for day, cnt in submission_rows.items():
        merged[day] = merged.get(day, 0) + cnt
    for day, cnt in daily_rows.items():
        merged[day] = merged.get(day, 0) + cnt

    conn.close()
    return {"heatmap": merged}


@router.get("/xp-history")
def get_xp_history(user_id: int = Header(..., alias="user-id")):
    """Returns XP earned per day for last 30 days"""
    conn = get_db()
    cur = conn.cursor()

    since = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")

    # Try xp_transactions first
    try:
        cur.execute("""
            SELECT DATE(created_at) as day, SUM(amount) as xp
            FROM xp_transactions
            WHERE user_id = ? AND created_at >= ?
            GROUP BY day
            ORDER BY day ASC
        """, (user_id, since))
        rows = [{"day": r["day"], "xp": r["xp"]} for r in cur.fetchall()]
    except Exception:
        rows = []

    # Fallback: use submissions points per day
    if not rows:
        cur.execute("""
            SELECT DATE(s.submitted_at) as day, SUM(c.points) as xp
            FROM submissions s
            JOIN challenges c ON c.id = s.challenge_id
            WHERE s.user_id = ? AND s.is_correct = 1 AND s.submitted_at >= ?
            GROUP BY day
            ORDER BY day ASC
        """, (user_id, since))
        rows = [{"day": r["day"], "xp": r["xp"]} for r in cur.fetchall()]

    conn.close()
    return {"xp_history": rows}


@router.get("/all-achievements")
def get_all_achievements(user_id: int = Header(..., alias="user-id")):
    """Returns ALL achievements with user unlock status and progress"""
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            a.id, a.title, a.description, a.points, a.icon, a.target,
            ua.progress, ua.unlocked_at
        FROM achievements a
        LEFT JOIN user_achievements ua
            ON a.id = ua.achievement_id AND ua.user_id = ?
        ORDER BY ua.unlocked_at DESC NULLS LAST, a.id ASC
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    achievements = []
    for r in rows:
        pts = r["points"] or 0
        # Rarity by points
        if pts >= 500:
            rarity = "Legendary"
        elif pts >= 200:
            rarity = "Epic"
        elif pts >= 100:
            rarity = "Rare"
        else:
            rarity = "Common"

        achievements.append({
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "points": pts,
            "icon": r["icon"],
            "target": r["target"],
            "progress": r["progress"] or 0,
            "unlocked": r["unlocked_at"] is not None,
            "unlocked_at": r["unlocked_at"],
            "rarity": rarity
        })

    return {"achievements": achievements}


@router.get("/activity-feed")
def get_activity_feed(user_id: int = Header(..., alias="user-id")):
    """Returns recent activity feed items (last 20 events)"""
    conn = get_db()
    cur = conn.cursor()

    events = []

    # Recent correct submissions
    cur.execute("""
        SELECT s.submitted_at as ts, c.title, c.points, c.category
        FROM submissions s
        JOIN challenges c ON c.id = s.challenge_id
        WHERE s.user_id = ? AND s.is_correct = 1
        ORDER BY s.submitted_at DESC
        LIMIT 8
    """, (user_id,))
    for r in cur.fetchall():
        events.append({
            "type": "challenge",
            "title": f"Solved: {r['title']}",
            "detail": f"+{r['points']} pts  •  {r['category']}",
            "ts": r["ts"],
            "icon": "fa-flag-checkered",
            "color": "#00ffbf"
        })

    # Recent achievements unlocked
    cur.execute("""
        SELECT ua.unlocked_at as ts, a.title, a.points
        FROM user_achievements ua
        JOIN achievements a ON a.id = ua.achievement_id
        WHERE ua.user_id = ? AND ua.unlocked_at IS NOT NULL
        ORDER BY ua.unlocked_at DESC
        LIMIT 5
    """, (user_id,))
    for r in cur.fetchall():
        events.append({
            "type": "achievement",
            "title": f"Unlocked: {r['title']}",
            "detail": f"+{r['points']} achievement pts",
            "ts": r["ts"],
            "icon": "fa-medal",
            "color": "#ffd700"
        })

    # Recent daily challenge completions
    try:
        cur.execute("""
            SELECT dcc.completed_at as ts, dc.title, dc.bonus_points
            FROM daily_challenge_completions dcc
            JOIN daily_challenges dc ON dc.id = dcc.daily_challenge_id
            WHERE dcc.user_id = ?
            ORDER BY dcc.completed_at DESC
            LIMIT 5
        """, (user_id,))
        for r in cur.fetchall():
            events.append({
                "type": "daily",
                "title": f"Daily Challenge: {r['title']}",
                "detail": f"+{r['bonus_points']} bonus pts",
                "ts": r["ts"],
                "icon": "fa-calendar-check",
                "color": "#a855f7"
            })
    except Exception:
        pass

    # Sort all events by timestamp descending
    def parse_ts(e):
        ts = e.get("ts") or ""
        try:
            return datetime.fromisoformat(str(ts).replace("Z", ""))
        except Exception:
            return datetime.min

    events.sort(key=parse_ts, reverse=True)

    conn.close()
    return {"feed": events[:20]}


@router.get("/extended-stats")
def get_extended_stats(user_id: int = Header(..., alias="user-id")):
    """Returns win rate, streak, sandbox sessions, notes count, saved count"""
    conn = get_db()
    cur = conn.cursor()

    # Win rate
    cur.execute("SELECT COUNT(*) as total FROM submissions WHERE user_id = ?", (user_id,))
    total_attempts = cur.fetchone()["total"] or 0

    cur.execute("SELECT COUNT(*) as correct FROM submissions WHERE user_id = ? AND is_correct = 1", (user_id,))
    correct = cur.fetchone()["correct"] or 0

    win_rate = round((correct / total_attempts) * 100, 1) if total_attempts > 0 else 0.0

    # Streak
    cur.execute("SELECT streak, last_active FROM users WHERE id = ?", (user_id,))
    u = cur.fetchone()
    streak = u["streak"] or 0

    # Sandbox sessions
    try:
        cur.execute("SELECT COUNT(*) as cnt FROM sandbox_sessions WHERE user_id = ?", (user_id,))
        sandbox_sessions = cur.fetchone()["cnt"] or 0
    except Exception:
        sandbox_sessions = 0

    # Notes count
    try:
        cur.execute("SELECT COUNT(*) as cnt FROM notes WHERE user_id = ?", (user_id,))
        notes_count = cur.fetchone()["cnt"] or 0
    except Exception:
        notes_count = 0

    # Saved modules/tutorials
    try:
        cur.execute("SELECT COUNT(*) as cnt FROM saved_modules WHERE user_id = ?", (user_id,))
        saved_count = cur.fetchone()["cnt"] or 0
        cur.execute("SELECT COUNT(*) as cnt FROM saved_tutorials WHERE user_id = ?", (user_id,))
        saved_count += cur.fetchone()["cnt"] or 0
    except Exception:
        saved_count = 0

    # Streak shields
    try:
        cur.execute("SELECT COUNT(*) as cnt FROM streak_shields WHERE user_id = ? AND used = 0", (user_id,))
        shields = cur.fetchone()["cnt"] or 0
    except Exception:
        shields = 0

    conn.close()
    return {
        "win_rate": win_rate,
        "total_attempts": total_attempts,
        "streak": streak,
        "sandbox_sessions": sandbox_sessions,
        "notes_count": notes_count,
        "saved_count": saved_count,
        "streak_shields": shields
    }
