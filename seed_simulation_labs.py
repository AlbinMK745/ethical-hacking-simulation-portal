"""
seed_simulation_labs.py
Inserts the Docker simulation lab challenges into the database.
Run once: python seed_simulation_labs.py
"""
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "backend", "app.db")

# Labs to add — (title, description, difficulty, points, category, correct_flag, docker_image)
NEW_LABS = [
    (
        "Reflected XSS Attack",
        "A search portal reflects user input directly into the HTML response without sanitization. "
        "Inject a malicious script that calls the /flag endpoint and displays the captured flag.",
        "Easy",
        150,
        "Web Hacking",
        "EHSP{xss_reflected_pwned}",
        "ehsp-xss-reflected",
    ),
    (
        "Command Injection — Ping Tool",
        "An internal network diagnostics tool runs 'ping -c 1 <ip>' using shell=True. "
        "Chain a second OS command to read /flag.txt from the server.",
        "Medium",
        250,
        "Web Hacking",
        "EHSP{cmd_injection_rce}",
        "ehsp-cmd-injection",
    ),
    (
        "Hardcoded Credentials in JavaScript",
        "A login portal uses client-side authentication. The admin token is hardcoded "
        "somewhere in the JavaScript source. Use DevTools to find it and log in.",
        "Easy",
        100,
        "Web Hacking",
        "EHSP{js_secret_exposed}",
        "ehsp-hardcoded-creds",
    ),
]

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Get existing columns to handle schema differences
cur.execute("PRAGMA table_info(challenges)")
cols = [r["name"] for r in cur.fetchall()]
print("Columns in challenges table:", cols)

inserted = 0
skipped = 0

for lab in NEW_LABS:
    title, desc, difficulty, points, category, flag, docker_image = lab

    # Check if already exists
    cur.execute("SELECT id FROM challenges WHERE title = ?", (title,))
    existing = cur.fetchone()
    if existing:
        print(f"  ⚠️  Skipped (already exists): {title}")
        skipped += 1
        continue

    # Build insert based on available columns
    if "docker_image" in cols:
        cur.execute("""
            INSERT INTO challenges (title, description, difficulty, points, category, correct_flag, docker_image)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (title, desc, difficulty, points, category, flag, docker_image))
    else:
        cur.execute("""
            INSERT INTO challenges (title, description, difficulty, points, category, correct_flag)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (title, desc, difficulty, points, category, flag))

    print(f"  ✅ Inserted: {title}")
    inserted += 1

conn.commit()
conn.close()

print(f"\nDone! Inserted: {inserted}, Skipped: {skipped}")
