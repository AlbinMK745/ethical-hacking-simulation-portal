"""
EHSP — SQL Injection Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
import sqlite3
import os
from flask import Flask, request, g

app = Flask(__name__)
DB = "/tmp/lab.db"
FLAG = "EHSP{sqli_bypass_success}"


# ── Bootstrap DB ──────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id       INTEGER PRIMARY KEY,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            role     TEXT DEFAULT 'user'
        );

        CREATE TABLE IF NOT EXISTS secrets (
            id    INTEGER PRIMARY KEY,
            name  TEXT,
            value TEXT
        );

        INSERT OR IGNORE INTO users (id, username, password, role)
        VALUES
            (1, 'alice', 'P@ssw0rd!', 'user'),
            (2, 'bob',   'hunter2',   'user'),
            (3, 'admin', 'sup3r$ecr3t', 'admin');

        INSERT OR IGNORE INTO secrets (id, name, value)
        VALUES (1, 'flag', '""" + FLAG + """');
    """)
    conn.commit()
    conn.close()


init_db()


# ── Common Cyber Styles ───────────────────────────────────────
COMMON_CSS = """
    :root {
      --bg-base: #060913;
      --border-subtle: rgba(56, 189, 248, 0.16);
      --border-glow: rgba(56, 189, 248, 0.45);
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.28);
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.25);
      --ruby: #f43f5e;
      --amber: #f59e0b;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 20%, #0d1f38 0%, #060913 60%, #020409 100%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
      background-size: 32px 32px;
      pointer-events: none;
      z-index: 0;
    }
    .hud-header {
      position: relative;
      z-index: 10;
      background: rgba(8, 14, 28, 0.85);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.7rem 1.6rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.8rem;
    }
    .hud-branding {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .hud-badge-icon {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.05));
      border: 1px solid var(--border-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      font-size: 1.05rem;
      box-shadow: 0 0 16px var(--accent-glow);
    }
    .hud-title-group h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
    }
    .hud-title-group p {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    .hud-metadata {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .hud-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.3rem 0.7rem;
      border-radius: 9999px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
    }
    .hud-pill.danger {
      background: rgba(244, 63, 94, 0.12);
      border-color: rgba(244, 63, 94, 0.35);
      color: #fda4af;
    }
    .hud-pill.success {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.35);
      color: #6ee7b7;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .main-wrapper {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.2rem;
    }
"""


# ── Pages ──────────────────────────────────────────────────────
@app.route("/")
def home():
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // SQL Injection Authentication Bypass Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .auth-card {{
      background: rgba(13, 20, 36, 0.85);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.12);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 440px;
      position: relative;
      overflow: hidden;
    }}
    .auth-card::before {{
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
    }}
    .card-header {{
      text-align: center;
      margin-bottom: 1.8rem;
    }}
    .portal-avatar {{
      width: 52px;
      height: 52px;
      margin: 0 auto 0.9rem;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.05));
      border: 1px solid var(--border-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      font-size: 1.4rem;
      box-shadow: 0 0 20px var(--accent-glow);
    }}
    .card-header h2 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
    }}
    .card-header p {{
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }}

    .form-group {{
      margin-bottom: 1.1rem;
    }}
    .form-label {{
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
      font-family: 'JetBrains Mono', monospace;
    }}
    .input-box {{
      position: relative;
    }}
    .input-box i {{
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
      font-size: 0.9rem;
      pointer-events: none;
      transition: color 0.2s;
    }}
    .input-box input {{
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.6rem;
      background: rgba(6, 9, 19, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 0.88rem;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: all 0.2s ease;
    }}
    .input-box input:focus {{
      border-color: var(--accent);
      box-shadow: 0 0 16px var(--accent-glow);
    }}
    .input-box input:focus + i {{
      color: var(--accent);
    }}

    .btn-submit {{
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.8rem;
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      border: 1px solid rgba(56, 189, 248, 0.5);
      border-radius: 8px;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 18px rgba(14, 165, 233, 0.35);
      transition: all 0.25s ease;
    }}
    .btn-submit:hover {{
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(14, 165, 233, 0.55);
      background: linear-gradient(135deg, #0369a1, #0284c7);
    }}

    /* Tactical Drawer */
    .tactical-box {{
      margin-top: 1.5rem;
      background: rgba(6, 11, 24, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 8px;
      padding: 0.9rem;
    }}
    .tactical-header {{
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.55rem;
    }}
    .tactical-desc {{
      font-size: 0.76rem;
      color: var(--text-muted);
      line-height: 1.45;
      margin-bottom: 0.65rem;
    }}
    .chips-label {{
      font-size: 0.68rem;
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 0.35rem;
    }}
    .chip-container {{
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }}
    .payload-chip {{
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 0.28rem 0.6rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: #7dd3fc;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s ease;
    }}
    .payload-chip:hover {{
      background: rgba(56, 189, 248, 0.18);
      border-color: var(--accent);
      color: #fff;
    }}
  </style>
</head>
<body>

  <!-- Cyber HUD Header -->
  <header class="hud-header">
    <div class="hud-branding">
      <div class="hud-badge-icon">
        <i class="fa-solid fa-database"></i>
      </div>
      <div class="hud-title-group">
        <h1>SQL Injection Lab <span style="font-size: 0.75rem; font-weight: 400; color: var(--accent);">(Auth Bypass)</span></h1>
        <p>EHSP DEFENSE MATRIX // HOST: auth.internal // PORT: 5000</p>
      </div>
    </div>
    <div class="hud-metadata">
      <div class="hud-pill danger">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>SEVERITY: CRITICAL</span>
      </div>
      <div class="hud-pill">
        <i class="fa-solid fa-server"></i>
        <span>BACKEND: SQLite3</span>
      </div>
      <div class="hud-pill success">
        <span class="status-dot"></span>
        <span>LAB ONLINE</span>
      </div>
    </div>
  </header>

  <!-- Main Area -->
  <main class="main-wrapper">
    <div class="auth-card">
      <div class="card-header">
        <div class="portal-avatar">
          <i class="fa-solid fa-shield-cat"></i>
        </div>
        <h2>Secure Employee Portal</h2>
        <p>Internal Authentication Gateway // EHSP-CORP</p>
      </div>

      <form method="POST" action="/login">
        <div class="form-group">
          <label class="form-label">IDENTITY / USERNAME</label>
          <div class="input-box">
            <input id="usernameInput" name="username" placeholder="e.g. alice or admin' --" autocomplete="off" required>
            <i class="fa-solid fa-user"></i>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">ACCESS PASSWORD</label>
          <div class="input-box">
            <input name="password" type="password" placeholder="••••••••••••" value="bypass">
            <i class="fa-solid fa-lock"></i>
          </div>
        </div>

        <button type="submit" class="btn-submit">
          <i class="fa-solid fa-right-to-bracket"></i> Authenticate Session
        </button>
      </form>

      <!-- Tactical Mission Dossier -->
      <div class="tactical-box">
        <div class="tactical-header">
          <i class="fa-solid fa-crosshairs"></i> MISSION BRIEFING
        </div>
        <p class="tactical-desc">
          The server executes an unsanitized query: <code>SELECT * FROM users WHERE username='&lt;input&gt;'</code>.
          Craft a payload that forces the expression to evaluate to <code>TRUE</code>.
        </p>
        <div class="chips-label">QUICK INJECT PAYLOADS:</div>
        <div class="chip-container">
          <div class="payload-chip" onclick="fillPayload(&quot;' OR 1=1 --&quot;)">' OR 1=1 --</div>
          <div class="payload-chip" onclick="fillPayload(&quot;admin' --&quot;)">admin' --</div>
          <div class="payload-chip" onclick="fillPayload(&quot;' OR '1'='1&quot;)">' OR '1'='1</div>
          <div class="payload-chip" onclick="fillPayload(&quot;' UNION SELECT 3,'admin','x','admin' --&quot;)">UNION SELECT</div>
        </div>
      </div>
    </div>
  </main>

  <script>
    function fillPayload(val) {{
      const input = document.getElementById('usernameInput');
      input.value = val;
      input.focus();
    }}
  </script>
</body>
</html>"""


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "")
    password = request.form.get("password", "")

    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    # ⚠️ INTENTIONALLY VULNERABLE — DO NOT USE IN PRODUCTION
    query = f"SELECT * FROM users WHERE username='{username}'"

    try:
        cur.execute(query)
        user = cur.fetchone()
    except Exception as e:
        conn.close()
        return error_page(f"SQL Execution Error: {e}", query)

    if user:
        # Fetch the flag from secrets table
        cur.execute("SELECT value FROM secrets WHERE name='flag'")
        secret = cur.fetchone()
        flag = secret[0] if secret else "No flag found"
        conn.close()
        return success_page(user, flag, query)

    conn.close()
    return error_page("Invalid credentials. The query returned zero records.", query)


def success_page(user, flag, query):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Access Granted (SQLi Success)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .result-card {{
      background: rgba(13, 20, 36, 0.9);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(16, 185, 129, 0.4);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(16, 185, 129, 0.2);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 520px;
    }}
    .status-badge {{
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #6ee7b7;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      margin-bottom: 0.8rem;
    }}
    .result-card h2 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
    }}
    .user-pill {{
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }}
    .user-pill strong {{ color: #fff; }}
    .role-badge {{
      background: rgba(56, 189, 248, 0.2);
      border: 1px solid var(--accent);
      color: #7dd3fc;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
    }}
    .flag-card {{
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.25));
      border: 1px solid #10b981;
      border-radius: 8px;
      padding: 1rem 1.2rem;
      margin: 1.4rem 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.8rem;
    }}
    .flag-label {{
      font-size: 0.68rem;
      color: #a7f3d0;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .flag-value {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.05rem;
      font-weight: 700;
      color: #34d399;
      margin-top: 0.2rem;
    }}
    .copy-btn {{
      background: #10b981;
      color: #022c22;
      border: none;
      padding: 0.45rem 0.8rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.76rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: background 0.2s;
    }}
    .copy-btn:hover {{ background: #34d399; }}
    .query-header {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: var(--text-dim);
      margin-bottom: 0.4rem;
    }}
    .query-box {{
      background: #020409;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: #fbbf24;
      word-break: break-all;
    }}
    .btn-back {{
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 1.4rem;
      color: var(--accent);
      font-size: 0.82rem;
      text-decoration: none;
      font-family: 'JetBrains Mono', monospace;
    }}
    .btn-back:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
  <main class="main-wrapper">
    <div class="result-card">
      <div class="status-badge">
        <i class="fa-solid fa-circle-check"></i> AUTHENTICATION BYPASSED
      </div>
      <h2>Session Hijack Confirmed</h2>
      <p class="user-pill">
        Authenticated As: <strong>{user[1]}</strong>
        <span class="role-badge">{user[3]}</span>
      </p>

      <div class="flag-card">
        <div>
          <div class="flag-label">CAPTURE THE FLAG</div>
          <div class="flag-value" id="flagText">{flag}</div>
        </div>
        <button class="copy-btn" onclick="copyFlag()"><i class="fa-regular fa-copy"></i> Copy</button>
      </div>

      <div class="query-header">EXECUTED DATABASE STATEMENT:</div>
      <div class="query-box">{query}</div>

      <a href="/" class="btn-back"><i class="fa-solid fa-arrow-left"></i> Return to Authentication Terminal</a>
    </div>
  </main>

  <script>
    function copyFlag() {{
      const text = document.getElementById('flagText').innerText;
      navigator.clipboard.writeText(text);
      alert('Flag copied: ' + text);
    }}
  </script>
</body>
</html>"""


def error_page(msg, query=""):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Access Denied</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .err-card {{
      background: rgba(13, 20, 36, 0.9);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(244, 63, 94, 0.4);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(244, 63, 94, 0.2);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 480px;
    }}
    .err-badge {{
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #fda4af;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      margin-bottom: 0.8rem;
    }}
    .err-card h2 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
    }}
    .err-desc {{
      color: var(--text-muted);
      font-size: 0.85rem;
      line-height: 1.5;
      margin: 0.5rem 0 1.2rem;
    }}
    .query-header {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: var(--text-dim);
      margin-bottom: 0.4rem;
    }}
    .query-box {{
      background: #020409;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: #fda4af;
      word-break: break-all;
    }}
    .btn-back {{
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 1.4rem;
      color: var(--accent);
      font-size: 0.82rem;
      text-decoration: none;
      font-family: 'JetBrains Mono', monospace;
    }}
    .btn-back:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
  <main class="main-wrapper">
    <div class="err-card">
      <div class="err-badge">
        <i class="fa-solid fa-triangle-exclamation"></i> ACCESS REJECTED
      </div>
      <h2>Authentication Failure</h2>
      <p class="err-desc">{msg}</p>

      {f"<div class='query-header'>QUERY ATTEMPTED:</div><div class='query-box'>{query}</div>" if query else ""}

      <a href="/" class="btn-back"><i class="fa-solid fa-arrow-left"></i> Return to Login</a>
    </div>
  </main>
</body>
</html>"""


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
