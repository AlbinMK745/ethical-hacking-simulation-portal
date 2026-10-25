/**
 * SKELETON LOADERS — Shimmer placeholder screens
 * =================================================
 * Replaces blank loading states with premium shimmer skeletons.
 * Usage: inject <SkeletonCard />, <SkeletonList />, <SkeletonTable /> in JSX
 * OR call SkeletonLoader.card(containerId) from vanilla JS
 */

/* ── Inject CSS ── */
(function injectSkeletonStyles() {
    if (document.getElementById("skeleton-styles")) return;
    const s = document.createElement("style");
    s.id = "skeleton-styles";
    s.textContent = `
/* ─── Base shimmer ─────────────────────────────────────── */
@keyframes skeleton-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
}

.skeleton {
    background: linear-gradient(
        90deg,
        rgba(255,255,255,0.04) 25%,
        rgba(255,255,255,0.09) 50%,
        rgba(255,255,255,0.04) 75%
    );
    background-size: 1200px 100%;
    animation: skeleton-shimmer 1.6s ease-in-out infinite;
    border-radius: 6px;
}

/* ─── Skeleton shapes ──────────────────────────────────── */
.sk-line   { height: 14px; border-radius: 99px; }
.sk-circle { border-radius: 50%; }
.sk-block  { border-radius: 10px; }
.sk-title  { height: 22px; width: 60%; border-radius: 99px; }
.sk-badge  { height: 22px; width: 80px; border-radius: 99px; }

/* ─── Skeleton Card ────────────────────────────────────── */
.sk-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.sk-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

/* ─── Skeleton grid ────────────────────────────────────── */
.sk-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 24px;
}

/* ─── Skeleton stat row ────────────────────────────────── */
.sk-stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin: 0 24px;
}
.sk-stat-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
}

/* ─── Skeleton table row ───────────────────────────────── */
.sk-table-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
}

/* ─── Light theme overrides ─────────────────────────────── */
body.theme-light .skeleton {
    background: linear-gradient(
        90deg,
        rgba(0,0,0,0.04) 25%,
        rgba(0,0,0,0.09) 50%,
        rgba(0,0,0,0.04) 75%
    );
    background-size: 1200px 100%;
}
body.theme-light .sk-card,
body.theme-light .sk-stat-card {
    background: rgba(0,0,0,0.03);
    border-color: rgba(0,0,0,0.08);
}
    `;
    document.head.appendChild(s);
})();

// ── React Skeleton Components ─────────────────────────────────────────────────
// These are plain functions (not using React.createElement syntax)
// so they work in both JSX and vanilla contexts.

/**
 * Single skeleton card with avatar + lines
 */
function SkeletonCard({ lines = 3 }) {
    return React.createElement("div", { className: "sk-card" },
        React.createElement("div", { className: "sk-card-header" },
            React.createElement("div", { className: "skeleton sk-circle", style: { width: 44, height: 44, flexShrink: 0 } }),
            React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 8 } },
                React.createElement("div", { className: "skeleton sk-title" }),
                React.createElement("div", { className: "skeleton sk-badge" })
            )
        ),
        ...[...Array(lines)].map((_, i) =>
            React.createElement("div", {
                key: i,
                className: "skeleton sk-line",
                style: { width: `${70 + Math.random() * 25}%`, opacity: 1 - i * 0.15 }
            })
        )
    );
}

/**
 * Grid of N skeleton cards
 */
function SkeletonGrid({ count = 6 }) {
    return React.createElement("div", { className: "sk-grid" },
        ...[...Array(count)].map((_, i) =>
            React.createElement(SkeletonCard, { key: i, lines: 2 + (i % 2) })
        )
    );
}

/**
 * Stats row (4 mini stat cards)
 */
function SkeletonStatsRow() {
    return React.createElement("div", { className: "sk-stats-row" },
        ...[...Array(4)].map((_, i) =>
            React.createElement("div", { key: i, className: "sk-stat-card" },
                React.createElement("div", { className: "skeleton sk-circle sk-block", style: { width: 44, height: 44, flexShrink: 0 } }),
                React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 8 } },
                    React.createElement("div", { className: "skeleton", style: { height: 24, width: "60%", borderRadius: 6 } }),
                    React.createElement("div", { className: "skeleton sk-line", style: { width: "80%" } })
                )
            )
        )
    );
}

/**
 * Table skeleton (N rows)
 */
function SkeletonTable({ rows = 5 }) {
    return React.createElement("div", { style: { padding: "0 20px" } },
        ...[...Array(rows)].map((_, i) =>
            React.createElement("div", { key: i, className: "sk-table-row" },
                React.createElement("div", { className: "skeleton", style: { width: 28, height: 28, borderRadius: "50%", flexShrink: 0 } }),
                React.createElement("div", { className: "skeleton sk-circle", style: { width: 36, height: 36, flexShrink: 0 } }),
                React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 6 } },
                    React.createElement("div", { className: "skeleton sk-line", style: { width: "55%" } }),
                    React.createElement("div", { className: "skeleton sk-line", style: { width: "35%", opacity: 0.6 } })
                ),
                React.createElement("div", { className: "skeleton sk-badge" })
            )
        )
    );
}

/**
 * Dashboard full skeleton (welcome + stats + cards)
 */
function SkeletonDashboard() {
    return React.createElement("div", { style: { padding: 24, display: "flex", flexDirection: "column", gap: 20 } },
        // Welcome card
        React.createElement("div", { className: "sk-card", style: { padding: 28 } },
            React.createElement("div", { className: "sk-card-header" },
                React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 10 } },
                    React.createElement("div", { className: "skeleton", style: { height: 28, width: "40%", borderRadius: 99 } }),
                    React.createElement("div", { className: "skeleton sk-line", style: { width: "25%" } })
                ),
                React.createElement("div", { className: "skeleton", style: { width: 80, height: 50, borderRadius: 10 } })
            ),
            React.createElement("div", { className: "skeleton", style: { height: 10, width: "100%", marginTop: 8, borderRadius: 99 } })
        ),
        // Stats row
        React.createElement(SkeletonStatsRow),
        // Cards grid
        React.createElement(SkeletonGrid, { count: 4 })
    );
}

// Expose to window
window.SkeletonCard      = SkeletonCard;
window.SkeletonGrid      = SkeletonGrid;
window.SkeletonStatsRow  = SkeletonStatsRow;
window.SkeletonTable     = SkeletonTable;
window.SkeletonDashboard = SkeletonDashboard;
