import sqlite3
import os

DB_PATH = r"c:\Users\LOQ\Desktop\MAIN PROJECT 2026\EHSP\ethical-hacking-portal (4)\ethical-hacking-portal\backend\app.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Add missing columns to sandbox_sessions
    try:
        cur.execute("ALTER TABLE sandbox_sessions ADD COLUMN container_name TEXT")
        print("Added container_name column")
    except sqlite3.OperationalError:
        print("container_name column already exists")
        
    try:
        cur.execute("ALTER TABLE sandbox_sessions ADD COLUMN last_activity DATETIME DEFAULT CURRENT_TIMESTAMP")
        print("Added last_activity column")
    except sqlite3.OperationalError:
        print("last_activity column already exists")
        
    try:
        cur.execute("ALTER TABLE sandbox_sessions ADD COLUMN stopped_at DATETIME")
        print("Added stopped_at column")
    except sqlite3.OperationalError:
        print("stopped_at column already exists")
        
    # Also ensure sandbox_logs exists if it was missed
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sandbox_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sandbox_id INTEGER NOT NULL,
            log_entry TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sandbox_id) REFERENCES sandbox_sessions(id)
        )
    """)
    print("Ensured sandbox_logs table exists")

    conn.commit()
    conn.close()
    print("Migration finished")

if __name__ == "__main__":
    migrate()
