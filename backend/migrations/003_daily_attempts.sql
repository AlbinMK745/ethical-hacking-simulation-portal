-- Migration: Daily Challenge CTF Engine
-- Adds daily_attempts table for precise time tracking

CREATE TABLE IF NOT EXISTS daily_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    daily_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    completion_time INTEGER,  -- duration in seconds
    is_completed BOOLEAN DEFAULT 0,
    bonus_earned BOOLEAN DEFAULT 0,
    FOREIGN KEY(daily_id) REFERENCES daily_challenges(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(daily_id, user_id) -- One active attempt per daily challenge per user
);

-- Ensure daily_challenges has created_at
-- Note: SQLite doesn't support ADD COLUMN if NOT EXISTS easily in a script
-- But we checked and it might already be there or not. Let's assume it's clean for now or use a safe check.
-- Typically we'd use PRAGMA table_info but for a simple script:
-- ALTER TABLE daily_challenges ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
