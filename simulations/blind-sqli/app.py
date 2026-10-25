"""
EHSP — Blind SQL Injection Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
import sqlite3
import time
from flask import Flask, request, jsonify

app = Flask(__name__)
FLAG = "EHSP{blind_sqli_extracted}"
DB = "/tmp/lab.db"


def init_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.executescript(f"""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL,
            password TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS secrets (
            id INTEGER PRIMARY KEY,
            key TEXT NOT NULL,
            value TEXT NOT NULL
        );
        INSERT OR IGNORE INTO users VALUES (1, 'admin', 'adminpass123');
        INSERT OR IGNORE INTO users VALUES (2, 'alice', 'alice99');
        INSERT OR IGNORE INTO users VALUES (3, 'bob',   'bob1234');
        INSERT OR IGNORE INTO secrets VALUES (1, 'flag', '{FLAG}');
    """)
    conn.commit()
    conn.close()


init_db()


@app.route("/")
def home():
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // User Lookup System (Blind SQLi)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {{
      --bg-dark: #070b13;
      --card-bg: rgba(13, 20, 36, 0.85);
      --border-color: rgba(168, 85, 247, 0.25);
      --accent-purple: #a855f7;
      --accent-purple-glow: rgba(168, 85, 247, 0.35);
      --accent-green: #4ade80;
      --accent-red: #f87171;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.12) 0%, transparent 60%), var(--bg-dark);
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
    .hud-brand i {{ color: var(--accent-purple); font-size: 1.1rem; }}
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
    .badge-diff.hard {{ background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.35); }}

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
      max-width: 640px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent-purple-glow);
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
    .card-header-block h1 i {{ color: var(--accent-purple); }}
    .card-header-block p {{
      color: var(--text-muted);
      font-size: 0.88rem;
      margin-top: 0.4rem;
      line-height: 1.5;
    }}

    .form-group {{ margin-bottom: 1.4rem; }}
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
      color: #e9d5ff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      padding: 0.85rem 1rem;
      outline: none;
      transition: all 0.25s ease;
    }}
    .cyber-input:focus {{
      border-color: var(--accent-purple);
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2), 0 0 20px rgba(168, 85, 247, 0.15);
    }}

    .cyber-btn {{
      width: 100%;
      background: linear-gradient(135deg, #a855f7, #7e22ce);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 0.85rem 1.4rem;
      font-family: 'Outfit', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
      transition: all 0.25s ease;
    }}
    .cyber-btn:hover {{
      background: linear-gradient(135deg, #c084fc, #a855f7);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(168, 85, 247, 0.5);
    }}

    .terminal-out {{
      margin-top: 1.5rem;
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
      font-size: 0.88rem;
      line-height: 1.6;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }}
    .terminal-out-body.found {{
      color: var(--accent-green);
      background: rgba(34, 197, 94, 0.05);
      border-left: 3px solid var(--accent-green);
    }}
    .terminal-out-body.notfound {{
      color: var(--accent-red);
      background: rgba(239, 68, 68, 0.05);
      border-left: 3px solid var(--accent-red);
    }}

    .briefing-box {{
      margin-top: 1.8rem;
      background: rgba(4, 8, 16, 0.75);
      border: 1px solid rgba(168, 85, 247, 0.25);
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
      color: var(--accent-purple);
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
      color: #d8b4fe;
    }}
    .copy-chip-btn {{
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.3);
      color: #fff;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .copy-chip-btn:hover {{
      background: var(--accent-purple);
      color: #070b13;
    }}
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
      <div class="meta-chip">VULN: <strong>BLIND SQLI</strong></div>
      <span class="badge-diff hard">Hard</span>
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
        <span class="card-titlebar-title">user_lookup.py — directory service</span>
        <span class="meta-chip">SQLITE3</span>
      </div>

      <div class="card-body">
        <div class="card-header-block">
          <h1><i class="fas fa-database"></i> User Lookup System</h1>
          <p>Query the internal user registry. Returns binary boolean presence without echoing record contents.</p>
        </div>

        <div class="form-group">
          <label>
            <span><i class="fas fa-user"></i> Target Username Query</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: var(--text-muted)">SQL INJECTION POINT</span>
          </label>
          <input id="uname" class="cyber-input" value="alice" placeholder="Enter username..." autocomplete="off">
        </div>

        <button type="button" class="cyber-btn" onclick="lookup()">
          <i class="fas fa-magnifying-glass"></i> Check User Existence
        </button>

        <div class="terminal-out">
          <div class="terminal-out-header">
            <span><i class="fas fa-code-branch"></i> BOOLEAN RESPONSE STATE</span>
            <span id="timing-chip">QUERY TIME: 0ms</span>
          </div>
          <div class="terminal-out-body" id="result">
            <span>Enter a username or injection payload to probe database.</span>
          </div>
        </div>

        <div class="briefing-box">
          <div class="briefing-title">
            <i class="fas fa-bullseye"></i> Tactical Objective // Blind SQL Extraction
          </div>
          <p class="briefing-text">
            The endpoint returns only True ("User found") or False ("User not found"). No data is ever printed directly. Use boolean differential logic or substring extraction to deduce the flag stored in <code>secrets</code> table.
          </p>
          <div class="payload-chip-row">
            <div class="payload-chip">
              <span>alice' AND 1=1--</span>
              <button type="button" class="copy-chip-btn" onclick="setPayload('alice\\' AND 1=1--')">Use Payload</button>
            </div>
            <div class="payload-chip">
              <span>alice' AND 1=2--</span>
              <button type="button" class="copy-chip-btn" onclick="setPayload('alice\\' AND 1=2--')">Use Payload</button>
            </div>
            <div class="payload-chip">
              <span>alice' AND SUBSTR((SELECT value FROM secrets WHERE key='flag'),1,1)='E'--</span>
              <button type="button" class="copy-chip-btn" onclick="setPayload('alice\\' AND SUBSTR((SELECT value FROM secrets WHERE key=\\'flag\\'),1,1)=\\'E\\'--')">Use Payload</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    function setPayload(val) {{
      document.getElementById('uname').value = val;
      lookup();
    }}

    async function lookup() {{
      const uname = document.getElementById('uname').value;
      const el = document.getElementById('result');
      const timeEl = document.getElementById('timing-chip');
      
      el.className = 'terminal-out-body';
      el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Interrogating database backend...';
      
      const t0 = performance.now();
      try {{
        const res = await fetch('/check?username=' + encodeURIComponent(uname));
        const data = await res.json();
        const duration = Math.round(performance.now() - t0);
        timeEl.textContent = 'QUERY TIME: ' + duration + 'ms';
        
        el.className = 'terminal-out-body ' + (data.found ? 'found' : 'notfound');
        el.innerHTML = '<i class="fas ' + (data.found ? 'fa-check-circle' : 'fa-xmark-circle') + '"></i> ' + data.message;
      }} catch(err) {{
        el.className = 'terminal-out-body notfound';
        el.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Error: ' + err.message;
      }}
    }}
  </script>
</body>
</html>"""


@app.route("/check")
def check():
    """⚠️ INTENTIONALLY VULNERABLE — raw string concatenation into SQL."""
    username = request.args.get("username", "")

    try:
        conn = sqlite3.connect(DB)
        cur = conn.cursor()
        # VULNERABLE: direct f-string injection into SQL
        query = f"SELECT id FROM users WHERE username = '{username}'"
        cur.execute(query)
        row = cur.fetchone()
        conn.close()

        if row:
            return jsonify({"found": True, "message": "✅ User found in the system."})
        else:
            return jsonify({"found": False, "message": "❌ User not found."})
    except Exception as e:
        return jsonify({"found": False, "message": f"DB Error: {str(e)}"})


@app.route("/time-check")
def time_check():
    """Time-based blind SQLi endpoint."""
    username = request.args.get("username", "")
    start = time.time()
    try:
        conn = sqlite3.connect(DB)
        cur = conn.cursor()
        query = f"SELECT id FROM users WHERE username = '{username}'"
        cur.execute(query)
        cur.fetchone()
        conn.close()
    except Exception:
        pass
    elapsed = time.time() - start
    return jsonify({"elapsed_ms": round(elapsed * 1000, 2)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
