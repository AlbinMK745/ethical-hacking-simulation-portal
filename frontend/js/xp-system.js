/**
 * XP & LEVEL SYSTEM UI COMPONENTS
 * Animated XP bar, level badge, rank title, XP toast, level-up modal
 * Drop-in: include this file in user.js or dashboard page
 */

// ── LEVEL CONFIG (mirrors backend) ──────────────────────────────────────────
const LEVEL_TABLE = [
    { minXp: 0,     level: 1,  title: "Script Kiddie",    color: "#6b7280" },
    { minXp: 100,   level: 2,  title: "Curious Hacker",   color: "#3b82f6" },
    { minXp: 250,   level: 3,  title: "Recon Agent",      color: "#06b6d4" },
    { minXp: 450,   level: 4,  title: "Packet Sniffer",   color: "#8b5cf6" },
    { minXp: 700,   level: 5,  title: "Exploit Dev",      color: "#ec4899" },
    { minXp: 1000,  level: 6,  title: "Shell Whisperer",  color: "#f97316" },
    { minXp: 1400,  level: 7,  title: "Root Hunter",      color: "#eab308" },
    { minXp: 1900,  level: 8,  title: "Zero-Day Seeker",  color: "#22c55e" },
    { minXp: 2500,  level: 9,  title: "Red Teamer",       color: "#ef4444" },
    { minXp: 3200,  level: 10, title: "Cyber Phantom",    color: "#a855f7" },
    { minXp: 4000,  level: 11, title: "Shadow Operator",  color: "#06b6d4" },
    { minXp: 5000,  level: 12, title: "Elite Hacker",     color: "#f59e0b" },
    { minXp: 6500,  level: 13, title: "Black-Hat Buster", color: "#dc2626" },
    { minXp: 8000,  level: 14, title: "Ghost Protocol",   color: "#7c3aed" },
    { minXp: 10000, level: 15, title: "LEGENDARY",        color: "#f97316" },
];

function getLevelInfo(xp) {
    let info = LEVEL_TABLE[0];
    for (let i = 0; i < LEVEL_TABLE.length; i++) {
        if (xp >= LEVEL_TABLE[i].minXp) {
            info = LEVEL_TABLE[i];
        } else break;
    }
    const nextEntry = LEVEL_TABLE[info.level] || LEVEL_TABLE[LEVEL_TABLE.length - 1];
    const xpInLevel  = xp - info.minXp;
    const xpNeeded   = nextEntry.minXp - info.minXp;
    const pct        = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
    return { ...info, xp, xpInLevel, xpNeeded, pct, nextTitle: nextEntry.title };
}

// ── INJECT XP BAR CSS ────────────────────────────────────────────────────────
(function injectXpStyles() {
    if (document.getElementById("xp-system-styles")) return;
    const style = document.createElement("style");
    style.id = "xp-system-styles";
    style.textContent = `
/* ─── XP Bar ─────────────────────────────────────────────────── */
.xp-bar-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    backdrop-filter: blur(8px);
}

.xp-level-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 54px;
    height: 54px;
    border-radius: 12px;
    font-weight: 900;
    font-size: 1.15rem;
    line-height: 1;
    letter-spacing: -0.5px;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    position: relative;
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1);
}
.xp-level-badge:hover { transform: scale(1.08); }
.xp-level-badge .lvl-num { font-size: 1.4rem; font-weight: 900; }
.xp-level-badge .lvl-lbl { font-size: 0.55rem; font-weight: 600; letter-spacing: 1px; opacity: 0.85; }

.xp-bar-info { flex: 1; min-width: 0; }

.xp-bar-titles {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}
.xp-rank-title {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}
.xp-bar-nums {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.45);
    font-variant-numeric: tabular-nums;
}

.xp-bar-track {
    height: 8px;
    background: rgba(255,255,255,0.08);
    border-radius: 99px;
    overflow: hidden;
    position: relative;
}
.xp-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 1.2s cubic-bezier(.22,1,.36,1);
    position: relative;
    overflow: hidden;
}
.xp-bar-fill::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
    animation: xp-shine 2.5s ease-in-out infinite;
}
@keyframes xp-shine {
    0%   { transform: translateX(-100%); }
    60%  { transform: translateX(200%); }
    100% { transform: translateX(200%); }
}
.xp-bar-fill.level-max { background: linear-gradient(90deg, #f97316, #fbbf24) !important; }

/* ─── XP Toast ───────────────────────────────────────────────── */
.xp-toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
}
.xp-toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.15);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: xp-toast-in 0.4s cubic-bezier(.34,1.56,.64,1) forwards,
               xp-toast-out 0.4s ease-in 3.6s forwards;
    pointer-events: all;
}
@keyframes xp-toast-in {
    from { opacity:0; transform: translateX(60px) scale(0.9); }
    to   { opacity:1; transform: translateX(0) scale(1); }
}
@keyframes xp-toast-out {
    from { opacity:1; transform: translateX(0) scale(1); }
    to   { opacity:0; transform: translateX(60px) scale(0.9); }
}
.xp-toast .xp-amount { font-size: 1.05rem; font-weight: 900; }

/* ─── Level-Up Modal ─────────────────────────────────────────── */
.lvlup-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(6px);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fade-in 0.3s ease;
}
@keyframes fade-in { from{opacity:0} to{opacity:1} }

.lvlup-card {
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px;
    padding: 48px 40px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    position: relative;
    overflow: hidden;
    animation: lvlup-pop 0.5s cubic-bezier(.34,1.56,.64,1);
}
@keyframes lvlup-pop {
    from { opacity:0; transform:scale(0.7) rotateX(20deg); }
    to   { opacity:1; transform:scale(1) rotateX(0); }
}
.lvlup-card::before {
    content:'';
    position:absolute; inset:0;
    background: radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 70%);
}
.lvlup-badge {
    width: 100px; height: 100px;
    border-radius: 50%;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: 900;
    color: #fff;
    position: relative;
    box-shadow: 0 0 40px rgba(139,92,246,0.6);
    animation: badge-pulse 1.5s ease-in-out infinite alternate;
}
@keyframes badge-pulse {
    from { box-shadow: 0 0 20px rgba(139,92,246,0.4); }
    to   { box-shadow: 0 0 60px rgba(139,92,246,0.9); }
}
.lvlup-title { font-size: 2rem; font-weight: 900; color:#fff; margin-bottom: 6px; }
.lvlup-rank  { font-size: 1rem; font-weight: 600; margin-bottom: 24px; }
.lvlup-close {
    padding: 12px 32px;
    border-radius: 10px;
    border: none;
    font-size: 0.95rem;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.2s;
}
.lvlup-close:hover { opacity: 0.85; }

/* ─── Confetti particles ─────────────────────────────────────── */
.confetti-particle {
    position: fixed;
    width: 8px; height: 8px;
    border-radius: 2px;
    pointer-events: none;
    z-index: 100001;
    animation: confetti-fall var(--dur, 2s) ease-in var(--delay, 0s) forwards;
}
@keyframes confetti-fall {
    0%   { opacity:1; transform: translateY(-20px) rotate(0deg); }
    100% { opacity:0; transform: translateY(100vh) rotate(720deg); }
}
    `;
    document.head.appendChild(style);
})();

// ── ENSURE TOAST CONTAINER ───────────────────────────────────────────────────
function getToastContainer() {
    let c = document.getElementById("xp-toast-container");
    if (!c) {
        c = document.createElement("div");
        c.id = "xp-toast-container";
        c.className = "xp-toast-container";
        document.body.appendChild(c);
    }
    return c;
}

// ── SHOW XP TOAST ────────────────────────────────────────────────────────────
function showXpToast(amount, reason = "") {
    const container = getToastContainer();
    const toast = document.createElement("div");
    toast.className = "xp-toast";
    toast.style.background = amount > 0
        ? "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15))"
        : "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))";
    const sign = amount > 0 ? "+" : "";
    const icon = amount > 0 ? "⚡" : "⬇️";
    toast.innerHTML = `
        <span style="font-size:1.4rem">${icon}</span>
        <div>
            <div class="xp-amount">${sign}${amount} XP</div>
            ${reason ? `<div style="font-size:0.75rem;opacity:0.7">${reason}</div>` : ""}
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
}

// ── CONFETTI BURST ───────────────────────────────────────────────────────────
function fireConfetti() {
    const colors = ["#f97316","#8b5cf6","#22c55e","#ec4899","#06b6d4","#fbbf24"];
    for (let i = 0; i < 60; i++) {
        const p = document.createElement("div");
        p.className = "confetti-particle";
        p.style.setProperty("--dur",   `${1.5 + Math.random() * 1.5}s`);
        p.style.setProperty("--delay", `${Math.random() * 0.5}s`);
        p.style.left  = `${Math.random() * 100}vw`;
        p.style.top   = `${-10 + Math.random() * 10}px`;
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 3500);
    }
}

// ── LEVEL-UP MODAL ───────────────────────────────────────────────────────────
function showLevelUpModal(levelInfo) {
    fireConfetti();
    const overlay = document.createElement("div");
    overlay.className = "lvlup-overlay";
    overlay.innerHTML = `
        <div class="lvlup-card">
            <div class="lvlup-badge" style="background: linear-gradient(135deg, ${levelInfo.color}, #7c3aed);">
                ${levelInfo.level}
            </div>
            <div class="lvlup-title">LEVEL UP! 🎉</div>
            <div class="lvlup-rank" style="color:${levelInfo.color}">${levelInfo.title}</div>
            <p style="color:rgba(255,255,255,0.6);font-size:0.88rem;margin-bottom:28px">
                You've reached Level ${levelInfo.level}.<br>
                Next: <strong style="color:#fff">${levelInfo.nextTitle}</strong> at ${levelInfo.nextStart?.toLocaleString()} XP
            </p>
            <button class="lvlup-close" style="background:linear-gradient(135deg,${levelInfo.color},#7c3aed)"
                    onclick="this.closest('.lvlup-overlay').remove()">
                Keep Hacking →
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// ── RENDER XP BAR ────────────────────────────────────────────────────────────
/**
 * Renders an animated XP bar into `containerId`.
 * @param {string} containerId - DOM element ID to render into
 * @param {number} xp          - Total XP
 */
function renderXpBar(containerId, xp) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const info = getLevelInfo(xp);
    const isMax = info.level >= 15;

    el.innerHTML = `
        <div class="xp-bar-wrapper" id="xp-bar-inner">
            <div class="xp-level-badge"
                 style="background: linear-gradient(135deg, ${info.color}, #1a1a2e);"
                 title="${info.title}">
                <span class="lvl-num">${info.level}</span>
                <span class="lvl-lbl">LVL</span>
            </div>
            <div class="xp-bar-info">
                <div class="xp-bar-titles">
                    <span class="xp-rank-title" style="color:${info.color}">${info.title}</span>
                    <span class="xp-bar-nums">${info.xp.toLocaleString()} XP</span>
                </div>
                <div class="xp-bar-track">
                    <div class="xp-bar-fill ${isMax ? 'level-max' : ''}"
                         id="xp-bar-fill-el"
                         style="width:0%;background:linear-gradient(90deg,${info.color},${info.color}88);">
                    </div>
                </div>
                <div class="xp-bar-titles" style="margin-top:4px">
                    <span class="xp-bar-nums">${isMax ? "MAX LEVEL" : `${info.xpInLevel} / ${info.xpNeeded} XP to ${info.nextTitle}`}</span>
                    <span class="xp-bar-nums">${isMax ? "🏆" : `${info.pct}%`}</span>
                </div>
            </div>
        </div>
    `;

    // Animate fill after paint
    requestAnimationFrame(() => {
        setTimeout(() => {
            const fill = document.getElementById("xp-bar-fill-el");
            if (fill) fill.style.width = `${info.pct}%`;
        }, 80);
    });
}

// ── HANDLE XP RESULT FROM API ─────────────────────────────────────────────────
/**
 * Call this after any API response that includes an `xp` field.
 * @param {object} xpResult - The `xp` field from challenge submit / daily / etc.
 * @param {string} [xpBarId] - Optional container ID to refresh XP bar
 */
function handleXpResult(xpResult, xpBarId = null) {
    if (!xpResult) return;

    // Show XP toast
    if (xpResult.xp_gained > 0) {
        const reasonMap = {
            challenge_solved: "Challenge Solved",
            daily_challenge:  "Daily Challenge",
            tutorial_complete:"Tutorial Completed",
            daily_login:      "Daily Login Bonus",
            streak_bonus:     "Streak Milestone!",
        };
        showXpToast(xpResult.xp_gained, reasonMap[xpResult.level_info?.title] || "XP Earned");
    }

    // Level up!
    if (xpResult.leveled_up && xpResult.level_info) {
        setTimeout(() => showLevelUpModal(xpResult.level_info), 800);
    }

    // Refresh bar
    if (xpBarId && xpResult.new_xp !== undefined) {
        setTimeout(() => renderXpBar(xpBarId, xpResult.new_xp), 200);
    }
}

// ── FETCH & RENDER XP BAR FROM API ───────────────────────────────────────────
async function loadAndRenderXpBar(containerId, userId) {
    try {
        const data = await fetch("/xp/summary", {
            headers: { "user-id": String(userId) }
        }).then(r => r.json());
        renderXpBar(containerId, data.xp || 0);
    } catch (e) {
        console.warn("[XP Bar] Could not load XP data:", e);
    }
}

// Export for use in other scripts
window.XpSystem = {
    getLevelInfo,
    renderXpBar,
    loadAndRenderXpBar,
    showXpToast,
    showLevelUpModal,
    handleXpResult,
    fireConfetti,
};
