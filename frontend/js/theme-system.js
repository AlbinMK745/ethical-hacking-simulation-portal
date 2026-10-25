/**
 * THEME SYSTEM — Dark / Light / Hacker (Matrix Green)
 * =====================================================
 * Injects CSS variable overrides per theme onto :root
 * Persists selection in localStorage
 * Renders a floating theme toggle button + picker panel
 */

const THEMES = {
    dark: {
        name: "Dark",
        icon: "🌑",
        vars: {
            "--bg-dark":       "#050505",
            "--panel-bg":      "#0f1012",
            "--border-color":  "#1f2229",
            "--primary-cyan":  "#00ffbf",
            "--secondary-blue":"#00d2ff",
            "--text-main":     "#e0e0e0",
            "--text-muted":    "#888",
            "--sidebar-bg":    "#04080d",
            "--topbar-bg":     "#060a10",
            "--main-bg":       "#05080d",
            "--card-bg":       "rgba(15,16,18,0.6)",
            "--accent":        "#00d2ff",
            "--accent-glow":   "rgba(0,210,255,0.3)",
            "--scrollbar":     "#333",
        }
    },
    light: {
        name: "Light",
        icon: "☀️",
        vars: {
            "--bg-dark":       "#f0f4f8",
            "--panel-bg":      "#ffffff",
            "--border-color":  "#dde3ea",
            "--primary-cyan":  "#0077cc",
            "--secondary-blue":"#0055aa",
            "--text-main":     "#1a1a2e",
            "--text-muted":    "#666",
            "--sidebar-bg":    "#ffffff",
            "--topbar-bg":     "#ffffff",
            "--main-bg":       "#f0f4f8",
            "--card-bg":       "rgba(255,255,255,0.9)",
            "--accent":        "#0055aa",
            "--accent-glow":   "rgba(0,85,170,0.2)",
            "--scrollbar":     "#ccc",
        }
    },
    hacker: {
        name: "Hacker",
        icon: "💻",
        vars: {
            "--bg-dark":       "#000000",
            "--panel-bg":      "#001100",
            "--border-color":  "#003300",
            "--primary-cyan":  "#00ff41",
            "--secondary-blue":"#00cc33",
            "--text-main":     "#00ff41",
            "--text-muted":    "#006600",
            "--sidebar-bg":    "#000500",
            "--topbar-bg":     "#000800",
            "--main-bg":       "#000300",
            "--card-bg":       "rgba(0,20,0,0.85)",
            "--accent":        "#00ff41",
            "--accent-glow":   "rgba(0,255,65,0.25)",
            "--scrollbar":     "#003300",
        }
    }
};

// ── Inject theme CSS overrides ────────────────────────────────────────────────
function applyTheme(themeKey) {
    const theme = THEMES[themeKey] || THEMES.dark;
    const root  = document.documentElement;

    Object.entries(theme.vars).forEach(([prop, val]) => {
        root.style.setProperty(prop, val);
    });

    // Extra overrides for light mode readability
    if (themeKey === "light") {
        root.style.setProperty("--card-border", "1px solid #dde3ea");
        document.body.classList.add("theme-light");
        document.body.classList.remove("theme-hacker");
    } else if (themeKey === "hacker") {
        root.style.setProperty("--card-border", "1px solid #003300");
        document.body.classList.add("theme-hacker");
        document.body.classList.remove("theme-light");
        injectHackerEffects();
    } else {
        document.body.classList.remove("theme-light", "theme-hacker");
        removeHackerEffects();
    }

    localStorage.setItem("ehsp-theme", themeKey);
    window._currentTheme = themeKey;
    updateThemeButton(themeKey);
}

// ── Matrix rain effect for Hacker theme ──────────────────────────────────────
let matrixCanvas = null;
let matrixAnim   = null;

function injectHackerEffects() {
    if (matrixCanvas) return;

    // Scanline overlay
    let scanline = document.getElementById("scanline-overlay");
    if (!scanline) {
        scanline = document.createElement("div");
        scanline.id = "scanline-overlay";
        scanline.style.cssText = `
            position:fixed; inset:0; pointer-events:none; z-index:9998;
            background: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0,255,65,0.015) 2px,
                rgba(0,255,65,0.015) 4px
            );
        `;
        document.body.appendChild(scanline);
    }

    // Matrix canvas (subtle, behind content)
    matrixCanvas = document.createElement("canvas");
    matrixCanvas.id = "matrix-canvas";
    matrixCanvas.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        pointer-events:none; z-index:0; opacity:0.04;
    `;
    document.body.insertBefore(matrixCanvas, document.body.firstChild);

    const ctx = matrixCanvas.getContext("2d");
    matrixCanvas.width  = window.innerWidth;
    matrixCanvas.height = window.innerHeight;

    const cols = Math.floor(matrixCanvas.width / 20);
    const drops = Array(cols).fill(1);

    function drawMatrix() {
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        ctx.fillStyle = "#00ff41";
        ctx.font = "15px monospace";

        drops.forEach((y, i) => {
            const char = String.fromCharCode(0x30A0 + Math.random() * 96);
            ctx.fillText(char, i * 20, y * 20);
            if (y * 20 > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
        matrixAnim = requestAnimationFrame(drawMatrix);
    }
    drawMatrix();
}

function removeHackerEffects() {
    const scanline = document.getElementById("scanline-overlay");
    if (scanline) scanline.remove();
    if (matrixCanvas) {
        cancelAnimationFrame(matrixAnim);
        matrixCanvas.remove();
        matrixCanvas = null;
        matrixAnim   = null;
    }
}

// ── Inject Theme Toggle Button UI ─────────────────────────────────────────────
function injectThemeStyles() {
    if (document.getElementById("theme-toggle-styles")) return;
    const s = document.createElement("style");
    s.id = "theme-toggle-styles";
    s.textContent = `
/* ── Theme Toggle Button (topbar inline) ─────────────── */
#theme-toggle-btn {
    position: relative;
    z-index: 10;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(0,210,255,0.25);
    background: rgba(0,210,255,0.06);
    color: var(--accent, #00d2ff);
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s, background 0.2s;
    flex-shrink: 0;
}
#theme-toggle-btn:hover {
    background: rgba(0,210,255,0.15);
    border-color: rgba(0,210,255,0.55);
    box-shadow: 0 0 14px rgba(0,210,255,0.3);
    transform: rotate(20deg) scale(1.08);
}

/* ── Theme Picker Panel (drops down from topbar) ─────── */
#theme-picker {
    position: fixed;
    top: 60px;
    right: 160px;
    z-index: 9999;
    background: var(--panel-bg, #0f1012);
    border: 1px solid var(--border-color, #1f2229);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
    animation: picker-in 0.25s cubic-bezier(.34,1.56,.64,1);
    min-width: 160px;
}
@keyframes picker-in {
    from { opacity:0; transform:translateY(10px) scale(0.9); }
    to   { opacity:1; transform:translateY(0) scale(1); }
}
.theme-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-muted, #888);
    transition: background 0.2s, color 0.2s;
    border: 1px solid transparent;
}
.theme-option:hover {
    background: rgba(255,255,255,0.07);
    color: var(--text-main, #e0e0e0);
}
.theme-option.active {
    background: rgba(0,210,255,0.1);
    color: var(--accent, #00d2ff);
    border-color: var(--accent, #00d2ff);
}
.theme-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
}

/* ── Light theme body overrides ──────────────────────── */
body.theme-light .sidebar { background: #ffffff !important; }
body.theme-light .topbar  { background: #ffffff !important; }
body.theme-light .main-content { background: #f0f4f8 !important; }
body.theme-light .dash-card {
    background: rgba(255,255,255,0.95) !important;
    border-color: #dde3ea !important;
    color: #1a1a2e !important;
}
body.theme-light .dash-card h2,
body.theme-light .dash-card h3,
body.theme-light .dash-card h4 { color: #1a1a2e !important; }
body.theme-light .sidebar-nav a { color: #444 !important; }
body.theme-light .sidebar-nav a:hover,
body.theme-light .sidebar-nav a.active { color: #0055aa !important; }
body.theme-light ::-webkit-scrollbar-thumb { background: #ccc !important; }
body.theme-light .topbar { border-bottom: 1px solid #dde3ea !important; }

/* ── Hacker theme body overrides ─────────────────────── */
body.theme-hacker * { font-family: 'Courier New', monospace !important; }
body.theme-hacker .dash-card {
    background: rgba(0,20,0,0.9) !important;
    border-color: #003300 !important;
}
body.theme-hacker .sidebar { background: #000500 !important; border-right-color: #003300 !important; }
body.theme-hacker .topbar  { background: #000800 !important; border-bottom-color: #003300 !important; }
body.theme-hacker .main-content { background: #000300 !important; }
body.theme-hacker h1, body.theme-hacker h2,
body.theme-hacker h3, body.theme-hacker h4 { color: #00ff41 !important; }
body.theme-hacker .topbar h1 { text-shadow: 0 0 10px #00ff41 !important; }
    `;
    document.head.appendChild(s);
}

// ── Render toggle button ──────────────────────────────────────────────────────
function updateThemeButton(themeKey) {
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) btn.textContent = THEMES[themeKey]?.icon || "🎨";
}

function renderThemeToggle() {
    injectThemeStyles();

    // Inject into .top-actions (next to bell) — wait for DOM
    function tryInject() {
        if (document.getElementById("theme-toggle-btn")) {
            // Already injected, just apply saved theme
            const saved = localStorage.getItem("ehsp-theme") || "dark";
            applyTheme(saved);
            return;
        }
        const topActions = document.querySelector(".top-actions");
        if (!topActions) {
            // React hasn't rendered yet — retry
            setTimeout(tryInject, 100);
            return;
        }
        const btn = document.createElement("button");
        btn.id = "theme-toggle-btn";
        btn.title = "Change Theme";
        btn.textContent = "🎨";
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const existing = document.getElementById("theme-picker");
            if (existing) { existing.remove(); return; }
            // Position picker below the button
            const rect = btn.getBoundingClientRect();
            renderThemePicker(rect);
        });
        // Insert as first child of top-actions (before the bell)
        topActions.insertBefore(btn, topActions.firstChild);

        const saved = localStorage.getItem("ehsp-theme") || "dark";
        applyTheme(saved);
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        tryInject();
    } else {
        document.addEventListener("DOMContentLoaded", tryInject);
    }
}

function renderThemePicker(anchorRect) {
    const current = localStorage.getItem("ehsp-theme") || "dark";

    const panel = document.createElement("div");
    panel.id = "theme-picker";

    // Position below the anchor button
    if (anchorRect) {
        panel.style.top  = (anchorRect.bottom + 8) + "px";
        panel.style.left = anchorRect.left + "px";
        panel.style.right = "auto";
    }

    const label = document.createElement("div");
    label.textContent = "Choose Theme";
    label.style.cssText = "font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:0.5;margin-bottom:4px;";
    panel.appendChild(label);

    const themeColors = { dark: "#00d2ff", light: "#0055aa", hacker: "#00ff41" };

    Object.entries(THEMES).forEach(([key, t]) => {
        const opt = document.createElement("div");
        opt.className = `theme-option ${key === current ? "active" : ""}`;
        opt.innerHTML = `
            <div class="theme-dot" style="background:${themeColors[key]};box-shadow:0 0 6px ${themeColors[key]};"></div>
            <span style="font-size:1rem">${t.icon}</span>
            <span>${t.name}</span>
            ${key === current ? '<span style="margin-left:auto;font-size:0.7rem;opacity:0.6;">✓</span>' : ""}
        `;
        opt.addEventListener("click", () => { applyTheme(key); panel.remove(); });
        panel.appendChild(opt);
    });

    document.body.appendChild(panel);

    setTimeout(() => {
        document.addEventListener("click", function closer(e) {
            if (!panel.contains(e.target) && e.target.id !== "theme-toggle-btn") {
                panel.remove();
                document.removeEventListener("click", closer);
            }
        });
    }, 50);
}

// ── Auto-init on DOM ready ────────────────────────────────────────────────────
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderThemeToggle);
} else {
    renderThemeToggle();
}

// Expose API
window.ThemeSystem = { applyTheme, THEMES, renderThemeToggle };
