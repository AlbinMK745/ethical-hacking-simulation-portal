"""
EHSP — SSRF (Server-Side Request Forgery) Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)
FLAG = "EHSP{ssrf_internal_reached}"

# Simulated "internal" metadata service
INTERNAL_METADATA_URL = "http://127.0.0.1:8888"


@app.route("/")
def home():
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Webhook & Resource Fetcher (SSRF)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {{
      --bg-dark: #070b13;
      --card-bg: rgba(13, 20, 36, 0.85);
      --border-color: rgba(249, 115, 22, 0.25);
      --accent-orange: #f97316;
      --accent-orange-glow: rgba(249, 115, 22, 0.35);
      --accent-cyan: #38bdf8;
      --accent-green: #4ade80;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 0%, rgba(249, 115, 22, 0.12) 0%, transparent 60%), var(--bg-dark);
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
    .hud-brand i {{ color: var(--accent-orange); font-size: 1.1rem; }}
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
      max-width: 660px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent-orange-glow);
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
    .card-header-block h1 i {{ color: var(--accent-orange); }}
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
      color: #fed7aa;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      padding: 0.85rem 1rem;
      outline: none;
      transition: all 0.25s ease;
    }}
    .cyber-input:focus {{
      border-color: var(--accent-orange);
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2), 0 0 20px rgba(249, 115, 22, 0.15);
    }}

    .cyber-btn {{
      width: 100%;
      background: linear-gradient(135deg, #f97316, #ea580c);
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
      box-shadow: 0 4px 18px rgba(249, 115, 22, 0.35);
      transition: all 0.25s ease;
    }}
    .cyber-btn:hover {{
      background: linear-gradient(135deg, #fb923c, #f97316);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(249, 115, 22, 0.5);
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
      font-size: 0.82rem;
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.6;
      color: #cbd5e1;
      min-height: 70px;
    }}

    .briefing-box {{
      margin-top: 1.8rem;
      background: rgba(4, 8, 16, 0.75);
      border: 1px solid rgba(249, 115, 22, 0.25);
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
      color: var(--accent-orange);
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
      color: #fdba74;
    }}
    .copy-chip-btn {{
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.3);
      color: #fff;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .copy-chip-btn:hover {{
      background: var(--accent-orange);
      color: #070b13;
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
      <div class="meta-chip">VULN: <strong>SSRF</strong></div>
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
        <span class="card-titlebar-title">webhook_fetcher.py — proxy relay</span>
        <span class="meta-chip">PORT 5000</span>
      </div>

      <div class="card-body">
        <div class="card-header-block">
          <h1><i class="fas fa-globe"></i> Webhook & Resource Fetcher</h1>
          <p>Server-side URL retrieval tool. Enter any remote or internal resource URI to fetch headers and body payload.</p>
        </div>

        <div class="form-group">
          <label>
            <span><i class="fas fa-link"></i> Target URI</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: var(--text-muted)">HTTP / HTTPS</span>
          </label>
          <input id="url-input" class="cyber-input" value="https://httpbin.org/get" placeholder="https://example.com" autocomplete="off">
        </div>

        <button type="button" class="cyber-btn" onclick="fetchUrl()">
          <i class="fas fa-satellite-dish"></i> Dispatch & Fetch URL
        </button>

        <div class="terminal-out">
          <div class="terminal-out-header">
            <span><i class="fas fa-code"></i> SERVER RESPONSE PAYLOAD</span>
            <span id="res-status">STATUS: IDLE</span>
          </div>
          <div class="terminal-out-body" id="result">Awaiting target request...</div>
        </div>

        <div id="victory-banner" class="victory-card">
          <div class="victory-tag"><i class="fas fa-flag"></i> SSRF EXPLOITATION SUCCESSFUL // FLAG INTERCEPTED</div>
          <div class="flag-code-box">
            <span id="flag-text">{FLAG}</span>
          </div>
          <button class="btn-copy-flag" onclick="copyFlag()">
            <i class="fas fa-copy"></i> Copy Flag & Paste in Portal
          </button>
        </div>

        <div class="briefing-box">
          <div class="briefing-title">
            <i class="fas fa-bullseye"></i> Tactical Objective // Server-Side Request Forgery
          </div>
          <p class="briefing-text">
            This backend proxy fetches resources on behalf of the server without loopback filtering. An internal metadata microservice is isolated on <code>http://127.0.0.1:8888</code> (inaccessible to external users).
            Proxy your request through this server to capture the internal metadata secret.
          </p>
          <div class="payload-chip-row">
            <div class="payload-chip">
              <span>http://127.0.0.1:8888/secret</span>
              <button type="button" class="copy-chip-btn" onclick="setAndFetch('http://127.0.0.1:8888/secret')">Use & Fetch</button>
            </div>
            <div class="payload-chip">
              <span>http://localhost:8888/</span>
              <button type="button" class="copy-chip-btn" onclick="setAndFetch('http://localhost:8888/')">Use & Fetch</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    function setAndFetch(val) {{
      document.getElementById('url-input').value = val;
      fetchUrl();
    }}

    async function fetchUrl() {{
      const url = document.getElementById('url-input').value.trim();
      const el = document.getElementById('result');
      const statusEl = document.getElementById('res-status');
      const victory = document.getElementById('victory-banner');
      
      el.textContent = 'Transmitting request from server IP to: ' + url + '...';
      statusEl.textContent = 'STATUS: FETCHING';
      victory.style.display = 'none';

      try {{
        const res = await fetch('/fetch', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ url }})
        }});
        const data = await res.json();
        const content = data.content || data.error || '(no content returned)';
        el.textContent = content;
        statusEl.textContent = 'STATUS ' + (data.status || (data.error ? 'ERR' : '200'));

        if (content.includes("EHSP{{") || content.includes("{FLAG}")) {{
          victory.style.display = 'block';
        }}
      }} catch(e) {{
        el.textContent = 'Network or Client Error: ' + e.message;
        statusEl.textContent = 'STATUS ERR';
      }}
    }}

    function copyFlag() {{
      navigator.clipboard.writeText("{FLAG}").then(() => {{
        alert("Flag copied to clipboard: {FLAG}");
      }});
    }}
  </script>
</body>
</html>"""


@app.route("/fetch", methods=["POST"])
def fetch_url():
    """⚠️ INTENTIONALLY VULNERABLE — fetches any URL including internal ones."""
    body = request.get_json(silent=True) or {}
    url = body.get("url", "").strip()

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    try:
        resp = requests.get(url, timeout=5, allow_redirects=True)
        content = resp.text[:2000]  # limit output
        return jsonify({"content": content, "status": resp.status_code})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Internal "metadata" service — simulates AWS metadata or internal API
from threading import Thread
from http.server import HTTPServer, BaseHTTPRequestHandler


class MetadataHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/secret" or self.path == "/":
            body = f'{{"flag": "{FLAG}", "service": "internal-metadata", "note": "This endpoint is only accessible from within the server"}}'.encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *args):
        pass  # Suppress logs


def start_internal_server():
    server = HTTPServer(("127.0.0.1", 8888), MetadataHandler)
    server.serve_forever()


# Start internal metadata server in background thread
t = Thread(target=start_internal_server, daemon=True)
t.start()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
