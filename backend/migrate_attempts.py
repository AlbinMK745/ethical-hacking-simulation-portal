import sqlite3
import os

DB_PATH = "backend/app.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Checking 'submissions' table schema...")
    
    # Get current columns
    cur.execute("PRAGMA table_info(submissions)")
    columns = [row[1] for row in cur.fetchall()]
    
    if "display_title" not in columns:
        print("Adding column 'display_title'...")
        try:
            cur.execute("ALTER TABLE submissions ADD COLUMN display_title TEXT")
            print("Column 'display_title' added successfully.")
        except Exception as e:
            print(f"Error adding column 'display_title': {e}")
    else:
        print("Column 'display_title' already exists.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
