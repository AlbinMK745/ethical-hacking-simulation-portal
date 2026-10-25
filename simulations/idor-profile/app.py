"""
EHSP — IDOR (Insecure Direct Object Reference) Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
import sqlite3
from flask import Flask, request, session, redirect, url_for

app = Flask(__name__)
app.secret_key = "ehsp-idor-lab-secret"

FLAG = "EHSP{idor_access_granted}"
DB = "/tmp/lab.db"


def init_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.executescript(f"""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            secret TEXT
        );

        INSERT OR IGNORE INTO users (id, username, email, role, secret) VALUES
            (1, 'admin', 'admin@ehsp.internal', 'admin', '{FLAG}'),
            (2, 'alice', 'alice@users.com', 'user', 'Nothing interesting here.'),
            (3, 'bob',   'bob@users.com',   'user', 'Keep looking...'),
            (4, 'charlie','charlie@users.com','user','Not this one either!'),
            (5, 'diana', 'diana@users.com', 'user', 'So close... try a lower ID!');
    """)
    conn.commit()
    conn.close()


init_db()


COMMON_CSS = """
    :root {
      --bg-base: #060913;
      --border-subtle: rgba(16, 185, 129, 0.18);
      --border-glow: rgba(16, 185, 129, 0.45);
      --accent: #10b981;
      --accent-glow: rgba(16, 185, 129, 0.28);
      --emerald: #10b981;
      --ruby: #f43f5e;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 20%, #06241a 0%, #080a14 55%, #020409 100%);
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
        linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px);
      background-size: 32px 32px;
      pointer-events: none;
      z-index: 0;
    }
    .hud-header {
      position: relative;
      z-index: 10;
      background: rgba(12, 16, 28, 0.85);
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
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
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
    .hud-pill.emerald {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.35);
      color: #a7f3d0;
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


@app.route("/")
def home():
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // IDOR Profile Access Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .portal-card {{
      background: rgba(13, 20, 36, 0.85);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.12);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 520px;
      position: relative;
    }}
    .portal-card::before {{
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
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
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

    .session-card {{
      background: rgba(6, 10, 22, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 1rem 1.2rem;
      margin-bottom: 1.4rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .session-info {{
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }}
    .session-icon {{
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
    }}
    .session-details h3 {{
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
    }}
    .session-details span {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: var(--text-muted);
    }}
    .btn-profile {{
      background: linear-gradient(135deg, #059669, #10b981);
      color: #022c22;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.82rem;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }}
    .btn-profile:hover {{
      background: #34d399;
      transform: translateY(-1px);
    }}

    .tactical-box {{
      background: rgba(6, 11, 24, 0.8);
      border: 1px solid rgba(16, 185, 129, 0.2);
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
      margin-bottom: 0.75rem;
    }}
    .tactical-desc code {{
      background: rgba(16, 185, 129, 0.15);
      color: #a7f3d0;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
    }}
    .stepper-row {{
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }}
    .chip-btn {{
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.35rem 0.7rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: #a7f3d0;
      text-decoration: none;
      transition: all 0.15s ease;
    }}
    .chip-btn:hover {{
      background: rgba(16, 185, 129, 0.2);
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
        <i class="fa-solid fa-address-card"></i>
      </div>
      <div class="hud-title-group">
        <h1>IDOR Simulation Lab <span style="font-size: 0.75rem; font-weight: 400; color: var(--accent);">(Broken Object Level Auth)</span></h1>
        <p>EHSP DEFENSE MATRIX // HOST: profiles.internal // PORT: 5000</p>
      </div>
    </div>
    <div class="hud-metadata">
      <div class="hud-pill emerald">
        <i class="fa-solid fa-id-badge"></i>
        <span>VULN: BOLA / IDOR</span>
      </div>
      <div class="hud-pill">
        <i class="fa-solid fa-user-secret"></i>
        <span>PARAM: ?id=&lt;target&gt;</span>
      </div>
      <div class="hud-pill success">
        <span class="status-dot"></span>
        <span>SERVICE ONLINE</span>
      </div>
    </div>
  </header>

  <!-- Main Area -->
  <main class="main-wrapper">
    <div class="portal-card">
      <div class="card-header">
        <div class="portal-avatar">
          <i class="fa-solid fa-users-gear"></i>
        </div>
        <h2>Enterprise Personnel Directory</h2>
        <p>Current Active Session: charlie (User ID 4)</p>
      </div>

      <div class="session-card">
        <div class="session-info">
          <div class="session-icon">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="session-details">
            <h3>charlie</h3>
            <span>ID: 4 // Role: user</span>
          </div>
        </div>
        <a href="/profile?id=4" class="btn-profile">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> View Profile
        </a>
      </div>

      <!-- Tactical Mission Dossier -->
      <div class="tactical-box">
        <div class="tactical-header">
          <i class="fa-solid fa-crosshairs"></i> MISSION BRIEFING
        </div>
        <p class="tactical-desc">
          The endpoint <code>/profile?id=4</code> does not verify whether the active session owns the requested object.
          Modify the numeric identifier in the URL query string to inspect other profiles and locate the admin flag.
        </p>
        <div style="font-size:0.68rem; color:var(--text-dim); font-family:'JetBrains Mono',monospace; margin-bottom:0.4rem;">DIRECT PROBE LINKS:</div>
        <div class="stepper-row">
          <a class="chip-btn" href="/profile?id=1"><i class="fa-solid fa-crown"></i> Probe ID 1 (admin)</a>
          <a class="chip-btn" href="/profile?id=2">Probe ID 2</a>
          <a class="chip-btn" href="/profile?id=3">Probe ID 3</a>
          <a class="chip-btn" href="/profile?id=5">Probe ID 5</a>
        </div>
      </div>
    </div>
  </main>

</body>
</html>"""


@app.route("/profile")
def profile():
    # ⚠️ INTENTIONALLY VULNERABLE — No authorization check!
    user_id = request.args.get("id", "4")

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cur.fetchone()
    conn.close()

    if not user:
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>User Not Found</title>
  <style>
    {COMMON_CSS}
    .notfound-card {{
      background: rgba(13, 20, 36, 0.9);
      border: 1px solid rgba(244, 63, 94, 0.4);
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      max-width: 420px;
    }}
  </style>
</head>
<body>
  <main class="main-wrapper">
    <div class="notfound-card">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; color:#f43f5e; margin-bottom:0.8rem;"></i>
      <h2 style="font-family:'Outfit',sans-serif; color:#fff;">User Record Not Found</h2>
      <p style="color:var(--text-muted); font-size:0.85rem; margin:0.5rem 0 1.2rem;">No employee record exists for User ID {user_id}.</p>
      <a href="/" style="color:var(--accent); font-family:'JetBrains Mono',monospace; font-size:0.8rem;">← Return to Directory</a>
    </div>
  </main>
</body>
</html>""", 404

    user = dict(user)
    is_admin = user["role"] == "admin"
    flag_found = user["secret"] == FLAG

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Profile — {user['username']}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .profile-card {{
      background: rgba(13, 20, 36, 0.92);
      backdrop-filter: blur(18px);
      border: 1px solid {'rgba(16, 185, 129, 0.5)' if is_admin else 'var(--border-subtle)'};
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px {'rgba(16, 185, 129, 0.25)' if is_admin else 'rgba(16, 185, 129, 0.1)'};
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 520px;
    }}
    .url-tracker {{
      background: #020409;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 0.6rem 0.9rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: #fbbf24;
      margin-bottom: 1.4rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }}
    .profile-header {{
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.4rem;
    }}
    .profile-avatar {{
      width: 54px;
      height: 54px;
      border-radius: 12px;
      background: {'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 78, 59, 0.3))' if is_admin else 'rgba(15, 23, 42, 0.8)'};
      border: 1px solid {'#10b981' if is_admin else 'rgba(255, 255, 255, 0.1)'};
      display: flex;
      align-items: center;
      justify-content: center;
      color: {'#34d399' if is_admin else '#94a3b8'};
      font-size: 1.5rem;
    }}
    .profile-header h2 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
    }}
    .role-badge {{
      display: inline-block;
      padding: 0.15rem 0.55rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      {'background:rgba(16, 185, 129, 0.2); color:#6ee7b7; border:1px solid #10b981;' if is_admin else 'background:rgba(56, 189, 248, 0.15); color:#7dd3fc; border:1px solid rgba(56,189,248,0.3);'}
    }}
    .prop-row {{
      background: rgba(6, 10, 22, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 0.55rem;
    }}
    .prop-key {{
      font-size: 0.7rem;
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .prop-val {{
      font-size: 0.88rem;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 0.2rem;
    }}

    .flag-banner {{
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 78, 59, 0.35));
      border: 1px solid #10b981;
      border-radius: 8px;
      padding: 1rem 1.2rem;
      margin: 1.4rem 0 0.8rem;
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
    <div class="profile-card">
      <div class="url-tracker">
        <i class="fa-solid fa-link"></i>
        <span>GET /profile?id={user_id}</span>
      </div>

      <div class="profile-header">
        <div class="profile-avatar">
          <i class="fa-solid {'fa-shield-halved' if is_admin else 'fa-user'}"></i>
        </div>
        <div>
          <h2>{user['username']}</h2>
          <span class="role-badge">{user['role']}</span>
        </div>
      </div>

      <div class="prop-row">
        <div class="prop-key">DATABASE USER ID</div>
        <div class="prop-val">{user['id']}</div>
      </div>
      <div class="prop-row">
        <div class="prop-key">REGISTERED EMAIL</div>
        <div class="prop-val">{user['email']}</div>
      </div>
      <div class="prop-row">
        <div class="prop-key">RESTRICTED USER SECRET</div>
        <div class="prop-val" style="color:{'#34d399' if is_admin else '#94a3b8'}">{user['secret']}</div>
      </div>

      {f"<div class='flag-banner'><div><div class='flag-label'>MISSION COMPLETED // ADMIN SECRET EXTRACTED</div><div class='flag-value' id='flagVal'>{FLAG}</div></div><button class='copy-btn' onclick='copyFlag()'><i class='fa-regular fa-copy'></i> Copy</button></div>" if flag_found else ""}

      <a href="/" class="btn-back"><i class="fa-solid fa-arrow-left"></i> Return to Personnel Directory</a>
    </div>
  </main>

  <script>
    function copyFlag() {{
      const el = document.getElementById('flagVal');
      if (el) {{
        navigator.clipboard.writeText(el.innerText);
        alert('Flag copied: ' + el.innerText);
      }}
    }}
  </script>
</body>
</html>"""


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
