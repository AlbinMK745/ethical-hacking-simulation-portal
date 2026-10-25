"""
EHSP — Command Injection Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
import os
import subprocess
from flask import Flask, request

app = Flask(__name__)
FLAG = "EHSP{cmd_injection_rce}"

# Write flag to file so user can find it with cat
with open("/flag.txt", "w") as f:
    f.write(FLAG)


COMMON_CSS = """
    :root {
      --bg-base: #060913;
      --border-subtle: rgba(167, 139, 250, 0.18);
      --border-glow: rgba(167, 139, 250, 0.45);
      --accent: #a78bfa;
      --accent-glow: rgba(167, 139, 250, 0.28);
      --emerald: #10b981;
      --ruby: #f43f5e;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 20%, #170d2b 0%, #080a14 55%, #020409 100%);
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
        linear-gradient(rgba(167, 139, 250, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(167, 139, 250, 0.03) 1px, transparent 1px);
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
      background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(167, 139, 250, 0.05));
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
    .hud-pill.purple {
      background: rgba(167, 139, 250, 0.12);
      border-color: rgba(167, 139, 250, 0.35);
      color: #ddd6fe;
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
  <title>EHSP // OS Command Injection Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .ping-card {{
      background: rgba(13, 20, 36, 0.85);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(167, 139, 250, 0.12);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 540px;
      position: relative;
    }}
    .ping-card::before {{
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
      background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(167, 139, 250, 0.05));
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

    .btn-ping {{
      padding: 0.75rem 1.4rem;
      background: linear-gradient(135deg, #7c3aed, #8b5cf6);
      border: 1px solid rgba(167, 139, 250, 0.5);
      border-radius: 8px;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      box-shadow: 0 4px 18px rgba(139, 92, 246, 0.35);
      transition: all 0.25s ease;
      white-space: nowrap;
    }}
    .btn-ping:hover {{
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(139, 92, 246, 0.55);
      background: linear-gradient(135deg, #6d28d9, #7c3aed);
    }}

    .tactical-box {{
      margin-top: 1.5rem;
      background: rgba(6, 11, 24, 0.8);
      border: 1px solid rgba(167, 139, 250, 0.2);
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
      border: 1px solid rgba(167, 139, 250, 0.3);
      padding: 0.35rem 0.65rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: #ddd6fe;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      transition: all 0.15s ease;
    }}
    .payload-chip:hover {{
      background: rgba(167, 139, 250, 0.18);
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
        <i class="fa-solid fa-satellite-dish"></i>
      </div>
      <div class="hud-title-group">
        <h1>Command Injection Lab <span style="font-size: 0.75rem; font-weight: 400; color: var(--accent);">(Arbitrary Shell Execution)</span></h1>
        <p>EHSP DEFENSE MATRIX // HOST: netmon.internal // TARGET: /flag.txt</p>
      </div>
    </div>
    <div class="hud-metadata">
      <div class="hud-pill purple">
        <i class="fa-solid fa-terminal"></i>
        <span>VULN: OS CMD INJECTION</span>
      </div>
      <div class="hud-pill">
        <i class="fa-solid fa-shield-virus"></i>
        <span>SUBPROCESS: shell=True</span>
      </div>
      <div class="hud-pill success">
        <span class="status-dot"></span>
        <span>SERVICE ONLINE</span>
      </div>
    </div>
  </header>

  <!-- Main Area -->
  <main class="main-wrapper">
    <div class="ping-card">
      <div class="card-header">
        <div class="portal-avatar">
          <i class="fa-solid fa-network-wired"></i>
        </div>
        <h2>Network Diagnostics Suite</h2>
        <p>Live Node ICMP Echo Verification Utility</p>
      </div>

      <form method="POST" action="/ping">
        <div class="input-row">
          <div class="input-box">
            <input id="ipInput" name="ip" placeholder="Target IP or chained command..." value="8.8.8.8" autocomplete="off" required>
            <i class="fa-solid fa-globe"></i>
          </div>
          <button type="submit" class="btn-ping">
            <i class="fa-solid fa-play"></i> Run Probe
          </button>
        </div>
      </form>

      <!-- Tactical Mission Dossier -->
      <div class="tactical-box">
        <div class="tactical-header">
          <i class="fa-solid fa-crosshairs"></i> MISSION BRIEFING
        </div>
        <p class="tactical-desc">
          The diagnostic service executes <code>ping -c 1 &lt;ip&gt;</code> directly in bash without shell sanitization.
          Use command separators (<code>;</code>, <code>&amp;&amp;</code>, <code>|</code>) to execute arbitrary commands and extract <code>/flag.txt</code>.
        </p>
        <div class="chips-label">QUICK INJECT PAYLOADS:</div>
        <div class="chip-container">
          <div class="payload-chip" onclick="fillPayload(&quot;8.8.8.8; id; whoami&quot;)">
            <span>8.8.8.8; id; whoami</span>
            <i class="fa-solid fa-play" style="font-size:0.65rem;"></i>
          </div>
          <div class="payload-chip" onclick="fillPayload(&quot;8.8.8.8; ls -la /; cat /flag.txt&quot;)">
            <span>8.8.8.8; ls -la /; cat /flag.txt</span>
            <i class="fa-solid fa-play" style="font-size:0.65rem;"></i>
          </div>
          <div class="payload-chip" onclick="fillPayload(&quot;8.8.8.8 && cat /flag.txt&quot;)">
            <span>8.8.8.8 && cat /flag.txt</span>
            <i class="fa-solid fa-play" style="font-size:0.65rem;"></i>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    function fillPayload(val) {{
      const input = document.getElementById('ipInput');
      input.value = val;
      input.focus();
    }}
  </script>
</body>
</html>"""


@app.route("/ping", methods=["POST"])
def ping():
    ip = request.form.get("ip", "").strip()

    # ⚠️ INTENTIONALLY VULNERABLE — shell=True is dangerous!
    try:
        output = subprocess.check_output(
            f"ping -c 1 {ip}",
            shell=True,
            stderr=subprocess.STDOUT,
            timeout=5,
            text=True
        )
    except subprocess.TimeoutExpired:
        output = "Command execution timed out (limit: 5s)."
    except subprocess.CalledProcessError as e:
        output = e.output or "Command failed with non-zero exit status."

    flag_found = FLAG in output

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Diagnostic Execution Output</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .term-wrapper {{
      background: rgba(13, 20, 36, 0.92);
      backdrop-filter: blur(18px);
      border: 1px solid {'rgba(16, 185, 129, 0.5)' if flag_found else 'var(--border-subtle)'};
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px {'rgba(16, 185, 129, 0.25)' if flag_found else 'rgba(167, 139, 250, 0.12)'};
      border-radius: 14px;
      padding: 2rem;
      width: 100%;
      max-width: 680px;
    }}
    .term-title {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 1.2rem;
    }}
    .cmd-bar {{
      background: #020409;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 0.65rem 0.9rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #fbbf24;
      margin-bottom: 1rem;
      word-break: break-all;
    }}
    .term-console {{
      background: #030611;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #6ee7b7;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 280px;
      overflow-y: auto;
      line-height: 1.45;
    }}
    .flag-banner {{
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.3));
      border: 1px solid #10b981;
      border-radius: 8px;
      padding: 1rem 1.2rem;
      margin-top: 1.2rem;
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
    <div class="term-wrapper">
      <div class="term-title">
        <i class="fa-solid fa-terminal" style="color:var(--accent);"></i>
        Subprocess Shell Execution
      </div>

      <div class="cmd-bar">
        <span style="color:var(--text-dim);">$ </span>ping -c 1 {ip}
      </div>

      <div class="term-console">{output}</div>

      {"<div class='flag-banner'><div><div class='flag-label'>MISSION COMPLETED // FLAG RETRIEVED</div><div class='flag-value' id='flagVal'>" + FLAG + "</div></div><button class='copy-btn' onclick='copyFlag()'><i class='fa-regular fa-copy'></i> Copy</button></div>" if flag_found else ""}

      <a href="/" class="btn-back"><i class="fa-solid fa-arrow-left"></i> Run Another Diagnostic Command</a>
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
