/**
 * SANDBOX MONITOR VIEW — Premium Build
 * Real-time Docker container monitoring, execution history, and admin code runner.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmtUptime(startedAt) {
    if (!startedAt) return "—";
    const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    if (isNaN(diff) || diff < 0) return "—";
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function fmtBytes(mb) {
    if (mb === undefined || mb === null) return "0 MB";
    return `${Number(mb).toFixed(1)} MB`;
}

function simTypeLabel(t) {
    const map = {
        "sqli-login": "SQL Injection", "sqli": "SQL Injection",
        "xss-reflected": "XSS Reflected", "xss": "XSS",
        "cmd-injection": "CMD Injection",
        "hardcoded-creds": "Hardcoded Creds",
        "idor-profile": "IDOR", "idor": "IDOR",
        "linux-flag-hunt": "Linux Hunt",
        "stored-xss": "Stored XSS",
        "jwt-manipulation": "JWT Manip.",
        "broken-access-control": "BAC",
        "blind-sqli": "Blind SQLi",
        "ssrf": "SSRF",
        "priv-esc": "Priv Esc",
        "rce-eval": "RCE/Eval",
    };
    return map[t] || (t ? t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Unknown");
}

function exitCodeBadge(code) {
    if (code === 0) return <span className="sbx-badge sbx-badge--success">✓ OK</span>;
    if (code === -1) return <span className="sbx-badge sbx-badge--danger">✗ Error</span>;
    return <span className="sbx-badge sbx-badge--warning">Exit {code}</span>;
}

function flagBadge(flag) {
    if (!flag) return null;
    const labels = {
        timeout: { cls: "sbx-badge--warning", icon: "⏱", txt: "Timeout" },
        memory_exceeded: { cls: "sbx-badge--danger", icon: "💾", txt: "Memory!" },
        docker_unavailable: { cls: "sbx-badge--danger", icon: "🐋", txt: "No Docker" },
        image_missing: { cls: "sbx-badge--warning", icon: "📦", txt: "No Image" },
        error: { cls: "sbx-badge--danger", icon: "⚠", txt: "Error" },
    };
    const meta = labels[flag] || { cls: "sbx-badge--warning", icon: "⚠", txt: flag };
    return <span className={`sbx-badge ${meta.cls}`}>{meta.icon} {meta.txt}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function SbxStatCard({ icon, label, value, accent, sublabel }) {
    return (
        <div className="sbx-stat" style={{ "--sbx-accent": accent }}>
            <div className="sbx-stat__icon"><i className={`fas ${icon}`} /></div>
            <div className="sbx-stat__body">
                <div className="sbx-stat__value">{value}</div>
                <div className="sbx-stat__label">{label}</div>
                {sublabel && <div className="sbx-stat__sub">{sublabel}</div>}
            </div>
            <div className="sbx-stat__glow" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CONTAINER CARD
// ─────────────────────────────────────────────────────────────────────────────

function ContainerCard({ session, onKill, killing }) {
    const [tick, setTick] = React.useState(0);
    React.useEffect(() => {
        const t = setInterval(() => setTick(p => p + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const memColor = session.memory_pct > 80 ? "#ff3333" : session.memory_pct > 50 ? "#ffcc00" : "#00ffbf";
    const cpuColor = session.cpu_pct > 80 ? "#ff3333" : session.cpu_pct > 50 ? "#ffcc00" : "#00d2ff";

    return (
        <div className="sbx-container-card">
            {/* Header */}
            <div className="sbx-container-card__head">
                <div className="sbx-live-dot" />
                <span className="sbx-container-card__type">{simTypeLabel(session.sim_type)}</span>
                <span className="sbx-container-card__port">:{session.port}</span>
                <button
                    className="sbx-kill-btn"
                    onClick={() => onKill(session.id, session.full_container_id)}
                    disabled={killing}
                    title="Force stop this container"
                >
                    {killing ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-power-off" /> Kill</>}
                </button>
            </div>

            {/* User info */}
            <div className="sbx-container-card__user">
                <div className="sbx-avatar">{(session.user || "?")[0].toUpperCase()}</div>
                <div>
                    <div className="sbx-container-card__username">{session.user}</div>
                    <div className="sbx-container-card__cid">
                        <i className="fas fa-cube" /> {session.container_id}
                    </div>
                </div>
                <div className="sbx-container-card__uptime">
                    <i className="fas fa-clock" /> {fmtUptime(session.started)}
                </div>
            </div>

            {/* Resource bars */}
            <div className="sbx-res-bars">
                <div className="sbx-res-bar">
                    <div className="sbx-res-bar__label">
                        <i className="fas fa-memory" /> MEM
                        <span style={{ color: memColor }}>{fmtBytes(session.memory_mb)}</span>
                    </div>
                    <div className="sbx-progress">
                        <div className="sbx-progress__fill" style={{ width: `${Math.min(session.memory_pct, 100)}%`, background: memColor }} />
                    </div>
                </div>
                <div className="sbx-res-bar">
                    <div className="sbx-res-bar__label">
                        <i className="fas fa-microchip" /> CPU
                        <span style={{ color: cpuColor }}>{Number(session.cpu_pct || 0).toFixed(1)}%</span>
                    </div>
                    <div className="sbx-progress">
                        <div className="sbx-progress__fill" style={{ width: `${Math.min(session.cpu_pct, 100)}%`, background: cpuColor }} />
                    </div>
                </div>
            </div>

            {/* Recent log */}
            {session.logs && session.logs[0] && (
                <div className="sbx-container-card__log">
                    <i className="fas fa-terminal" style={{ color: "#00d2ff", marginRight: 6 }} />
                    <span>{session.logs[0].msg}</span>
                    <span className="sbx-log-time">{session.logs[0].time}</span>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXEC LOG TABLE
// ─────────────────────────────────────────────────────────────────────────────

function ExecLogsTable({ logs }) {
    const [expanded, setExpanded] = React.useState(null);
    if (!logs || logs.length === 0) {
        return (
            <div className="sbx-empty">
                <i className="fas fa-history" />
                <p>No code execution history yet.</p>
                <small>Use the Admin Code Runner panel below to run sandbox code.</small>
            </div>
        );
    }
    return (
        <div className="sbx-table-wrap">
            <table className="sbx-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>User</th>
                        <th>Code</th>
                        <th>Time</th>
                        <th>Exit</th>
                        <th>Flag</th>
                        <th>At</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((l, i) => (
                        <React.Fragment key={l.id}>
                            <tr className={expanded === l.id ? "sbx-table__row--expanded" : ""} onClick={() => setExpanded(expanded === l.id ? null : l.id)} style={{ cursor: "pointer" }}>
                                <td className="sbx-table__id">{l.id}</td>
                                <td>
                                    <span className="sbx-table__user">
                                        <div className="sbx-avatar sbx-avatar--sm">{(l.username || "?")[0].toUpperCase()}</div>
                                        {l.username || "admin"}
                                    </span>
                                </td>
                                <td>
                                    <code className="sbx-code-snippet">{(l.code_snippet || "").slice(0, 45)}{l.code_snippet?.length > 45 ? "…" : ""}</code>
                                </td>
                                <td className="sbx-table__num">{l.execution_time != null ? `${Number(l.execution_time).toFixed(3)}s` : "—"}</td>
                                <td>{exitCodeBadge(l.exit_code)}</td>
                                <td>{flagBadge(l.flag)}</td>
                                <td className="sbx-table__dim">{l.created_at ? new Date(l.created_at).toLocaleTimeString() : "—"}</td>
                                <td><i className={`fas fa-chevron-${expanded === l.id ? "up" : "down"}`} style={{ color: "#555", fontSize: "0.75rem" }} /></td>
                            </tr>
                            {expanded === l.id && (
                                <tr className="sbx-table__expanded-row">
                                    <td colSpan={8}>
                                        <div className="sbx-expanded-body">
                                            <div className="sbx-expanded-col">
                                                <div className="sbx-expanded-label"><i className="fas fa-code" /> Code</div>
                                                <pre className="sbx-pre">{l.code_snippet || "(empty)"}</pre>
                                            </div>
                                            <div className="sbx-expanded-col">
                                                <div className="sbx-expanded-label"><i className="fas fa-terminal" /> Output</div>
                                                <pre className="sbx-pre sbx-pre--output">{l.output || "(no output)"}</pre>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW
// ─────────────────────────────────────────────────────────────────────────────

function SandboxView({ user }) {
    const [stats, setStats] = React.useState(null);
    const [sessions, setSessions] = React.useState([]);
    const [execLogs, setExecLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [killing, setKilling] = React.useState({});
    const [tab, setTab] = React.useState("live");   // "live" | "logs"
    const [lastRefresh, setLastRefresh] = React.useState(null);
    const [autoRefresh, setAutoRefresh] = React.useState(true);
    const intervalRef = React.useRef(null);

    const loadAll = React.useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError("");
        try {
            const [s, sess, logs] = await Promise.all([
                fetch("http://127.0.0.1:8000/admin/sandbox/stats", { headers: { "user-id": String(user?.id || 1) } }).then(r => r.json()),
                fetch("http://127.0.0.1:8000/admin/sandbox", { headers: { "user-id": String(user?.id || 1) } }).then(r => r.json()),
                fetch("http://127.0.0.1:8000/admin/sandbox/exec-logs", { headers: { "user-id": String(user?.id || 1) } }).then(r => r.json()),
            ]);
            setStats(s);
            setSessions(Array.isArray(sess) ? sess : []);
            setExecLogs(Array.isArray(logs) ? logs : []);
            setLastRefresh(new Date());
        } catch (e) {
            setError("Backend unreachable — make sure FastAPI is running on port 8000.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    React.useEffect(() => {
        loadAll();
    }, [loadAll]);

    React.useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(() => loadAll(true), 5000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [autoRefresh, loadAll]);

    const killContainer = async (sessionId, containerId) => {
        const key = sessionId;
        setKilling(k => ({ ...k, [key]: true }));
        try {
            await fetch(`http://127.0.0.1:8000/admin/sandbox/${sessionId}/stop`, {
                method: "POST",
                headers: { "user-id": String(user?.id || 1) }
            });
            await loadAll(true);
        } catch (e) {
            alert("Failed to kill container: " + e.message);
        } finally {
            setKilling(k => { const n = { ...k }; delete n[key]; return n; });
        }
    };

    // ── RENDER ──────────────────────────────────────────────────────────────

    return (
        <div className="sbx-root">
            {/* ── Styles ── */}
            <style>{`
                /* ===== SANDBOX MONITOR STYLES ===== */
                .sbx-root { display:flex; flex-direction:column; gap:20px; animation:sbxFadeIn .4s ease; }
                @keyframes sbxFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

                /* ─ Header Bar ─ */
                .sbx-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; }
                .sbx-header__left { display:flex; align-items:center; gap:14px; }
                .sbx-header__title { font-family:'Orbitron',sans-serif; font-size:1.3rem; color:#fff; letter-spacing:1px; }
                .sbx-header__title i { color:#00d2ff; margin-right:10px; }
                .sbx-header__subtitle { font-size:0.8rem; color:#555; margin-top:3px; }
                .sbx-header__right { display:flex; align-items:center; gap:10px; }
                .sbx-refresh-time { font-size:0.78rem; color:#444; }
                .sbx-refresh-time i { color:#00d2ff; margin-right:4px; }
                .sbx-toggle { display:flex; align-items:center; gap:7px; font-size:0.8rem; color:#666; cursor:pointer; }
                .sbx-toggle input { accent-color:#00d2ff; width:14px; height:14px; }
                .sbx-toggle:hover { color:#ccc; }
                .sbx-refresh-btn { background:none; border:1px solid #222; color:#666; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem; transition:.2s; display:flex; align-items:center; gap:6px; }
                .sbx-refresh-btn:hover { border-color:#00d2ff; color:#00d2ff; }

                /* ─ Stats Row ─ */
                .sbx-stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
                @media(max-width:900px) { .sbx-stats-row { grid-template-columns:repeat(2,1fr); } }
                .sbx-stat { background:#0d0d0f; border:1px solid #1a1a1a; border-radius:10px; padding:16px 18px; display:flex; align-items:center; gap:14px; position:relative; overflow:hidden; transition:border-color .3s; }
                .sbx-stat:hover { border-color:var(--sbx-accent,#00d2ff); }
                .sbx-stat__icon { width:42px; height:42px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; background:rgba(0,210,255,0.08); color:var(--sbx-accent,#00d2ff); border:1px solid var(--sbx-accent,#00d2ff); flex-shrink:0; }
                .sbx-stat__body { flex:1; min-width:0; }
                .sbx-stat__value { font-family:'Orbitron',sans-serif; font-size:1.6rem; color:#fff; line-height:1; }
                .sbx-stat__label { font-size:0.75rem; color:#555; margin-top:4px; text-transform:uppercase; letter-spacing:.5px; }
                .sbx-stat__sub { font-size:0.7rem; color:var(--sbx-accent,#00d2ff); margin-top:3px; }
                .sbx-stat__glow { position:absolute; right:-20px; top:-20px; width:80px; height:80px; border-radius:50%; background:radial-gradient(circle,var(--sbx-accent,#00d2ff)22,0%,transparent 70%); opacity:.04; pointer-events:none; }

                /* ─ Error / Dismiss ─ */
                .sbx-error { background:rgba(255,51,51,.08); border:1px solid rgba(255,51,51,.3); border-radius:8px; padding:14px 18px; color:#ff6666; display:flex; align-items:center; gap:12px; font-size:.9rem; }
                .sbx-error i { font-size:1.1rem; }

                /* ─ Tabs ─ */
                .sbx-tabs { display:flex; align-items:center; gap:6px; border-bottom:1px solid #1a1a1a; padding-bottom:2px; }
                .sbx-tab { background:none; border:none; color:#555; padding:9px 16px; border-radius:6px 6px 0 0; cursor:pointer; font-size:.88rem; display:flex; align-items:center; gap:7px; transition:.2s; font-family:inherit; border-bottom:2px solid transparent; }
                .sbx-tab:hover { color:#aaa; }
                .sbx-tab.active { color:#00d2ff; border-bottom-color:#00d2ff; background:rgba(0,210,255,.05); }
                .sbx-tab .sbx-count { background:#222; color:#888; border-radius:10px; padding:1px 7px; font-size:.74rem; margin-left:2px; }
                .sbx-tab.active .sbx-count { background:rgba(0,210,255,.15); color:#00d2ff; }

                /* ─ Container Grid ─ */
                .sbx-container-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:16px; }
                .sbx-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:50px 20px; color:#333; }
                .sbx-empty i { font-size:2.4rem; }
                .sbx-empty p { font-size:1rem; color:#444; margin:0; }
                .sbx-empty small { color:#333; font-size:.82rem; }

                /* ─ Container Card ─ */
                .sbx-container-card { background:#0d0d0f; border:1px solid #1e1e22; border-radius:12px; padding:18px; display:flex; flex-direction:column; gap:14px; transition:border-color .3s,box-shadow .3s; animation:sbxFadeIn .3s ease; }
                .sbx-container-card:hover { border-color:#00d2ff30; box-shadow:0 0 20px rgba(0,210,255,.04); }
                .sbx-container-card__head { display:flex; align-items:center; gap:8px; }
                .sbx-live-dot { width:8px; height:8px; border-radius:50%; background:#00ffbf; box-shadow:0 0 6px #00ffbf; animation:pulse 1.5s infinite; flex-shrink:0; }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
                .sbx-container-card__type { font-weight:600; color:#eee; font-size:.92rem; flex:1; }
                .sbx-container-card__port { font-size:.8rem; color:#555; margin-right:4px; }
                .sbx-kill-btn { background:rgba(255,51,51,.08); border:1px solid rgba(255,51,51,.25); color:#ff5555; padding:5px 11px; border-radius:6px; cursor:pointer; font-size:.78rem; display:flex; align-items:center; gap:5px; transition:.2s; font-family:inherit; }
                .sbx-kill-btn:hover:not(:disabled) { background:rgba(255,51,51,.18); border-color:#ff3333; box-shadow:0 0 10px rgba(255,51,51,.2); }
                .sbx-kill-btn:disabled { opacity:.5; cursor:not-allowed; }

                .sbx-container-card__user { display:flex; align-items:center; gap:12px; }
                .sbx-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#00d2ff,#006eff); color:#000; font-weight:700; font-size:.85rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
                .sbx-avatar--sm { width:24px; height:24px; font-size:.7rem; }
                .sbx-container-card__username { font-weight:600; color:#e0e0e0; font-size:.9rem; }
                .sbx-container-card__cid { font-size:.73rem; color:#444; margin-top:2px; font-family:monospace; }
                .sbx-container-card__cid i { margin-right:4px; }
                .sbx-container-card__uptime { margin-left:auto; font-size:.8rem; color:#00d2ff; white-space:nowrap; }
                .sbx-container-card__uptime i { margin-right:4px; }

                .sbx-res-bars { display:flex; flex-direction:column; gap:8px; }
                .sbx-res-bar__label { display:flex; justify-content:space-between; font-size:.76rem; color:#555; margin-bottom:4px; text-transform:uppercase; letter-spacing:.4px; }
                .sbx-res-bar__label i { margin-right:5px; }
                .sbx-res-bar__label span { font-weight:600; }
                .sbx-progress { background:#111; border-radius:4px; height:5px; overflow:hidden; }
                .sbx-progress__fill { height:100%; border-radius:4px; transition:width .8s ease; box-shadow:0 0 6px currentColor; }

                .sbx-container-card__log { background:#080808; border:1px solid #1a1a1a; border-radius:6px; padding:8px 12px; font-size:.76rem; color:#555; display:flex; align-items:center; font-family:monospace; }
                .sbx-log-time { margin-left:auto; color:#333; }

                /* ─ Execution Log Table ─ */
                .sbx-table-wrap { background:#0d0d0f; border:1px solid #1a1a1a; border-radius:10px; overflow:auto; }
                .sbx-table { width:100%; border-collapse:collapse; font-size:.87rem; }
                .sbx-table th { padding:12px 16px; text-align:left; color:#00d2ff; font-family:'Orbitron',sans-serif; font-weight:500; font-size:.74rem; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid #1a1a1a; white-space:nowrap; }
                .sbx-table td { padding:11px 16px; border-bottom:1px solid #111; vertical-align:middle; }
                .sbx-table tr:last-child td { border-bottom:none; }
                .sbx-table tbody tr:hover { background:rgba(255,255,255,.015); }
                .sbx-table__row--expanded { background:rgba(0,210,255,.03) !important; }
                .sbx-table__id { color:#333; font-family:monospace; }
                .sbx-table__user { display:flex; align-items:center; gap:8px; }
                .sbx-table__num { font-family:monospace; color:#00d2ff; }
                .sbx-table__dim { color:#444; font-size:.8rem; }
                .sbx-code-snippet { background:#111; padding:3px 7px; border-radius:4px; font-size:.78rem; color:#aaa; font-family:monospace; white-space:nowrap; display:inline-block; max-width:250px; overflow:hidden; text-overflow:ellipsis; vertical-align:middle; }

                /* ─ Expanded Row ─ */
                .sbx-table__expanded-row { background:#080808 !important; }
                .sbx-expanded-body { display:grid; grid-template-columns:1fr 1fr; gap:16px; padding:16px; }
                .sbx-expanded-label { font-size:.75rem; color:#555; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
                .sbx-expanded-label i { color:#00d2ff; }
                .sbx-pre { background:#0a0a0a; border:1px solid #1a1a1a; border-radius:6px; padding:12px; font-size:.8rem; font-family:monospace; color:#aaa; white-space:pre-wrap; word-break:break-all; max-height:150px; overflow-y:auto; margin:0; line-height:1.5; }
                .sbx-pre--output { color:#00ffbf; }

                /* ─ Badges ─ */
                .sbx-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:20px; font-size:.73rem; font-weight:600; }
                .sbx-badge--success { background:rgba(0,255,191,.1); color:#00ffbf; border:1px solid rgba(0,255,191,.3); }
                .sbx-badge--warning { background:rgba(255,204,0,.1); color:#ffcc00; border:1px solid rgba(255,204,0,.3); }
                .sbx-badge--danger { background:rgba(255,51,51,.1); color:#ff5555; border:1px solid rgba(255,51,51,.3); }


                /* Loading state */
                .sbx-loading { display:flex; align-items:center; gap:12px; color:#555; padding:40px; font-size:.95rem; justify-content:center; }
                .sbx-loading i { color:#00d2ff; font-size:1.3rem; }

                /* Section header */
                .sbx-section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
                .sbx-section-title { font-family:'Orbitron',sans-serif; font-size:.88rem; color:#555; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:8px; }
                .sbx-section-title i { color:#00d2ff; }
            `}</style>

            {/* ── Header ── */}
            <div className="sbx-header">
                <div className="sbx-header__left">
                    <div>
                        <div className="sbx-header__title"><i className="fas fa-server" />Sandbox Monitor</div>
                        <div className="sbx-header__subtitle">Real-time Docker container oversight &amp; execution control</div>
                    </div>
                </div>
                <div className="sbx-header__right">
                    {lastRefresh && (
                        <div className="sbx-refresh-time">
                            <i className="fas fa-sync-alt" />Last: {lastRefresh.toLocaleTimeString()}
                        </div>
                    )}
                    <label className="sbx-toggle">
                        <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
                        Auto-refresh (5s)
                    </label>
                    <button className="sbx-refresh-btn" onClick={() => loadAll(false)}>
                        <i className="fas fa-redo" />Refresh
                    </button>
                </div>
            </div>

            {/* ── Error Banner ── */}
            {error && (
                <div className="sbx-error">
                    <i className="fas fa-exclamation-triangle" />
                    {error}
                </div>
            )}

            {/* ── Stats Row ── */}
            <div className="sbx-stats-row">
                <SbxStatCard
                    icon="fa-cube"
                    label="Active Containers"
                    value={loading ? "—" : (stats?.docker_active ?? stats?.active_sessions ?? 0)}
                    accent="#00d2ff"
                    sublabel={stats?.active_sessions != null ? `${stats.active_sessions} in DB` : null}
                />
                <SbxStatCard
                    icon="fa-calendar-day"
                    label="Sessions Today"
                    value={loading ? "—" : (stats?.today_sessions ?? 0)}
                    accent="#00ffbf"
                    sublabel={stats?.total_sessions != null ? `${stats.total_sessions} all time` : null}
                />
                <SbxStatCard
                    icon="fa-memory"
                    label="Total Memory"
                    value={loading ? "—" : `${stats?.total_memory_mb ?? 0} MB`}
                    accent="#a855f7"
                    sublabel="across all containers"
                />
                <SbxStatCard
                    icon="fa-ban"
                    label="Terminated Today"
                    value={loading ? "—" : (stats?.killed_today ?? 0)}
                    accent="#ff3333"
                    sublabel={stats?.exec_runs != null ? `${stats.exec_runs} exec runs` : null}
                />
            </div>

            {/* ── Tabs ── */}
            <div className="sbx-tabs">
                <button className={`sbx-tab ${tab === "live" ? "active" : ""}`} onClick={() => setTab("live")}>
                    <i className="fas fa-satellite-dish" />Live Containers
                    <span className="sbx-count">{sessions.length}</span>
                </button>
                <button className={`sbx-tab ${tab === "logs" ? "active" : ""}`} onClick={() => setTab("logs")}>
                    <i className="fas fa-history" />Execution History
                    <span className="sbx-count">{execLogs.length}</span>
                </button>
            </div>

            {/* ── Tab Content ── */}
            {loading ? (
                <div className="sbx-loading"><i className="fas fa-circle-notch fa-spin" />Loading sandbox data…</div>
            ) : tab === "live" ? (
                <>
                    <div className="sbx-section-header">
                        <div className="sbx-section-title">
                            <i className="fas fa-satellite-dish" />
                            {sessions.length > 0 ? `${sessions.length} Active Simulation Container${sessions.length !== 1 ? "s" : ""}` : "No Active Containers"}
                        </div>
                    </div>
                    {sessions.length === 0 ? (
                        <div className="sbx-empty">
                            <i className="fas fa-cubes" />
                            <p>No active simulation containers</p>
                            <small>When users launch simulation labs, they will appear here with live resource stats.</small>
                        </div>
                    ) : (
                        <div className="sbx-container-grid">
                            {sessions.map(s => (
                                <ContainerCard
                                    key={s.id}
                                    session={s}
                                    onKill={killContainer}
                                    killing={!!killing[s.id]}
                                />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="sbx-section-header">
                        <div className="sbx-section-title">
                            <i className="fas fa-history" />Code Execution Audit Log
                        </div>
                    </div>
                    <ExecLogsTable logs={execLogs} />
                </>
            )}
        </div>
    );
}
