-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin','user')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CHALLENGES
-- =========================
CREATE TABLE challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT CHECK(difficulty IN ('Easy','Medium','Hard')),
    points INTEGER NOT NULL,
    correct_flag TEXT NOT NULL,
    category TEXT
);

-- =========================
-- SUBMISSIONS
-- =========================
CREATE TABLE submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    submitted_flag TEXT,
    is_correct BOOLEAN,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id)
);

-- =========================
-- USER PROGRESS
-- =========================
CREATE TABLE user_progress (
    user_id INTEGER PRIMARY KEY,
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    last_activity DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- TUTORIALS
-- =========================
CREATE TABLE tutorials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT
);

-- =========================
-- SAVED TUTORIALS
-- =========================
CREATE TABLE saved_tutorials (
    user_id INTEGER,
    tutorial_id INTEGER,
    PRIMARY KEY (user_id, tutorial_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tutorial_id) REFERENCES tutorials(id)
);

-- =========================
-- ACHIEVEMENTS
-- =========================
CREATE TABLE achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

-- =========================
-- USER ACHIEVEMENTS
-- =========================
CREATE TABLE user_achievements (
    user_id INTEGER,
    achievement_id INTEGER,
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

-- =========================
-- NOTES
-- =========================
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- LEADERBOARD
-- =========================
CREATE TABLE leaderboard (
    user_id INTEGER PRIMARY KEY,
    total_points INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
