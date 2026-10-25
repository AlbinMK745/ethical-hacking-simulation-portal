import sqlite3
import os

DB_PATH = r"c:\Users\LOQ\Desktop\MAIN PROJECT 2026\EHSP\ethical-hacking-portal (4)\ethical-hacking-portal - till sandbox (strt)\ethical-hacking-portal\backend\app.db"
OUTPUT_PATH = r"c:\Users\LOQ\Desktop\MAIN PROJECT 2026\EHSP\ethical-hacking-portal (4)\ethical-hacking-portal - till sandbox (strt)\ethical-hacking-portal\schema_output.txt"

def get_schema():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    tables = ["tutorials", "recently_viewed", "user_room_progress", "user_progress", "saved_tutorials"]
    
    with open(OUTPUT_PATH, "w") as f:
        for table in tables:
            f.write(f"\n--- Schema for {table} ---\n")
            cur.execute(f"SELECT sql FROM sqlite_master WHERE name='{table}'")
            row = cur.fetchone()
            if row:
                f.write(row[0] + "\n")
            else:
                f.write("Table not found.\n")
                
            f.write(f"\n--- Columns for {table} ---\n")
            cur.execute(f"PRAGMA table_info({table})")
            for col in cur.fetchall():
                f.write(str(col) + "\n")
            
    conn.close()

if __name__ == "__main__":
    get_schema()
