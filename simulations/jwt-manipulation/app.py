"""
EHSP — JWT Manipulation Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
import base64
import json
import hmac
import hashlib
from flask import Flask, request, jsonify, make_response

app = Flask(__name__)
FLAG = "EHSP{jwt_admin_escalation}"
SECRET = "super_secret_key_12345"


def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def make_jwt(payload: dict, alg: str = "HS256") -> str:
    header = b64url_encode(json.dumps({"alg": alg, "typ": "JWT"}).encode())
    body = b64url_encode(json.dumps(payload).encode())
    if alg == "none":
        sig = ""
    else:
        sig = b64url_encode(
            hmac.new(SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
        )
    return f"{header}.{body}.{sig}"


def verify_jwt(token: str):
    """Returns (payload, error). Vulnerable: accepts alg:none."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None, "Invalid token format (expected 3 dot-separated segments)"

        header = json.loads(b64url_decode(parts[0]))
        payload = json.loads(b64url_decode(parts[1]))
        alg = header.get("alg", "HS256")

        if alg == "none":
            # ⚠️ INTENTIONALLY VULNERABLE — accepts unsigned tokens!
            return payload, None
        elif alg == "HS256":
            expected_sig = b64url_encode(
                hmac.new(SECRET.encode(), f"{parts[0]}.{parts[1]}".encode(), hashlib.sha256).digest()
            )
            if parts[2] != expected_sig:
                return None, "Invalid cryptographic signature"
            return payload, None
        else:
            return None, f"Unsupported algorithm: {alg}"
    except Exception as e:
        return None, str(e)


@app.route("/")
def home():
    token = make_jwt({"sub": "user123", "name": "Alice", "role": "user"})
    parts = token.split(".")

    # Pre-generate alg:none forged admin token for quick testing
    forged_token = make_jwt({"sub": "user123", "name": "Alice", "role": "admin"}, alg="none")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // JSON Web Token (JWT) Manipulation Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {{
      --bg-base: #060913;
      --border-subtle: rgba(245, 158, 11, 0.18);
      --border-glow: rgba(245, 158, 11, 0.45);
      --accent: #f59e0b;
      --accent-glow: rgba(245, 158, 11, 0.28);
      --emerald: #10b981;
      --ruby: #f43f5e;
      --cyan: #06b6d4;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }}
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 15%, #231604 0%, #080a14 55%, #020409 100%);
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
        linear-gradient(rgba(245, 158, 11, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(245, 158, 11, 0.03) 1px, transparent 1px);
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
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05));
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
    .hud-pill.amber {{
      background: rgba(245, 158, 11, 0.12);
      border-color: rgba(245, 158, 11, 0.35);
      color: #fde68a;
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
      justify-content: center;
      align-items: center;
      padding: 2rem 1.2rem;
    }}
    .jwt-card {{
      background: rgba(13, 20, 36, 0.88);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.12);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 640px;
      position: relative;
    }}
    .card-header {{
      text-align: center;
      margin-bottom: 1.6rem;
    }}
    .portal-avatar {{
      width: 52px;
      height: 52px;
      margin: 0 auto 0.9rem;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05));
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

    /* Color-coded token stream */
    .token-display {{
      background: #020409;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.9rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      line-height: 1.6;
      word-break: break-all;
      margin-bottom: 1.2rem;
    }}
    .tok-h {{ color: #fb7185; }}
    .tok-p {{ color: #34d399; }}
    .tok-s {{ color: #38bdf8; }}
    .tok-dot {{ color: #64748b; font-weight: bold; }}

    .tok-legend {{
      display: flex;
      gap: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      margin-top: 0.4rem;
    }}
    .legend-item {{
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }}
    .dot-h {{ width: 8px; height: 8px; border-radius: 50%; background: #fb7185; }}
    .dot-p {{ width: 8px; height: 8px; border-radius: 50%; background: #34d399; }}
    .dot-s {{ width: 8px; height: 8px; border-radius: 50%; background: #38bdf8; }}

    .form-group {{
      margin-bottom: 1rem;
    }}
    .form-label {{
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
      font-family: 'JetBrains Mono', monospace;
    }}
    textarea {{
      width: 100%;
      padding: 0.75rem;
      background: #020409;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 0.82rem;
      font-family: 'JetBrains Mono', monospace;
      min-height: 75px;
      outline: none;
      resize: vertical;
      transition: all 0.2s ease;
    }}
    textarea:focus {{
      border-color: var(--accent);
      box-shadow: 0 0 16px var(--accent-glow);
    }}

    .btn-submit {{
      width: 100%;
      padding: 0.8rem;
      background: linear-gradient(135deg, #d97706, #f59e0b);
      border: 1px solid rgba(245, 158, 11, 0.5);
      border-radius: 8px;
      color: #000;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 18px rgba(245, 158, 11, 0.35);
      transition: all 0.25s ease;
    }}
    .btn-submit:hover {{
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(245, 158, 11, 0.55);
      background: linear-gradient(135deg, #b45309, #d97706);
      color: #fff;
    }}

    #result {{
      margin-top: 1rem;
    }}

    .tactical-box {{
      margin-top: 1.4rem;
      background: rgba(6, 11, 24, 0.8);
      border: 1px solid rgba(245, 158, 11, 0.2);
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
    .tactical-desc code {{
      background: rgba(245, 158, 11, 0.15);
      color: #fde68a;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
    }}
    .chip-btn {{
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 0.35rem 0.7rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: #fde68a;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s ease;
    }}
    .chip-btn:hover {{
      background: rgba(245, 158, 11, 0.2);
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
        <i class="fa-solid fa-ticket"></i>
      </div>
      <div class="hud-title-group">
        <h1>JWT Manipulation Lab <span style="font-size: 0.75rem; font-weight: 400; color: var(--accent);">(Signature Stripping / Alg None)</span></h1>
        <p>EHSP DEFENSE MATRIX // HOST: jwt-auth.internal // TARGET: /api/admin</p>
      </div>
    </div>
    <div class="hud-metadata">
      <div class="hud-pill amber">
        <i class="fa-solid fa-user-shield"></i>
        <span>VULN: ALG: NONE ACCEPTED</span>
      </div>
      <div class="hud-pill">
        <i class="fa-solid fa-fingerprint"></i>
        <span>CURRENT ROLE: user</span>
      </div>
      <div class="hud-pill success">
        <span class="status-dot"></span>
        <span>AUTH ONLINE</span>
      </div>
    </div>
  </header>

  <!-- Main Area -->
  <main class="main-wrapper">
    <div class="jwt-card">
      <div class="card-header">
        <div class="portal-avatar">
          <i class="fa-solid fa-id-card-clip"></i>
        </div>
        <h2>Token Inspection & Elevation Gate</h2>
        <p>Issued standard user session for Alice (role: user)</p>
      </div>

      <div class="form-label">CURRENT ISSUED JSON WEB TOKEN:</div>
      <div class="token-display">
        <span class="tok-h">{parts[0]}</span><span class="tok-dot">.</span><span class="tok-p">{parts[1]}</span><span class="tok-dot">.</span><span class="tok-s">{parts[2]}</span>
        <div class="tok-legend">
          <div class="legend-item"><div class="dot-h"></div> Header</div>
          <div class="legend-item"><div class="dot-p"></div> Payload</div>
          <div class="legend-item"><div class="dot-s"></div> Signature</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">MANIPULATED BEARER TOKEN FOR /api/admin REQUEST:</label>
        <textarea id="jwt-input" rows="3">{token}</textarea>
      </div>

      <button class="btn-submit" onclick="tryAccess()">
        <i class="fa-solid fa-lock-open"></i> Transmit to /api/admin
      </button>

      <div id="result"></div>

      <!-- Tactical Mission Dossier -->
      <div class="tactical-box">
        <div class="tactical-header">
          <i class="fa-solid fa-crosshairs"></i> MISSION BRIEFING
        </div>
        <p class="tactical-desc">
          The server backend accepts tokens signed with <code>alg: "none"</code>.
          Decode the payload, change <code>"role": "user"</code> to <code>"role": "admin"</code>, set header <code>alg</code> to <code>"none"</code>, and remove the signature (leaving the trailing dot).
        </p>
        <div style="font-size:0.68rem; color:var(--text-dim); font-family:'JetBrains Mono',monospace; margin-bottom:0.35rem;">EXPLOIT SHORTCUT:</div>
        <div class="chip-btn" onclick="loadForgedToken()">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Load Forged alg:none Admin Token
        </div>
      </div>
    </div>
  </main>

  <script>
    const forgedToken = "{forged_token}";

    function loadForgedToken() {{
      const el = document.getElementById('jwt-input');
      el.value = forgedToken;
      el.focus();
    }}

    async function tryAccess() {{
      const token = document.getElementById('jwt-input').value.trim();
      const res = await fetch('/api/admin', {{
        headers: {{ 'Authorization': 'Bearer ' + token }}
      }});
      const data = await res.json();
      const el = document.getElementById('result');
      if (data.flag) {{
        el.innerHTML = `
          <div style="background:linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,78,59,0.35)); border:1px solid #10b981; border-radius:10px; padding:1.2rem; text-align:center;">
            <div style="font-family:'Outfit',sans-serif; font-size:1.1rem; font-weight:700; color:#34d399;">
              <i class="fa-solid fa-circle-check"></i> PRIVILEGE ESCALATION TO ADMIN SUCCESSFUL!
            </div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:800; color:#fff; background:rgba(0,0,0,0.4); padding:0.6rem; border-radius:6px; margin:0.8rem 0; letter-spacing:1px;">
              ${{data.flag}}
            </div>
            <button onclick="navigator.clipboard.writeText('${{FLAG}}'); alert('Flag copied to clipboard!');" style="background:#10b981; color:#022c22; border:none; padding:0.4rem 0.9rem; border-radius:4px; font-weight:700; cursor:pointer;">
              Copy Flag
            </button>
          </div>
        `;
      }} else {{
        el.innerHTML = `
          <div style="background:rgba(244,63,94,0.12); border:1px solid rgba(244,63,94,0.35); border-radius:8px; padding:0.75rem; font-size:0.8rem; color:#fda4af; text-align:center; font-family:'JetBrains Mono',monospace;">
            <i class="fa-solid fa-triangle-exclamation"></i> ${{data.error || data.message}}
          </div>
        `;
      }}
    }}
  </script>
</body>
</html>"""


@app.route("/api/admin")
def admin_api():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"error": "No Authorization header provided (expected 'Bearer <token>')"}), 401

    token = auth[7:]
    payload, err = verify_jwt(token)

    if err:
        return jsonify({"error": f"Token verification failed: {err}"}), 401

    if payload.get("role") != "admin":
        return jsonify({
            "error": f"Access denied. Token carries role '{payload.get('role', 'unknown')}'. Elevation to 'admin' required!"
        }), 403

    return jsonify({
        "message": "Welcome, Administrator!",
        "flag": FLAG,
        "user": payload.get("name", "Unknown"),
        "role": payload.get("role")
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
