-- =========================
-- 1. USERS
-- =========================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 2. CHALLENGES
-- =========================
CREATE TABLE challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    flag_hash TEXT NOT NULL,
    category TEXT,
    difficulty TEXT,
    points INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 3. SUBMISSIONS
-- =========================
CREATE TABLE submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    challenge_id INTEGER,
    submitted_flag TEXT,
    is_correct BOOLEAN,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
);

-- =========================
-- 4. CHALLENGE ATTEMPTS
-- =========================
CREATE TABLE challenge_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    challenge_id INTEGER,
    attempt_count INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
);

-- =========================
-- 5. USER CHALLENGES
-- =========================
CREATE TABLE user_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    challenge_id INTEGER,
    solved BOOLEAN DEFAULT 0,
    solved_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
);

-- =========================
-- DAILY CHALLENGES
-- =========================
CREATE TABLE daily_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER,
    challenge_date DATE,
    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
);

CREATE TABLE daily_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    challenge_id INTEGER,
    attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
);

CREATE TABLE daily_challenge_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    challenge_id INTEGER,
    bonus_points INTEGER,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
);

-- =========================
-- TUTORIALS & LEARNING
-- =========================
CREATE TABLE tutorials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    difficulty TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER,
    title TEXT,
    description TEXT,
    points INTEGER,
    FOREIGN KEY(module_id) REFERENCES modules(id)
);

CREATE TABLE user_module_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    module_id INTEGER,
    progress_percent INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(module_id) REFERENCES modules(id)
);

CREATE TABLE user_room_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    room_id INTEGER,
    completed BOOLEAN DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(room_id) REFERENCES rooms(id)
);

CREATE TABLE saved_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    module_id INTEGER,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(module_id) REFERENCES modules(id)
);

CREATE TABLE saved_tutorials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tutorial_id INTEGER,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(tutorial_id) REFERENCES tutorials(id)
);

CREATE TABLE recently_viewed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    item_type TEXT,
    item_id INTEGER,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- =========================
-- SANDBOX SYSTEM
-- =========================
CREATE TABLE sandbox_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    container_id TEXT,
    status TEXT,
    started_at DATETIME,
    ended_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE sandbox_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    log_message TEXT,
    log_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sandbox_sessions(id)
);

CREATE TABLE sandbox_exec_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    command TEXT,
    output TEXT,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sandbox_sessions(id)
);

-- =========================
-- ACHIEVEMENTS
-- =========================
CREATE TABLE achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    points INTEGER
);

CREATE TABLE user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    achievement_id INTEGER,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(achievement_id) REFERENCES achievements(id)
);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    notification_id INTEGER,
    is_read BOOLEAN DEFAULT 0,
    delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(notification_id) REFERENCES notifications(id)
);

-- =========================
-- USER FEATURES
-- =========================
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_points INTEGER,
    challenges_solved INTEGER,
    streak_days INTEGER,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- =========================
-- AI LOGS
-- =========================
CREATE TABLE ai_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    feature TEXT,
    request_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);