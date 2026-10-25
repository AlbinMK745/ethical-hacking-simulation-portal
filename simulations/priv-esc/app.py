"""
EHSP — Privilege Escalation Simulation Lab
Intentionally VULNERABLE Flask app for educational purposes.
DO NOT deploy this outside a sandboxed Docker container.

The challenge: Find a SUID binary, use it to read /root/flag.txt as root.
"""
import os
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)
FLAG = "EHSP{privesc_root_achieved}"

# Write flag to a root-owned file
os.makedirs("/root", exist_ok=True)
with open("/root/flag.txt", "w") as f:
    f.write(FLAG + "\n")

# Simulate a SUID binary by creating a helper script
os.makedirs("/usr/local/sbin", exist_ok=True)
with open("/usr/local/sbin/suid-reader", "w") as f:
    f.write("""#!/bin/bash
# Super-privileged script (runs as root in real scenario)
cat "$1"
""")
os.chmod("/usr/local/sbin/suid-reader", 0o4755)  # SUID bit

ALLOWED = {"ls", "id", "whoami", "cat", "find", "env", "uname", "hostname",
           "echo", "pwd", "which", "file", "stat", "ps", "groups", "sudo"}

# A simulated sudo privileges list
SUDO_ALLOWED = {"/usr/local/sbin/suid-reader", "/usr/bin/find"}


@app.route("/")
def home():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EHSP // Privilege Escalation Security Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css">
  <style>
    :root {
      --bg-base: #060913;
      --bg-card: rgba(13, 19, 36, 0.82);
      --bg-card-hover: rgba(20, 29, 54, 0.95);
      --border-subtle: rgba(244, 63, 94, 0.16);
      --border-glow: rgba(244, 63, 94, 0.45);
      --accent: #f43f5e;
      --accent-glow: rgba(244, 63, 94, 0.28);
      --accent-secondary: #fb7185;
      --amber: #f59e0b;
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.25);
      --cyan: #06b6d4;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: radial-gradient(circle at 15% 15%, #170817 0%, #070914 45%, #030409 100%);
      color: var(--text-main);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Ambient cyber grid */
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(rgba(244, 63, 94, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(244, 63, 94, 0.03) 1px, transparent 1px);
      background-size: 32px 32px;
      pointer-events: none;
      z-index: 0;
    }

    /* Top Cyber HUD */
    .hud-header {
      position: relative;
      z-index: 10;
      background: rgba(8, 12, 24, 0.85);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.65rem 1.4rem;
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
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.05));
      border: 1px solid var(--border-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      font-size: 1rem;
      box-shadow: 0 0 16px var(--accent-glow);
    }
    .hud-title-group h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .hud-title-group p {
      font-size: 0.72rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
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
      padding: 0.28rem 0.65rem;
      border-radius: 9999px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
    }
    .hud-pill.danger {
      background: rgba(244, 63, 94, 0.12);
      border-color: rgba(244, 63, 94, 0.35);
      color: #fda4af;
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

    /* Main Workspace Split Layout */
    .workspace {
      position: relative;
      z-index: 1;
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* Tactical Mission Sidebar */
    .tactical-sidebar {
      width: 380px;
      background: rgba(10, 14, 28, 0.75);
      backdrop-filter: blur(12px);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(244,63,94,0.3) transparent;
    }
    .tactical-sidebar::-webkit-scrollbar { width: 5px; }
    .tactical-sidebar::-webkit-scrollbar-thumb { background: rgba(244,63,94,0.3); border-radius: 4px; }

    .sidebar-section {
      padding: 1.1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .section-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
      margin-bottom: 0.65rem;
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    /* Mission Target Box */
    .target-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 0.8rem;
    }
    .target-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.76rem;
      padding: 0.25rem 0;
      font-family: 'JetBrains Mono', monospace;
    }
    .target-key { color: var(--text-dim); }
    .target-val { color: var(--text-main); font-weight: 500; }
    .target-val.danger { color: var(--accent); }

    /* Objectives List */
    .obj-item {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      padding: 0.65rem 0.75rem;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 6px;
      margin-bottom: 0.5rem;
      font-size: 0.78rem;
      line-height: 1.45;
      color: var(--text-muted);
      transition: all 0.2s ease;
    }
    .obj-item:hover {
      border-color: rgba(244, 63, 94, 0.25);
      background: rgba(20, 28, 52, 0.7);
    }
    .obj-icon {
      color: var(--accent);
      font-size: 0.8rem;
      margin-top: 0.15rem;
    }

    /* Quick Injector Chips */
    .payload-chip-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .payload-chip {
      background: rgba(6, 9, 19, 0.85);
      border: 1px solid rgba(244, 63, 94, 0.22);
      border-radius: 6px;
      padding: 0.55rem 0.7rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }
    .payload-chip:hover {
      border-color: var(--accent);
      background: rgba(244, 63, 94, 0.08);
      transform: translateX(3px);
    }
    .chip-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.74rem;
      color: #fda4af;
      word-break: break-all;
    }
    .chip-action {
      font-size: 0.68rem;
      color: var(--accent);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      opacity: 0.8;
      flex-shrink: 0;
    }

    /* Terminal Pane */
    .terminal-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #020409;
      min-width: 0;
      position: relative;
    }
    .terminal-titlebar {
      height: 38px;
      background: rgba(13, 18, 33, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      user-select: none;
    }
    .term-dots {
      display: flex;
      gap: 6px;
    }
    .term-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .term-dot.r { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.5); }
    .term-dot.y { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
    .term-dot.g { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); }

    .term-tab-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.74rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .term-controls {
      display: flex;
      gap: 0.4rem;
    }
    .term-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      font-size: 0.7rem;
      padding: 0.25rem 0.55rem;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-family: 'JetBrains Mono', monospace;
      transition: all 0.2s ease;
    }
    .term-btn:hover {
      background: rgba(244, 63, 94, 0.15);
      border-color: var(--accent);
      color: #fff;
    }

    #terminal {
      flex: 1;
      padding: 0.6rem 0.8rem;
      overflow: hidden;
    }

    /* Victory Banner overlay */
    .victory-overlay {
      position: absolute;
      bottom: 20px;
      right: 20px;
      left: 20px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.35));
      border: 1px solid #10b981;
      box-shadow: 0 0 35px rgba(16, 185, 129, 0.35);
      border-radius: 10px;
      padding: 1rem 1.4rem;
      display: none;
      align-items: center;
      justify-content: space-between;
      backdrop-filter: blur(14px);
      z-index: 100;
      animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp {
      from { transform: translateY(40px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .victory-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .victory-icon {
      font-size: 1.8rem;
      color: #10b981;
      filter: drop-shadow(0 0 10px #10b981);
    }
    .victory-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
    }
    .victory-desc {
      font-size: 0.78rem;
      color: #a7f3d0;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 0.2rem;
    }
    .flag-box {
      background: rgba(0, 0, 0, 0.5);
      border: 1px dashed #10b981;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #34d399;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.7rem;
    }
    .copy-flag-btn {
      background: #10b981;
      color: #022c22;
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: background 0.2s;
    }
    .copy-flag-btn:hover { background: #34d399; }

    /* Toast notification */
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid var(--accent);
      color: #fff;
      padding: 0.6rem 1rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-family: 'JetBrains Mono', monospace;
      z-index: 200;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      transform: translateY(-20px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s ease;
    }
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>

  <!-- Cyber HUD Header -->
  <header class="hud-header">
    <div class="hud-branding">
      <div class="hud-badge-icon">
        <i class="fa-solid fa-shield-halved"></i>
      </div>
      <div class="hud-title-group">
        <h1>Privilege Escalation Lab <span style="font-size: 0.75rem; font-weight: 400; color: var(--accent);">(SUID & Sudoers)</span></h1>
        <p>EHSP DEFENSE MATRIX // HOST: node-privesc.local // TARGET: /root/flag.txt</p>
      </div>
    </div>
    <div class="hud-metadata">
      <div class="hud-pill danger">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>DIFFICULTY: HARD</span>
      </div>
      <div class="hud-pill">
        <i class="fa-solid fa-user-lock"></i>
        <span>IDENTITY: lowpriv (UID 1001)</span>
      </div>
      <div class="hud-pill success">
        <span class="status-dot"></span>
        <span>TERMINAL: ACTIVE</span>
      </div>
    </div>
  </header>

  <!-- Main Workspace -->
  <div class="workspace">
    <!-- Left Tactical Mission Dossier -->
    <aside class="tactical-sidebar">
      <div class="sidebar-section">
        <div class="section-label">
          <i class="fa-solid fa-crosshairs"></i> TARGET DOSSIER
        </div>
        <div class="target-card">
          <div class="target-row">
            <span class="target-key">TARGET NODE</span>
            <span class="target-val">127.0.0.1:5000</span>
          </div>
          <div class="target-row">
            <span class="target-key">INITIAL PRIVS</span>
            <span class="target-val danger">lowpriv (Unprivileged)</span>
          </div>
          <div class="target-row">
            <span class="target-key">TARGET USER</span>
            <span class="target-val" style="color:#10b981">root (UID 0)</span>
          </div>
          <div class="target-row">
            <span class="target-key">OBJECTIVE</span>
            <span class="target-val">Read /root/flag.txt</span>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-label">
          <i class="fa-solid fa-list-check"></i> MISSION CHECKLIST
        </div>
        <div class="obj-item">
          <i class="fa-solid fa-terminal obj-icon"></i>
          <div>Inspect initial credentials & environment (<code>whoami</code> & <code>id</code>)</div>
        </div>
        <div class="obj-item">
          <i class="fa-solid fa-magnifying-glass obj-icon"></i>
          <div>Scan filesystem for binaries with SUID bits enabled (<code>-perm -4000</code>)</div>
        </div>
        <div class="obj-item">
          <i class="fa-solid fa-key obj-icon"></i>
          <div>Query sudo privileges allowed without password (<code>sudo -l</code>)</div>
        </div>
        <div class="obj-item">
          <i class="fa-solid fa-unlock-keyhole obj-icon"></i>
          <div>Abuse privileged binary or GTFObin to access protected <code>/root/flag.txt</code></div>
        </div>
      </div>

      <div class="sidebar-section" style="border-bottom: none;">
        <div class="section-label">
          <i class="fa-solid fa-bolt"></i> QUICK INJECTOR CHIPS
        </div>
        <p style="font-size:0.72rem; color:var(--text-dim); margin-bottom:0.7rem;">Click any payload to inject and execute in the shell:</p>
        <div class="payload-chip-list">
          <div class="payload-chip" onclick="injectCmd('whoami && id')">
            <span class="chip-code">whoami && id</span>
            <span class="chip-action"><i class="fa-solid fa-play"></i> Run</span>
          </div>
          <div class="payload-chip" onclick="injectCmd('sudo -l')">
            <span class="chip-code">sudo -l</span>
            <span class="chip-action"><i class="fa-solid fa-play"></i> Run</span>
          </div>
          <div class="payload-chip" onclick="injectCmd('find / -perm -4000 2>/dev/null')">
            <span class="chip-code">find / -perm -4000 2>/dev/null</span>
            <span class="chip-action"><i class="fa-solid fa-play"></i> Run</span>
          </div>
          <div class="payload-chip" onclick="injectCmd('sudo /usr/local/sbin/suid-reader /root/flag.txt')">
            <span class="chip-code">sudo /usr/local/sbin/suid-reader /root/flag.txt</span>
            <span class="chip-action"><i class="fa-solid fa-play"></i> Run</span>
          </div>
          <div class="payload-chip" onclick="injectCmd('sudo find /root -name flag.txt -exec cat {} \\;')">
            <span class="chip-code">sudo find /root -name flag.txt -exec cat {} \\;</span>
            <span class="chip-action"><i class="fa-solid fa-play"></i> Run</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Terminal Frame -->
    <main class="terminal-container">
      <div class="terminal-titlebar">
        <div class="term-dots">
          <div class="term-dot r"></div>
          <div class="term-dot y"></div>
          <div class="term-dot g"></div>
        </div>
        <div class="term-tab-title">
          <i class="fa-solid fa-terminal" style="color:var(--accent);"></i>
          <span>bash // lowpriv@ehsp-lab: ~ (pts/0)</span>
        </div>
        <div class="term-controls">
          <button class="term-btn" onclick="clearTerm()"><i class="fa-solid fa-eraser"></i> Clear</button>
          <button class="term-btn" onclick="resetPrompt()"><i class="fa-solid fa-rotate-left"></i> Reset</button>
        </div>
      </div>

      <div id="terminal"></div>

      <!-- Victory Overlay Card -->
      <div id="victoryOverlay" class="victory-overlay">
        <div class="victory-content">
          <i class="fa-solid fa-trophy victory-icon"></i>
          <div>
            <div class="victory-title">ROOT PRIVILEGES COMPROMISED!</div>
            <div class="victory-desc">Flag captured from /root/flag.txt via authorized sudo escalation.</div>
          </div>
        </div>
        <div class="flag-box">
          <span id="capturedFlag">EHSP{...}</span>
          <button class="copy-flag-btn" onclick="copyFlag()"><i class="fa-regular fa-copy"></i> Copy Flag</button>
        </div>
      </div>
    </main>
  </div>

  <div id="toast" class="toast">
    <i class="fa-solid fa-circle-check" style="color:var(--accent);"></i>
    <span id="toastMsg">Command injected</span>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.min.js"></script>
  <script>
    let capturedFlagStr = '';

    const term = new Terminal({
      theme: {
        background: '#040711',
        foreground: '#e2e8f0',
        cursor: '#f43f5e',
        selectionBackground: 'rgba(244, 63, 94, 0.35)',
        black: '#0f172a',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#fb7185',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#e879f9',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff'
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13.5,
      lineHeight: 1.25,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1500
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal'));
    fitAddon.fit();
    window.addEventListener('resize', () => fitAddon.fit());

    // Banner intro
    term.writeln('\\x1b[1;31m╔═══════════════════════════════════════════════════════════════╗\\x1b[0m');
    term.writeln('\\x1b[1;31m║   EHSP CYBER LABS // PRIVILEGE ESCALATION VULNERABILITY MATRIX ║\\x1b[0m');
    term.writeln('\\x1b[1;31m╚═══════════════════════════════════════════════════════════════╝\\x1b[0m');
    term.writeln('\\x1b[90m[*] Session established to node: ehsp-privesc.local (pts/0)\\x1b[0m');
    term.writeln('\\x1b[90m[*] User: lowpriv (UID: 1001, GID: 1001) | Security: RESTRICTED SHELL\\x1b[0m');
    term.writeln('\\x1b[33m[!] Target Objective: Read protected asset /root/flag.txt\\x1b[0m');
    term.writeln('');

    let input = '';
    const PROMPT = '\\x1b[1;31mlowpriv@ehsp-lab\\x1b[0m:\\x1b[1;34m~\\x1b[0m$ ';
    function showPrompt() { term.write('\\r\\n' + PROMPT); }
    showPrompt();

    term.onKey(({key, domEvent}) => {
      const code = domEvent.keyCode;
      if (code === 13) {
        term.writeln('');
        if (input.trim()) execCmd(input.trim());
        else showPrompt();
        input = '';
      } else if (code === 8) {
        if (input.length > 0) { input = input.slice(0,-1); term.write('\\b \\b'); }
      } else if (key.length === 1) { 
        input += key; 
        term.write(key); 
      }
    });

    async function execCmd(cmd) {
      try {
        const res = await fetch('/exec', {
          method:'POST', 
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({cmd})
        });
        const data = await res.json();
        if (data.output) {
          data.output.split('\\n').forEach(line => {
            if (line.includes('EHSP{')) {
              term.writeln('\\x1b[1;32m' + line + '\\x1b[0m');
              const match = line.match(/EHSP\\{[^}]+\\}/);
              if (match) triggerVictory(match[0]);
            } else {
              term.writeln(line);
            }
          });
        }
        if (data.error) {
          term.writeln('\\x1b[33m' + data.error + '\\x1b[0m');
        }
      } catch (err) {
        term.writeln('\\x1b[31m[!] Communication Failure: ' + err.message + '\\x1b[0m');
      }
      showPrompt();
    }

    function injectCmd(cmd) {
      term.writeln(cmd);
      execCmd(cmd);
      showToast('Executed: ' + cmd);
    }

    function clearTerm() {
      term.clear();
      showPrompt();
    }

    function resetPrompt() {
      input = '';
      showPrompt();
    }

    function triggerVictory(flag) {
      capturedFlagStr = flag;
      document.getElementById('capturedFlag').innerText = flag;
      const overlay = document.getElementById('victoryOverlay');
      overlay.style.display = 'flex';
      showToast('Flag Captured: ' + flag);
    }

    function copyFlag() {
      if (!capturedFlagStr) return;
      navigator.clipboard.writeText(capturedFlagStr);
      showToast('Flag copied to clipboard!');
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toastMsg').innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2800);
    }
  </script>
</body>
</html>"""


@app.route("/exec", methods=["POST"])
def execute():
    body = request.get_json(silent=True) or {}
    raw_cmd = body.get("cmd", "").strip()
    if not raw_cmd:
        return jsonify({"output": "", "error": ""})

    parts = raw_cmd.split()
    cmd_name = parts[0]

    # Handle sudo commands
    if cmd_name == "sudo":
        if len(parts) < 2:
            return jsonify({"output": "", "error": "usage: sudo <command>"})
        if parts[1] == "-l":
            return jsonify({"output": "User lowpriv may run the following commands:\n  (root) NOPASSWD: /usr/local/sbin/suid-reader\n  (root) NOPASSWD: /usr/bin/find"})
        # Check if the command is in allowed sudo list
        sub_cmd = parts[1]
        if sub_cmd in SUDO_ALLOWED:
            try:
                result = subprocess.run(
                    raw_cmd.replace("sudo ", "", 1),
                    shell=True, capture_output=True, text=True, timeout=5
                )
                return jsonify({"output": result.stdout.rstrip(), "error": result.stderr.rstrip()})
            except Exception as e:
                return jsonify({"output": "", "error": str(e)})
        return jsonify({"output": "", "error": f"sudo: {sub_cmd}: command not allowed"})

    # Regular commands
    base = cmd_name.lstrip("/")
    if base not in ALLOWED:
        return jsonify({"output": "", "error": f"bash: {cmd_name}: command not found (or restricted)"})

    try:
        result = subprocess.run(
            raw_cmd, shell=True, capture_output=True, text=True, timeout=5, cwd="/home/lowpriv" if os.path.exists("/home/lowpriv") else "/tmp"
        )
        return jsonify({"output": result.stdout.rstrip(), "error": result.stderr.rstrip()})
    except subprocess.TimeoutExpired:
        return jsonify({"output": "", "error": "Command timed out"})
    except Exception as e:
        return jsonify({"output": "", "error": str(e)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
