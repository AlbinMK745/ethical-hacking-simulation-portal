/**
 * DASHBOARD VIEW
 * The main overview screen for the hacker agent.
 */

// ── Level config (mirrors backend & xp-system.js) ────────────────────────────
const DASH_LEVEL_TABLE = [
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

function dashGetLevelInfo(xp) {
    let info = DASH_LEVEL_TABLE[0];
    for (let i = 0; i < DASH_LEVEL_TABLE.length; i++) {
        if (xp >= DASH_LEVEL_TABLE[i].minXp) info = DASH_LEVEL_TABLE[i];
        else break;
    }
    const nextEntry = DASH_LEVEL_TABLE[info.level] || DASH_LEVEL_TABLE[DASH_LEVEL_TABLE.length - 1];
    const xpInLevel  = xp - info.minXp;
    const xpNeeded   = nextEntry.minXp - info.minXp;
    const pct        = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
    return { ...info, xp, xpInLevel, xpNeeded, pct, nextTitle: nextEntry.title, nextMinXp: nextEntry.minXp };
}

// ── Animated XP Bar Component ─────────────────────────────────────────────────
function XpBarWidget({ xpData, points }) {
    const [fillWidth, setFillWidth] = React.useState(0);
    const xp   = (xpData && xpData.xp != null) ? xpData.xp : (points || 0);
    const info = dashGetLevelInfo(xp);
    const isMax = info.level >= 15;

    React.useEffect(() => {
        const timer = setTimeout(() => setFillWidth(info.pct), 150);
        return () => clearTimeout(timer);
    }, [xp]);

    return (
        <div style={{
            display:'flex', alignItems:'center', gap:'14px',
            padding:'12px 16px',
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.09)',
            borderRadius:'14px',
            marginTop:'12px',
        }}>
            {/* Level Badge */}
            <div style={{
                minWidth:'58px', height:'58px',
                borderRadius:'12px',
                background: `linear-gradient(135deg, ${info.color}, #1a1a2e)`,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                color:'#fff', fontWeight:900,
                boxShadow: `0 0 16px ${info.color}55`,
                flexShrink: 0,
            }}>
                <span style={{fontSize:'1.5rem', lineHeight:1}}>{info.level}</span>
                <span style={{fontSize:'0.5rem', letterSpacing:'1.5px', opacity:0.8}}>LEVEL</span>
            </div>

            {/* Bar info */}
            <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                    <span style={{fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase',
                                  letterSpacing:'0.5px', color: info.color}}>
                        {info.title}
                    </span>
                    <span style={{fontSize:'0.72rem', color:'rgba(255,255,255,0.45)'}}>
                        {xp.toLocaleString()} XP
                    </span>
                </div>
                {/* Track */}
                <div style={{
                    height:'9px', background:'rgba(255,255,255,0.08)',
                    borderRadius:'99px', overflow:'hidden', position:'relative',
                }}>
                    <div style={{
                        height:'100%', borderRadius:'99px',
                        width: `${fillWidth}%`,
                        transition:'width 1.3s cubic-bezier(.22,1,.36,1)',
                        background: isMax
                            ? 'linear-gradient(90deg,#f97316,#fbbf24)'
                            : `linear-gradient(90deg, ${info.color}, ${info.color}88)`,
                        position:'relative', overflow:'hidden',
                    }}>
                        <div style={{
                            position:'absolute', inset:0,
                            background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)',
                            animation:'xpShine 2.5s ease-in-out infinite',
                        }} />
                    </div>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:'4px'}}>
                    <span style={{fontSize:'0.68rem', color:'rgba(255,255,255,0.38)'}}>
                        {isMax ? "MAX LEVEL 🏆" : `${info.xpInLevel} / ${info.xpNeeded} XP → ${info.nextTitle}`}
                    </span>
                    <span style={{fontSize:'0.68rem', color:'rgba(255,255,255,0.38)'}}>
                        {isMax ? "" : `${info.pct}%`}
                    </span>
                </div>
            </div>
        </div>
    );
}

function DashboardView({ user, onNavigate, setPage }) {
    const [state, setState] = React.useState({ loading: true, error: "", stats: null, rank: "-", recent: [], xpData: null, streak: 0 });
    const [xpFill, setXpFill] = React.useState(0);

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [stats, lb, recent] = await Promise.all([
                    api(`/user/dashboard/stats/${user.id}`),
                    api(`/user/leaderboard-data`),
                    api(`/user/dashboard/recently-viewed`, { headers: { "user-id": String(user.id) } })
                ]);

                let xpData = null, streak = 0;
                try {
                    xpData = await api(`/xp/summary`, { headers: { "user-id": String(user.id) } });
                    streak = xpData.streak || 0;
                    fetch("/xp/login-reward", { method: "POST", headers: { "user-id": String(user.id) } })
                        .then(r => r.json())
                        .then(lr => {
                            if (lr.xp_gained > 0 && window.XpSystem) {
                                window.XpSystem.showXpToast(lr.xp_gained, "Daily Login Bonus");
                                if (lr.streak_milestone) window.XpSystem.showXpToast(50, `🔥 ${lr.streak}-Day Streak!`);
                                if (lr.leveled_up) setTimeout(() => window.XpSystem.showLevelUpModal(lr.level_info), 1200);
                            }
                        }).catch(() => {});
                } catch(e) { /* XP API might not exist yet */ }

                if (cancelled) return;
                const me = Array.isArray(lb) ? lb.find(x => x.user_id === user.id) : null;
                setState({ loading: false, error: "", stats, rank: me ? me.rank : "-", recent: Array.isArray(recent) ? recent : [], xpData, streak });
            } catch (err) {
                if (!cancelled) setState({ loading: false, error: err.message, stats: null, rank: "-", recent: [], xpData: null, streak: 0 });
            }
        })();
        return () => { cancelled = true; };
    }, [user.id]);

    // Derive XP info (safe defaults while loading)
    const s    = state.stats || {};
    const points = s.points || 0;
    const xp   = state.xpData?.xp ?? points;
    const info = dashGetLevelInfo(xp);
    const level = info.level;

    // Animate XP bar fill after data loads
    React.useEffect(() => {
        if (state.loading) return;
        const t = setTimeout(() => setXpFill(info.pct), 200);
        return () => clearTimeout(t);
    }, [xp, state.loading]);

    if (state.loading) return (typeof SkeletonDashboard !== "undefined")
        ? <SkeletonDashboard />
        : <Loading text="Loading dashboard..." />;
    if (state.error) return <ErrorBox error={state.error} />;



    return (
        <div className="dashboard-grid">

            {/* ══ 1. HERO BANNER ══ */}
            <div className="db-hero">
                {/* Level Orb */}
                <div className="db-hero-orb" style={{ background: `linear-gradient(135deg, ${info.color}33, #0a1628)`, boxShadow: `0 0 30px ${info.color}44` }}>
                    <div className="db-hero-orb-ring" style={{ borderImage: `linear-gradient(135deg, ${info.color}, transparent) 1`, borderColor: info.color, opacity: 0.6 }}></div>
                    <span className="db-hero-orb-num">{level}</span>
                    <span className="db-hero-orb-lbl">LEVEL</span>
                </div>

                {/* Text */}
                <div className="db-hero-text">
                    <div className="db-hero-name">Welcome, <span>{user.username}</span></div>
                    <div className="db-hero-tags">
                        <span className="db-hero-rank-tag" style={{ borderColor: `${info.color}44`, color: info.color }}>
                            <i className="fas fa-shield-alt"></i> {info.title}
                        </span>
                        <span className="db-hero-rank-tag">
                            <i className="fas fa-globe"></i> Rank #{state.rank || "—"}
                        </span>
                        {state.streak > 0 && (
                            <span className="db-hero-streak-tag">🔥 {state.streak}-day streak</span>
                        )}
                    </div>
                    {/* XP bar */}
                    <div className="db-xp-bar-wrap">
                        <div className="db-xp-labels">
                            <span className="db-xp-title" style={{ color: info.color }}>{info.title}</span>
                            <span className="db-xp-val">{xp.toLocaleString()} XP</span>
                        </div>
                        <div className="db-xp-track">
                            <div className="db-xp-fill" style={{
                                width: `${xpFill}%`,
                                background: `linear-gradient(90deg, ${info.color}, ${info.color}88)`,
                            }} />
                        </div>
                        <div className="db-xp-sub">
                            <span>{info.xpInLevel} / {info.xpNeeded} XP → {info.nextTitle}</span>
                            <span>{info.pct}%</span>
                        </div>
                    </div>
                </div>

                {/* Total XP */}
                <div className="db-hero-xp-total">
                    <span className="db-xp-big" style={{ color: info.color }}>{xp.toLocaleString()}</span>
                    <span className="db-xp-lbl">Total XP</span>
                </div>
            </div>

            {/* ══ 2. STATS ROW ══ */}
            <div className="db-stats-row">
                <div className="db-stat s-blue">
                    <div className="db-stat-icon s-blue"><i className="fas fa-bullseye"></i></div>
                    <div className="db-stat-val">{s.solved || 0}</div>
                    <div className="db-stat-lbl">Challenges Solved</div>
                </div>
                <div className="db-stat s-green">
                    <div className="db-stat-icon s-green"><i className="fas fa-globe"></i></div>
                    <div className="db-stat-val">#{state.rank || "—"}</div>
                    <div className="db-stat-lbl">Global Rank</div>
                </div>
                <div className="db-stat s-yellow">
                    <div className="db-stat-icon s-yellow"><i className="fas fa-layer-group"></i></div>
                    <div className="db-stat-val">{level}</div>
                    <div className="db-stat-lbl">Current Level</div>
                </div>
                <div className="db-stat s-orange">
                    <div className="db-stat-icon s-orange">🔥</div>
                    <div className="db-stat-val" style={{ color: state.streak > 0 ? '#f97316' : undefined }}>{state.streak || 0}</div>
                    <div className="db-stat-lbl">Day Streak</div>
                </div>
            </div>

            {/* ══ 3. MIDDLE ROW ══ */}
            <div className="db-mid-row">

                {/* Daily Challenge */}
                <div className="db-card db-daily-card">
                    <div className="db-card-header" style={{ color: '#00d2ff', borderBottomColor: 'rgba(0,210,255,0.1)' }}>
                        <i className="fas fa-calendar-day"></i> Daily Challenge
                        <span className="see-all" onClick={() => setPage("daily-challenge")}>View →</span>
                    </div>
                    <div className="db-daily-inner">
                        <div className="db-daily-tags">
                            <span className="db-daily-tag db-tag-blue">Due Today</span>
                            <span className="db-daily-tag db-tag-xp"><i className="fas fa-bolt"></i> +150 XP</span>
                        </div>
                        <div className="db-daily-title">XSS Reflected Attack</div>
                        <div className="db-daily-desc">Exploit a reflected XSS vulnerability to steal session cookies from the target application.</div>
                        <button className="db-daily-btn" onClick={() => setPage("daily-challenge")}>
                            <i className="fas fa-play-circle"></i> Accept Mission
                        </button>
                    </div>
                </div>

                {/* Recently Viewed Activity */}
                <div className="db-card">
                    <div className="db-card-header">
                        <i className="fas fa-clock"></i> Recent Activity
                        <span className="see-all" onClick={() => setPage("recent")}>See all →</span>
                    </div>
                    <div className="db-activity-list">
                        {state.recent.length === 0 ? (
                            <div style={{ padding: '20px 14px', color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' }}>No recent activity yet.</div>
                        ) : state.recent.slice(0, 5).map((item, i) => {
                            const CAT_ICONS = { Web: "fa-globe", Network: "fa-network-wired", Binary: "fa-terminal", Crypto: "fa-lock" };
                            const icon = Object.keys(CAT_ICONS).find(k => item.category?.includes(k));
                            const iconClass = CAT_ICONS[icon] || "fa-book";
                            const isComplete = item.completed;
                            return (
                                <div key={i} className="db-activity-item"
                                     style={{ animationDelay: `${i * 0.07}s` }}
                                     onClick={() => onNavigate("tutorials", item.item_id)}>
                                    <div className="db-activity-icon" style={{
                                        background: isComplete ? 'rgba(34,197,94,0.1)' : 'rgba(0,210,255,0.08)',
                                        color: isComplete ? '#22c55e' : '#00d2ff'
                                    }}>
                                        <i className={`fas ${iconClass}`}></i>
                                    </div>
                                    <div className="db-activity-info">
                                        <h4>{item.title}</h4>
                                        <p>{new Date(item.last_viewed_at).toLocaleDateString()}</p>
                                    </div>
                                    {isComplete && (
                                        <span className="db-activity-badge" style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.25)' }}>✓ Done</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ══ 4. STREAK WIDGET ══ */}
            <StreakWidget streak={state.streak || 0} shields={state.xpData?.shields || 0} />

            {/* ══ 5. BOTTOM ROW ══ */}
            <div className="db-bottom-row">

                {/* Achievements */}
                <div className="db-card">
                    <div className="db-card-header">
                        <i className="fas fa-medal" style={{ color:'#eab308' }}></i> Recent Achievements
                        <span className="see-all" onClick={() => setPage("achievements")}>See all →</span>
                    </div>
                    <div className="db-ach-list">
                        {[
                            { title:"First Blood",      desc:"Solve your first challenge",      icon:"fa-trophy" },
                            { title:"SQL Master",       desc:"Solve 5 SQL injection challenges", icon:"fa-flask" },
                            { title:"Knowledge Seeker", desc:"Complete 10 tutorials",            icon:"fa-graduation-cap" },
                        ].map((a, i) => (
                            <div key={i} className="db-ach-item" style={{ animationDelay:`${i*0.09}s` }}>
                                <div className="db-ach-icon"><i className={`fas ${a.icon}`}></i></div>
                                <div className="db-ach-info"><h4>{a.title}</h4><p>{a.desc}</p></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Navigation */}
                <div className="db-card">
                    <div className="db-card-header">
                        <i className="fas fa-th-large"></i> Quick Access
                    </div>
                    <div className="db-quick-nav">
                        {[
                            { icon:"fa-graduation-cap", label:"Tutorials",   page:"tutorials",       color:"#00d2ff" },
                            { icon:"fa-crosshairs",     label:"Challenges",  page:"challenges",      color:"#ef4444" },
                            { icon:"fa-trophy",         label:"Leaderboard", page:"leaderboard",     color:"#eab308" },
                            { icon:"fa-flask",          label:"Sandbox",     page:"sandbox",         color:"#22c55e" },
                            { icon:"fa-calendar-day",  label:"Daily",       page:"daily-challenge", color:"#f97316" },
                            { icon:"fa-chart-line",    label:"Progress",    page:"progress",        color:"#8b5cf6" },
                        ].map((n, i) => (
                            <div key={i} className="db-qnav-btn" onClick={() => setPage(n.page)}
                                 style={{ '--hover-color': n.color }}>
                                <i className={`fas ${n.icon}`} style={{ color: n.color }}></i>
                                <span>{n.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
