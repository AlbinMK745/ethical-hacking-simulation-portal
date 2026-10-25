"""
EHSP — Reflected XSS Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
from flask import Flask, request, make_response

app = Flask(__name__)
FLAG = "EHSP{xss_reflected_pwned}"


COMMON_CSS = """
    :root {
      --bg-base: #060913;
      --border-subtle: rgba(245, 158, 11, 0.18);
      --border-glow: rgba(245, 158, 11, 0.45);
      --accent: #f59e0b;
      --accent-glow: rgba(245, 158, 11, 0.28);
      --emerald: #10b981;
      --ruby: #f43f5e;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 20%, #1e1308 0%, #080a14 55%, #020409 100%);
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
        linear-gradient(rgba(245, 158, 11, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(245, 158, 11, 0.03) 1px, transparent 1px);
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
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05));
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
    .hud-pill.amber {
      background: rgba(245, 158, 11, 0.12);
      border-color: rgba(245, 158, 11, 0.35);
      color: #fde68a;
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
  <title>EHSP // Reflected Cross-Site Scripting (XSS) Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .search-card {{
      background: rgba(13, 20, 36, 0.85);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.12);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 520px;
      position: relative;
    }}
    .search-card::before {{
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

    .input-row {{
      display: flex;
      gap: 0.6rem;
    }}
    .input-box {{
      position: relative;
      flex: 1;
    }}
    .input-box i {{
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
      padding: 0.75rem 1rem 0.75rem 2.6rem;
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

    .btn-search {{
      padding: 0.75rem 1.4rem;
      background: linear-gradient(135deg, #d97706, #f59e0b);
      border: 1px solid rgba(245, 158, 11, 0.5);
      border-radius: 8px;
      color: #000;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      box-shadow: 0 4px 18px rgba(245, 158, 11, 0.35);
      transition: all 0.25s ease;
      white-space: nowrap;
    }}
    .btn-search:hover {{
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(245, 158, 11, 0.55);
      background: linear-gradient(135deg, #b45309, #d97706);
      color: #fff;
    }}

    .tactical-box {{
      margin-top: 1.5rem;
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
    .chips-label {{
      font-size: 0.68rem;
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 0.35rem;
    }}
    .chip-container {{
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }}
    .payload-chip {{
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 0.35rem 0.65rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: #fde68a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      transition: all 0.15s ease;
    }}
    .payload-chip:hover {{
      background: rgba(245, 158, 11, 0.18);
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
        <i class="fa-solid fa-code"></i>
      </div>
      <div class="hud-title-group">
        <h1>Reflected XSS Lab <span style="font-size: 0.75rem; font-weight: 400; color: var(--accent);">(DOM / Script Injection)</span></h1>
        <p>EHSP DEFENSE MATRIX // HOST: kb-search.internal // PORT: 5000</p>
      </div>
    </div>
    <div class="hud-metadata">
      <div class="hud-pill amber">
        <i class="fa-solid fa-bug"></i>
        <span>VULN: REFLECTED XSS</span>
      </div>
      <div class="hud-pill">
        <i class="fa-solid fa-compass"></i>
        <span>CONTEXT: Unescaped HTML</span>
      </div>
      <div class="hud-pill success">
        <span class="status-dot"></span>
        <span>LAB ONLINE</span>
      </div>
    </div>
  </header>

  <!-- Main Area -->
  <main class="main-wrapper">
    <div class="search-card">
      <div class="card-header">
        <div class="portal-avatar">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <h2>Enterprise Knowledge Base</h2>
        <p>Search Internal Documentation & Policy Manuals</p>
      </div>

      <form method="GET" action="/search">
        <div class="input-row">
          <div class="input-box">
            <input id="queryInput" name="q" placeholder="Search keywords or inject script..." autocomplete="off" required>
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <button type="submit" class="btn-search">
            <i class="fa-solid fa-bolt"></i> Query
          </button>
        </div>
      </form>

      <!-- Tactical Mission Dossier -->
      <div class="tactical-box">
        <div class="tactical-header">
          <i class="fa-solid fa-crosshairs"></i> MISSION BRIEFING
        </div>
        <p class="tactical-desc">
          The <code>/search?q=...</code> endpoint reflects user queries directly into the DOM without HTML entity encoding.
          Inject a payload that requests the protected <code>/flag</code> endpoint and writes the flag to the page.
        </p>
        <div class="chips-label">QUICK TEST PAYLOADS:</div>
        <div class="chip-container">
          <div class="payload-chip" onclick="fillPayload(&quot;<script>alert(1)</script>&quot;)">
            <span>&lt;script&gt;alert(1)&lt;/script&gt;</span>
            <i class="fa-solid fa-play" style="font-size:0.65rem;"></i>
          </div>
          <div class="payload-chip" onclick="fillPayload(&quot;<img src=x onerror=alert(document.domain)>&quot;)">
            <span>&lt;img src=x onerror=alert(document.domain)&gt;</span>
            <i class="fa-solid fa-play" style="font-size:0.65rem;"></i>
          </div>
          <div class="payload-chip" onclick="fillPayload(&quot;<script>fetch('/flag').then(r=>r.text()).then(d=>document.body.innerHTML=d)</script>&quot;)">
            <span>&lt;script&gt;fetch('/flag').then(r=&gt;r.text()).then(d=&gt;document.body.innerHTML=d)&lt;/script&gt;</span>
            <i class="fa-solid fa-play" style="font-size:0.65rem;"></i>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    function fillPayload(val) {{
      const input = document.getElementById('queryInput');
      input.value = val;
      input.focus();
    }}
  </script>
</body>
</html>"""


@app.route("/search")
def search():
    # ⚠️ INTENTIONALLY VULNERABLE — DO NOT USE IN PRODUCTION
    query = request.args.get("q", "")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Search Results</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .results-card {{
      background: rgba(13, 20, 36, 0.9);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.12);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 580px;
    }}
    .results-card h2 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }}
    .reflection-banner {{
      margin: 1.2rem 0;
      padding: 0.85rem 1rem;
      background: #020409;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-muted);
    }}
    .reflected-payload {{
      color: #fde68a;
      font-weight: 600;
    }}
    .no-match-box {{
      padding: 1.2rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: var(--text-dim);
      font-size: 0.82rem;
      text-align: center;
      margin-bottom: 1.5rem;
    }}
    .btn-back {{
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
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
    <div class="results-card">
      <h2><i class="fa-solid fa-magnifying-glass" style="color:var(--accent);"></i> Knowledge Base Query Output</h2>
      
      <div class="reflection-banner">
        <span>Evaluated Search String: </span>
        <span class="reflected-payload">{query}</span>
      </div>

      <div class="no-match-box">
        <i class="fa-solid fa-circle-question" style="font-size:1.4rem; margin-bottom:0.5rem; display:block;"></i>
        Zero documents matched the submitted query string in the index.
      </div>

      <a href="/" class="btn-back"><i class="fa-solid fa-arrow-left"></i> Return to Knowledge Base</a>
    </div>
  </main>
</body>
</html>"""


@app.route("/flag")
def flag():
    """Returns the flag - only reachable via XSS from the search page (same origin)."""
    resp = make_response(f"""
    <div style='font-family: "JetBrains Mono", monospace; background: #040711; color: #10b981; padding: 2.2rem; border-radius: 12px; border: 2px solid #10b981; box-shadow: 0 0 40px rgba(16, 185, 129, 0.3); margin: 2rem auto; max-width: 580px; text-align: center;'>
      <div style='font-size: 0.78rem; letter-spacing: 0.1em; color: #6ee7b7; text-transform: uppercase; margin-bottom: 0.6rem;'>
        ⚡ CROSS-SITE SCRIPTING EXPLOITATION SUCCESSFUL ⚡
      </div>
      <div style='font-size: 1.35rem; font-weight: 800; color: #fff; background: rgba(16, 185, 129, 0.15); border: 1px dashed #10b981; padding: 0.8rem; border-radius: 8px; margin: 1rem 0; letter-spacing: 1px;'>
        {FLAG}
      </div>
      <div style='font-size: 0.78rem; color: #94a3b8; line-height: 1.5;'>
        Injected script executed within the victim origin and successfully exfiltrated session flag!
      </div>
      <button onclick="navigator.clipboard.writeText('{FLAG}'); alert('Flag copied to clipboard!');" style="margin-top:1.2rem; background:#10b981; color:#022c22; border:none; padding:0.5rem 1rem; border-radius:6px; font-weight:700; cursor:pointer;">
        📋 Copy Flag
      </button>
    </div>""")
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
