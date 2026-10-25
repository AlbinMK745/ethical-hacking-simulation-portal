from fastapi import APIRouter, HTTPException
import sqlite3

router = APIRouter(
    prefix="/user/notes",
    tags=["User Notes"]
)

DB_PATH = "backend/app.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# 1️⃣ GET USER NOTES
@router.get("/{user_id}")
def get_user_notes(user_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, content, created_at, title
        FROM notes
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# 2️⃣ CREATE NOTE
@router.post("/")
def create_note(user_id: int, title: str, content: str):
    if not title or not content:
        raise HTTPException(status_code=400, detail="Title & content required")

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO notes (user_id, title, content)
        VALUES (?, ?, ?)
    """, (user_id, title, content))

    conn.commit()
    conn.close()
    return {"message": "Note added"}


# 3️⃣ DELETE NOTE
@router.delete("/{note_id}")
def delete_note(note_id: int, user_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM notes
        WHERE id = ? AND user_id = ?
    """, (note_id, user_id))

    conn.commit()
    conn.close()
    return {"message": "Note deleted"}
# 4️⃣ UPDATE NOTE
@router.put("/{note_id}")
def update_note(note_id: int, user_id: int, title: str, content: str):
    if not title or not content:
        raise HTTPException(status_code=400, detail="Title & content required")

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE notes
        SET title = ?, content = ?
        WHERE id = ? AND user_id = ?
    """, (title, content, note_id, user_id))

    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Note not found or unauthorized")

    conn.commit()
    conn.close()
    return {"message": "Note updated"}
