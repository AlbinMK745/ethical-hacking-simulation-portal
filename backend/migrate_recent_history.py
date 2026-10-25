import sqlite3
import os

DB_PATH = "backend/app.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Checking 'recently_viewed' table schema...")
    
    # Get current columns
    cur.execute("PRAGMA table_info(recently_viewed)")
    columns = [row[1] for row in cur.fetchall()]
    
    if "title" not in columns:
        print("Adding column 'title'...")
        try:
            cur.execute("ALTER TABLE recently_viewed ADD COLUMN title TEXT")
            print("Column 'title' added successfully.")
        except Exception as e:
            print(f"Error adding column 'title': {e}")
    else:
        print("Column 'title' already exists.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
