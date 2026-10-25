"""Migration: Add new profile fields to users table"""
import sqlite3

def run():
    conn = sqlite3.connect("backend/app.db")
    cur = conn.cursor()
    
    new_cols = [
        ("country", "TEXT DEFAULT ''"),
        ("hacker_title", "TEXT DEFAULT ''"),
        ("twitter_url", "TEXT DEFAULT ''"),
        ("linkedin_url", "TEXT DEFAULT ''"),
    ]
    
    # Get existing columns
    cur.execute("PRAGMA table_info(users)")
    existing = {r[1] for r in cur.fetchall()}
    
    for col, col_def in new_cols:
        if col not in existing:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_def}")
            print(f"[Migration] Added column: {col}")
        else:
            print(f"[Migration] Column already exists: {col}")
    
    conn.commit()
    conn.close()
    print("[Migration] Profile fields migration complete.")

if __name__ == "__main__":
    run()
