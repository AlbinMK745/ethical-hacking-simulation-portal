"""
WebSocket Notifications Route
Real-time push notifications to connected clients.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Header, HTTPException
from typing import Dict, List
import asyncio
import json
from datetime import datetime
from backend.database import get_db

router = APIRouter(prefix="/ws", tags=["WebSocket"])


# ── Connection Manager ────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # user_id -> list of WebSocket connections (user may have multiple tabs)
        self.active: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        if user_id not in self.active:
            self.active[user_id] = []
        self.active[user_id].append(ws)
        print(f"[WS] User {user_id} connected. Total connections: {sum(len(v) for v in self.active.values())}")

    def disconnect(self, user_id: int, ws: WebSocket):
        if user_id in self.active:
            self.active[user_id] = [c for c in self.active[user_id] if c != ws]
            if not self.active[user_id]:
                del self.active[user_id]
        print(f"[WS] User {user_id} disconnected.")

    async def send_to_user(self, user_id: int, payload: dict):
        """Send a JSON message to all connections of a specific user."""
        if user_id in self.active:
            dead = []
            for ws in self.active[user_id]:
                try:
                    await ws.send_json(payload)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active[user_id].remove(ws)

    async def broadcast(self, payload: dict, exclude_user: int = None):
        """Broadcast to ALL connected users."""
        for uid, conns in list(self.active.items()):
            if uid == exclude_user:
                continue
            for ws in conns:
                try:
                    await ws.send_json(payload)
                except Exception:
                    pass


manager = ConnectionManager()


# ── WebSocket endpoint ────────────────────────────────────────────────────────
@router.websocket("/notifications/{user_id}")
async def ws_notifications(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)

    # Send any unread notifications on connect
    try:
        conn = get_db()
        cur  = conn.cursor()
        unread = cur.execute("""
            SELECT id, message, type, created_at
            FROM notifications
            WHERE user_id = ? AND is_read = 0
            ORDER BY created_at DESC
            LIMIT 10
        """, (user_id,)).fetchall()
        conn.close()

        for n in unread:
            await websocket.send_json({
                "type":    "notification",
                "id":      n["id"],
                "message": n["message"],
                "notif_type": n["type"] if "type" in n.keys() else "info",
                "at":      n["created_at"],
                "unread":  True,
            })
    except Exception as e:
        print(f"[WS] Error sending unread notifications: {e}")

    # Send welcome ping
    await websocket.send_json({
        "type":    "connected",
        "message": "Real-time notifications active",
        "at":      str(datetime.now()),
    })

    # Keep alive — listen for pings from client
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)


# ── Helper: push notification to user ────────────────────────────────────────
async def push_notification(user_id: int, message: str, notif_type: str = "info", persist: bool = True):
    """
    Send a real-time notification to a user.
    If persist=True, also saves to the notifications table.
    """
    payload = {
        "type":       "notification",
        "notif_type": notif_type,
        "message":    message,
        "at":         str(datetime.now()),
    }

    if persist:
        try:
            conn = get_db()
            cur  = conn.cursor()
            # Try with 'type' column (may not exist in all schemas)
            try:
                cur.execute("""
                    INSERT INTO notifications (user_id, message, type, is_read)
                    VALUES (?, ?, ?, 0)
                """, (user_id, message, notif_type))
            except Exception:
                cur.execute("""
                    INSERT INTO notifications (user_id, message, status)
                    VALUES (?, ?, 'unread')
                """, (user_id, message))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[WS] DB persist error: {e}")

    await manager.send_to_user(user_id, payload)


# ── REST: Send notification via HTTP (for internal use) ───────────────────────
@router.post("/notify/{user_id}")
async def notify_user(user_id: int, message: str, notif_type: str = "info"):
    """Trigger a real-time notification to a user via REST (for testing/admin)."""
    await push_notification(user_id, message, notif_type)
    return {"sent": True}


# ── REST: Broadcast announcement ──────────────────────────────────────────────
@router.post("/broadcast")
async def broadcast_message(message: str, notif_type: str = "info"):
    """Admin: broadcast a message to all connected users."""
    await manager.broadcast({
        "type":       "announcement",
        "notif_type": notif_type,
        "message":    message,
        "at":         str(datetime.now()),
    })
    return {"broadcast": True, "recipients": len(manager.active)}


# ── REST: Get online user count ───────────────────────────────────────────────
@router.get("/online-count")
def online_count():
    return {
        "users_online": len(manager.active),
        "connections":  sum(len(v) for v in manager.active.values()),
    }


# Expose manager for use in other routes (e.g., award_xp)
ws_manager = manager
