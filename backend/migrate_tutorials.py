import sqlite3
import os

DB_PATH = "backend/app.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Checking 'tutorials' table schema...")
    
    # Get current columns
    cur.execute("PRAGMA table_info(tutorials)")
    columns = [row[1] for row in cur.fetchall()]
    
    new_columns = {
        "difficulty": "TEXT DEFAULT 'Beginner'",
        "duration": "TEXT DEFAULT '30 min'",
        "views": "INTEGER DEFAULT 0"
    }

    for col, definition in new_columns.items():
        if col not in columns:
            print(f"Adding column '{col}'...")
            try:
                cur.execute(f"ALTER TABLE tutorials ADD COLUMN {col} {definition}")
                print(f"Column '{col}' added successfully.")
            except Exception as e:
                print(f"Error adding column '{col}': {e}")
        else:
            print(f"Column '{col}' already exists.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
