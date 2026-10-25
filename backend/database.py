# backend/database.py
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(BASE_DIR, "app.db")  # 👈 SAME DB you opened in DB Browser

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=20)
    conn.row_factory = sqlite3.Row
    return conn

def sync_user_points(user_id: int, conn=None):
    """
    Calculates total points (Challenges + Daily Bonuses) and updates the users table.
    """
    should_close = False
    if conn is None:
        conn = get_db()
        should_close = True
    
    cur = conn.cursor()
    
    # Calculate points from challenges (submissions table)
    cur.execute("""
        SELECT COALESCE(SUM(c.points), 0)
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id = ? AND s.is_correct = 1
    """, (user_id,))
    challenge_points = cur.fetchone()[0]
    
    # Calculate points from daily challenges
    cur.execute("""
        SELECT COALESCE(SUM(dc.bonus_points), 0)
        FROM daily_challenge_completions dcc
        JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id
        WHERE dcc.user_id = ? AND dcc.bonus_earned = 1
    """, (user_id,))
    daily_points = cur.fetchone()[0]
    
    total_points = challenge_points + daily_points
    
    # Update users table
    cur.execute("UPDATE users SET points = ? WHERE id = ?", (total_points, user_id))
    conn.commit()
    
    if should_close:
        conn.close()
    
    return total_points
