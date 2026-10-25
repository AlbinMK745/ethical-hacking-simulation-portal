from fastapi import APIRouter, HTTPException
import sqlite3

router = APIRouter(
    prefix="/user/tutorials",
    tags=["User Tutorials"]
)

DB_PATH = "backend/app.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# 1️⃣ GET ALL PUBLISHED TUTORIALS (LIST VIEW)
@router.get("/")
def get_tutorials():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            title,
            content,
            category,
            difficulty,
            duration,
            views
        FROM tutorials
        ORDER BY created_at DESC
    """)

    tutorials = [dict(row) for row in cur.fetchall()]
    conn.close()
    return tutorials

#  SEARCH TUTORIALS
@router.get("/search")
def search_tutorials(q: str):
    conn = get_db()
    cur = conn.cursor()

    # Search title, category and content; ensure a difficulty field is returned (fallback to 'Beginner')
    cur.execute("""
        SELECT id, title, category, content, difficulty, duration, views
        FROM tutorials
        WHERE title LIKE ? OR category LIKE ? OR content LIKE ?
        ORDER BY created_at DESC
    """, (f"%{q}%", f"%{q}%", f"%{q}%"))

    rows = cur.fetchall()
    conn.close()

    return [dict(r) for r in rows]



# 2️⃣ GET SINGLE TUTORIAL (START LEARNING)
@router.get("/{tutorial_id}")
def get_tutorial(tutorial_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM tutorials
        WHERE id = ?
    """, (tutorial_id,))

    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Tutorial not found")

    return dict(row)
 

# 4️⃣ VIEW SAVED TUTORIALS
@router.get("/saved/{user_id}")
def get_saved_tutorials(user_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            t.id,
            t.title,
            t.category
            FROM tutorials t
        JOIN saved_tutorials s
            ON t.id = s.tutorial_id
        WHERE s.user_id = ?
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# 5️⃣ REMOVE SAVED TUTORIAL
@router.delete("/saved/{tutorial_id}")
def remove_saved_tutorial(tutorial_id: int, user_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM saved_tutorials
        WHERE user_id = ? AND tutorial_id = ?
    """, (user_id, tutorial_id))

    conn.commit()
    conn.close()
    return {"message": "Saved tutorial removed"}


# 6️⃣ SAVE TUTORIAL
@router.post("/save/{tutorial_id}")
def save_tutorial(tutorial_id: int, user_id: int):
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO saved_tutorials (user_id, tutorial_id)
            VALUES (?, ?)
        """, (user_id, tutorial_id))
        conn.commit()
    except sqlite3.IntegrityError:
        # Already saved or foreign key violation - ignore duplicate saves
        pass
    finally:
        conn.close()

    return {"message": "Saved"}


