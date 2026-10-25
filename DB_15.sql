CREATE DATABASE IF NOT EXISTS ehsp;
USE ehsp;

-- 1 USERS
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100),
    email VARCHAR(120) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2 CHALLENGES
CREATE TABLE challenges (
    challenge_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(150),
    description TEXT,
    category VARCHAR(50),
    difficulty VARCHAR(20),
    points INTEGER,
    flag VARCHAR(100)
);

-- 3 SUBMISSIONS
CREATE TABLE submissions (
    submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    challenge_id INTEGER,
    submitted_flag VARCHAR(100),
    status VARCHAR(20),
    score INTEGER,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    FOREIGN KEY(challenge_id) REFERENCES challenges(challenge_id)
);

-- 4 DAILY CHALLENGES
CREATE TABLE daily_challenges (
    daily_id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER,
    date DATE,
    FOREIGN KEY(challenge_id) REFERENCES challenges(challenge_id)
);

-- 5 DAILY USER ACTIVITY
CREATE TABLE daily_user_activity (
    activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    login_date DATE,
    challenges_completed INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- 6 LEARNING CONTENT
CREATE TABLE learning_content (
    content_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200),
    type VARCHAR(50),
    category VARCHAR(50),
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7 USER LEARNING PROGRESS
CREATE TABLE user_learning_progress (
    progress_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content_id INTEGER,
    completed BOOLEAN DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    FOREIGN KEY(content_id) REFERENCES learning_content(content_id)
);

-- 8 SAVED ITEMS
CREATE TABLE saved_items (
    saved_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content_id INTEGER,
    type VARCHAR(20),
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    FOREIGN KEY(content_id) REFERENCES learning_content(content_id)
);

-- 9 SANDBOX SESSIONS
CREATE TABLE sandbox_sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    start_time DATETIME,
    end_time DATETIME,
    status VARCHAR(20),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- 10 SANDBOX LOGS
CREATE TABLE sandbox_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    command TEXT,
    output TEXT,
    log_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sandbox_sessions(session_id)
);

-- 11 ACHIEVEMENTS
CREATE TABLE achievements (
    achievement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    badge_name VARCHAR(100),
    description TEXT,
    awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- 12 USER ACTIVITY
CREATE TABLE user_activity (
    activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(150),
    activity_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- 13 NOTIFICATIONS
CREATE TABLE notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    status VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- 14 REPORTS
CREATE TABLE reports (
    report_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    report_type VARCHAR(100),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- 15 SYSTEM LOGS
CREATE TABLE system_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event VARCHAR(200),
    log_level VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);