from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db

router = APIRouter(prefix="/admin/modules", tags=["admin-modules"])

# Pydantic Models
class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: str = "Beginner"
    category: str = "General"
    thumbnail_url: Optional[str] = None
    is_published: bool = True

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None

class RoomCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    order_index: int = 0
    points: int = 10
    content_type: str = "text"

class RoomUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    order_index: Optional[int] = None
    points: Optional[int] = None
    content_type: Optional[str] = None

# Helper function to check admin
def verify_admin(request: Request):
    """Check if user is admin"""
    user_id = request.headers.get("user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    user = cur.fetchone()
    db.close()
    
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user_id

# ============= MODULE ENDPOINTS =============

@router.get("/")
def get_all_modules(request: Request):
    """Get all modules (including unpublished) - Admin only"""
    verify_admin(request)
    
    db = get_db()
    cur = db.cursor()
    
    cur.execute("""
        SELECT 
            m.*,
            COUNT(r.id) as room_count
        FROM modules m
        LEFT JOIN rooms r ON m.id = r.module_id
        GROUP BY m.id
        ORDER BY m.id DESC
    """)
    
    modules = [dict(row) for row in cur.fetchall()]
    db.close()
    
    return {"modules": modules}

@router.post("/")
def create_module(module: ModuleCreate, request: Request):
    """Create a new module - Admin only"""
    verify_admin(request)
    
    db = get_db()
    cur = db.cursor()
    
    cur.execute("""
        INSERT INTO modules (title, description, difficulty, category, thumbnail_url, is_published)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        module.title,
        module.description,
        module.difficulty,
        module.category,
        module.thumbnail_url,
        1 if module.is_published else 0
    ))
    
    module_id = cur.lastrowid
    db.commit()
    db.close()
    
    return {"status": "success", "module_id": module_id, "message": "Module created successfully"}

@router.get("/{module_id}")
def get_module_detail(module_id: int, request: Request):
    """Get module details with rooms - Admin only"""
    verify_admin(request)
    
    db = get_db()
    cur = db.cursor()
    
    # Get module
    cur.execute("SELECT * FROM modules WHERE id = ?", (module_id,))
    module = cur.fetchone()
    
    if not module:
        db.close()
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get rooms
    cur.execute("""
        SELECT * FROM rooms 
        WHERE module_id = ? 
        ORDER BY order_index ASC
    """, (module_id,))
    
    rooms = [dict(row) for row in cur.fetchall()]
    db.close()
    
    return {
        "module": dict(module),
        "rooms": rooms
    }

@router.put("/{module_id}")
def update_module(module_id: int, module: ModuleUpdate, request: Request):
    """Update module details - Admin only"""
    verify_admin(request)
    
    db = get_db()
    cur = db.cursor()
    
    # Check if module exists
    cur.execute("SELECT id FROM modules WHERE id = ?", (module_id,))
    if not cur.fetchone():
        db.close()
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Build update query dynamically
    updates = []
    values = []
    
    if module.title is not None:
        updates.append("title = ?")
        values.append(module.title)
    if module.description is not None:
        updates.append("description = ?")
        values.append(module.description)
    if module.difficulty is not None:
        updates.append("difficulty = ?")
        values.append(module.difficulty)
    if module.category is not None:
        updates.append("category = ?")
        values.append(module.category)
    if module.thumbnail_url is not None:
        updates.append("thumbnail_url = ?")
        values.append(module.thumbnail_url)
    if module.is_published is not None:
        updates.append("is_published = ?")
        values.append(1 if module.is_published else 0)
    
    if not updates:
        db.close()
        return {"status": "success", "message": "No changes provided"}
    
    values.append(module_id)
    query = f"UPDATE modules SET {', '.join(updates)} WHERE id = ?"
    
    cur.execute(query, values)
    db.commit()
    db.close()
    
    return {"status": "success", "message": "Module updated successfully"}

@router.delete("/{module_id}")
def delete_module(module_id: int, request: Request):
    """Delete module and all its rooms - Admin only"""
    verify_admin(request)
    
    db = get_db()
    cur = db.cursor()
    
    # Check if module exists
    cur.execute("SELECT id FROM modules WHERE id = ?", (module_id,))
    if not cur.fetchone():
        db.close()
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Delete module (CASCADE will delete rooms)
    cur.execute("DELETE FROM modules WHERE id = ?", (module_id,))
    db.commit()
    db.close()
    
    return {"status": "success", "message": "Module deleted successfully"}

# ============= ROOM ENDPOINTS =============

@router.post("/{module_id}/rooms")
def create_room(module_id: int, room: RoomCreate, request: Request):
    """Create a new room in a module - Admin only"""
    verify_admin(request)
    
    db = get_db()
    cur = db.cursor()
    
    # Verify module exists
    cur.execute("SELECT id FROM modules WHERE id = ?", (module_id,))
    if not cur.fetchone():
        db.close()
        raise HTTPException(status_code=404, detail="Module not found")
    
    cur.execute("""
        INSERT INTO rooms (module_id, title, description, content, order_index, points, content_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        module_id,
        room.title,
        room.description,
        room.content,
        room.order_index,
        room.points,
        room.content_type
    ))
    
    room_id = cur.lastrowid
    db.commit()
    db.close()
    
    return {"status": "success", "room_id": room_id, "message": "Room created successfully"}

@router.put("/{module_id}/rooms/{room_id}")
def update_room(module_id: int, room_id: int, room: RoomUpdate, request: Request):
    """Update room details - Admin only"""
    verify_admin(request)
    
    db = get_db()
    cur = db.cursor()
    
    # Check if room exists and belongs to module
    cur.execute("SELECT id FROM rooms WHERE id = ? AND module_id = ?", (room_id, module_id))
    if not cur.fetchone():
        db.close()
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Build update query
    updates = []
    values = []
    
    if room.title is not None:
        updates.append("title = ?")
        values.append(room.title)
    if room.description is not None:
        updates.append("description = ?")
        values.append(room.description)
    if room.content is not None:
        updates.append("content = ?")
        values.append(room.content)
    if room.order_index is not None:
        updates.append("order_index = ?")
        values.append(room.order_index)
    if room.points is not None:
        updates.append("points = ?")
        values.append(room.points)
    if room.content_type is not None:
        updates.append("content_type = ?")
        values.append(room.content_type)
    
    if not updates:
        db.close()
        return {"status": "success", "message": "No changes provided"}
    
    values.append(room_id)
    query = f"UPDATE rooms SET {', '.join(updates)} WHERE id = ?"
    
    cur.execute(query, values)
    db.commit()
    db.close()
    
    return {"status": "success", "message": "Room updated successfully"}

@router.delete("/{module_id}/rooms/{room_id}")
def delete_room(module_id: int, room_id: int, request: Request):
    """Delete a room - Admin only"""
    verify_admin(request)
    
    db = get_db()
    cur = db.cursor()
    
    # Check if room exists and belongs to module
    cur.execute("SELECT id FROM rooms WHERE id = ? AND module_id = ?", (room_id, module_id))
    if not cur.fetchone():
        db.close()
        raise HTTPException(status_code=404, detail="Room not found")
    
    cur.execute("DELETE FROM rooms WHERE id = ?", (room_id,))
    db.commit()
    db.close()
    
    return {"status": "success", "message": "Room deleted successfully"}
