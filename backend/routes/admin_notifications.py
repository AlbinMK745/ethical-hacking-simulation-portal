# ethical-hacking-portal/backend/routes/admin_notifications.py

from fastapi import APIRouter, Depends
from pydantic import BaseModel
import sqlite3
from backend.utils.security import require_admin
from typing import Optional

router = APIRouter(
    prefix="/admin/notifications",
    tags=["Admin Notifications"]
)

DB_PATH = "backend/app.db"


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"  # info, warning, success, error


@router.post("/")
def create_notification(data: NotificationCreate):
    """
    Create notification and auto-distribute to all users
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Insert notification
    cur.execute("""
        INSERT INTO notifications
        (title, message, type, target, created_by)
        VALUES (?, ?, ?, ?, 1)
    """, (data.title, data.message, data.type, 'all'))
    
    notification_id = cur.lastrowid
    
    # Get all users with role='user'
    cur.execute("SELECT id FROM users WHERE role = 'user'")
    users = cur.fetchall()
    
    # Create user_notification entries for each user
    for user in users:
        cur.execute("""
            INSERT OR IGNORE INTO user_notifications (user_id, notification_id, is_read)
            VALUES (?, ?, 0)
        """, (user["id"], notification_id))

    conn.commit()
    conn.close()

    return {
        "message": "Notification created and distributed successfully",
        "notification_id": notification_id,
        "distributed_to": len(users)
    }


@router.get("/")
def get_notifications(admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, message, type, target, created_by, created_at
        FROM notifications
        ORDER BY created_at DESC
    """)

    rows = cur.fetchall()
    conn.close()

    return [dict(r) for r in rows]
@router.delete("/{notification_id}")
def delete_notification(notification_id: int, admin=Depends(require_admin)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Delete from main notifications table
    # (Cascading delete should ideally handle user_notifications if foreign keys are set, 
    # but we'll do it manually to be safe for this db setup)
    cur.execute("DELETE FROM user_notifications WHERE notification_id = ?", (notification_id,))
    cur.execute("DELETE FROM notifications WHERE id = ?", (notification_id,))
    
    conn.commit()
    conn.close()

    return {"message": "Notification and associations deleted successfully"}
