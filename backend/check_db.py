import sqlite3
import os

DB_PATH = r"c:\Users\LOQ\Desktop\MAIN PROJECT 2026\EHSP\ethical-hacking-portal (4)\ethical-hacking-portal\backend\app.db"

def check_schema():
    if not os.path.exists(DB_PATH):
        return f"Error: Database not found at {DB_PATH}"

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    result = "--- sandbox_sessions schema ---\n"
    cur.execute("PRAGMA table_info(sandbox_sessions)")
    rows = cur.fetchall()
    for r in rows:
        result += str(r) + "\n"
        
    result += "\n--- sandbox_logs schema ---\n"
    try:
        cur.execute("PRAGMA table_info(sandbox_logs)")
        rows = cur.fetchall()
        for r in rows:
            result += str(r) + "\n"
    except Exception as e:
        result += f"Error checking sandbox_logs: {e}\n"
        
    conn.close()
    return result

if __name__ == "__main__":
    out = check_schema()
    with open(r"c:\Users\LOQ\Desktop\MAIN PROJECT 2026\EHSP\ethical-hacking-portal (4)\ethical-hacking-portal\backend\schema_fixed.txt", "w", encoding="utf-8") as f:
        f.write(out)
