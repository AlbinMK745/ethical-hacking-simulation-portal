"""
EHSP — Remote Code Execution (RCE) Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.

The challenge: A template renderer uses Python eval() — exploit it to read the flag.
"""
import os
from flask import Flask, request

app = Flask(__name__)
FLAG = "EHSP{rce_eval_code_exec}"

# Write flag file
with open("/tmp/flag.txt", "w") as f:
    f.write(FLAG + "\n")


COMMON_HEAD = """
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --bg-dark: #070b13;
      --card-bg: rgba(13, 20, 36, 0.85);
      --border-color: rgba(34, 211, 238, 0.22);
      --accent-cyan: #22d3ee;
      --accent-cyan-glow: rgba(34, 211, 238, 0.35);
      --accent-blue: #38bdf8;
      --accent-green: #4ade80;
      --accent-red: #f87171;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 0%, rgba(34, 211, 238, 0.12) 0%, transparent 60%), var(--bg-dark);
      background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 24px 24px;
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    /* Top HUD */
    .hud-header {
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
    }
    .hud-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      letter-spacing: 1px;
      font-size: 0.95rem;
      color: #fff;
    }
    .hud-brand i { color: var(--accent-cyan); font-size: 1.1rem; }
    .hud-live-tag {
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
    }
    .live-dot {
      width: 7px;
      height: 7px;
      background: var(--accent-green);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--accent-green);
      animation: pulseDot 1.4s infinite;
    }
    @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
    .hud-meta {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    .meta-chip {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .meta-chip strong { color: var(--text-main); }
    .badge-diff {
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: 'Outfit', sans-serif;
    }
    .badge-diff.hard { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.35); }
    
    /* Main Layout */
    .lab-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.5rem;
    }
    .lab-card {
      background: var(--card-bg);
      backdrop-filter: blur(24px);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      width: 100%;
      max-width: 680px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent-cyan-glow);
      overflow: hidden;
      animation: cardFadeUp 0.4s ease-out;
    }
    @keyframes cardFadeUp { from { opacity: 0; transform: translateY(18px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
    
    /* Terminal Titlebar */
    .card-titlebar {
      background: rgba(4, 8, 16, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .traffic-dots { display: flex; gap: 6px; }
    .traffic-dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #22c55e; }
    .card-titlebar-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    
    /* Card Body */
    .card-body {
      padding: 2rem 2.2rem;
    }
    .card-header-block {
      margin-bottom: 1.8rem;
    }
    .card-header-block h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      letter-spacing: -0.3px;
    }
    .card-header-block h1 i { color: var(--accent-cyan); }
    .card-header-block p {
      color: var(--text-muted);
      font-size: 0.88rem;
      margin-top: 0.4rem;
      line-height: 1.5;
    }
    
    /* Form Styles */
    .form-group {
      margin-bottom: 1.4rem;
    }
    .form-group label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    .form-group label span.sublabel {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    .cyber-textarea {
      width: 100%;
      background: rgba(4, 8, 16, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      padding: 0.9rem 1rem;
      min-height: 110px;
      resize: vertical;
      outline: none;
      transition: all 0.25s ease;
      line-height: 1.5;
    }
    .cyber-textarea:focus {
      border-color: var(--accent-cyan);
      box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.18), 0 0 20px rgba(34, 211, 238, 0.12);
    }
    
    .cyber-btn {
      width: 100%;
      background: linear-gradient(135deg, #06b6d4, #0891b2);
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
      box-shadow: 0 4px 18px rgba(6, 182, 212, 0.35);
      transition: all 0.25s ease;
    }
    .cyber-btn:hover {
      background: linear-gradient(135deg, #22d3ee, #06b6d4);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(34, 211, 238, 0.5);
    }
    .cyber-btn:active { transform: translateY(0); }
    
    /* Output Box */
    .terminal-out {
      margin-top: 1.5rem;
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;
    }
    .terminal-out-header {
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 0.45rem 0.9rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.72rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    .terminal-out-body {
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.6;
    }
    .out-code { color: var(--accent-cyan); }
    .out-res { color: var(--accent-green); }
    .out-err { color: var(--accent-red); }
    
    /* Objective Drawer */
    .briefing-box {
      margin-top: 1.8rem;
      background: rgba(4, 8, 16, 0.75);
      border: 1px solid rgba(34, 211, 238, 0.2);
      border-radius: 12px;
      padding: 1.2rem;
      font-size: 0.84rem;
      line-height: 1.6;
    }
    .briefing-title {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--accent-cyan);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.6rem;
    }
    .briefing-text { color: var(--text-muted); margin-bottom: 0.8rem; }
    .payload-chip-row {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.6rem;
    }
    .payload-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 0.4rem 0.8rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #67e8f9;
    }
    .copy-chip-btn {
      background: rgba(34, 211, 238, 0.15);
      border: 1px solid rgba(34, 211, 238, 0.3);
      color: #fff;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .copy-chip-btn:hover {
      background: var(--accent-cyan);
      color: #070b13;
    }
    
    /* Victory Flag Banner */
    .victory-card {
      background: linear-gradient(135deg, rgba(20, 83, 45, 0.8), rgba(6, 78, 59, 0.9));
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 1.4rem;
      margin-top: 1.5rem;
      text-align: center;
      box-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
      animation: victoryPulse 2s infinite alternate;
    }
    @keyframes victoryPulse { from { box-shadow: 0 0 20px rgba(34, 197, 94, 0.2); } to { box-shadow: 0 0 40px rgba(34, 197, 94, 0.45); } }
    .victory-tag {
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
    }
    .flag-code-box {
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8rem;
    }
    .btn-copy-flag {
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
    }
    .btn-copy-flag:hover { background: #4ade80; transform: scale(1.03); }
    
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-muted);
      font-size: 0.82rem;
      text-decoration: none;
      margin-top: 1.2rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--accent-cyan); }
  </style>
  <script>
    function copyText(btn, text) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = orig; }, 1800);
      });
    }
  </script>
"""


@app.route("/")
def home():
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  {COMMON_HEAD}
  <title>EHSP // Expression Template Renderer (RCE)</title>
</head>
<body>
  <!-- Header HUD -->
  <header class="hud-header">
    <div class="hud-brand">
      <i class="fas fa-shield-halved"></i>
      <span>EHSP // SECURITY LAB SIMULATION</span>
      <span class="hud-live-tag"><span class="live-dot"></span> TARGET ONLINE</span>
    </div>
    <div class="hud-meta">
      <div class="meta-chip">TARGET: <strong>127.0.0.1:5000</strong></div>
      <div class="meta-chip">VULN: <strong>RCE (EVAL)</strong></div>
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
        <span class="card-titlebar-title">eval_renderer.py — interactive shell</span>
        <span class="meta-chip">PORT 5000</span>
      </div>

      <div class="card-body">
        <div class="card-header-block">
          <h1><i class="fas fa-terminal"></i> Expression Template Renderer</h1>
          <p>Internal calculation & expression engine. Enter a Python expression to evaluate it live in the server execution context.</p>
        </div>

        <form method="POST" action="/render">
          <div class="form-group">
            <label>
              <span><i class="fas fa-code"></i> Python Expression</span>
              <span class="sublabel">e.g. 2 + 2, "sec".upper()</span>
            </label>
            <textarea name="expr" class="cyber-textarea" placeholder="Enter Python expression...">2 + 2</textarea>
          </div>
          <button type="submit" class="cyber-btn">
            <i class="fas fa-play"></i> Evaluate Expression
          </button>
        </form>

        <div class="briefing-box">
          <div class="briefing-title">
            <i class="fas fa-bullseye"></i> Tactical Objective // RCE Via eval()
          </div>
          <p class="briefing-text">
            This endpoint passes user-supplied input straight into Python's native <code>eval()</code> without sandbox restrictions.
            Exploit the interpreter to breach file permissions and retrieve the secret token located at <code>/tmp/flag.txt</code>.
          </p>
          <div class="payload-chip-row">
            <div class="payload-chip">
              <span>open('/tmp/flag.txt').read()</span>
              <button type="button" class="copy-chip-btn" onclick="copyText(this, 'open(\\'/tmp/flag.txt\\').read()')">Copy</button>
            </div>
            <div class="payload-chip">
              <span>__import__('os').listdir('/tmp')</span>
              <button type="button" class="copy-chip-btn" onclick="copyText(this, '__import__(\\'os\\').listdir(\\'/tmp\\')')">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>"""


@app.route("/render", methods=["POST"])
def render():
    expr = request.form.get("expr", "").strip()
    if not expr:
        return home()

    result = ""
    error = ""
    try:
        # ⚠️ INTENTIONALLY VULNERABLE — direct eval of user input!
        result = str(eval(expr))
    except Exception as e:
        error = str(e)

    flag_banner = ""
    if FLAG in result:
        flag_banner = f"""
        <div class="victory-card">
          <div class="victory-tag"><i class="fas fa-flag"></i> EXPLOITATION SUCCESSFUL // FLAG RETRIEVED</div>
          <div class="flag-code-box">
            <span>{FLAG}</span>
          </div>
          <button class="btn-copy-flag" onclick="copyText(this, '{FLAG}')">
            <i class="fas fa-copy"></i> Copy Flag & Paste in Portal
          </button>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  {COMMON_HEAD}
  <title>EHSP // Evaluation Output</title>
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
      <div class="meta-chip">STATUS: <strong>EVALUATED</strong></div>
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
        <span class="card-titlebar-title">stdout // execution_result</span>
        <span class="meta-chip">EXIT 0</span>
      </div>

      <div class="card-body">
        <div class="card-header-block">
          <h1><i class="fas fa-square-poll-vertical"></i> Evaluation Result</h1>
          <p>Payload execution summary from the server's Python runtime.</p>
        </div>

        <div class="terminal-out">
          <div class="terminal-out-header">
            <span><i class="fas fa-terminal"></i> EXPR INPUT</span>
            <span>PYTHON 3</span>
          </div>
          <div class="terminal-out-body out-code">&gt;&gt;&gt; {expr}</div>
        </div>

        {f'''
        <div class="terminal-out" style="margin-top: 1rem;">
          <div class="terminal-out-header">
            <span><i class="fas fa-check-circle"></i> RETURN VALUE</span>
            <button class="copy-chip-btn" onclick="copyText(this, document.getElementById('res-val').innerText)">Copy</button>
          </div>
          <div class="terminal-out-body out-res" id="res-val">{result}</div>
        </div>
        ''' if result else ''}

        {f'''
        <div class="terminal-out" style="margin-top: 1rem;">
          <div class="terminal-out-header" style="color: #f87171;">
            <span><i class="fas fa-triangle-exclamation"></i> EXCEPTION TRACE</span>
          </div>
          <div class="terminal-out-body out-err">Error: {error}</div>
        </div>
        ''' if error else ''}

        {flag_banner}

        <div style="text-align: center; margin-top: 1.5rem;">
          <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> Return to Expression Renderer</a>
        </div>
      </div>
    </div>
  </main>
</body>
</html>"""


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
