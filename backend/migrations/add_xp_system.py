"""
Migration: Add XP & Level System
Run: python -m backend.migrations.add_xp_system
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "app.db")


def run():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ── 1. xp_transactions table ──────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS xp_transactions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            amount      INTEGER NOT NULL,          -- can be negative (penalty)
            reason      TEXT    NOT NULL,          -- 'challenge_solved', 'daily_login', 'tutorial_complete', etc.
            source_id   INTEGER,                   -- challenge_id / tutorial_id / etc.
            created_at  DATETIME DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ── 2. streak_shields table ───────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS streak_shields (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL UNIQUE,
            shields     INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ── 3. Add xp column to users (if not already present) ───────────────────
    existing_cols = [row[1] for row in cur.execute("PRAGMA table_info(users)").fetchall()]

    if "xp" not in existing_cols:
        cur.execute("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0")
        print("[XP Migration] Added 'xp' column to users table.")

    if "level" not in existing_cols:
        cur.execute("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1")
        print("[XP Migration] Added 'level' column to users table.")

    if "streak" not in existing_cols:
        cur.execute("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0")
        print("[XP Migration] Added 'streak' column to users table.")

    if "last_active" not in existing_cols:
        cur.execute("ALTER TABLE users ADD COLUMN last_active DATE")
        print("[XP Migration] Added 'last_active' column to users table.")

    conn.commit()
    conn.close()
    print("[XP Migration] OK - XP & Level System tables created successfully.")


if __name__ == "__main__":
    run()
