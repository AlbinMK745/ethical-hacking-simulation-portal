
-- Update challenges table
ALTER TABLE challenges ADD COLUMN is_active BOOLEAN DEFAULT 1;
ALTER TABLE challenges ADD COLUMN is_sim_lab BOOLEAN DEFAULT 0;
ALTER TABLE challenges ADD COLUMN sim_type TEXT;

-- Create sandbox_sessions table
CREATE TABLE IF NOT EXISTS sandbox_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    container_id TEXT NOT NULL,
    container_name TEXT NOT NULL,
    port INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    stopped_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id)
);

-- Create sandbox_logs table
CREATE TABLE IF NOT EXISTS sandbox_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sandbox_id INTEGER NOT NULL,
    log_entry TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sandbox_id) REFERENCES sandbox_sessions(id)
);

-- Update existing challenges to be sim labs (based on current logic)
UPDATE challenges SET is_sim_lab = 1, is_active = 1;
UPDATE challenges SET sim_type = 'sqli-login' WHERE title LIKE '%SQL Injection%';
UPDATE challenges SET sim_type = 'xss-reflected' WHERE title LIKE '%Reflected XSS%';
UPDATE challenges SET sim_type = 'cmd-injection' WHERE title LIKE '%Command Injection%';
UPDATE challenges SET sim_type = 'hardcoded-creds' WHERE title LIKE '%Hardcoded%';
UPDATE challenges SET sim_type = 'idor-profile' WHERE title LIKE '%IDOR%';
UPDATE challenges SET sim_type = 'linux-flag-hunt' WHERE title LIKE '%Linux%';
UPDATE challenges SET sim_type = 'stored-xss' WHERE title LIKE '%Stored XSS%';
UPDATE challenges SET sim_type = 'jwt-manipulation' WHERE title LIKE '%JWT%';
UPDATE challenges SET sim_type = 'broken-access-control' WHERE title LIKE '%Broken Access%';
UPDATE challenges SET sim_type = 'blind-sqli' WHERE title LIKE '%Blind SQLi%';
UPDATE challenges SET sim_type = 'ssrf' WHERE title LIKE '%SSRF%';
UPDATE challenges SET sim_type = 'priv-esc' WHERE title LIKE '%Privilege Escalation%';
UPDATE challenges SET sim_type = 'rce-eval' WHERE title LIKE '%RCE%';
