from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from backend.utils.security import require_admin
from fastapi import Query
from pydantic import BaseModel



router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

DB_PATH = "backend/app.db"


def get_connection():
    return sqlite3.connect(DB_PATH)


# 🧪 SANITY CHECK
@router.get("/test")
def admin_test():
    return {"status": "Admin route working"}


# 📊 ADMIN DASHBOARD
@router.get("/dashboard")
def admin_dashboard(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Total Users
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]

    # Total Challenges
    cursor.execute("SELECT COUNT(*) FROM challenges")
    total_challenges = cursor.fetchone()[0]

    # Active users in last 24 hours
    cursor.execute("""
        SELECT COUNT(DISTINCT user_id)
        FROM submissions
        WHERE submitted_at >= datetime('now', '-24 hours')
    """)
    active_sessions = cursor.fetchone()[0]

    # Total Tutorials
    cursor.execute("SELECT COUNT(*) FROM tutorials")
    tutorials = cursor.fetchone()[0]

    conn.close()

    return {
        "total_users": total_users,
        "total_challenges": total_challenges,
        "active_sessions": active_sessions,
        "tutorials": tutorials
    }



# 📌 GET ALL CHALLENGES (ADMIN VIEW)
@router.get("/challenges")
def get_challenges(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        SELECT
            c.id,
            c.title,
            c.description,
            c.category,
            c.difficulty,
            c.points,
            c.correct_flag,
            COUNT(s.id) AS solves
        FROM challenges c
        LEFT JOIN submissions s
            ON c.id = s.challenge_id
            AND s.is_correct = 1
        GROUP BY c.id
        ORDER BY c.id DESC
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "category": r[3],
            "difficulty": r[4],
            "points": r[5],
            "flag": r[6][:10] + "..." if r[6] else "",
            "solves": r[7]
        }
        for r in rows
    ]



class ChallengeCreate(BaseModel):
    title: str
    category: str
    difficulty: str
    points: int
    correct_flag: str
    description: str
    docker_image: str | None = None
    is_sim_lab: bool = False
    sim_type: str | None = None
    is_active: bool = True
    instructions: str | None = None
    hints: list[str] | None = []

class ChallengeUpdate(ChallengeCreate):
    pass


# ➕ CREATE CHALLENGE
@router.post("/challenges")
def create_challenge(
    data: ChallengeCreate,
    admin=Depends(require_admin)
):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO challenges
        (title, category, difficulty, points, correct_flag, description, instructions, docker_image, is_sim_lab, sim_type, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.title,
        data.category,
        data.difficulty,
        data.points,
        data.correct_flag,
        data.description,
        data.instructions,
        data.docker_image,
        int(data.is_sim_lab),
        data.sim_type,
        int(data.is_active)
    ))

    conn.commit()
    conn.close()

    return {"message": "Challenge created successfully"}



# ✏️ UPDATE CHALLENGE
@router.put("/challenges/{challenge_id}")
def update_challenge(
    challenge_id: int,
    data: ChallengeUpdate,
    admin=Depends(require_admin)
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE challenges
        SET title=?, description=?, difficulty=?, points=?, correct_flag=?, 
            category=?, docker_image=?, is_sim_lab=?, sim_type=?, is_active=?
        WHERE id=?
    """, (
        data.title, data.description, data.difficulty, data.points, data.correct_flag,
        data.category, data.docker_image, int(data.is_sim_lab), data.sim_type, 
        int(data.is_active), challenge_id
    ))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Challenge not found")

    conn.commit()
    conn.close()

    return {"message": "Challenge updated successfully"}


# ❌ DELETE CHALLENGE
@router.delete("/challenges/{challenge_id}")
def delete_challenge(challenge_id: int, admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("DELETE FROM challenges WHERE id = ?", (challenge_id,))

    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Challenge not found")

    conn.commit()
    conn.close()

    return {"message": "Challenge deleted"}



# 📊 ADMIN ANALYTICS (Consolidated)
@router.get("/analytics")
def admin_analytics(admin=Depends(require_admin)):
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Overview Stats
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM challenges")
    total_challenges = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM submissions")
    total_submissions = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM submissions WHERE is_correct = 1")
    correct = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM submissions WHERE is_correct = 0")
    wrong = cursor.fetchone()[0]

    accuracy = (
        round((correct / total_submissions) * 100, 2)
        if total_submissions > 0 else 0
    )

    # 2. Difficulty Distribution
    cursor.execute("""
        SELECT difficulty, COUNT(*)
        FROM challenges
        GROUP BY difficulty
    """)
    difficulty_rows = cursor.fetchall()
    
    difficulty_stats = {"Easy": 0, "Medium": 0, "Hard": 0}
    for d, c in difficulty_rows:
        if d in difficulty_stats:
            difficulty_stats[d] = c
        else:
             # Handle case sensitivity or unexpected values
            difficulty_stats[d.capitalize()] = c


    # 3. Top Solved Challenges
    cursor.execute("""
        SELECT c.title, COUNT(s.id) as solve_count
        FROM challenges c
        JOIN submissions s ON c.id = s.challenge_id
        WHERE s.is_correct = 1
        GROUP BY c.id
        ORDER BY solve_count DESC
        LIMIT 5
    """)
    top_solved = [{"title": r[0], "count": r[1]} for r in cursor.fetchall()]

    conn.close()

    return {
        "overview": {
            "total_users": total_users,
            "total_challenges": total_challenges,
            "total_submissions": total_submissions,
            "correct_submissions": correct,
            "wrong_submissions": wrong,
            "accuracy_percentage": accuracy
        },
        "difficulty": difficulty_stats,
        "top_solved": top_solved
    }

# ==============================
# 📊 ADMIN DASHBOARD DATA APIS
# ==============================

from datetime import datetime, timedelta

@router.get("/activity")
def admin_activity(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        WITH hours AS (
            SELECT '00' as h UNION SELECT '01' UNION SELECT '02' UNION SELECT '03' UNION SELECT '04'
            UNION SELECT '05' UNION SELECT '06' UNION SELECT '07' UNION SELECT '08' UNION SELECT '09'
            UNION SELECT '10' UNION SELECT '11' UNION SELECT '12' UNION SELECT '13' UNION SELECT '14'
            UNION SELECT '15' UNION SELECT '16' UNION SELECT '17' UNION SELECT '18' UNION SELECT '19'
            UNION SELECT '20' UNION SELECT '21' UNION SELECT '22' UNION SELECT '23'
        )
        SELECT h.h, COUNT(s.id)
        FROM hours h
        LEFT JOIN submissions s ON strftime('%H', s.created_at) = h.h 
            AND s.created_at >= datetime('now', '-24 hours')
        GROUP BY h.h
        ORDER BY h.h
    """)

    rows = cursor.fetchall()
    conn.close()

    return [{"hour": r[0] + ":00", "count": r[1]} for r in rows]


@router.get("/solve-stats")
def solve_stats(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT c.category, COUNT(*) 
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.is_correct = 1
        GROUP BY c.category
    """)

    rows = cursor.fetchall()
    conn.close()

    return [{"category": r[0], "count": r[1]} for r in rows]


@router.get("/recent-activity")
def recent_activity(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT u.username, c.title, s.is_correct, s.created_at
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        JOIN challenges c ON s.challenge_id = c.id
        ORDER BY s.created_at DESC
        LIMIT 10
    """)

    rows = cursor.fetchall()
    conn.close()

    return [{
        "username": r[0],
        "challenge": r[1],
        "is_correct": bool(r[2]),
        "time": r[3]
    } for r in rows]


@router.get("/notices")
def admin_notices(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT title, message, created_at, type
        FROM notifications
        WHERE target = 'all' OR title LIKE '%Challenge%' OR title LIKE '%maintenance%'
        ORDER BY created_at DESC
        LIMIT 5
    """)

    rows = cursor.fetchall()
    conn.close()

    return [{
        "title": r[0],
        "message": r[1],
        "time": r[2],
        "type": r[3]
    } for r in rows]


@router.get("/users")
def get_users(
    q: str | None = Query(None),
    admin=Depends(require_admin)
):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    sql = """
        SELECT
            u.id,
            u.username,
            u.email,
            u.status,
            COUNT(CASE WHEN s.is_correct = 1 THEN 1 END) AS challenges_solved,
            COALESCE(SUM(CASE WHEN s.is_correct = 1 THEN c.points END), 0) AS points,
            MAX(s.created_at) AS last_active
        FROM users u
        LEFT JOIN submissions s ON u.id = s.user_id
        LEFT JOIN challenges c ON s.challenge_id = c.id
        WHERE u.role = 'user'
    """

    params = []

    if q:
        sql += " AND (u.username LIKE ? OR u.email LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%"])

    sql += " GROUP BY u.id"

    cur.execute(sql, params)
    rows = cur.fetchall()
    conn.close()

    users = []
    for r in rows:
        points = r[5]

        if points >= 4000:
            level = 12
        elif points >= 3000:
            level = 10
        elif points >= 2000:
            level = 8
        elif points >= 1000:
            level = 5
        else:
            level = 1

        users.append({
            "id": r[0],
            "username": r[1],
            "email": r[2],
            "status": r[3],
            "level": level,
            "points": points,
            "challenges": r[4],
            "last_active": r[6] or "—"
        })

    return users



@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    status: str = Query(..., pattern="^(active|suspended)$"),
    admin=Depends(require_admin)
):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        "UPDATE users SET status = ? WHERE id = ?",
        (status, user_id)
    )

    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    conn.commit()
    conn.close()

    return {"message": f"User {user_id} updated to {status}"}


# ➕ CREATE USER
from pydantic import BaseModel

class CreateUser(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"


@router.post("/users")
def create_user(
    data: CreateUser,
    admin=Depends(require_admin)
):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Prevent duplicate email
    cur.execute("SELECT id FROM users WHERE email = ?", (data.email,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already exists")

    cur.execute("""
        INSERT INTO users (
            username, email, password, role, status,
            avatar, bio, github_url, portfolio_url, 
            htb_profile, thm_profile, skills, theme_color, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, CURRENT_TIMESTAMP)
    """, (
        data.username,
        data.email,
        data.password,   # hashing later, NOT now (ok for college)
        data.role,
        "active",
        'default', '', '', '', '', '', '[]', '#00ffbf'
    ))

    conn.commit()
    conn.close()

    return {"message": "User created successfully"}



@router.get("/challenges/{challenge_id}")
def get_challenge(challenge_id: int, admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, description, category, difficulty, points, correct_flag
        FROM challenges
        WHERE id = ?
    """, (challenge_id,))

    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return {
        "id": row[0],
        "title": row[1],
        "description": row[2],
        "category": row[3],
        "difficulty": row[4],
        "points": row[5],
        "flag": row[6]
    }


# ==============================
# 📘 TUTORIAL MANAGEMENT (ADMIN)
# ==============================

class TutorialCreate(BaseModel):
    title: str
    content: str
    category: str


@router.post("/tutorials")
def create_tutorial(data: TutorialCreate, admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO tutorials (title, content, category)
        VALUES (?, ?, ?)
    """, (data.title, data.content, data.category))

    conn.commit()
    tutorial_id = cur.lastrowid
    conn.close()

    return {"message": "Tutorial created", "id": tutorial_id}

#
#@router.get("/tutorials")
#def get_tutorials(admin=Depends(require_admin)):
#    conn = sqlite3.connect(DB_PATH)
#    cur = conn.cursor()
#
#    cur.execute("""
#        SELECT id, title, content, category, created_at
#        FROM tutorials
#        ORDER BY created_at DESC
#    """)
#    rows = cur.fetchall()
#    conn.close()
#
#    return [
#        {
#            "id": r[0],
#            "title": r[1],
#            "content": r[2],
#            "category": r[3],
#            "created_at": r[4]
#        }
#        for r in rows
#    ]



class TutorialUpdate(BaseModel):
    title: str
    content: str
    category: str

@router.put("/tutorials/{tutorial_id}")
def update_tutorial(
    tutorial_id: int,
    data: TutorialUpdate,
    admin=Depends(require_admin)
):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        UPDATE tutorials
        SET title=?, content=?, category=?
        WHERE id=?
    """, (data.title, data.content, data.category, tutorial_id))

    conn.commit()
    conn.close()

    return {"message": "Tutorial updated"}


# ==============================
# 📘 TUTORIAL MANAGEMENT (ADMIN)
# ==============================

@router.get("/tutorials")
def get_tutorials(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, content, category, created_at
        FROM tutorials
        ORDER BY created_at DESC
    """)
    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "title": r[1],
            "content": r[2],
            "category": r[3],
            "created_at": r[4]
        }
        for r in rows
    ]


@router.get("/tutorials/{tutorial_id}")
def get_tutorial(tutorial_id: int, admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, content, category, created_at
        FROM tutorials
        WHERE id = ?
    """, (tutorial_id,))

    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Tutorial not found")

    return {
        "id": row[0],
        "title": row[1],
        "content": row[2],
        "category": row[3],
        "created_at": row[4]
    }



@router.put("/tutorials/{tutorial_id}")
def update_tutorial(
    tutorial_id: int,
    title: str,
    content: str,
    category: str,
    admin=Depends(require_admin)
):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        UPDATE tutorials
        SET title=?, content=?, category=?
        WHERE id=?
    """, (title, content, category, tutorial_id))

    if cur.rowcount == 0:
        raise HTTPException(404, "Tutorial not found")

    conn.commit()
    conn.close()
    return {"message": "Tutorial updated"}



@router.delete("/tutorials/{tutorial_id}")
def delete_tutorial(tutorial_id: int, admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("DELETE FROM tutorials WHERE id=?", (tutorial_id,))
    conn.commit()
    conn.close()

    return {"message": "Tutorial deleted"}



# backend/routes/admin.py

from ..simulation_manager import stop_simulation, _get_client as get_docker_client, _active as active_containers


def _get_docker_stats(container_id: str) -> dict:
    """Fetch live Docker memory/cpu stats for a container. Returns {} if unavailable."""
    try:
        client = get_docker_client()
        if not client:
            return {}
        c = client.containers.get(container_id)
        stats = c.stats(stream=False)
        mem_usage = stats.get("memory_stats", {}).get("usage", 0)
        mem_limit = stats.get("memory_stats", {}).get("limit", 134217728)  # 128MB default
        # CPU delta calculation
        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
        sys_delta = stats["cpu_stats"].get("system_cpu_usage", 0) - stats["precpu_stats"].get("system_cpu_usage", 0)
        cpu_pct = round((cpu_delta / sys_delta) * 100, 1) if sys_delta > 0 else 0
        return {
            "memory_mb": round(mem_usage / 1024 / 1024, 1),
            "memory_pct": round((mem_usage / mem_limit) * 100, 1),
            "cpu_pct": min(cpu_pct, 100.0)
        }
    except Exception:
        return {"memory_mb": 0, "memory_pct": 0, "cpu_pct": 0}


@router.get("/sandbox")
def get_sandbox_sessions(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("""
        SELECT
            s.id,
            u.username as user,
            s.container_id,
            s.container_name,
            s.port,
            s.status,
            s.started_at,
            s.last_activity,
            c.sim_type
        FROM sandbox_sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN challenges c ON s.challenge_id = c.id
        WHERE s.status = 'active'
        ORDER BY s.started_at DESC
    """)
    rows = cur.fetchall()

    sessions = []
    for r in rows:
        # Live Docker stats
        docker_stats = _get_docker_stats(r['container_id']) if r['container_id'] else {}

        # Recent activity logs
        cur.execute(
            "SELECT log_entry, timestamp FROM sandbox_logs WHERE sandbox_id = ? ORDER BY timestamp DESC LIMIT 3",
            (r['id'],)
        )
        log_rows = cur.fetchall()
        logs = [{"time": lr['timestamp'].split(' ')[1][:8] if ' ' in str(lr['timestamp']) else str(lr['timestamp']), "msg": lr['log_entry'], "type": "info"} for lr in log_rows]
        if not logs:
            logs.append({"time": "--:--:--", "msg": "Session active", "type": "success"})

        sessions.append({
            "id": r['id'],
            "user": r['user'],
            "container_id": r['container_id'][:12] if r['container_id'] else "—",
            "full_container_id": r['container_id'],
            "sim_type": r['sim_type'] or (r['container_name'] or 'unknown').replace('ehsp_', '').split('_')[0] if r['container_name'] else 'unknown',
            "port": r['port'],
            "status": r['status'],
            "started": r['started_at'],
            "last_active": r['last_activity'],
            "memory_mb": docker_stats.get('memory_mb', 0),
            "memory_pct": docker_stats.get('memory_pct', 0),
            "cpu_pct": docker_stats.get('cpu_pct', 0),
            "logs": logs
        })

    conn.close()
    return sessions


@router.get("/sandbox/stats")
def get_sandbox_stats(admin=Depends(require_admin)):
    """Aggregate sandbox statistics for the admin dashboard header."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Active sessions right now
    cur.execute("SELECT COUNT(*) FROM sandbox_sessions WHERE status = 'active'")
    active_count = cur.fetchone()[0]

    # Total sessions today
    cur.execute("""
        SELECT COUNT(*) FROM sandbox_sessions
        WHERE date(started_at) = date('now')
    """)
    today_count = cur.fetchone()[0]

    # Total sessions all time
    cur.execute("SELECT COUNT(*) FROM sandbox_sessions")
    total_count = cur.fetchone()[0]

    # Containers killed/stopped today
    cur.execute("""
        SELECT COUNT(*) FROM sandbox_sessions
        WHERE status = 'stopped' AND date(stopped_at) = date('now')
    """)
    killed_today = cur.fetchone()[0]

    # Total exec log runs (admin code runner)
    exec_count = 0
    try:
        cur.execute("SELECT COUNT(*) FROM sandbox_exec_logs")
        exec_count = cur.fetchone()[0]
    except Exception:
        pass

    conn.close()

    # Live Docker totals
    total_memory_mb = 0
    docker_active = 0
    try:
        client = get_docker_client()
        if client:
            containers = client.containers.list(filters={"label": "ehsp=simulation"})
            docker_active = len(containers)
            for c in containers:
                try:
                    stats = c.stats(stream=False)
                    total_memory_mb += stats.get("memory_stats", {}).get("usage", 0) / 1024 / 1024
                except Exception:
                    pass
    except Exception:
        pass

    return {
        "active_sessions": active_count,
        "docker_active": docker_active,
        "today_sessions": today_count,
        "total_sessions": total_count,
        "killed_today": killed_today,
        "total_memory_mb": round(total_memory_mb, 1),
        "exec_runs": exec_count
    }


@router.get("/sandbox/exec-logs")
def get_exec_logs(limit: int = 50, admin=Depends(require_admin)):
    """Get admin code execution log history."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT el.id, u.username, el.code_snippet, el.output,
                   el.execution_time, el.exit_code, el.flag, el.created_at
            FROM sandbox_exec_logs el
            LEFT JOIN users u ON el.user_id = u.id
            ORDER BY el.created_at DESC
            LIMIT ?
        """, (limit,))
        rows = cur.fetchall()
        result = [dict(r) for r in rows]
    except Exception:
        result = []
    conn.close()
    return result


@router.post("/sandbox/{session_id}/stop")
def admin_stop_sandbox(session_id: str, admin=Depends(require_admin)):
    """Admin forced stop of a sandbox session."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        "SELECT container_id FROM sandbox_sessions WHERE id = ? OR container_id LIKE ?",
        (session_id, f"{session_id}%")
    )
    row = cur.fetchone()

    if not row:
        conn.close()
        raise HTTPException(404, "Session not found")

    container_id = row[0]
    conn.close()

    success = stop_simulation(container_id)
    if not success:
        return {"message": "Container already gone or stop failed, DB status updated."}
    return {"message": "Sandbox stopped successfully"}





# ==============================
# 👁️ CHALLENGE PREVIEW (ADMIN)
# ==============================

@router.get("/challenges/{challenge_id}/preview")
def preview_challenge(challenge_id: int, admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Fetch challenge (ONLY existing columns)
    cur.execute("""
        SELECT
            title,
            description,
            category,
            difficulty,
            points,
            correct_flag
        FROM challenges
        WHERE id = ?
    """, (challenge_id,))

    row = cur.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Solve count
    cur.execute("""
        SELECT COUNT(*)
        FROM submissions
        WHERE challenge_id = ? AND is_correct = 1
    """, (challenge_id,))
    solves = cur.fetchone()[0]

    conn.close()

    return {
        "title": row[0],
        "description": row[1],
        "category": row[2],
        "difficulty": row[3],
        "points": row[4],

        # Using description as instructions (DB-safe)
        "instructions": row[1],

        # Admin-only info
        "flag": row[5],
        "solves": solves,
        "created_at": "—",

        # No hints to prevent accidental spoilers in API
        "hints": [] 
    }


# ==============================
# 📊 ANALYTICS DATA
# ==============================
@router.get("/analytics")
def get_analytics(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Difficulty Distribution
    cur.execute("""
        SELECT difficulty, COUNT(*)
        FROM challenges
        GROUP BY difficulty
    """)
    diff_rows = cur.fetchall()
    
    difficulty_data = {"Easy": 0, "Medium": 0, "Hard": 0}
    for row in diff_rows:
        diff_level = row[0]
        count = row[1]
        if diff_level in difficulty_data:
            difficulty_data[diff_level] = count
        else:
            # Handle potential case mismatch or other levels
            processed_level = diff_level.capitalize()
            if processed_level in difficulty_data:
                difficulty_data[processed_level] += count

    # 2. Top Solved Challenges (including 0-solve nodes)
    cur.execute("""
        SELECT c.title, COUNT(s.id) as solve_count
        FROM challenges c
        LEFT JOIN submissions s ON c.id = s.challenge_id AND s.is_correct = 1
        GROUP BY c.id
        ORDER BY solve_count DESC, c.id ASC
        LIMIT 10
    """)
    solves_rows = cur.fetchall()
    
    solves_data = []
    for row in solves_rows:
        solves_data.append({
            "title": row[0],
            "count": row[1]
        })

    conn.close()

    return {
        "difficulty": difficulty_data,
        "solves": solves_data
    }