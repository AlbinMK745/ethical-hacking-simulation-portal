-- Sample challenges for daily selection
INSERT OR IGNORE INTO challenges (id, title, description, difficulty, points, flag, category) VALUES
(1, 'SQL Injection Basics', 'Find the flag by exploiting SQL injection vulnerability in the login form.', 'Easy', 100, 'FLAG{sql_1nj3ct10n_b4s1cs}', 'Web Security'),
(2, 'Cross-Site Scripting (XSS)', 'Execute a script in the vulnerable comment section to steal the admin cookie.', 'Medium', 150, 'FLAG{xss_c00k13_st34l}', 'Web Security'),
(3, 'Buffer Overflow Attack', 'Overflow the buffer to gain control of the program execution.', 'Hard', 250, 'FLAG{buff3r_0v3rfl0w_pwn}', 'Binary Exploitation'),
(4, 'Network Packet Analysis', 'Analyze the captured network traffic to find the hidden flag.', 'Medium', 150, 'FLAG{p4ck3t_4n4lys1s}', 'Network Security'),
(5, 'Linux Privilege Escalation', 'Escalate your privileges from a limited user to root access.', 'Hard', 250, 'FLAG{pr1v_3sc4l4t10n}', 'System Security'),
(6, 'Cryptography Challenge', 'Decrypt the encrypted message using the provided hints.', 'Medium', 150, 'FLAG{cry t0_m4st3r}', 'Cryptography');

-- Sample users (if not exists)
INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES
(1, 'testuser', 'test@example.com', 'hashed_password', 'user');
