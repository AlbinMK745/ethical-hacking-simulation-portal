from fastapi import APIRouter, Header, HTTPException, Body
from backend.database import get_db
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/social", tags=["Social & Chat"])

# --- Models ---
class FriendRequestAction(BaseModel):
    action: str  # 'accept' or 'decline'

class CreateGroupRequest(BaseModel):
    name: str
    member_ids: List[int]

class SendMessageRequest(BaseModel):
    content: str

# --- Endpoints ---

@router.get("/users")
def get_all_users(user_id: int = Header(..., alias="user-id")):
    """List all users with friendship status relative to the current user."""
    conn = get_db()
    cur = conn.cursor()
    
    # Get all users except self
    cur.execute("""
        SELECT id, username, avatar, level, hacker_title
        FROM users
        WHERE id != ?
    """, (user_id,))
    users = [dict(r) for r in cur.fetchall()]
    
    # Get friendship statuses
    cur.execute("""
        SELECT requester_id, addressee_id, status, id as request_id
        FROM friendships
        WHERE requester_id = ? OR addressee_id = ?
    """, (user_id, user_id))
    friendships = cur.fetchall()
    
    # Map status to users
    for u in users:
        u['friend_status'] = 'none'
        u['request_id'] = None
        for f in friendships:
            if f['requester_id'] == user_id and f['addressee_id'] == u['id']:
                u['friend_status'] = 'sent' if f['status'] == 'pending' else f['status']
                u['request_id'] = f['request_id']
            elif f['addressee_id'] == user_id and f['requester_id'] == u['id']:
                u['friend_status'] = 'received' if f['status'] == 'pending' else f['status']
                u['request_id'] = f['request_id']
                
    conn.close()
    return {"users": users}

@router.post("/friend-request/{target_id}")
def send_friend_request(target_id: int, user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()
    
    # Check if exists
    cur.execute("""
        SELECT id FROM friendships 
        WHERE (requester_id = ? AND addressee_id = ?) 
           OR (requester_id = ? AND addressee_id = ?)
    """, (user_id, target_id, target_id, user_id))
    
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Request already exists")
        
    cur.execute("""
        INSERT INTO friendships (requester_id, addressee_id, status)
        VALUES (?, ?, 'pending')
    """, (user_id, target_id))
    
    conn.commit()
    conn.close()
    return {"status": "sent"}

@router.put("/friend-request/{request_id}")
def handle_friend_request(request_id: int, body: FriendRequestAction, user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()
    
    status = 'accepted' if body.action == 'accept' else 'declined'
    
    cur.execute("""
        UPDATE friendships 
        SET status = ? 
        WHERE id = ? AND addressee_id = ?
    """, (status, request_id, user_id))
    
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found or not for you")
        
    conn.commit()
    conn.close()
    return {"status": status}

@router.get("/friends")
def get_friends(user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT u.id, u.username, u.avatar, u.hacker_title, u.level
        FROM users u
        JOIN friendships f ON (f.requester_id = u.id OR f.addressee_id = u.id)
        WHERE (f.requester_id = ? OR f.addressee_id = ?) 
          AND f.status = 'accepted'
          AND u.id != ?
    """, (user_id, user_id, user_id))
    
    friends = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"friends": friends}

@router.get("/dm/{friend_id}")
def get_dm_history(friend_id: int, user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT sender_id, content, sent_at, is_read
        FROM direct_messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY sent_at ASC
        LIMIT 50
    """, (user_id, friend_id, friend_id, user_id))
    
    messages = [dict(r) for r in cur.fetchall()]
    
    # Mark as read
    cur.execute("""
        UPDATE direct_messages SET is_read = 1
        WHERE sender_id = ? AND receiver_id = ?
    """, (friend_id, user_id))
    
    conn.commit()
    conn.close()
    return {"messages": messages}

@router.post("/dm/{friend_id}")
def send_dm(friend_id: int, body: SendMessageRequest, user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO direct_messages (sender_id, receiver_id, content)
        VALUES (?, ?, ?)
    """, (user_id, friend_id, body.content))
    
    conn.commit()
    msg_id = cur.lastrowid
    conn.close()
    
    return {"id": msg_id, "sent_at": datetime.now().isoformat()}

@router.post("/groups")
def create_group(body: CreateGroupRequest, user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("INSERT INTO chat_groups (name, created_by) VALUES (?, ?)", (body.name, user_id))
    group_id = cur.lastrowid
    
    # Add creator as admin
    cur.execute("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')", (group_id, user_id))
    
    # Add members
    for mid in body.member_ids:
        if mid != user_id:
            cur.execute("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", (group_id, mid))
            
    conn.commit()
    conn.close()
    return {"id": group_id}

@router.get("/groups")
def get_my_groups(user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT g.id, g.name, g.avatar, gm.role
        FROM chat_groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
    """, (user_id,))
    
    groups = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"groups": groups}

@router.get("/groups/{group_id}/messages")
def get_group_messages(group_id: int, user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()
    
    # Check if member
    cur.execute("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?", (group_id, user_id))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    cur.execute("""
        SELECT gm.sender_id, u.username as sender_name, gm.content, gm.sent_at
        FROM group_messages gm
        JOIN users u ON gm.sender_id = u.id
        WHERE gm.group_id = ?
        ORDER BY gm.sent_at ASC
        LIMIT 100
    """, (group_id,))
    
    messages = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"messages": messages}

@router.post("/groups/{group_id}/messages")
def send_group_message(group_id: int, body: SendMessageRequest, user_id: int = Header(..., alias="user-id")):
    conn = get_db()
    cur = conn.cursor()
    
    # Check if member
    cur.execute("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?", (group_id, user_id))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    cur.execute("""
        INSERT INTO group_messages (group_id, sender_id, content)
        VALUES (?, ?, ?)
    """, (group_id, user_id, body.content))
    
    conn.commit()
    conn.close()
    return {"status": "sent"}
