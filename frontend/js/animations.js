/**
 * ULTRA ANIMATION SYSTEM
 * Covers: particles, glitch, tilt, ripple, counter, cursor trail, neon pulse, page transitions
 */
(function () {
    // ── CSS ──────────────────────────────────────────────────────────────────
    const CSS = `
/* ── Page / View Transitions ─────────────────────────────── */
@keyframes fadeSlideIn {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
}
@keyframes fadeSlideOut {
    from { opacity:1; transform:translateY(0); }
    to   { opacity:0; transform:translateY(-14px); }
}
#view > * { animation: fadeSlideIn 0.45s cubic-bezier(.22,1,.36,1) both; }

/* ── Card Hover Lift + Glow ──────────────────────────────── */
.dash-card {
    transition: transform 0.35s cubic-bezier(.22,1,.36,1),
                box-shadow 0.35s ease,
                border-color 0.35s ease !important;
    will-change: transform;
}
.dash-card:hover {
    transform: translateY(-5px) scale(1.012) !important;
    box-shadow: 0 20px 60px rgba(0,210,255,0.18), 0 0 0 1px rgba(0,210,255,0.25) !important;
}

/* ── Sidebar Nav Slide ───────────────────────────────────── */
.sidebar-nav a {
    position: relative;
    overflow: hidden;
    transition: background 0.25s, color 0.25s, transform 0.25s, padding-left 0.25s !important;
}
.sidebar-nav a::after {
    content:'';
    position:absolute; left:0; top:0; bottom:0;
    width:3px;
    background: linear-gradient(180deg,#00d2ff,#00ffbf);
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1);
    border-radius: 0 2px 2px 0;
}
.sidebar-nav a:hover, .sidebar-nav a.active { padding-left: 18px !important; }
.sidebar-nav a.active::after, .sidebar-nav a:hover::after { transform: scaleY(1); }

/* ── Button Ripple ───────────────────────────────────────── */
.btn-primary, .btn-outline, button {
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s !important;
}
.btn-primary:active, .btn-outline:active { transform: scale(0.96) !important; }
.ripple-wave {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.35);
    transform: scale(0);
    animation: rippleAnim 0.6s linear;
    pointer-events: none;
}
@keyframes rippleAnim {
    to { transform: scale(4); opacity: 0; }
}

/* ── Neon Pulse on Active Nav ────────────────────────────── */
@keyframes neonPulse {
    0%,100% { box-shadow: 0 0 6px rgba(0,210,255,0.4); }
    50%      { box-shadow: 0 0 20px rgba(0,210,255,0.9), 0 0 40px rgba(0,210,255,0.4); }
}
.sidebar-nav a.active { animation: neonPulse 2.5s ease-in-out infinite; }

/* ── Topbar Scan Line ────────────────────────────────────── */
.topbar { position: relative; overflow: hidden; }
.topbar::after {
    content:'';
    position:absolute; top:0; left:-100%; width:60%; height:100%;
    background: linear-gradient(90deg,transparent,rgba(0,210,255,0.08),transparent);
    animation: topbarScan 4s ease-in-out infinite;
}
@keyframes topbarScan {
    0%   { left:-60%; }
    100% { left:110%; }
}

/* ── Glitch Text ─────────────────────────────────────────── */
@keyframes glitch1 {
    0%,100% { clip-path:inset(0 0 95% 0); transform:translate(-3px,0); }
    20%     { clip-path:inset(30% 0 50% 0); transform:translate(3px,0); }
    40%     { clip-path:inset(70% 0 10% 0); transform:translate(-2px,0); }
    60%     { clip-path:inset(10% 0 80% 0); transform:translate(2px,0); }
    80%     { clip-path:inset(50% 0 30% 0); transform:translate(-1px,0); }
}
@keyframes glitch2 {
    0%,100% { clip-path:inset(90% 0 0% 0); transform:translate(3px,0); }
    20%     { clip-path:inset(5% 0 60% 0);  transform:translate(-3px,0); }
    40%     { clip-path:inset(60% 0 20% 0); transform:translate(2px,0); }
    60%     { clip-path:inset(20% 0 70% 0); transform:translate(-2px,0); }
    80%     { clip-path:inset(40% 0 40% 0); transform:translate(1px,0); }
}
.glitch-text { position: relative; display: inline-block; }
.glitch-text::before, .glitch-text::after {
    content: attr(data-text);
    position: absolute; top:0; left:0;
    width:100%; height:100%;
    opacity: 0.8;
}
.glitch-text::before { color:#00ffbf; animation: glitch1 3s infinite; }
.glitch-text::after  { color:#ff00aa; animation: glitch2 3s infinite; }

/* ── Stat Counter Pop ────────────────────────────────────── */
@keyframes statPop {
    0%   { transform:scale(0.5); opacity:0; }
    70%  { transform:scale(1.1); }
    100% { transform:scale(1);   opacity:1; }
}
.stat-mini h2 { animation: statPop 0.6s cubic-bezier(.34,1.56,.64,1) both; }

/* ── XP Bar Shimmer ──────────────────────────────────────── */
@keyframes xpShine {
    0%   { transform:translateX(-100%); }
    60%  { transform:translateX(200%); }
    100% { transform:translateX(200%); }
}

/* ── Badge Bounce-In ─────────────────────────────────────── */
@keyframes badgeBounce {
    0%   { transform:scale(0) rotate(-15deg); opacity:0; }
    60%  { transform:scale(1.2) rotate(5deg); }
    80%  { transform:scale(0.95) rotate(-2deg); }
    100% { transform:scale(1) rotate(0deg); opacity:1; }
}
.badge { animation: badgeBounce 0.5s cubic-bezier(.34,1.56,.64,1) both; }

/* ── List Item Stagger ───────────────────────────────────── */
.list-item {
    animation: fadeSlideIn 0.4s cubic-bezier(.22,1,.36,1) both;
    transition: background 0.2s, transform 0.2s !important;
}
.list-item:hover { transform: translateX(6px) !important; background: rgba(0,210,255,0.04) !important; }

/* ── Challenge Card Hover ────────────────────────────────── */
.challenge-card, .tutorial-card, .module-card {
    transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s !important;
}
.challenge-card:hover, .tutorial-card:hover, .module-card:hover {
    transform: translateY(-6px) rotateX(2deg) !important;
    box-shadow: 0 24px 50px rgba(0,210,255,0.2) !important;
}

/* ── Progress Bar Fill Animate ───────────────────────────── */
@keyframes progressFill {
    from { width:0%; }
}
.progress-bar-fill { animation: progressFill 1.4s cubic-bezier(.22,1,.36,1) both; }

/* ── Floating Avatar ─────────────────────────────────────── */
@keyframes avatarFloat {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(-4px); }
}
.avatar { animation: avatarFloat 3s ease-in-out infinite; }

/* ── Notification Slide ──────────────────────────────────── */
@keyframes notifSlide {
    from { opacity:0; transform:translateX(40px); }
    to   { opacity:1; transform:translateX(0); }
}
.notif-item, .notification-item {
    animation: notifSlide 0.35s cubic-bezier(.22,1,.36,1) both;
}

/* ── Brand Icon Spin-Glow ────────────────────────────────── */
@keyframes brandGlow {
    0%,100% { filter:drop-shadow(0 0 4px var(--secondary-blue)); }
    50%     { filter:drop-shadow(0 0 16px var(--secondary-blue)) drop-shadow(0 0 30px var(--primary-cyan)); }
}
.brand-icon { animation: brandGlow 3s ease-in-out infinite; }

/* ── Leaderboard Row ─────────────────────────────────────── */
@keyframes rowSlide {
    from { opacity:0; transform:translateX(-30px); }
    to   { opacity:1; transform:translateX(0); }
}
tr, .lb-row { animation: rowSlide 0.4s cubic-bezier(.22,1,.36,1) both; }

/* ── Modal Pop ───────────────────────────────────────────── */
@keyframes modalPop {
    from { opacity:0; transform:scale(0.85) translateY(20px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
}
.modal, .modal-content, [class*="modal"], [class*="popup"] {
    animation: modalPop 0.4s cubic-bezier(.34,1.56,.64,1) both !important;
}

/* ── Input Focus Glow ────────────────────────────────────── */
input, textarea, select {
    transition: border-color 0.3s, box-shadow 0.3s, transform 0.2s !important;
}
input:focus, textarea:focus, select:focus {
    transform: scale(1.01) !important;
    box-shadow: 0 0 0 3px rgba(0,210,255,0.2), 0 0 20px rgba(0,210,255,0.1) !important;
    outline: none !important;
}

/* ── Cursor Dot ──────────────────────────────────────────── */
#cursor-dot {
    position:fixed; width:8px; height:8px; border-radius:50%;
    background:#00d2ff; pointer-events:none; z-index:999999;
    transform:translate(-50%,-50%);
    box-shadow:0 0 10px #00d2ff, 0 0 20px rgba(0,210,255,0.5);
    transition:transform 0.08s, width 0.2s, height 0.2s, opacity 0.2s;
}
#cursor-ring {
    position:fixed; width:32px; height:32px; border-radius:50%;
    border:1.5px solid rgba(0,210,255,0.6); pointer-events:none; z-index:999998;
    transform:translate(-50%,-50%);
    transition:transform 0.18s cubic-bezier(.22,1,.36,1), width 0.3s, height 0.3s, opacity 0.3s;
}

/* ── Particle Canvas ─────────────────────────────────────── */
#particle-canvas {
    position:fixed; top:0; left:0; width:100%; height:100%;
    pointer-events:none; z-index:0; opacity:0.35;
}

/* ── Loading dot bounce ──────────────────────────────────── */
@keyframes dotBounce {
    0%,80%,100% { transform:scale(0.6); opacity:0.4; }
    40%         { transform:scale(1.2); opacity:1; }
}
.loading-dot {
    display:inline-block; width:8px; height:8px; border-radius:50%;
    background:var(--primary-cyan,#00ffbf);
    animation:dotBounce 1.4s ease-in-out infinite;
}
.loading-dot:nth-child(2) { animation-delay:0.16s; }
.loading-dot:nth-child(3) { animation-delay:0.32s; }

/* ── 3D Tilt card (set by JS) ────────────────────────────── */
.tilt-card { transform-style:preserve-3d; perspective:800px; }

/* ── Stagger delays for grids ────────────────────────────── */
.dash-card:nth-child(1)  { animation-delay:0.04s; }
.dash-card:nth-child(2)  { animation-delay:0.08s; }
.dash-card:nth-child(3)  { animation-delay:0.12s; }
.dash-card:nth-child(4)  { animation-delay:0.16s; }
.dash-card:nth-child(5)  { animation-delay:0.20s; }
.dash-card:nth-child(6)  { animation-delay:0.24s; }
.list-item:nth-child(1)  { animation-delay:0.05s; }
.list-item:nth-child(2)  { animation-delay:0.10s; }
.list-item:nth-child(3)  { animation-delay:0.15s; }
.list-item:nth-child(4)  { animation-delay:0.20s; }
.list-item:nth-child(5)  { animation-delay:0.25s; }

/* ── Hacker theme scanline ───────────────────────────────── */
body.theme-hacker .dash-card { border-color: #003300 !important; animation: hackerBorder 4s ease infinite; }
@keyframes hackerBorder {
    0%,100% { border-color:#003300; }
    50%     { border-color:#00ff41; box-shadow:0 0 18px rgba(0,255,65,0.2); }
}
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'ultra-animations';
    document.head.appendChild(styleEl);
    styleEl.textContent = CSS;

    // ── Particle Background ───────────────────────────────────────────────
    function initParticles() {
        if (document.getElementById('particle-canvas')) return;
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        document.body.insertBefore(canvas, document.body.firstChild);
        const ctx = canvas.getContext('2d');

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);

        const PARTICLE_COUNT = 55;
        const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.1,
        }));

        const isHacker = () => document.body.classList.contains('theme-hacker');
        const isLight  = () => document.body.classList.contains('theme-light');

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const color = isHacker() ? '0,255,65' : isLight() ? '0,100,200' : '0,210,255';

            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${color},${p.alpha})`;
                ctx.fill();
            });

            // Draw connecting lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(${color},${0.12 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(draw);
        }
        draw();
    }

    // ── Custom Cursor ─────────────────────────────────────────────────────
    function initCursor() {
        if (document.getElementById('cursor-dot')) return;
        const dot  = document.createElement('div'); dot.id = 'cursor-dot';
        const ring = document.createElement('div'); ring.id = 'cursor-ring';
        document.body.appendChild(dot);
        document.body.appendChild(ring);

        let mx = 0, my = 0, rx = 0, ry = 0;
        document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

        function animCursor() {
            rx += (mx - rx) * 0.15;
            ry += (my - ry) * 0.15;
            dot.style.left  = mx + 'px';
            dot.style.top   = my + 'px';
            ring.style.left = rx + 'px';
            ring.style.top  = ry + 'px';
            requestAnimationFrame(animCursor);
        }
        animCursor();

        // Grow on hover
        document.addEventListener('mouseover', e => {
            const el = e.target;
            if (el.matches('a,button,.dash-card,.btn-primary,.btn-outline,input')) {
                ring.style.width  = '50px';
                ring.style.height = '50px';
                ring.style.opacity = '0.5';
                dot.style.transform = 'translate(-50%,-50%) scale(1.8)';
            }
        });
        document.addEventListener('mouseout', () => {
            ring.style.width  = '32px';
            ring.style.height = '32px';
            ring.style.opacity = '1';
            dot.style.transform = 'translate(-50%,-50%) scale(1)';
        });
    }

    // ── Ripple Effect on Buttons ──────────────────────────────────────────
    function initRipple() {
        document.addEventListener('click', e => {
            const btn = e.target.closest('button, .btn-primary, .btn-outline, .nav-link, .sidebar-nav a');
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            const ripple = document.createElement('span');
            ripple.className = 'ripple-wave';
            ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);
        });
    }

    // ── 3D Card Tilt ──────────────────────────────────────────────────────
    function initTilt() {
        document.addEventListener('mousemove', e => {
            document.querySelectorAll('.dash-card').forEach(card => {
                const rect = card.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top  + rect.height / 2;
                const dx = (e.clientX - cx) / rect.width;
                const dy = (e.clientY - cy) / rect.height;
                const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
                if (dist < rect.width * 0.9) {
                    card.style.transform = `translateY(-5px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg) scale(1.012)`;
                } else {
                    card.style.transform = '';
                }
            });
        });
    }

    // ── Animated Number Counter ───────────────────────────────────────────
    function animateCounters() {
        document.querySelectorAll('.stat-mini h2, .xp-stat .level-rank').forEach(el => {
            const raw = el.textContent.replace(/[^0-9]/g, '');
            if (!raw || el.dataset.counted) return;
            el.dataset.counted = '1';
            const end = parseInt(raw, 10);
            if (isNaN(end) || end === 0) return;
            const prefix = el.textContent.replace(raw, '').replace(raw, '').split(raw)[0] || '';
            const suffix = el.textContent.split(raw).pop() || '';
            let start = 0;
            const dur = 1200;
            const step = end / (dur / 16);
            const tick = () => {
                start = Math.min(start + step, end);
                el.textContent = prefix + Math.round(start).toLocaleString() + suffix;
                if (start < end) requestAnimationFrame(tick);
            };
            tick();
        });
    }

    // ── Stagger Cards on View Change ──────────────────────────────────────
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.dash-card:not([data-anim])').forEach((card, i) => {
            card.dataset.anim = '1';
            card.style.animationDelay = `${i * 0.06}s`;
            card.style.animation = 'fadeSlideIn 0.5s cubic-bezier(.22,1,.36,1) both';
        });
        setTimeout(animateCounters, 400);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ── Glitch Brand Title ────────────────────────────────────────────────
    function glitchBrand() {
        const brand = document.querySelector('.brand-text h2');
        if (!brand || brand.dataset.glitch) return;
        brand.dataset.glitch = '1';
        brand.classList.add('glitch-text');
        brand.setAttribute('data-text', brand.textContent);
    }

    // ── Init all on DOM ready ─────────────────────────────────────────────
    function init() {
        initParticles();
        initCursor();
        initRipple();
        initTilt();
        glitchBrand();
        setTimeout(animateCounters, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.UltraAnimations = { animateCounters };
})();
