"""
EHSP — Stored XSS Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.
"""
import sqlite3
import os
from flask import Flask, request, redirect

app = Flask(__name__)
FLAG = "EHSP{stored_xss_persisted}"
DB = "/tmp/lab.db"


def init_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT OR IGNORE INTO comments (id, author, content) VALUES
            (1, 'alice', 'Great technical writeup on zero-trust architecture!'),
            (2, 'bob', 'Looking forward to the advanced binary exploitation module.'),
            (3, 'charlie', 'Has anyone tested this against modern CSP headers?');
    """)
    conn.commit()
    conn.close()


init_db()

ADMIN_FLAG_JS = f"""
<script>
  // Simulated admin auto-viewer session
  const adminSecret = "{FLAG}";
  document.addEventListener('DOMContentLoaded', function() {{
    fetch('/steal?data=' + encodeURIComponent(adminSecret));
  }});
</script>
"""

COMMON_CSS = """
    :root {
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
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 15%, #20081d 0%, #080a14 55%, #020409 100%);
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
        linear-gradient(rgba(244, 114, 182, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(244, 114, 182, 0.03) 1px, transparent 1px);
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
      background: linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(244, 114, 182, 0.05));
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
    .hud-pill.pink {
      background: rgba(244, 114, 182, 0.12);
      border-color: rgba(244, 114, 182, 0.35);
      color: #fbcfe8;
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
      justify-content: center;
      padding: 2rem 1.2rem;
      overflow-y: auto;
    }
    .content-container {
      width: 100%;
      max-width: 720px;
    }
"""


@app.route("/")
def home():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM comments ORDER BY created_at DESC")
    comments = cur.fetchall()
    conn.close()

    comments_html = ""
    for c in comments:
        # ⚠️ INTENTIONALLY VULNERABLE — content rendered without escaping
        comments_html += f"""
        <div class="comment-item">
          <div class="comment-header">
            <div class="author-avatar">{c['author'][0].upper()}</div>
            <div class="author-name">{c['author']}</div>
            <div class="comment-time">{c['created_at']}</div>
          </div>
          <div class="comment-body">{c['content']}</div>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Stored Cross-Site Scripting Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .tactical-box {{
      background: rgba(13, 20, 36, 0.85);
      backdrop-filter: blur(14px);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 1.2rem;
      margin-bottom: 1.4rem;
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
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 0.75rem;
    }}
    .payload-chips {{
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }}
    .payload-chip {{
      background: rgba(6, 11, 24, 0.9);
      border: 1px solid rgba(244, 114, 182, 0.3);
      padding: 0.35rem 0.65rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: #fbcfe8;
      cursor: pointer;
      transition: all 0.15s ease;
    }}
    .payload-chip:hover {{
      background: rgba(244, 114, 182, 0.2);
      border-color: var(--accent);
    }}

    .article-card {{
      background: rgba(13, 20, 36, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1.8rem;
      margin-bottom: 1.5rem;
    }}
    .article-tag {{
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
    }}
    .article-card h2 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.4rem;
    }}
    .article-meta {{
      font-size: 0.75rem;
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 1rem;
    }}
    .article-body {{
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.65;
    }}

    .comment-item {{
      background: rgba(6, 10, 22, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 1rem 1.2rem;
      margin-bottom: 0.75rem;
    }}
    .comment-header {{
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.5rem;
    }}
    .author-avatar {{
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #db2777, #f472b6);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }}
    .author-name {{
      font-size: 0.82rem;
      font-weight: 600;
      color: #fff;
    }}
    .comment-time {{
      font-size: 0.7rem;
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
      margin-left: auto;
    }}
    .comment-body {{
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
    }}

    .comment-form-box {{
      background: rgba(13, 20, 36, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 1.6rem;
      margin-top: 1.5rem;
    }}
    .comment-form-box h3 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 1rem;
    }}
    .form-group {{
      margin-bottom: 0.9rem;
    }}
    .form-label {{
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
      font-family: 'JetBrains Mono', monospace;
    }}
    .comment-form-box input, .comment-form-box textarea {{
      width: 100%;
      padding: 0.7rem 0.9rem;
      background: rgba(6, 9, 19, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #fff;
      font-size: 0.85rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }}
    .comment-form-box input:focus, .comment-form-box textarea:focus {{
      border-color: var(--accent);
      box-shadow: 0 0 14px var(--accent-glow);
    }}
    .btn-comment {{
      background: linear-gradient(135deg, #db2777, #f472b6);
      border: none;
      padding: 0.65rem 1.4rem;
      border-radius: 6px;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }}
    .btn-comment:hover {{
      background: linear-gradient(135deg, #be185d, #db2777);
      transform: translateY(-1px);
    }}
    .admin-link {{
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--accent);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      margin-top: 1rem;
      text-decoration: none;
    }}
    .admin-link:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>

  <!-- Cyber HUD Header -->
  <header class="hud-header">
    <div class="hud-branding">
      <div class="hud-badge-icon">
        <i class="fa-solid fa-comments"></i>
      </div>
      <div class="hud-title-group">
        <h1>Stored XSS Lab <span style="font-size: 0.75rem; font-weight: 400; color: var(--accent);">(Persistent Script Injection)</span></h1>
        <p>EHSP DEFENSE MATRIX // HOST: blog.internal // PORT: 5000</p>
      </div>
    </div>
    <div class="hud-metadata">
      <div class="hud-pill pink">
        <i class="fa-solid fa-database"></i>
        <span>VULN: PERSISTED XSS</span>
      </div>
      <a href="/admin" class="hud-pill" style="text-decoration:none; color:var(--text-main);">
        <i class="fa-solid fa-user-shield"></i>
        <span>SIMULATE ADMIN VIEW</span>
      </a>
      <div class="hud-pill success">
        <span class="status-dot"></span>
        <span>STREAM ONLINE</span>
      </div>
    </div>
  </header>

  <!-- Main Area -->
  <main class="main-wrapper">
    <div class="content-container">
      
      <!-- Tactical Mission Dossier -->
      <div class="tactical-box">
        <div class="tactical-header">
          <i class="fa-solid fa-crosshairs"></i> MISSION BRIEFING
        </div>
        <p class="tactical-desc">
          User comments are persisted into the SQLite database and rendered verbatim without HTML sanitization.
          Post an XSS payload, then visit the <strong>Admin Review Panel</strong> (<code>/admin</code>) where the simulated bot executes the payload and reveals the flag.
        </p>
        <div style="font-size:0.68rem; color:var(--text-dim); font-family:'JetBrains Mono',monospace; margin-bottom:0.35rem;">SAMPLE XSS PAYLOADS:</div>
        <div class="payload-chips">
          <div class="payload-chip" onclick="fillComment('<script>alert(1)</script>')">&lt;script&gt;alert(1)&lt;/script&gt;</div>
          <div class="payload-chip" onclick="fillComment('<script>fetch(\\'/steal?data=\\' + document.cookie)</script>')">Steal Cookie Script</div>
        </div>
      </div>

      <!-- Article -->
      <article class="article-card">
        <span class="article-tag">FEATURED RESEARCH</span>
        <h2>Top 5 Web Application Attack Surfaces in 2026</h2>
        <div class="article-meta">Author: SecOps Team // Category: Vulnerability Analysis // Published: 2026-02-24</div>
        <p class="article-body">
          Stored Cross-Site Scripting (Persistent XSS) occurs when malicious code is submitted via input fields and permanently stored on the host database. When unsuspecting users or administrators request the resource, the payload executes within their browser context with their permissions.
        </p>
      </article>

      <h3 style="font-family:'Outfit',sans-serif; font-size:1.15rem; color:#fff; margin-bottom:0.8rem;">
        <i class="fa-regular fa-comment-dots" style="color:var(--accent);"></i> Community Comments ({len(comments)})
      </h3>

      {comments_html}

      <!-- New Comment Form -->
      <div class="comment-form-box">
        <h3>Post New Comment</h3>
        <form method="POST" action="/comment">
          <div class="form-group">
            <label class="form-label">HANDLE / AUTHOR NAME</label>
            <input name="author" placeholder="e.g. Researcher1337" required>
          </div>
          <div class="form-group">
            <label class="form-label">COMMENT BODY (HTML SUPPORTED)</label>
            <textarea id="commentInput" name="content" rows="3" placeholder="Enter your feedback or injection script..." required></textarea>
          </div>
          <button type="submit" class="btn-comment">
            <i class="fa-solid fa-paper-plane"></i> Submit Comment
          </button>
        </form>
        <a href="/admin" class="admin-link"><i class="fa-solid fa-shield-cat"></i> Open Simulated Admin Review Page →</a>
      </div>

    </div>
  </main>

  <script>
    function fillComment(val) {{
      const el = document.getElementById('commentInput');
      el.value = val;
      el.focus();
    }}
  </script>
</body>
</html>"""


@app.route("/comment", methods=["POST"])
def post_comment():
    author = request.form.get("author", "Anonymous")
    content = request.form.get("content", "")

    if not content.strip():
        return redirect("/")

    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    # ⚠️ INTENTIONALLY VULNERABLE — stored without sanitization
    cur.execute("INSERT INTO comments (author, content) VALUES (?, ?)", (author, content))
    conn.commit()
    conn.close()

    return redirect("/")


_stolen_data = {}


@app.route("/steal")
def steal():
    data = request.args.get("data", "")
    _stolen_data["last"] = data
    return "", 200


@app.route("/admin")
def admin():
    """Simulated admin page that processes stored comments and auto-triggers XSS."""
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM comments ORDER BY created_at DESC")
    comments = cur.fetchall()
    conn.close()

    # Check if any comment contains an XSS payload
    xss_found = any(
        "<script>" in c["content"].lower() or "javascript:" in c["content"].lower()
        for c in comments
    )

    flag_html = ""
    if xss_found:
        flag_html = f"""
        <div style="background:linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,78,59,0.35)); border:1px solid #10b981; border-radius:10px; padding:1.2rem; margin:1.2rem 0; text-align:center;">
          <div style="font-family:'Outfit',sans-serif; font-size:1.1rem; font-weight:700; color:#34d399;">
            <i class="fa-solid fa-circle-check"></i> XSS PAYLOAD TRIGGERED BY ADMIN BOT!
          </div>
          <div style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:800; color:#fff; background:rgba(0,0,0,0.4); padding:0.6rem; border-radius:6px; margin:0.8rem 0; letter-spacing:1px;" id="adminFlag">
            {FLAG}
          </div>
          <button onclick="navigator.clipboard.writeText('{FLAG}'); alert('Flag copied!');" style="background:#10b981; color:#022c22; border:none; padding:0.4rem 0.9rem; border-radius:4px; font-weight:700; cursor:pointer;">
            Copy Flag
          </button>
        </div>"""

    comments_html = "".join(
        f'<div style="background:rgba(6,10,22,0.8); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:0.75rem 1rem; margin-bottom:0.5rem; font-size:0.82rem;">'
        f'<strong style="color:var(--accent)">{c["author"]}</strong>: {c["content"]}'
        f'</div>' for c in comments
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Admin Comment Review Panel</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    {COMMON_CSS}
    .admin-card {{
      background: rgba(13, 20, 36, 0.92);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
      border-radius: 14px;
      padding: 2.2rem;
      width: 100%;
      max-width: 680px;
    }}
    .admin-card h2 {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }}
  </style>
  {ADMIN_FLAG_JS}
</head>
<body>
  <main class="main-wrapper">
    <div class="admin-card">
      <h2><i class="fa-solid fa-shield-halved" style="color:var(--accent);"></i> Administrative Moderation Queue</h2>
      <p style="font-size:0.8rem; color:var(--text-muted); font-family:'JetBrains Mono',monospace; margin:0.4rem 0 1rem;">
        {'⚠️ Active executable scripts detected in review queue!' if xss_found else 'Audit complete: all comments clear of executable tags.'}
      </p>

      {flag_html}

      <div style="margin: 1.2rem 0;">
        {comments_html}
      </div>

      <a href="/" style="color:var(--accent); font-family:'JetBrains Mono',monospace; font-size:0.8rem; text-decoration:none;">
        ← Return to Public Blog
      </a>
    </div>
  </main>
</body>
</html>"""


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
