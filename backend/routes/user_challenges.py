from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
import sqlite3
from .daily_challenge import check_and_complete_daily_challenge
from ..database import sync_user_points
from ..services.xp_service import award_xp, XP_REWARDS

router = APIRouter(
    prefix="/user/challenges",
    tags=["User Challenges"]
)

DB_PATH = "backend/app.db"


class FlagSubmission(BaseModel):
    flag: str


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ==============================
# 1️⃣ GET ALL CHALLENGES (USER VIEW)
# ==============================
@router.get("/")
def get_challenges(user_id: int = Header(...)):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            c.id,
            c.title,
            c.description,
            c.difficulty,
            c.category,
            c.points,
            c.docker_image,
            uc.status,
            uc.attempts,
            ss.container_id,
            ss.port,
            ss.status AS lab_status
        FROM challenges c
        LEFT JOIN user_challenges uc
            ON c.id = uc.challenge_id AND uc.user_id = ?
        LEFT JOIN sandbox_sessions ss
            ON c.id = ss.challenge_id AND ss.user_id = ? AND ss.status = 'active'
    """, (user_id, user_id))

    rows = cur.fetchall()
    conn.close()

    results = []
    for r in rows:
        row = dict(r)
        # Derive sim_type from docker_image name
        img = row.get("docker_image") or ""
        if img.startswith("ehsp-") and img != "":
            row["sim_type"] = img[len("ehsp-"):]
            row["is_sim_lab"] = True
        else:
            row["sim_type"] = None
            row["is_sim_lab"] = False
        
        # Add active lab info if present
        if row.get("lab_status") == "active":
            row["active_lab"] = {
                "container_id": row["container_id"],
                "port": row["port"],
                "url": f"http://localhost:{row['port']}"
            }
        else:
            row["active_lab"] = None
            
        results.append(row)

    return results



# ==============================
# 2️⃣ GET SINGLE CHALLENGE
# ==============================
@router.get("/{challenge_id}")
def get_challenge(challenge_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            title,
            description,
            difficulty,
            category,
            points
        FROM challenges
        WHERE id = ?
    """, (challenge_id,))

    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return dict(row)


@router.post("/start/{challenge_id}")
def start_challenge(
    challenge_id: int,
    user_id: int = Header(...)
):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT OR IGNORE INTO user_challenges (user_id, challenge_id)
        VALUES (?, ?)
    """, (user_id, challenge_id))

    conn.commit()
    conn.close()
    return {"status": "started"}



@router.post("/submit/{challenge_id}")
def submit_flag(
    challenge_id: int,
    data: FlagSubmission,
    user_id: int = Header(...)
):
    conn = get_db()
    cur = conn.cursor()

    # get correct flag
    cur.execute("SELECT correct_flag, points, title FROM challenges WHERE id=?", (challenge_id,))
    row = cur.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Challenge not found")

    correct_flag, points, title = row
    
    # Check if already solved
    cur.execute("SELECT 1 FROM submissions WHERE user_id=? AND challenge_id=? AND is_correct=1", (user_id, challenge_id))
    already_solved = cur.fetchone() is not None

    is_correct = data.flag.strip().lower() == correct_flag.strip().lower()

    # log attempt in challenge_attempts
    cur.execute("""
        INSERT INTO challenge_attempts (user_id, challenge_id, submitted_flag, is_correct)
        VALUES (?, ?, ?, ?)
    """, (user_id, challenge_id, data.flag, int(is_correct)))

    xp_result = None
    if is_correct and not already_solved:
        # Mark as solved in user_challenges
        cur.execute("""
            UPDATE user_challenges
            SET status='solved',
                score=?,
                solved_at=CURRENT_TIMESTAMP
            WHERE user_id=? AND challenge_id=?
        """, (points, user_id, challenge_id))

        # ✅ Also write to submissions table (used by leaderboard + progress + dashboard)
        cur.execute("""
            INSERT OR IGNORE INTO submissions (user_id, challenge_id, submitted_flag, is_correct)
            VALUES (?, ?, ?, 1)
        """, (user_id, challenge_id, data.flag))

        # ✅ Update achievement progress based on challenges solved
        sync_user_points(user_id, conn)

        cur.execute("""
            SELECT COUNT(DISTINCT challenge_id)
            FROM submissions
            WHERE user_id = ? AND is_correct = 1
        """, (user_id,))
        total_solved = cur.fetchone()[0]

        # Update progress for all achievements
        cur.execute("SELECT id, target FROM achievements")
        all_achievements = cur.fetchall()
        for ach_id, target in all_achievements:
            if target is None or target == 0:
                continue
            progress = min(total_solved, target)
            is_unlocked = progress >= target

            existing = cur.execute(
                "SELECT id, progress, unlocked_at FROM user_achievements WHERE user_id=? AND achievement_id=?",
                (user_id, ach_id)
            ).fetchone()

            if existing:
                cur.execute("""
                    UPDATE user_achievements
                    SET progress = MAX(progress, ?),
                        unlocked_at = CASE WHEN ? = 1 AND unlocked_at IS NULL THEN CURRENT_TIMESTAMP ELSE unlocked_at END
                    WHERE user_id=? AND achievement_id=?
                """, (progress, 1 if is_unlocked else 0, user_id, ach_id))
            else:
                cur.execute("""
                    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
                    VALUES (?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)
                """, (user_id, ach_id, progress, 1 if is_unlocked else 0))
    
    elif not is_correct:
        cur.execute("""
            UPDATE user_challenges
            SET attempts = attempts + 1
            WHERE user_id=? AND challenge_id=?
        """, (user_id, challenge_id))

    conn.commit()

    # ✅ Trigger Daily Challenge completion logic (BEFORE points calculation)
    daily_res = None
    if is_correct:
        try:
            from .daily_challenge import check_and_complete_daily_challenge
            daily_res = check_and_complete_daily_challenge(user_id, challenge_id)
        except Exception as e:
            print(f"Daily challenge check failed: {e}")

    # Get fresh total points for the user (Challenges + Daily Bonuses)
    cur.execute("""
        SELECT (
            COALESCE((SELECT SUM(p) FROM (SELECT DISTINCT challenge_id, c.points as p FROM submissions s JOIN challenges c ON s.challenge_id = c.id WHERE s.user_id = ? AND s.is_correct = 1)), 0) +
            COALESCE((SELECT SUM(dc.bonus_points) FROM daily_challenge_completions dcc JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id WHERE dcc.user_id = ? AND dcc.bonus_earned = 1), 0)
        )
    """, (user_id, user_id))
    total_points = cur.fetchone()[0] or 0

    conn.close()

    # ── Award XP based on difficulty (after db conn is closed) ──────────────
    if is_correct and not already_solved:
        # Determine difficulty from challenge (re-fetch)
        diff_conn = sqlite3.connect(DB_PATH)
        diff_conn.row_factory = sqlite3.Row
        diff_cur = diff_conn.cursor()
        diff_row = diff_cur.execute("SELECT difficulty FROM challenges WHERE id=?", (challenge_id,)).fetchone()
        diff_conn.close()

        difficulty = (diff_row["difficulty"] or "medium").lower() if diff_row else "medium"
        xp_key = f"challenge_{difficulty}" if f"challenge_{difficulty}" in XP_REWARDS else "challenge_medium"
        xp_result = award_xp(user_id, XP_REWARDS[xp_key], "challenge_solved", source_id=challenge_id)

    return {
        "correct": is_correct,
        "already_solved": already_solved,
        "points_earned": points if (is_correct and not already_solved) else 0,
        "total_points": total_points,
        "daily_challenge": daily_res,
        "xp": xp_result,   # ← NEW: level-up data for frontend animation
    }


@router.get("/attempts")
def attempt_history(user_id: int = Header(...)):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT c.title, a.submitted_flag, a.is_correct, a.attempted_at
        FROM challenge_attempts a
        JOIN challenges c ON c.id = a.challenge_id
        WHERE a.user_id = ?
        ORDER BY a.attempted_at DESC
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==============================
# GET CHALLENGE STATISTICS
# ==============================
@router.get("/{challenge_id}/stats")
def get_challenge_statistics(challenge_id: int):
    """
    Get statistics for a specific challenge (total attempts, solved by, etc.)
    """
    conn = get_db()
    cur = conn.cursor()
    
    # Get total attempts for this challenge
    cur.execute("""
        SELECT COUNT(*) as count
        FROM challenge_attempts
        WHERE challenge_id = ?
    """, (challenge_id,))
    
    total_attempts = cur.fetchone()
    total_attempts_count = total_attempts[0] if total_attempts else 0
    
    # Get number of unique users who solved this challenge
    cur.execute("""
        SELECT COUNT(DISTINCT user_id) as count
        FROM challenge_attempts
        WHERE challenge_id = ? AND is_correct = 1
    """, (challenge_id,))
    
    solved_by = cur.fetchone()
    solved_by_count = solved_by[0] if solved_by else 0
    
    # Get number of users who completed as daily challenge with bonus
    cur.execute("""
        SELECT COUNT(DISTINCT dcc.user_id) as count
        FROM daily_challenge_completions dcc
        JOIN daily_challenges dc ON dcc.daily_challenge_id = dc.id
        WHERE dc.challenge_id = ? AND dcc.bonus_earned = 1
    """, (challenge_id,))
    
    completed_with_bonus = cur.fetchone()
    completed_by_count = completed_with_bonus[0] if completed_with_bonus else 0
    
    conn.close()
    
    return {
        "totalAttempts": total_attempts_count,
        "solvedBy": solved_by_count,
        "completedBy": completed_by_count
    }

