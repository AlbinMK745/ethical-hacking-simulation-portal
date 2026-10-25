import sqlite3
conn = sqlite3.connect('backend/app.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
print([r[0] for r in cur.fetchall()])
# Also show users columns
cur.execute("PRAGMA table_info(users)")
print("\nusers columns:", [(r[1], r[2]) for r in cur.fetchall()])
# Check submissions
cur.execute("PRAGMA table_info(submissions)")
print("\nsubmissions columns:", [(r[1], r[2]) for r in cur.fetchall()])
conn.close()
