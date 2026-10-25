"""
EHSP — Broken Access Control Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
from flask import Flask, request, jsonify, session, redirect

app = Flask(__name__)
app.secret_key = "ehsp-bac-secret"
FLAG = "EHSP{bac_admin_panel}"

USERS = {
    "alice": {"password": "password123", "role": "user"},
    "admin": {"password": "complexpassword!99", "role": "admin"},
}


@app.route("/")
def home():
    logged_in = "username" in session
    username = session.get("username", "")
    role = session.get("role", "user")

    user_info_html = (
        f"""
        <div class="user-info-card">
          <div class="user-avatar"><i class="fas fa-user-shield"></i></div>
          <div class="user-details">
            <div class="user-name-line">Current Session: <strong class="name-val">{username}</strong></div>
            <div class="user-role-line">Session Authority: <span class="role-pill {role}">{role.upper()}</span></div>
          </div>
        </div>
        """
        if logged_in else ""
    )

    auth_form_html = (
        f"""
        <form method="POST" action="/login">
          <div class="form-group">
            <label><span><i class="fas fa-user"></i> Username</span></label>
            <input name="username" class="cyber-input" value="alice" autocomplete="off" />
          </div>
          <div class="form-group">
            <label><span><i class="fas fa-lock"></i> Password</span></label>
            <input name="password" type="password" class="cyber-input" value="password123" />
          </div>
          <button type="submit" class="cyber-btn"><i class="fas fa-right-to-bracket"></i> Sign In to Portal</button>
        </form>
        """
        if not logged_in else
        """
        <form method="POST" action="/logout">
          <button class="cyber-btn danger" type="submit"><i class="fas fa-power-off"></i> Terminate Active Session</button>
        </form>
        """
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Enterprise Portal (Broken Access Control)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {{
      --bg-dark: #070b13;
      --card-bg: rgba(13, 20, 36, 0.85);
      --border-color: rgba(96, 165, 250, 0.25);
      --accent-blue: #3b82f6;
      --accent-blue-glow: rgba(59, 130, 246, 0.35);
      --accent-purple: #a855f7;
      --accent-green: #4ade80;
      --accent-red: #ef4444;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.12) 0%, transparent 60%), var(--bg-dark);
      background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 24px 24px;
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }}
    .hud-header {{
      background: rgba(7, 11, 19, 0.9);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.75rem 1.8rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }}
    .hud-brand {{
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      letter-spacing: 1px;
      font-size: 0.95rem;
      color: #fff;
    }}
    .hud-brand i {{ color: var(--accent-blue); font-size: 1.1rem; }}
    .hud-live-tag {{
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: var(--accent-green);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      text-transform: uppercase;
    }}
    .live-dot {{
      width: 7px;
      height: 7px;
      background: var(--accent-green);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--accent-green);
      animation: pulseDot 1.4s infinite;
    }}
    @keyframes pulseDot {{ 0%, 100% {{ opacity: 1; transform: scale(1); }} 50% {{ opacity: 0.4; transform: scale(0.85); }} }}
    .hud-meta {{ display: flex; align-items: center; gap: 0.8rem; }}
    .meta-chip {{
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: var(--text-muted);
    }}
    .meta-chip strong {{ color: var(--text-main); }}
    .badge-diff {{
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: 'Outfit', sans-serif;
    }}
    .badge-diff.medium {{ background: rgba(250, 204, 21, 0.15); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.35); }}

    .lab-container {{
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.5rem;
    }}
    .lab-card {{
      background: var(--card-bg);
      backdrop-filter: blur(24px);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      width: 100%;
      max-width: 620px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent-blue-glow);
      overflow: hidden;
      animation: cardFadeUp 0.4s ease-out;
    }}
    @keyframes cardFadeUp {{ from {{ opacity: 0; transform: translateY(18px) scale(0.99); }} to {{ opacity: 1; transform: translateY(0) scale(1); }} }}
    
    .card-titlebar {{
      background: rgba(4, 8, 16, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .traffic-dots {{ display: flex; gap: 6px; }}
    .traffic-dot {{ width: 10px; height: 10px; border-radius: 50%; }}
    .dot-red {{ background: #ef4444; }}
    .dot-yellow {{ background: #f59e0b; }}
    .dot-green {{ background: #22c55e; }}
    .card-titlebar-title {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
    }}
    
    .card-body {{ padding: 2rem 2.2rem; }}
    .card-header-block {{ margin-bottom: 1.8rem; }}
    .card-header-block h1 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }}
    .card-header-block h1 i {{ color: var(--accent-blue); }}
    .card-header-block p {{
      color: var(--text-muted);
      font-size: 0.88rem;
      margin-top: 0.4rem;
      line-height: 1.5;
    }}

    .user-info-card {{
      background: rgba(4, 8, 16, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 0.85rem 1.1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.4rem;
    }}
    .user-avatar {{
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: var(--accent-blue);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }}
    .user-details {{ flex: 1; }}
    .user-name-line {{ font-size: 0.82rem; color: var(--text-muted); }}
    .name-val {{ color: #fff; font-size: 0.95rem; }}
    .user-role-line {{ font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }}
    .role-pill {{
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.68rem;
      font-weight: 700;
    }}
    .role-pill.user {{ background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }}
    .role-pill.admin {{ background: rgba(34, 197, 94, 0.15); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); }}

    .form-group {{ margin-bottom: 1.2rem; }}
    .form-group label {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }}
    .cyber-input {{
      width: 100%;
      background: rgba(4, 8, 16, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      color: #93c5fd;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      padding: 0.8rem 1rem;
      outline: none;
      transition: all 0.25s ease;
    }}
    .cyber-input:focus {{
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.15);
    }}

    .cyber-btn {{
      width: 100%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 0.85rem 1.4rem;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      box-shadow: 0 4px 18px rgba(59, 130, 246, 0.35);
      transition: all 0.25s ease;
      text-decoration: none;
    }}
    .cyber-btn:hover {{
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5);
    }}
    .cyber-btn.danger {{
      background: linear-gradient(135deg, #ef4444, #b91c1c);
      box-shadow: 0 4px 18px rgba(239, 68, 68, 0.35);
    }}
    .cyber-btn.danger:hover {{
      background: linear-gradient(135deg, #f87171, #ef4444);
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.5);
    }}

    .nav-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.6rem;
      margin-top: 1.2rem;
    }}
    .nav-btn {{
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.65rem 0.8rem;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.2s;
    }}
    .nav-btn:hover {{
      border-color: var(--accent-blue);
      color: #fff;
      background: rgba(59, 130, 246, 0.08);
    }}
    .nav-btn.admin-link {{
      border-color: rgba(168, 85, 247, 0.3);
      color: #c084fc;
    }}
    .nav-btn.admin-link:hover {{
      border-color: var(--accent-purple);
      background: rgba(168, 85, 247, 0.1);
      color: #fff;
    }}

    .briefing-box {{
      margin-top: 1.8rem;
      background: rgba(4, 8, 16, 0.75);
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 12px;
      padding: 1.2rem;
      font-size: 0.84rem;
      line-height: 1.6;
    }}
    .briefing-title {{
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--accent-blue);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.6rem;
    }}
    .briefing-text {{ color: var(--text-muted); margin-bottom: 0.8rem; }}
    .payload-chip-row {{
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.6rem;
    }}
    .payload-chip {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 0.4rem 0.8rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #93c5fd;
    }}
    .copy-chip-btn {{
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #fff;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .copy-chip-btn:hover {{
      background: var(--accent-blue);
      color: #070b13;
    }}

    .terminal-out {{
      margin-top: 1.2rem;
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;
    }}
    .terminal-out-header {{
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 0.45rem 0.9rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.72rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }}
    .terminal-out-body {{
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.6;
      color: #cbd5e1;
    }}

    .victory-card {{
      background: linear-gradient(135deg, rgba(20, 83, 45, 0.8), rgba(6, 78, 59, 0.9));
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 1.4rem;
      margin-top: 1.5rem;
      text-align: center;
      box-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
      animation: victoryPulse 2s infinite alternate;
      display: none;
    }}
    @keyframes victoryPulse {{ from {{ box-shadow: 0 0 20px rgba(34, 197, 94, 0.2); }} to {{ box-shadow: 0 0 40px rgba(34, 197, 94, 0.45); }} }}
    .victory-tag {{
      font-family: 'Outfit', sans-serif;
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #86efac;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }}
    .flag-code-box {{
      background: rgba(0, 0, 0, 0.5);
      border: 1px dashed #4ade80;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.15rem;
      font-weight: 700;
      color: #4ade80;
      margin-bottom: 0.8rem;
      letter-spacing: 0.5px;
    }}
    .btn-copy-flag {{
      background: #22c55e;
      border: none;
      color: #070b13;
      padding: 0.5rem 1.2rem;
      border-radius: 6px;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .btn-copy-flag:hover {{ background: #4ade80; transform: scale(1.03); }}
  </style>
</head>
<body>
  <header class="hud-header">
    <div class="hud-brand">
      <i class="fas fa-shield-halved"></i>
      <span>EHSP // SECURITY LAB SIMULATION</span>
      <span class="hud-live-tag"><span class="live-dot"></span> TARGET ONLINE</span>
    </div>
    <div class="hud-meta">
      <div class="meta-chip">TARGET: <strong>127.0.0.1:5000</strong></div>
      <div class="meta-chip">VULN: <strong>BROKEN ACCESS CONTROL</strong></div>
      <span class="badge-diff medium">Medium</span>
    </div>
  </header>

  <main class="lab-container">
    <div class="lab-card">
      <div class="card-titlebar">
        <div class="traffic-dots">
          <span class="traffic-dot dot-red"></span>
          <span class="traffic-dot dot-yellow"></span>
          <span class="traffic-dot dot-green"></span>
        </div>
        <span class="card-titlebar-title">auth_gateway.py — role-based access controller</span>
        <span class="meta-chip">FLASK SESSION</span>
      </div>

      <div class="card-body">
        <div class="card-header-block">
          <h1><i class="fas fa-building-shield"></i> EHSP Enterprise Portal</h1>
          <p>Internal employee corporate directory with role-based dashboard permissions.</p>
        </div>

        {user_info_html}
        {auth_form_html}

        <div class="nav-grid">
          <a class="nav-btn" href="/dashboard"><i class="fas fa-chart-line"></i> Dashboard</a>
          <a class="nav-btn" href="/profile"><i class="fas fa-id-card"></i> Profile</a>
          <a class="nav-btn admin-link" href="/admin"><i class="fas fa-lock"></i> Admin Panel</a>
        </div>

        <div style="margin-top: 1.5rem;">
          <button type="button" class="cyber-btn" onclick="testAdminApi()">
            <i class="fas fa-bolt"></i> Probe /api/admin-data (With X-Role: admin)
          </button>
        </div>

        <div class="terminal-out" id="probe-terminal" style="display: none;">
          <div class="terminal-out-header">
            <span><i class="fas fa-terminal"></i> API INTERCEPTION RESPONSE</span>
            <span id="probe-status">STATUS: 200 OK</span>
          </div>
          <div class="terminal-out-body" id="probe-result">Awaiting request...</div>
        </div>

        <div id="victory-banner" class="victory-card">
          <div class="victory-tag"><i class="fas fa-flag"></i> ACCESS CONTROL BYPASSED // ADMIN PRIVILEGES FORGED</div>
          <div class="flag-code-box">
            <span>{FLAG}</span>
          </div>
          <button class="btn-copy-flag" onclick="copyFlag()">
            <i class="fas fa-copy"></i> Copy Flag & Paste in Portal
          </button>
        </div>

        <div class="briefing-box">
          <div class="briefing-title">
            <i class="fas fa-bullseye"></i> Tactical Objective // Broken Authorization
          </div>
          <p class="briefing-text">
            While <code>/admin</code> enforces session role validation, the administrative API endpoint at <code>/api/admin-data</code> naively trusts the client-controlled HTTP header <code>X-Role: admin</code>.
            Simulate or dispatch a request with this custom header to bypass role enforcement.
          </p>
          <div class="payload-chip-row">
            <div class="payload-chip">
              <span>GET /api/admin-data with Header: X-Role: admin</span>
              <button type="button" class="copy-chip-btn" onclick="testAdminApi()">Execute In-Page</button>
            </div>
            <div class="payload-chip">
              <span>curl -H "X-Role: admin" http://localhost:5000/api/admin-data</span>
              <button type="button" class="copy-chip-btn" onclick="copyCurl(this)">Copy curl</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    async function testAdminApi() {{
      const term = document.getElementById('probe-terminal');
      const resEl = document.getElementById('probe-result');
      const statusEl = document.getElementById('probe-status');
      const victory = document.getElementById('victory-banner');
      
      term.style.display = 'block';
      resEl.textContent = 'Dispatching GET /api/admin-data with X-Role: admin...';

      try {{
        const res = await fetch('/api/admin-data', {{
          headers: {{ 'X-Role': 'admin' }}
        }});
        const data = await res.json();
        statusEl.textContent = 'STATUS: ' + res.status + ' ' + (res.ok ? 'OK' : 'DENIED');
        resEl.textContent = JSON.stringify(data, null, 2);

        if (data.flag) {{
          victory.style.display = 'block';
        }}
      }} catch(err) {{
        resEl.textContent = 'Request failed: ' + err.message;
        statusEl.textContent = 'STATUS: ERROR';
      }}
    }}

    function copyCurl(btn) {{
      const cmd = 'curl -H "X-Role: admin" http://localhost:5000/api/admin-data';
      navigator.clipboard.writeText(cmd).then(() => {{
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {{ btn.innerHTML = orig; }}, 1800);
      }});
    }}

    function copyFlag() {{
      navigator.clipboard.writeText("{FLAG}").then(() => {{
        alert("Flag copied to clipboard: {FLAG}");
      }});
    }}
  </script>
</body>
</html>"""


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "")
    password = request.form.get("password", "")
    user = USERS.get(username)
    if user and user["password"] == password:
        session["username"] = username
        session["role"] = user["role"]
    return redirect("/")


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect("/")


@app.route("/dashboard")
def dashboard():
    if "username" not in session:
        return redirect("/")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EHSP // Dashboard</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body {{ background: #070b13; color: #f1f5f9; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
    .card {{ background: rgba(13, 20, 36, 0.9); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 16px; padding: 2.5rem; text-align: center; max-width: 440px; }}
    h2 {{ color: #60a5fa; margin-bottom: 0.5rem; }}
    p {{ color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }}
    a {{ color: #38bdf8; text-decoration: none; font-size: 0.85rem; margin-top: 1.5rem; display: inline-block; }}
  </style>
</head>
<body>
  <div class="card">
    <h2><i class="fas fa-chart-line"></i> User Dashboard</h2>
    <p>Welcome, <strong>{session['username']}</strong>! Normal employee metrics loaded.</p>
    <a href="/">← Return to Portal</a>
  </div>
</body>
</html>"""


@app.route("/profile")
def profile():
    if "username" not in session:
        return redirect("/")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EHSP // Profile</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body {{ background: #070b13; color: #f1f5f9; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
    .card {{ background: rgba(13, 20, 36, 0.9); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 16px; padding: 2.5rem; text-align: center; max-width: 440px; }}
    h2 {{ color: #60a5fa; margin-bottom: 0.5rem; }}
    p {{ color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }}
    a {{ color: #38bdf8; text-decoration: none; font-size: 0.85rem; margin-top: 1.5rem; display: inline-block; }}
  </style>
</head>
<body>
  <div class="card">
    <h2><i class="fas fa-id-card"></i> Employee Profile</h2>
    <p>Identity: <strong>{session['username']}</strong></p>
    <p>Assigned Role: <span style="color:#93c5fd;font-family:monospace">{session.get('role', 'user')}</span></p>
    <a href="/">← Return to Portal</a>
  </div>
</body>
</html>"""


@app.route("/admin")
def admin():
    """Admin panel — checks session role properly."""
    if session.get("role") != "admin":
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EHSP // Access Denied</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body {{ background: #070b13; color: #f1f5f9; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
    .card {{ background: rgba(13, 20, 36, 0.9); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 16px; padding: 2.5rem; text-align: center; max-width: 460px; }}
    h2 {{ color: #ef4444; margin-bottom: 0.5rem; }}
    p {{ color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }}
    .hint-sub {{ color: #f87171; font-size: 0.8rem; margin-top: 1rem; background: rgba(239, 68, 68, 0.1); padding: 0.8rem; border-radius: 8px; }}
    a {{ color: #38bdf8; text-decoration: none; font-size: 0.85rem; margin-top: 1.5rem; display: inline-block; }}
  </style>
</head>
<body>
  <div class="card">
    <h2><i class="fas fa-ban"></i> 403 Forbidden</h2>
    <p>Active session lacks administrator role authorization.</p>
    <div class="hint-sub">
      <strong>Security Inspection:</strong><br>
      The UI route enforces session checks, but does the backend API verify requests identically? Inspect <code>/api/admin-data</code>.
    </div>
    <a href="/">← Return to Portal</a>
  </div>
</body>
</html>""", 403

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EHSP // Admin Panel</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body {{ background: #070b13; color: #f1f5f9; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
    .card {{ background: rgba(13, 20, 36, 0.9); border: 2px solid #22c55e; border-radius: 16px; padding: 2.5rem; text-align: center; max-width: 500px; }}
    h2 {{ color: #22c55e; margin-bottom: 0.5rem; }}
    p {{ color: #94a3b8; font-size: 0.9rem; }}
    .flag-box {{ background: rgba(0,0,0,0.5); border: 1px dashed #4ade80; color: #4ade80; font-family: monospace; font-size: 1.1rem; padding: 0.8rem; border-radius: 8px; margin: 1.2rem 0; }}
    a {{ color: #38bdf8; text-decoration: none; font-size: 0.85rem; display: inline-block; }}
  </style>
</head>
<body>
  <div class="card">
    <h2><i class="fas fa-shield-check"></i> Admin Operations Active</h2>
    <p>Session-validated admin authority confirmed.</p>
    <div class="flag-box">{FLAG}</div>
    <a href="/">← Return to Portal</a>
  </div>
</body>
</html>"""


@app.route("/api/admin-data")
def api_admin_data():
    """
    ⚠️ INTENTIONALLY VULNERABLE — Only checks X-Role header, not actual session!
    Any request with X-Role: admin header bypasses authentication.
    """
    role = request.headers.get("X-Role", "user")

    if role != "admin":
        return jsonify({"error": "Admin access required. Set X-Role: admin header."}), 403

    return jsonify({
        "message": "Access granted via broken access control!",
        "flag": FLAG,
        "vulnerability": "Server trusted the X-Role header without verifying the session."
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
