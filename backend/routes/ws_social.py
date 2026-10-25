from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
from datetime import datetime
from backend.database import get_db

router = APIRouter(prefix="/ws/social", tags=["Social WebSocket"])

class SocialConnectionManager:
    def __init__(self):
        # user_id -> list of WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # group_id -> set of user_ids currently online and in chat
        self.group_channels: Dict[int, Set[int]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"[WS-Social] User {user_id} connected.")

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"[WS-Social] User {user_id} disconnected.")

    async def send_dm(self, sender_id: int, receiver_id: int, content: str):
        payload = {
            "type": "dm",
            "sender_id": sender_id,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        # Send to receiver
        if receiver_id in self.active_connections:
            for connection in self.active_connections[receiver_id]:
                try:
                    await connection.send_json(payload)
                except:
                    pass
        # Also send to sender's other devices/tabs
        if sender_id in self.active_connections:
            for connection in self.active_connections[sender_id]:
                try:
                    await connection.send_json(payload)
                except:
                    pass

    async def send_group_msg(self, group_id: int, sender_id: int, sender_name: str, content: str):
        payload = {
            "type": "group_msg",
            "group_id": group_id,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        
        # Get all members of the group from DB
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM group_members WHERE group_id = ?", (group_id,))
        member_ids = [r[0] for r in cur.fetchall()]
        conn.close()

        for mid in member_ids:
            if mid in self.active_connections:
                for connection in self.active_connections[mid]:
                    try:
                        await connection.send_json(payload)
                    except:
                        pass

social_manager = SocialConnectionManager()

@router.websocket("/{user_id}")
async def ws_social_endpoint(websocket: WebSocket, user_id: int):
    await social_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get("type")
            
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                
            elif msg_type == "send_dm":
                receiver_id = message.get("receiver_id")
                content = message.get("content")
                if receiver_id and content:
                    await social_manager.send_dm(user_id, receiver_id, content)
                    
            elif msg_type == "send_group_msg":
                group_id = message.get("group_id")
                content = message.get("content")
                sender_name = message.get("sender_name", "Anonymous")
                if group_id and content:
                    await social_manager.send_group_msg(group_id, user_id, sender_name, content)

    except WebSocketDisconnect:
        social_manager.disconnect(user_id, websocket)
    except Exception as e:
        print(f"[WS-Social] Error: {e}")
        social_manager.disconnect(user_id, websocket)
