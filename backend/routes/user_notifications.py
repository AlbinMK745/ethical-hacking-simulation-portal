from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
import sqlite3
from datetime import datetime

router = APIRouter(prefix="/user/notifications", tags=["User Notifications"])

DB_PATH = "backend/app.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ==============================
# GET USER NOTIFICATIONS
# ==============================
@router.get("/")
def get_user_notifications(user_id: int = Header(..., alias="user-id"), limit: int = 10):
    """
    Get notifications for a specific user
    """
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            n.id,
            n.title,
            n.message,
            n.type,
            n.created_at,
            un.is_read,
            un.read_at
        FROM user_notifications un
        JOIN notifications n ON un.notification_id = n.id
        WHERE un.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT ?
    """, (user_id, limit))
    
    rows = cur.fetchall()
    conn.close()
    
    notifications = []
    for row in rows:
        notifications.append({
            "id": row["id"],
            "title": row["title"],
            "message": row["message"],
            "type": row["type"],
            "created_at": row["created_at"],
            "is_read": bool(row["is_read"]),
            "read_at": row["read_at"]
        })
    
    return notifications


# ==============================
# GET UNREAD COUNT
# ==============================
@router.get("/unread-count")
def get_unread_count(user_id: int = Header(..., alias="user-id")):
    """
    Get count of unread notifications for user
    """
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT COUNT(*) as count
        FROM user_notifications
        WHERE user_id = ? AND is_read = 0
    """, (user_id,))
    
    count = cur.fetchone()["count"]
    conn.close()
    
    return {"unread_count": count}


# ==============================
# MARK AS READ
# ==============================
@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, user_id: int = Header(..., alias="user-id")):
    """
    Mark a notification as read
    """
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE user_notifications
        SET is_read = 1, read_at = ?
        WHERE user_id = ? AND notification_id = ?
    """, (datetime.now().isoformat(), user_id, notification_id))
    
    conn.commit()
    conn.close()
    
    return {"status": "marked_read"}


# ==============================
# MARK ALL AS READ
# ==============================
@router.put("/mark-all-read")
def mark_all_notifications_read(user_id: int = Header(..., alias="user-id")):
    """
    Mark all notifications as read for user
    """
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE user_notifications
        SET is_read = 1, read_at = ?
        WHERE user_id = ? AND is_read = 0
    """, (datetime.now().isoformat(), user_id))
    
    conn.commit()
    affected = cur.rowcount
    conn.close()
    
    return {"status": "all_marked_read", "count": affected}
