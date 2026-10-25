/**
 * ONBOARDING FLOW — First-time User Tour
 * ========================================
 * A guided, step-by-step spotlight overlay that walks new users
 * through the portal's key features on first login.
 *
 * Usage: OnboardingFlow.start()  — call after dashboard renders
 * Auto-triggered once per user (localStorage flag)
 */

const OnboardingFlow = (function () {

    const STEPS = [
        {
            target:  null,                       // null = centered modal (no spotlight)
            title:   "Welcome to EHSP! 👋",
            body:    "You've joined the Ethical Hacking Simulation Portal. Let us give you a quick tour so you know exactly where everything is.",
            icon:    "🛡️",
            btnText: "Let's Go!",
        },
        {
            target:  '[data-nav="dashboard"]',
            title:   "Your Dashboard",
            body:    "This is your home base. See your XP, level, streak, and daily challenge all in one glance.",
            icon:    "🏠",
            btnText: "Next →",
            position: "right",
        },
        {
            target:  '[data-nav="challenges"]',
            title:   "Challenges",
            body:    "Solve real hacking challenges across SQL Injection, XSS, Buffer Overflow, and more. Submit the correct flag to earn XP.",
            icon:    "🎯",
            btnText: "Next →",
            position: "right",
        },
        {
            target:  '[data-nav="tutorials"]',
            title:   "Tutorials & Learning",
            body:    "Study structured modules on offensive security topics. Track your reading progress and earn XP for completions.",
            icon:    "📚",
            btnText: "Next →",
            position: "right",
        },
        {
            target:  '[data-nav="daily-challenge"]',
            title:   "Daily Challenge",
            body:    "A new challenge every day! Complete it to earn bonus XP and maintain your streak. Don't break the chain! 🔥",
            icon:    "📅",
            btnText: "Next →",
            position: "right",
        },
        {
            target:  '[data-nav="leaderboard"]',
            title:   "Leaderboard",
            body:    "Compete with other hackers globally. Earn XP, climb the ranks, and prove you're the best.",
            icon:    "🏆",
            btnText: "Next →",
            position: "right",
        },
        {
            target:  "#theme-toggle-btn",
            title:   "Theme Switcher 🎨",
            body:    "Click the button in the bottom-left to switch between Dark, Light, and the legendary Hacker (Matrix) theme.",
            icon:    "🎨",
            btnText: "Next →",
            position: "top",
        },
        {
            target:  null,
            title:   "You're All Set! 🚀",
            body:    "Start with the Daily Challenge to earn your first XP and build your streak. Good luck, hacker.",
            icon:    "⚡",
            btnText: "Start Hacking!",
        },
    ];

    let currentStep = 0;
    let overlay     = null;
    let spotlight   = null;
    let card        = null;

    // ── Inject CSS ────────────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById("onboarding-styles")) return;
        const s = document.createElement("style");
        s.id = "onboarding-styles";
        s.textContent = `
/* ─── Onboarding Overlay ─────────────────────────────── */
#onboarding-overlay {
    position: fixed; inset: 0;
    z-index: 100000;
    pointer-events: none;
}

/* Dark mask with hole cut out by spotlight */
#onboarding-mask {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(2px);
    transition: all 0.4s ease;
}

/* Spotlight highlight box */
#onboarding-spotlight {
    position: absolute;
    border-radius: 12px;
    box-shadow:
        0 0 0 4000px rgba(0,0,0,0.72),
        0 0 0 3px rgba(0,210,255,0.8),
        0 0 30px rgba(0,210,255,0.5);
    transition: all 0.45s cubic-bezier(.22,1,.36,1);
    pointer-events: none;
    z-index: 100001;
}

/* Tour card */
#onboarding-card {
    position: absolute;
    background: linear-gradient(135deg, #0a0e14 0%, #12182a 100%);
    border: 1px solid rgba(0,210,255,0.35);
    border-radius: 18px;
    padding: 28px 30px;
    max-width: 340px;
    width: 90%;
    box-shadow:
        0 24px 60px rgba(0,0,0,0.7),
        0 0 0 1px rgba(0,210,255,0.1);
    pointer-events: all;
    z-index: 100002;
    transition: all 0.45s cubic-bezier(.22,1,.36,1);
    animation: card-pop 0.4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes card-pop {
    from { opacity:0; transform: scale(0.88); }
    to   { opacity:1; transform: scale(1); }
}

.ob-icon {
    font-size: 2.2rem;
    margin-bottom: 12px;
    display: block;
}
.ob-title {
    font-size: 1.25rem;
    font-weight: 900;
    color: #fff;
    margin-bottom: 10px;
    line-height: 1.2;
}
.ob-body {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.65);
    line-height: 1.6;
    margin-bottom: 22px;
}

.ob-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.ob-dots {
    display: flex;
    gap: 5px;
    flex: 1;
}
.ob-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    transition: all 0.3s;
}
.ob-dot.active {
    background: #00d2ff;
    width: 18px;
    border-radius: 99px;
    box-shadow: 0 0 6px rgba(0,210,255,0.6);
}

.ob-skip {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
    cursor: pointer;
    background: none;
    border: none;
    padding: 4px 8px;
    border-radius: 6px;
    transition: color 0.2s;
    pointer-events: all;
}
.ob-skip:hover { color: rgba(255,255,255,0.6); }

.ob-next {
    padding: 10px 22px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #00d2ff, #00ffbf);
    color: #050505;
    font-weight: 800;
    font-size: 0.88rem;
    cursor: pointer;
    pointer-events: all;
    transition: transform 0.2s, box-shadow 0.2s;
    white-space: nowrap;
}
.ob-next:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,210,255,0.4);
}

/* Step counter */
.ob-step-count {
    font-size: 0.68rem;
    color: rgba(255,255,255,0.3);
    font-variant-numeric: tabular-nums;
    margin-bottom: 6px;
}
        `;
        document.head.appendChild(s);
    }

    // ── Position card near target ──────────────────────────────────────────────
    function positionCard(targetEl, position = "right") {
        if (!targetEl || !card) return;

        const rect   = targetEl.getBoundingClientRect();
        const cW     = card.offsetWidth  || 340;
        const cH     = card.offsetHeight || 220;
        const margin = 18;
        const vW     = window.innerWidth;
        const vH     = window.innerHeight;

        let top, left;

        if (position === "right") {
            top  = Math.max(margin, Math.min(rect.top + rect.height / 2 - cH / 2, vH - cH - margin));
            left = Math.min(rect.right + margin, vW - cW - margin);
        } else if (position === "left") {
            top  = Math.max(margin, Math.min(rect.top + rect.height / 2 - cH / 2, vH - cH - margin));
            left = Math.max(margin, rect.left - cW - margin);
        } else if (position === "top") {
            top  = Math.max(margin, rect.top - cH - margin);
            left = Math.max(margin, Math.min(rect.left + rect.width / 2 - cW / 2, vW - cW - margin));
        } else {
            top  = Math.min(rect.bottom + margin, vH - cH - margin);
            left = Math.max(margin, Math.min(rect.left + rect.width / 2 - cW / 2, vW - cW - margin));
        }

        card.style.top  = `${top}px`;
        card.style.left = `${left}px`;
    }

    function centerCard() {
        if (!card) return;
        card.style.top  = "50%";
        card.style.left = "50%";
        card.style.transform = "translate(-50%, -50%)";
    }

    // ── Render a step ─────────────────────────────────────────────────────────
    function showStep(index) {
        if (!overlay) return;
        const step      = STEPS[index];
        const isLast    = index === STEPS.length - 1;
        const targetEl  = step.target ? document.querySelector(step.target) : null;

        // Update spotlight
        if (spotlight) {
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const pad  = 8;
                spotlight.style.display = "block";
                spotlight.style.top     = `${rect.top  - pad}px`;
                spotlight.style.left    = `${rect.left - pad}px`;
                spotlight.style.width   = `${rect.width  + pad * 2}px`;
                spotlight.style.height  = `${rect.height + pad * 2}px`;
            } else {
                spotlight.style.display = "none";
            }
        }

        // Update card content
        const dots = STEPS.map((_, i) =>
            `<div class="ob-dot ${i === index ? "active" : ""}"></div>`
        ).join("");

        card.style.transform = "";
        card.innerHTML = `
            <div class="ob-step-count">${index + 1} of ${STEPS.length}</div>
            <span class="ob-icon">${step.icon}</span>
            <div class="ob-title">${step.title}</div>
            <div class="ob-body">${step.body}</div>
            <div class="ob-footer">
                <div class="ob-dots">${dots}</div>
                ${!isLast ? `<button class="ob-skip" id="ob-skip-btn">Skip tour</button>` : ""}
                <button class="ob-next" id="ob-next-btn">${step.btnText}</button>
            </div>
        `;

        // Position
        if (targetEl) {
            setTimeout(() => positionCard(targetEl, step.position || "right"), 50);
        } else {
            centerCard();
        }

        // Bind buttons
        document.getElementById("ob-next-btn")?.addEventListener("click", () => {
            if (isLast) finish();
            else { currentStep++; showStep(currentStep); }
        });
        document.getElementById("ob-skip-btn")?.addEventListener("click", finish);
    }

    // ── Create overlay DOM ────────────────────────────────────────────────────
    function createOverlay() {
        overlay = document.createElement("div");
        overlay.id = "onboarding-overlay";

        const mask = document.createElement("div");
        mask.id = "onboarding-mask";
        overlay.appendChild(mask);

        spotlight = document.createElement("div");
        spotlight.id = "onboarding-spotlight";
        document.body.appendChild(spotlight);

        card = document.createElement("div");
        card.id = "onboarding-card";
        overlay.appendChild(card);

        document.body.appendChild(overlay);
    }

    // ── Finish / cleanup ──────────────────────────────────────────────────────
    function finish() {
        overlay?.remove();
        spotlight?.remove();
        overlay   = null;
        spotlight = null;
        card      = null;
        localStorage.setItem("ehsp-onboarding-done", "1");
    }

    // ── Public: start ─────────────────────────────────────────────────────────
    function start(force = false) {
        if (!force && localStorage.getItem("ehsp-onboarding-done")) return;
        injectStyles();
        createOverlay();
        currentStep = 0;
        showStep(0);
    }

    // ── Public: reset (for testing) ───────────────────────────────────────────
    function reset() {
        localStorage.removeItem("ehsp-onboarding-done");
    }

    return { start, reset, finish };

})();

// ── Auto-launch after short delay on first visit ──────────────────────────────
window.addEventListener("load", () => {
    setTimeout(() => OnboardingFlow.start(), 1800);
});

window.OnboardingFlow = OnboardingFlow;
