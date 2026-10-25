from fastapi import Header, HTTPException
import sqlite3

DB_PATH = "backend/app.db"

def require_admin(admin_id: int = Header(..., alias="user-id")):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT role FROM users WHERE id=?",
        (admin_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row or row[0] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return admin_id
