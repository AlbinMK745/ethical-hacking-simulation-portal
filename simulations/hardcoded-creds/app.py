"""
EHSP — Hardcoded Credentials in JS Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
from flask import Flask, request, jsonify

app = Flask(__name__)
FLAG = "EHSP{js_secret_exposed}"
ADMIN_TOKEN = "s3cr3t_4dm1n_t0k3n_d0_n0t_sh4r3"


@app.route("/")
def home():
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Hardcoded Secrets Inspection Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {{
      --bg-base: #060913;
      --border-subtle: rgba(244, 114, 182, 0.18);
      --border-glow: rgba(244, 114, 182, 0.45);
      --accent: #f472b6;
      --accent-glow: rgba(244, 114, 182, 0.28);
      --emerald: #10b981;
      --ruby: #f43f5e;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }}
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 20%, #20081a 0%, #080a14 55%, #020409 100%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }}
    body::before {{
      content: "";
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(rgba(244, 114, 182, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(244, 114, 182, 0.03) 1px, transparent 1px);
      background-size: 32px 32px;
      pointer-events: none;
      z-index: 0;
    }}
    .hud-header {{
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
    }}
    .hud-branding {{
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }}
    .hud-badge-icon {{
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(244, 114, 182, 0.05));
      border: 1px solid var(--border-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      font-size: 1.05rem;
      box-shadow: 0 0 16px var(--accent-glow);
    }}
    .hud-title-group h1 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
    }}
    .hud-title-group p {{
      font-size: 0.72rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }}
    .hud-metadata {{
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }}
    .hud-pill {{
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
    }}
    .hud-pill.pink {{
      background: rgba(244, 114, 182, 0.12);
      border-color: rgba(244, 114, 182, 0.35);
      color: #fbcfe8;
    }}
    .hud-pill.success {{
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.35);
      color: #6ee7b7;
    }}
    .status-dot {{
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse-dot 2s infinite;
    }}
    @keyframes pulse-dot {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.4; transform: scale(0.85); }}
    }}
    .main-wrapper {{
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.2rem;
    }}
    .gate-card {{
      background: rgba(13, 20, 36, 0.85);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(244, 114, 182, 0.12);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 480px;
      position: relative;
    }}
    .gate-card::before {{
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
      background: linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(244, 114, 182, 0.05));
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
      margin-bottom: 1.2rem;
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
    .input-box i.input-icon {{
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
      font-size: 0.9rem;
      pointer-events: none;
    }}
    .input-box input {{
      width: 100%;
      padding: 0.75rem 2.8rem 0.75rem 2.6rem;
      background: rgba(6, 9, 19, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 0.88rem;
      font-family: 'JetBrains Mono', monospace;
      outline: none;
      transition: all 0.2s ease;
    }}
    .input-box input:focus {{
      border-color: var(--accent);
      box-shadow: 0 0 16px var(--accent-glow);
    }}
    .toggle-vis-btn {{
      position: absolute;
      right: 0.8rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0.3rem;
    }}
    .toggle-vis-btn:hover {{ color: var(--accent); }}

    .btn-submit {{
      width: 100%;
      padding: 0.8rem;
      background: linear-gradient(135deg, #db2777, #f472b6);
      border: 1px solid rgba(244, 114, 182, 0.5);
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
      box-shadow: 0 4px 18px rgba(244, 114, 182, 0.35);
      transition: all 0.25s ease;
    }}
    .btn-submit:hover {{
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(244, 114, 182, 0.55);
      background: linear-gradient(135deg, #be185d, #db2777);
    }}

    #result {{
      margin-top: 1.1rem;
    }}

    .tactical-box {{
      margin-top: 1.5rem;
      background: rgba(6, 11, 24, 0.8);
      border: 1px solid rgba(244, 114, 182, 0.2);
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
    }}
    .tactical-desc code {{
      background: rgba(244, 114, 182, 0.15);
      color: #fbcfe8;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
    }}
  </style>

  <!-- 
    ⚠️  INTENTIONAL VULNERABILITY: 
        Admin token hardcoded directly in client-side JavaScript source!
        Inspect Sources or press Ctrl+U to uncover the secret token.
  -->
  <script>
    // TODO: Deprecate client-side token constant before release!
    const ADMIN_TOKEN = "{ADMIN_TOKEN}";
    
    async function tryLogin() {{
      const token = document.getElementById('token').value.trim();
      const res = await fetch('/api/login', {{
        method: 'POST',
        headers: {{'Content-Type': 'application/json'}},
        body: JSON.stringify({{ token }})
      }});
      const data = await res.json();
      const el = document.getElementById('result');
      if (data.success) {{
        el.innerHTML = `
          <div style="background:linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,78,59,0.3)); border:1px solid #10b981; border-radius:8px; padding:1rem; text-align:center;">
            <div style="font-family:'Outfit',sans-serif; font-weight:700; color:#34d399; font-size:1.05rem;"><i class="fa-solid fa-circle-check"></i> ACCESS GRANTED!</div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:0.95rem; font-weight:700; color:#fff; margin:0.6rem 0; padding:0.4rem; background:rgba(0,0,0,0.4); border-radius:4px;">${{data.message}}</div>
            <button onclick="navigator.clipboard.writeText('${{FLAG}}'); alert('Flag copied!');" style="background:#10b981; color:#022c22; border:none; padding:0.35rem 0.8rem; border-radius:4px; font-weight:700; font-size:0.75rem; cursor:pointer;">Copy Flag</button>
          </div>
        `;
      }} else {{
        el.innerHTML = `
          <div style="background:rgba(244,63,94,0.12); border:1px solid rgba(244,63,94,0.35); border-radius:8px; padding:0.75rem; font-size:0.8rem; color:#fda4af; text-align:center; font-family:'JetBrains Mono',monospace;">
            <i class="fa-solid fa-triangle-exclamation"></i> ${{data.message}}
          </div>
        `;
      }}
    }}

    function toggleTokenVis() {{
      const input = document.getElementById('token');
      const icon = document.getElementById('visIcon');
      if (input.type === 'password') {{
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }} else {{
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }}
    }}
  </script>
</head>
<body>

  <!-- Cyber HUD Header -->
  <header class="hud-header">
    <div class="hud-branding">
      <div class="hud-badge-icon">
        <i class="fa-solid fa-key"></i>
      </div>
      <div class="hud-title-group">
        <h1>Hardcoded Secrets Lab <span style="font-size: 0.75rem; font-weight: 400; color: var(--accent);">(Frontend Leaks)</span></h1>
        <p>EHSP DEFENSE MATRIX // HOST: admin-auth.internal // PORT: 5000</p>
      </div>
    </div>
    <div class="hud-metadata">
      <div class="hud-pill pink">
        <i class="fa-solid fa-fingerprint"></i>
        <span>VULN: CLIENT-SIDE LEAK</span>
      </div>
      <div class="hud-pill">
        <i class="fa-solid fa-code"></i>
        <span>SOURCE: DevTools / Ctrl+U</span>
      </div>
      <div class="hud-pill success">
        <span class="status-dot"></span>
        <span>GATE ONLINE</span>
      </div>
    </div>
  </header>

  <!-- Main Area -->
  <main class="main-wrapper">
    <div class="gate-card">
      <div class="card-header">
        <div class="portal-avatar">
          <i class="fa-solid fa-lock-open"></i>
        </div>
        <h2>Administrative Gateway</h2>
        <p>Authenticate with Master Security Token</p>
      </div>

      <div class="form-group">
        <label class="form-label">SECURITY BEARER TOKEN</label>
        <div class="input-box">
          <input id="token" type="password" placeholder="Enter admin token..." autocomplete="off">
          <i class="fa-solid fa-key input-icon"></i>
          <button type="button" class="toggle-vis-btn" onclick="toggleTokenVis()">
            <i id="visIcon" class="fa-solid fa-eye"></i>
          </button>
        </div>
      </div>

      <button class="btn-submit" onclick="tryLogin()">
        <i class="fa-solid fa-shield-halved"></i> Verify & Authenticate
      </button>

      <div id="result"></div>

      <!-- Tactical Mission Dossier -->
      <div class="tactical-box">
        <div class="tactical-header">
          <i class="fa-solid fa-crosshairs"></i> MISSION BRIEFING
        </div>
        <p class="tactical-desc">
          Developers frequently embed debug constants or staging credentials into client bundles.
          Open DevTools (<code>F12</code>) or view page source (<code>Ctrl+U</code>) to locate the exposed <code>ADMIN_TOKEN</code> constant.
        </p>
      </div>
    </div>
  </main>

</body>
</html>"""


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    token = data.get("token", "")

    if token == ADMIN_TOKEN:
        return jsonify({
            "success": True,
            "message": FLAG
        })

    return jsonify({
        "success": False,
        "message": "Invalid token. Inspect page source to locate the secret! 👀"
    }), 401


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
