from fastapi import APIRouter, HTTPException, Query, Request
import sqlite3
from typing import List, Optional

router = APIRouter(
    prefix="/user/modules",
    tags=["User Modules"]
)

DB_PATH = "backend/app.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# 1. GET ALL MODULES (Search, Filter, Pagination)
@router.get("/")
def get_modules(
    request: Request,
    page: int = 1,
    limit: int = 9,
    search: str = "",
    difficulty: str = "All",
    category: str = "All"
):
    conn = get_db()
    cur = conn.cursor()
    
    offset = (page - 1) * limit
    
    # Base Query
    query = "SELECT * FROM modules WHERE is_published = 1"
    params = []
    
    # Apply Search
    if search:
        query += " AND (title LIKE ? OR description LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
        
    # Apply Difficulty Filter
    if difficulty != "All":
        query += " AND difficulty = ?"
        params.append(difficulty)

    # Apply Category Filter
    if category != "All":
        query += " AND category = ?"
        params.append(category)
        
    # Count Total Results for Pagination
    count_query = query.replace("SELECT *", "SELECT COUNT(*)")
    cur.execute(count_query, params)
    total_items = cur.fetchone()[0]
    total_pages = (total_items + limit - 1) // limit
    
    # Apply Sorting and Pagination
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cur.execute(query, params)
    modules = [dict(row) for row in cur.fetchall()]
    
    # Fetch User Progress for each module if user_id is provided in header/query
    # For now, let's assume we fetch progress in a separate call or simple join if needed.
    # To keep it simple and performant, we'll return the module data.
    # A true "TryHackMe" style might return progress % here.
    
    # Let's try to fetch progress if user_id header exists
    user_id = request.headers.get("user-id")
    if user_id:
        # Get saved module IDs for this user
        cur.execute("SELECT module_id FROM saved_modules WHERE user_id = ?", (user_id,))
        saved_ids = {row["module_id"] for row in cur.fetchall()}
        
        for m in modules:
            # Get progress
            cur.execute("""
                SELECT progress_percent, completed FROM user_module_progress 
                WHERE user_id = ? AND module_id = ?
            """, (user_id, m["id"]))
            prog = cur.fetchone()
            if prog:
                m["progress"] = prog["progress_percent"]
                m["completed"] = bool(prog["completed"])
            else:
                m["progress"] = 0
                m["completed"] = False
            
            # Add is_saved status
            m["is_saved"] = m["id"] in saved_ids
    else:
        # No user logged in
        for m in modules:
            m["is_saved"] = False

    conn.close()
    
    return {
        "modules": modules,
        "page": page,
        "limit": limit,
        "total_items": total_items,
        "total_pages": total_pages
    }

# GET RECENTLY VIEWED MODULES
@router.get("/recently-viewed")
def get_recently_viewed(request: Request, limit: int = 50):
    """Get recently viewed modules for a user (Standardized)"""
    user_id = request.headers.get("user-id")
    if not user_id:
        return []
    
    conn = get_db()
    cur = conn.cursor()
    
    # Query from recently_viewed table to include non-module items if we add them later, 
    # and to ensure consistency with the dashboard list.
    cur.execute("""
        SELECT rv.item_id as id, rv.item_id, rv.item_type, rv.title, rv.last_viewed_at, 
               m.difficulty, m.category,
               COALESCE(ump.progress_percent, 0) as progress_percent,
               COALESCE(ump.completed, 0) as completed
        FROM recently_viewed rv
        LEFT JOIN modules m ON rv.item_id = m.id AND rv.item_type = 'tutorial'
        LEFT JOIN user_module_progress ump ON rv.item_id = ump.module_id AND rv.user_id = ump.user_id
        WHERE rv.user_id = ?
        ORDER BY rv.last_viewed_at DESC
        LIMIT ?
    """, (user_id, limit))
    
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    
    return rows

# SAVE/BOOKMARK MODULE
@router.post("/{module_id}/save")
def save_module(module_id: int, request: Request):
    """Save/bookmark a module for a user"""
    user_id = request.headers.get("user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Check if module exists
        cur.execute("SELECT id FROM modules WHERE id = ?", (module_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Module not found")
        
        # Try to insert, ignore if already saved
        cur.execute("""
            INSERT OR IGNORE INTO saved_modules (user_id, module_id)
            VALUES (?, ?)
        """, (user_id, module_id))
        
        conn.commit()
        return {"status": "success", "message": "Module saved"}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# UNSAVE/UNBOOKMARK MODULE
@router.delete("/{module_id}/save")
def unsave_module(module_id: int, request: Request):
    """Remove a module from saved/bookmarks"""
    user_id = request.headers.get("user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            DELETE FROM saved_modules
            WHERE user_id = ? AND module_id = ?
        """, (user_id, module_id))
        
        conn.commit()
        return {"status": "success", "message": "Module unsaved"}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# GET SAVED MODULES
@router.get("/saved")
def get_saved_modules(request: Request):
    """Get all saved/bookmarked modules for a user"""
    user_id = request.headers.get("user-id")
    if not user_id:
        return {"modules": []}
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT m.*, ump.progress_percent, ump.completed, sm.saved_at
        FROM modules m
        JOIN saved_modules sm ON m.id = sm.module_id
        LEFT JOIN user_module_progress ump ON m.id = ump.module_id AND ump.user_id = ?
        WHERE sm.user_id = ? AND m.is_published = 1
        ORDER BY sm.saved_at DESC
    """, (user_id, user_id))
    
    modules = [dict(row) for row in cur.fetchall()]
    conn.close()
    
    return {"modules": modules}

# 2. GET MODULE DETAILS (With Rooms)
@router.get("/{module_id}")
def get_module_details(module_id: int, request: Request):
    conn = get_db()
    cur = conn.cursor()
    
    # Fetch Module
    cur.execute("SELECT * FROM modules WHERE id = ?", (module_id,))
    module = cur.fetchone()
    
    if not module:
        conn.close()
        raise HTTPException(status_code=404, detail="Module not found")
        
    module_data = dict(module)
    
    # Fetch Rooms (Tasks)
    cur.execute("SELECT * FROM rooms WHERE module_id = ? ORDER BY order_index ASC", (module_id,))
    rooms = [dict(row) for row in cur.fetchall()]
    
    # Fetch User Progress
    user_id = request.headers.get("user-id")
    if user_id:
        # 1. Track this view for "Recently Viewed" table (Dashboard History)
        cur.execute("""
            SELECT id FROM recently_viewed 
            WHERE user_id = ? AND item_type = 'tutorial' AND item_id = ?
        """, (user_id, module_id))
        rv_exists = cur.fetchone()
        
        if rv_exists:
            cur.execute("""
                UPDATE recently_viewed 
                SET last_viewed_at = CURRENT_TIMESTAMP, title = ?
                WHERE id = ?
            """, (module_data["title"], rv_exists["id"]))
        else:
            cur.execute("""
                INSERT INTO recently_viewed (user_id, item_type, item_id, title, last_viewed_at)
                VALUES (?, 'tutorial', ?, ?, CURRENT_TIMESTAMP)
            """, (user_id, module_id, module_data["title"]))

        # 2. Track/Sync with user_module_progress (Learning Progress)
        cur.execute("SELECT id FROM user_module_progress WHERE user_id = ? AND module_id = ?", (user_id, module_id))
        existing = cur.fetchone()
        
        if existing:
            # Update last_accessed timestamp
            cur.execute("""
                UPDATE user_module_progress 
                SET last_accessed = CURRENT_TIMESTAMP
                WHERE user_id = ? AND module_id = ?
            """, (user_id, module_id))
        else:
            # Create new progress record
            cur.execute("""
                INSERT INTO user_module_progress (user_id, module_id, progress_percent, completed, last_accessed)
                VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP)
            """, (user_id, module_id))
        
        conn.commit()
        
        # Module global progress
        cur.execute("SELECT * FROM user_module_progress WHERE user_id = ? AND module_id = ?", (user_id, module_id))
        prog = cur.fetchone()
        module_data["user_progress"] = dict(prog) if prog else {"progress_percent": 0, "completed": False}
        
        # Room specific progress
        for room in rooms:
            cur.execute("SELECT completed FROM user_room_progress WHERE user_id = ? AND room_id = ?", (user_id, room["id"]))
            room_prog = cur.fetchone()
            room["is_completed"] = bool(room_prog["completed"]) if room_prog else False
        
        # Check if module is saved
        cur.execute("SELECT id FROM saved_modules WHERE user_id = ? AND module_id = ?", (user_id, module_id))
        module_data["is_saved"] = cur.fetchone() is not None
    else:
        module_data["is_saved"] = False
    
    conn.close()
    
    return {
        "module": module_data,
        "rooms": rooms
    }

# 3. COMPLETE A ROOM (Task)
@router.post("/{module_id}/rooms/{room_id}/complete")
def complete_room(module_id: int, room_id: int, request: Request):
    user_id = request.headers.get("user-id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")
        
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Mark Room as Completed (check if exists first)
        cur.execute("SELECT id, completed FROM user_room_progress WHERE user_id = ? AND room_id = ?", (user_id, room_id))
        existing = cur.fetchone()
        
        if existing:
            if existing["completed"]:
                # Already completed, just return success
                return {"status": "success", "message": "Already completed"}
            # Update if already exists but not completed (though unlikely with current logic)
            cur.execute("UPDATE user_room_progress SET completed = 1 WHERE user_id = ? AND room_id = ?", (user_id, room_id))
        else:
            # Insert new record
            cur.execute("INSERT INTO user_room_progress (user_id, room_id, completed) VALUES (?, ?, 1)", (user_id, room_id))
            
            # AWARD POINTS - Only on the first completion
            cur.execute("SELECT points FROM rooms WHERE id = ?", (room_id,))
            room_data = cur.fetchone()
            if room_data:
                pts = room_data["points"] or 10
                cur.execute("UPDATE users SET points = points + ? WHERE id = ?", (pts, user_id))
        
        # Update Module Overall Progress
        # 1. Count total rooms
        cur.execute("SELECT count(*) FROM rooms WHERE module_id = ?", (module_id,))
        total_rooms = cur.fetchone()[0]
        
        progress_percent = 0
        
        if total_rooms > 0:
            # 2. Count completed rooms for this user in this module
            cur.execute("""
                SELECT count(distinct r.id) 
                FROM rooms r
                JOIN user_room_progress urp ON r.id = urp.room_id
                WHERE r.module_id = ? AND urp.user_id = ? AND urp.completed = 1
            """, (module_id, user_id))
            completed_rooms = cur.fetchone()[0]
            
            progress_percent = int((completed_rooms / total_rooms) * 100)
            is_completed = (progress_percent == 100)
            
            # 3. Update/Insert into user_module_progress
            cur.execute("SELECT id FROM user_module_progress WHERE user_id = ? AND module_id = ?", (user_id, module_id))
            mod_prog_exists = cur.fetchone()
            
            if mod_prog_exists:
                cur.execute("""
                    UPDATE user_module_progress 
                    SET progress_percent = ?, completed = ?
                    WHERE user_id = ? AND module_id = ?
                """, (progress_percent, is_completed, user_id, module_id))
            else:
                cur.execute("""
                    INSERT INTO user_module_progress (user_id, module_id, progress_percent, completed)
                    VALUES (?, ?, ?, ?)
                """, (user_id, module_id, progress_percent, is_completed))
        
        conn.commit()
        
        # Check and update achievements after completion
        check_and_update_achievements(user_id, conn)
        
        # Get point value for response
        cur.execute("SELECT points FROM rooms WHERE id = ?", (room_id,))
        room_data = cur.fetchone()
        pts_earned = room_data["points"] if room_data else 0

        return {"status": "success", "progress": progress_percent, "points_earned": pts_earned}
        
    except Exception as e:
        conn.rollback()
        print(f"Error completing room: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")
    finally:
        conn.close()

# Helper function to check and update achievements
def check_and_update_achievements(user_id: int, conn):
    """Check if user has earned any achievements and update progress"""
    cur = conn.cursor()
    
    try:
        # Get total completed modules for this user
        cur.execute("""
            SELECT COUNT(*) FROM user_module_progress 
            WHERE user_id = ? AND completed = 1
        """, (user_id,))
        completed_modules = cur.fetchone()[0]
        
        # Define achievements to check (matching database achievements)
        achievements_to_check = [
            {"id": 1, "target": 1},   # First Blood - complete first challenge/module
            {"id": 2, "target": 10},  # SQL Master - 10 SQL challenges (we'll count as 10 modules)
            {"id": 3, "target": 20},  # Tutorial Master - 20 tutorials (20 modules)
        ]
        
        for achievement in achievements_to_check:
            ach_id = achievement["id"]
            target = achievement["target"]
            
            # Calculate progress for this achievement
            progress = min(completed_modules, target)
            unlocked = (progress >= target)
            
            # Check if user has a record for this achievement
            cur.execute("""
                SELECT id, progress, unlocked_at 
                FROM user_achievements 
                WHERE user_id = ? AND achievement_id = ?
            """, (user_id, ach_id))
            
            existing = cur.fetchone()
            
            if existing:
                # Update progress if it changed
                old_progress = existing[1]
                was_unlocked = existing[2] is not None
                
                if progress > old_progress or (unlocked and not was_unlocked):
                    if unlocked and not was_unlocked:
                        # Just unlocked!
                        cur.execute("""
                            UPDATE user_achievements 
                            SET progress = ?, unlocked_at = CURRENT_TIMESTAMP
                            WHERE user_id = ? AND achievement_id = ?
                        """, (progress, user_id, ach_id))
                    else:
                        # Update progress only
                        cur.execute("""
                            UPDATE user_achievements 
                            SET progress = ?
                            WHERE user_id = ? AND achievement_id = ?
                        """, (progress, user_id, ach_id))
            else:
                # Create new achievement record
                unlocked_at = 'CURRENT_TIMESTAMP' if unlocked else None
                cur.execute("""
                    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
                    VALUES (?, ?, ?, ?)
                """, (user_id, ach_id, progress, unlocked_at if unlocked else None))
        
        conn.commit()
        
    except Exception as e:
        print(f"Error updating achievements: {e}")
        # Don't raise - achievements are a nice-to-have, don't break module completion
