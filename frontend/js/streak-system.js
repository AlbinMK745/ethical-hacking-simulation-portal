/**
 * STREAK SYSTEM UI COMPONENT
 * Daily login streak tracker with flame animation, shields, and milestone rewards
 * Included in dashboard-view.jsx and profile-view.jsx
 */

/* ── Streak CSS ── */
(function injectStreakStyles() {
    if (document.getElementById("streak-system-styles")) return;
    const style = document.createElement("style");
    style.id = "streak-system-styles";
    style.textContent = `

/* ── Streak Card ────────────────────────────────────────────── */
.streak-card {
    background: linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,179,8,0.08));
    border: 1px solid rgba(249,115,22,0.25);
    border-radius: 16px;
    padding: 18px 20px;
    position: relative;
    overflow: hidden;
}
.streak-card::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at top right, rgba(249,115,22,0.15), transparent 70%);
    pointer-events: none;
}

.streak-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}
.streak-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(255,255,255,0.6);
}

/* ── Flame Number ───────────────────────────────────────────── */
.streak-count-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
}
.streak-flame-icon {
    font-size: 2.2rem;
    line-height: 1;
    animation: flame-flicker 1.8s ease-in-out infinite alternate;
    filter: drop-shadow(0 0 8px rgba(249,115,22,0.8));
}
@keyframes flame-flicker {
    0%   { transform: scale(1)   rotate(-2deg); opacity: 0.9; }
    50%  { transform: scale(1.1) rotate(2deg);  opacity: 1;   }
    100% { transform: scale(1)   rotate(-1deg); opacity: 0.95;}
}
.streak-number {
    font-size: 2.8rem;
    font-weight: 900;
    color: #f97316;
    line-height: 1;
    text-shadow: 0 0 20px rgba(249,115,22,0.5);
}
.streak-label {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.45);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* ── 7-day Dots ─────────────────────────────────────────────── */
.streak-dots {
    display: flex;
    gap: 7px;
    margin-bottom: 14px;
}
.streak-dot {
    flex: 1;
    height: 6px;
    border-radius: 99px;
    background: rgba(255,255,255,0.1);
    position: relative;
    overflow: hidden;
    transition: background 0.4s;
}
.streak-dot.filled {
    background: linear-gradient(90deg, #f97316, #fbbf24);
    box-shadow: 0 0 6px rgba(249,115,22,0.5);
}
.streak-dot.filled::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: dot-shine 2s ease-in-out infinite;
}
@keyframes dot-shine {
    0%   { transform: translateX(-100%); }
    60%  { transform: translateX(200%); }
    100% { transform: translateX(200%); }
}
.streak-dot-labels {
    display: flex;
    gap: 7px;
    margin-bottom: 14px;
    margin-top: -10px;
}
.streak-dot-label {
    flex: 1;
    text-align: center;
    font-size: 0.55rem;
    color: rgba(255,255,255,0.3);
    font-weight: 600;
    text-transform: uppercase;
}

/* ── Shields ────────────────────────────────────────────────── */
.streak-shields {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
}
.streak-shield-icon {
    font-size: 0.9rem;
    filter: drop-shadow(0 0 4px rgba(99,102,241,0.8));
}
.streak-shield-count {
    font-weight: 700;
    color: #818cf8;
}

/* ── Next Milestone ─────────────────────────────────────────── */
.streak-milestone-bar {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.4);
}
.streak-milestone-track {
    flex: 1;
    height: 4px;
    background: rgba(255,255,255,0.08);
    border-radius: 99px;
    overflow: hidden;
}
.streak-milestone-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, #f97316, #fbbf24);
    transition: width 1s cubic-bezier(.22,1,.36,1);
}

/* ── Streak lost toast ──────────────────────────────────────── */
.streak-reset-toast {
    background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1));
    border: 1px solid rgba(239,68,68,0.3);
}
    `;
    document.head.appendChild(style);
})();
