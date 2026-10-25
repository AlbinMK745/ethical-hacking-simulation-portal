from fastapi import APIRouter, HTTPException, Header
import sqlite3
from datetime import datetime, date, timedelta
import random
from ..database import sync_user_points

router = APIRouter(
    prefix="/daily-challenge",
    tags=["Daily Challenge"]
)

DB_PATH = "backend/app.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_or_create_daily_challenge():
    """
    Get today's challenge, or create one if it doesn't exist.
    Selection logic: randomly select a challenge not used in the last 7 days.
    """
    conn = get_db()
    cur = conn.cursor()
    
    today = date.today().isoformat()
    
    # Check if today's challenge already exists
    cur.execute("""
        SELECT id, challenge_id, bonus_points, challenge_date
        FROM daily_challenges
        WHERE challenge_date = ?
    """, (today,))
    
    existing = cur.fetchone()
    
    if existing:
        conn.close()
        return dict(existing)
    
    # Get challenges used in the last 7 days
    seven_days_ago = (date.today() - timedelta(days=7)).isoformat()
    
    cur.execute("""
        SELECT challenge_id
        FROM daily_challenges
        WHERE challenge_date >= ?
    """, (seven_days_ago,))
    
    recent_challenge_ids = [row[0] for row in cur.fetchall()]
    
    # Select a random challenge not used recently
    if recent_challenge_ids:
        placeholders = ','.join('?' * len(recent_challenge_ids))
        cur.execute(f"""
            SELECT id
            FROM challenges
            WHERE id NOT IN ({placeholders})
            ORDER BY RANDOM()
            LIMIT 1
        """, recent_challenge_ids)
    else:
        cur.execute("""
            SELECT id
            FROM challenges
            ORDER BY RANDOM()
            LIMIT 1
        """)
    

    challenge_row = cur.fetchone()

    # Fallback: If all challenges used recently, pick ANY challenge
    if not challenge_row:
        cur.execute("""
            SELECT id
            FROM challenges
            ORDER BY RANDOM()
            LIMIT 1
        """)
        challenge_row = cur.fetchone()
    
    if not challenge_row:
        conn.close()
        raise HTTPException(status_code=404, detail="No challenges available in the system")
    
    selected_challenge_id = challenge_row[0]
    bonus_points = 50  # Default bonus
    
    # Insert today's daily challenge
    cur.execute("""
        INSERT INTO daily_challenges (challenge_id, challenge_date, bonus_points)
        VALUES (?, ?, ?)
    """, (selected_challenge_id, today, bonus_points))
    
    daily_challenge_id = cur.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "id": daily_challenge_id,
        "challenge_id": selected_challenge_id,
        "bonus_points": bonus_points,
        "challenge_date": today
    }


# ==============================
# 1️⃣ GET TODAY'S DAILY CHALLENGE
# ==============================
@router.get("/today")
def get_todays_challenge(user_id: int = Header(...)):
    """
    Get today's daily challenge with completion status, real-time stats, 
    and time-based leaderboard ranking.
    """
    conn = get_db()
    cur = conn.cursor()
    
    # Get or create daily challenge
    daily_challenge = get_or_create_daily_challenge()
    dc_id = daily_challenge['id']
    
    # Check if user is admin (user_id = 1)
    is_admin = (user_id == 1)
    
    # Fetch full challenge details
    query = """
        SELECT id, title, description, difficulty, category, points, is_sim_lab, sim_type
        FROM challenges WHERE id = ?
    """
    if is_admin:
        query = "SELECT id, title, description, difficulty, category, points, is_sim_lab, sim_type, correct_flag FROM challenges WHERE id = ?"
        
    cur.execute(query, (daily_challenge['challenge_id'],))
    challenge = cur.fetchone()
    
    if not challenge:
        conn.close()
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    challenge_dict = dict(challenge)
    
    # --- CTF Engine Stats ---
    # Total Attempts
    cur.execute("SELECT COUNT(*) FROM daily_attempts WHERE daily_id = ?", (dc_id,))
    total_attempts = cur.fetchone()[0]
    
    # Completed By
    cur.execute("SELECT COUNT(*) FROM daily_attempts WHERE daily_id = ? AND is_completed = 1", (dc_id,))
    completed_by = cur.fetchone()[0]
    
    # Active Now (Started in last 60 minutes and not completed)
    one_hour_ago = (datetime.now() - timedelta(minutes=60)).strftime('%Y-%m-%d %H:%M:%S')
    cur.execute("""
        SELECT COUNT(*) FROM daily_attempts 
        WHERE daily_id = ? AND is_completed = 0 AND start_time > ?
    """, (dc_id, one_hour_ago))
    active_now = cur.fetchone()[0]
    
    # User's current attempt status
    cur.execute("""
        SELECT start_time, end_time, completion_time, is_completed, bonus_earned
        FROM daily_attempts WHERE user_id = ? AND daily_id = ?
    """, (user_id, dc_id))
    attempt = cur.fetchone()
    
    # --- Active Lab Check ---
    cur.execute("""
        SELECT container_id, port 
        FROM sandbox_sessions 
        WHERE user_id = ? AND challenge_id = ? AND status = 'active'
    """, (user_id, daily_challenge['challenge_id']))
    active_lab_row = cur.fetchone()
    active_lab = None
    if active_lab_row:
        active_lab = {
            "container_id": active_lab_row[0],
            "port": active_lab_row[1],
            "url": f"http://localhost:{active_lab_row[1]}"
        }

    conn.close()
    
    # Calculate time remaining for bonus (until midnight)
    now = datetime.now()
    midnight = datetime.combine(date.today() + timedelta(days=1), datetime.min.time())
    time_remaining_seconds = int((midnight - now).total_seconds())
    
    response = {
        "daily_challenge_id": dc_id,
        "challenge_date": daily_challenge['challenge_date'],
        "bonus_points": daily_challenge['bonus_points'],
        "challenge": challenge_dict,
        "stats": {
            "total_attempts": total_attempts,
            "completed_by": completed_by,
            "active_now": active_now
        },
        "user_attempt": dict(attempt) if attempt else None,
        "completed": bool(attempt[3]) if attempt else False,
        "time_remaining": {
            "seconds": time_remaining_seconds,
            "formatted": f"{time_remaining_seconds // 3600}h {(time_remaining_seconds % 3600) // 60}m"
        },
        "active_lab": active_lab
    }
    
    if is_admin and 'correct_flag' in challenge_dict:
        response['flag'] = challenge_dict['correct_flag']
    
    return response


# ==============================
# 2️⃣ START DAILY CHALLENGE
# ==============================
@router.post("/start")
def start_daily_challenge(user_id: int = Header(...)):
    """
    Record the start time for today's daily challenge.
    """
    dc = get_or_create_daily_challenge()
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Create attempt or ignore if already exists (one attempt per day per user for timing)
        cur.execute("""
            INSERT OR IGNORE INTO daily_attempts (daily_id, user_id, start_time, is_completed)
            VALUES (?, ?, CURRENT_TIMESTAMP, 0)
        """, (dc['id'], user_id))
        conn.commit()
    finally:
        conn.close()
    
    return {"message": "Operation initiated. Timer started."}


# ==============================
# 2️⃣ COMPLETE DAILY CHALLENGE
# ==============================
# Helper function for internal use
def check_and_complete_daily_challenge(user_id: int, solved_challenge_id: int):
    conn = get_db()
    cur = conn.cursor()
    
    # Get today's active daily challenge
    daily_challenge = get_or_create_daily_challenge()
    if daily_challenge['challenge_id'] != solved_challenge_id:
        conn.close()
        return None

    # Check for active attempt
    cur.execute("""
        SELECT id, start_time, is_completed 
        FROM daily_attempts 
        WHERE user_id = ? AND daily_id = ?
    """, (user_id, daily_challenge['id']))
    
    attempt = cur.fetchone()
    if not attempt:
        conn.close()
        return None # User somehow solved without "starting"? 
    
    attempt_id, start_time_str, already_completed = attempt
    if already_completed:
        conn.close()
        return {"already_completed": True}

    # Calculate completion time
    start_time = datetime.strptime(start_time_str, '%Y-%m-%d %H:%M:%S')
    end_time = datetime.now()
    completion_time = int((end_time - start_time).total_seconds())
    
    # Calculate ranking for bonus (Top 10 get 500, others 200 - as requested)
    cur.execute("""
        SELECT COUNT(*) FROM daily_attempts 
        WHERE daily_id = ? AND is_completed = 1 AND completion_time < ?
    """, (daily_challenge['id'], completion_time))
    rank_before = cur.fetchone()[0]
    my_rank = rank_before + 1
    
    bonus_points = 500 if my_rank <= 10 else 200
    
    # Update attempt
    cur.execute("""
        UPDATE daily_attempts 
        SET end_time = ?, completion_time = ?, is_completed = 1, bonus_earned = 1
        WHERE id = ?
    """, (end_time.strftime('%Y-%m-%d %H:%M:%S'), completion_time, attempt_id))
    
    # Also keep legacy table in sync if needed (optional, but safer)
    cur.execute("""
        INSERT OR IGNORE INTO daily_challenge_completions (user_id, daily_challenge_id, bonus_earned)
        VALUES (?, ?, 1)
    """, (user_id, daily_challenge['id']))
    
    # ✅ Sync user points (Challenges + Daily Bonuses)
    sync_user_points(user_id, conn)
    
    conn.commit()
    conn.close()
    
    return {
        "bonus_earned": True,
        "bonus_points": bonus_points,
        "completion_time": completion_time,
        "rank": my_rank,
        "already_completed": False
    }


# ==============================
# 4️⃣ GET TOP SOLVERS FOR TODAY'S CHALLENGE
# ==============================
@router.get("/top-solvers")
def get_top_solvers():
    """
    Get today's top solvers ranked by fastest completion time.
    """
    conn = get_db()
    cur = conn.cursor()
    
    dc = get_or_create_daily_challenge()
    
    # Get top 5 fastest solvers
    cur.execute("""
        SELECT u.username, da.completion_time, da.end_time
        FROM daily_attempts da
        JOIN users u ON da.user_id = u.id
        WHERE da.daily_id = ? AND da.is_completed = 1
        ORDER BY da.completion_time ASC
        LIMIT 5
    """, (dc['id'],))
    
    rows = cur.fetchall()
    conn.close()
    
    solvers = []
    for idx, row in enumerate(rows):
        # Format time display
        seconds = row[1]
        time_display = f"{seconds // 60:02d}:{seconds % 60:02d}"
        
        solvers.append({
            "rank": idx + 1,
            "username": row[0],
            "time": time_display,
            "points": 500 if (idx + 1) <= 10 else 200 # Simplified display
        })
    
    return solvers


# ==============================
# 5️⃣ GET STATS
# ==============================
@router.get("/stats/{user_id}")
def get_daily_challenge_stats(user_id: int):
    """
    Get user's daily challenge statistics.
    """
    conn = get_db()
    cur = conn.cursor()
    
    # Total daily challenges completed
    cur.execute("""
        SELECT COUNT(*) as total
        FROM daily_challenge_completions
        WHERE user_id = ?
    """, (user_id,))
    total_completed = cur.fetchone()[0]
    
    # Total bonus points earned
    cur.execute("""
        SELECT COUNT(*) as bonus_count
        FROM daily_challenge_completions
        WHERE user_id = ? AND bonus_earned = 1
    """, (user_id,))
    bonus_count = cur.fetchone()[0]
    
    # Calculate streak (consecutive days)
    cur.execute("""
        SELECT dc.challenge_date
        FROM daily_challenge_completions dcc
        JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id
        WHERE dcc.user_id = ?
        ORDER BY dc.challenge_date DESC
    """, (user_id,))
    
    dates = [row[0] for row in cur.fetchall()]
    
    streak = 0
    if dates:
        current_date = date.today()
        for completion_date_str in dates:
            completion_date = date.fromisoformat(completion_date_str)
            if completion_date == current_date - timedelta(days=streak):
                streak += 1
            else:
                break
    
    conn.close()
    
    return {
        "total_completed": total_completed,
        "bonus_earned_count": bonus_count,
        "current_streak": streak,
        "completion_rate": round((bonus_count / total_completed * 100), 1) if total_completed > 0 else 0
    }
