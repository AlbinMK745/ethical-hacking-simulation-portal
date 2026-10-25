from fastapi import APIRouter
import sqlite3
from datetime import datetime, timedelta, date

router = APIRouter(prefix="/user/progress", tags=["User Progress"])

DB = "backend/app.db"

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("/{user_id}")
def user_progress_graph(user_id: int):
    """
    Get elite-level comprehensive progress data for advanced analytics
    """
    conn = get_db()
    cur = conn.cursor()

    # 1. Unified Points History (last 30 days)
    # Merging Challenge Submissions and Daily Challenge Bonuses
    cur.execute("""
        SELECT date, SUM(points) as points, SUM(solved) as daily_solved
        FROM (
            SELECT DATE(COALESCE(s.created_at, s.submitted_at)) as date, SUM(c.points) as points, COUNT(s.id) as solved
            FROM submissions s
            JOIN challenges c ON s.challenge_id = c.id
            WHERE s.user_id = ? AND s.is_correct = 1
            GROUP BY date
            UNION ALL
            SELECT DATE(dcc.completed_at) as date, SUM(dc.bonus_points) as points, 0 as solved
            FROM daily_challenge_completions dcc
            JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id
            WHERE dcc.user_id = ? AND dcc.bonus_earned = 1
            GROUP BY date
        )
        GROUP BY date
        ORDER BY date DESC
        LIMIT 30
    """, (user_id, user_id))
    
    raw_points = cur.fetchall()
    
    # Calculate lifetime total points to back-calculate history
    cur.execute("""
        SELECT (
            COALESCE((SELECT SUM(c.points) FROM submissions s JOIN challenges c ON s.challenge_id = c.id WHERE s.user_id = ? AND s.is_correct = 1), 0) +
            COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id WHERE dcc.user_id = ? AND dcc.bonus_earned = 1), 0)
        )
    """, (user_id, user_id))
    total_lifetime_points = cur.fetchone()[0]

    points_data = [dict(row) for row in raw_points]
    points_data.reverse()
    
    # Back-calculate cumulative points
    current_cumulative = total_lifetime_points
    # We need to calculate cumulative for each point in history by subtracting backwards
    temp_hist = []
    # Reverse again to go backwards from today
    for item in reversed(points_data):
        item['cumulative_points'] = current_cumulative
        temp_hist.append(item)
        current_cumulative -= item['points']
    
    # points_data is now properly populated with cumulative totals
    points_data = list(reversed(temp_hist))

    # 2. Skill Radar Data (Mastery Levels)
    # Map current categories to Radar domains
    radar_map = {
        "Web": "Web Exploitation",
        "Web Hacking": "Web Exploitation",
        "SQLi": "Web Exploitation",
        "Reverse Engineering": "System Exploitation",
        "Binary": "System Exploitation",
        "Pwn": "System Exploitation",
        "Cryptography": "Cryptography",
        "Forensics": "Forensics",
        "Networking": "Networking",
        "Network": "Networking",
        "General": "Offensive Security",
        "OSINT": "Offensive Security"
    }
    
    cur.execute("""
        SELECT c.category, COUNT(DISTINCT s.challenge_id) as count
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id = ? AND s.is_correct = 1
        GROUP BY c.category
    """, (user_id,))
    
    mastery = {domain: 0 for domain in set(radar_map.values())}
    for row in cur.fetchall():
        domain = radar_map.get(row['category'], "Offensive Security")
        mastery[domain] = mastery.get(domain, 0) + row['count']
    
    radar_data = [
        {"subject": k, "A": min(v * 10, 100), "fullMark": 100} 
        for k, v in mastery.items()
    ]

    # 3. Dynamic Rank Calculation
    # Get current rank
    cur.execute("""
        SELECT rank FROM (
            SELECT u.id, RANK() OVER (ORDER BY (
                COALESCE((SELECT SUM(c.points) FROM submissions s JOIN challenges c ON s.challenge_id = c.id WHERE s.user_id = u.id AND s.is_correct = 1), 0) +
                COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id WHERE dcc.user_id = u.id AND dcc.bonus_earned = 1), 0)
            ) DESC) as rank
            FROM users u WHERE u.role = 'user'
        ) WHERE id = ?
    """, (user_id,))
    current_rank = cur.fetchone()[0] if cur.rowcount > 0 else 1

    # For rank evolution, we still use a heuristic but base it on actual current rank
    rank_evolution = []
    for i, item in enumerate(points_data):
        # Heuristic: historical rank is current rank + some offset based on points gained since then
        # This is more "real" than an absolute base rank
        points_gained_since = points_data[-1]['cumulative_points'] - item['cumulative_points']
        hist_rank = current_rank + int(points_gained_since / 50) # Improved estimate
        rank_evolution.append({"date": item['date'], "rank": hist_rank})

    # 4. Exploit Speed Graph (Actual time spent in containers)
    cur.execute("""
        SELECT 
            c.difficulty,
            AVG(strftime('%s', COALESCE(ss.stopped_at, CURRENT_TIMESTAMP)) - strftime('%s', ss.started_at)) / 60.0 as avg_time
        FROM sandbox_sessions ss
        JOIN challenges c ON ss.challenge_id = c.id
        WHERE ss.user_id = ?
        GROUP BY c.difficulty
    """, (user_id,))
    
    exploit_speed = [
        {"difficulty": row['difficulty'], "time": round(float(row['avg_time'] or 0), 1)}
        for row in cur.fetchall()
    ]

    # 5. Difficulty Distribution (Pie Chart)
    cur.execute("""
        SELECT c.difficulty, COUNT(*) as count
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id = ? AND s.is_correct = 1
        GROUP BY c.difficulty
    """, (user_id,))
    difficulty_dist = [dict(row) for row in cur.fetchall()]

    # 6. Sandbox Usage Stats
    cur.execute("""
        SELECT 
            COUNT(*) as total_launched,
            SUM(strftime('%s', COALESCE(stopped_at, CURRENT_TIMESTAMP)) - strftime('%s', started_at)) / 60.0 as total_time
        FROM sandbox_sessions
        WHERE user_id = ?
    """, (user_id,))
    sb_row = cur.fetchone()
    sandbox_stats = {
        "containers": sb_row['total_launched'] or 0,
        "lab_time": round(float(sb_row['total_time'] or 0), 1),
        "active": 0 # Logic for active sessions if status='running'
    }
    cur.execute("SELECT COUNT(*) FROM sandbox_sessions WHERE user_id = ? AND status = 'running'", (user_id,))
    sandbox_stats["active"] = cur.fetchone()[0]

    # 7. Offensive vs Defensive Comparison
    # Defensive: Tutorials/Modules focus. Offensive: Challenges focus.
    cur.execute("SELECT COUNT(*) FROM submissions WHERE user_id = ? AND is_correct = 1", (user_id,))
    off_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM user_room_progress WHERE user_id = ? AND completed = 1", (user_id,))
    def_count = cur.fetchone()[0]
    off_def = [
        {"name": "Offensive (Challenges)", "value": off_count},
        {"name": "Defensive (Tutorials)", "value": def_count}
    ]

    # 8. Real Streak Calculation
    cur.execute("""
        SELECT date FROM (
            SELECT DATE(COALESCE(created_at, submitted_at)) as date FROM submissions WHERE user_id = ? AND is_correct = 1
            UNION
            SELECT DATE(completed_at) as date FROM daily_challenge_completions WHERE user_id = ? AND bonus_earned = 1
        )
        ORDER BY date DESC
    """, (user_id, user_id))
    
    activity_dates = [row['date'] for row in cur.fetchall()]
    current_streak = 0
    if activity_dates:
        today_str = date.today().isoformat()
        yesterday_str = (date.today() - timedelta(days=1)).isoformat()
        
        # Check if there was activity today or yesterday to start a streak
        if activity_dates[0] == today_str or activity_dates[0] == yesterday_str:
            last_date = None
            for d_str in activity_dates:
                d_obj = datetime.strptime(d_str, '%Y-%m-%d').date()
                if last_date is None:
                    current_streak = 1
                    last_date = d_obj
                else:
                    if (last_date - d_obj).days == 1:
                        current_streak += 1
                        last_date = d_obj
                    elif (last_date - d_obj).days == 0:
                        continue # Same day activity, don't break streak or increment
                    else:
                        break # Gap in dates, streak broken

    # Legacy: Weekly activity
    weekly_activity = []
    for i in range(7):
        target_date = (datetime.now() - timedelta(days=6-i)).date().isoformat()
        cur.execute("SELECT COUNT(*) FROM submissions WHERE user_id=? AND is_correct=1 AND DATE(COALESCE(created_at, submitted_at)) = ?",(user_id, target_date))
        chals = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM user_room_progress WHERE user_id=? AND completed=1 AND DATE(completed_at) = ?",(user_id, target_date))
        tuts = cur.fetchone()[0]
        weekly_activity.append({"day": (datetime.now()-timedelta(days=6-i)).strftime('%a'), "challenges": chals, "tutorials": tuts})

    # Legacy: category_progress
    cur.execute("""
        SELECT c.category, COUNT(DISTINCT CASE WHEN s.is_correct=1 THEN c.id END) as solved, COUNT(DISTINCT c.id) as total
        FROM challenges c LEFT JOIN submissions s ON c.id=s.challenge_id AND s.user_id=?
        WHERE c.category IS NOT NULL GROUP BY c.category
    """, (user_id,))
    category_progress = [{"category": r['category'], "solved": r['solved'], "total": r['total'], "percentage": round(r['solved']/r['total']*100, 1) if r['total']>0 else 0} for r in cur.fetchall()]

    # Global Stats
    cur.execute("SELECT COUNT(*) FROM submissions WHERE user_id = ?", (user_id,))
    total_subs = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM submissions WHERE user_id = ? AND is_correct = 1", (user_id,))
    correct_subs = cur.fetchone()[0]
    
    today = datetime.now().date()
    monday = today - timedelta(days=today.weekday())
    cur.execute("SELECT COALESCE(SUM(c.points), 0) FROM submissions s JOIN challenges c ON s.challenge_id = c.id WHERE s.user_id = ? AND s.is_correct = 1 AND DATE(COALESCE(s.created_at, s.submitted_at)) >= ?", (user_id, monday.isoformat()))
    points_this_week = cur.fetchone()[0]

    conn.close()

    return {
        "points_over_time": points_data,
        "radar_data": radar_data,
        "rank_evolution": rank_evolution,
        "exploit_speed": exploit_speed,
        "difficulty_dist": difficulty_dist,
        "sandbox_stats": sandbox_stats,
        "off_def": off_def,
        "weekly_activity": weekly_activity,
        "category_progress": category_progress,
        "stats": {
            "total_pts": total_lifetime_points,
            "total_challenges": off_count,
            "success_rate": round((correct_subs / total_subs * 100), 1) if total_subs > 0 else 0,
            "points_this_week": points_this_week,
            "current_streak": current_streak
        }
    }
