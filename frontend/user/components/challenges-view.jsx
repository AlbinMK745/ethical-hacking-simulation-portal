/**
 * HACKING CHALLENGES VIEW
 * Interface for engaging and breaching system challenges.
 * Includes AI Hint Generator + Vulnerability Explanation — shown in a popup modal.
 */

function ChallengesView({ user, onSuccess }) {
    const [state, setState] = React.useState({
        loading: true,
        error: "",
        rows: [],
        flags: {},
        labs: {},
        q: "",
        diff: "All",
        launchingLab: null
    });

    // AI modal state: { open: bool, type: 'hint'|'expl', challengeId, loading, content }
    const [aiModal, setAiModal] = React.useState({
        open: false,
        type: "hint",
        challengeId: null,
        loading: false,
        content: null,
        title: "",
    });

    // Cache already-fetched results: { [challengeId]: { hint, expl } }
    const [aiCache, setAiCache] = React.useState({});

    const load = async () => {
        setState((p) => ({ ...p, loading: true, error: "" }));
        try {
            const rows = await api(`/user/challenges/`, { headers: { "user-id": String(user.id) } });
            const activeLabs = {};
            if (Array.isArray(rows)) {
                rows.forEach(r => { if (r.active_lab) activeLabs[r.id] = r.active_lab; });
            }
            setState((p) => ({ ...p, loading: false, rows: Array.isArray(rows) ? rows : [], labs: activeLabs }));
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err.message }));
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    // Close AI modal on Escape key
    React.useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") closeAiModal(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const submit = async (cid) => {
        const flag = (state.flags[cid] || "").trim();
        if (!flag) return alert("Enter a flag first.");
        try {
            await fetch(`${API_BASE}/user/challenges/start/${cid}`, { method: "POST", headers: { "user-id": String(user.id) } });
            const res = await api(`/user/challenges/submit/${cid}`, {
                method: "POST",
                headers: { "user-id": String(user.id), "Content-Type": "application/json" },
                body: JSON.stringify({ flag })
            });
            if (res.correct) {
                onSuccess({ message: "Challenge successfully breached. Data decrypted.", points: res.points_earned || 0 });
                if (state.labs[cid]) stopLab(cid);
            } else {
                alert("Wrong flag.");
            }
            load();
        } catch (err) {
            alert(err.message);
        }
    };

    const launchLab = async (challenge) => {
        if (!challenge.sim_type) { alert("This challenge does not have a simulation lab."); return; }
        setState((p) => ({ ...p, launchingLab: challenge.id }));
        try {
            const data = await api(`/simulation/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, sim_type: challenge.sim_type })
            });
            setState((p) => ({ ...p, labs: { ...p.labs, [challenge.id]: data }, launchingLab: null }));
            window.open(data.url, "_blank");
        } catch (err) {
            setState((p) => ({ ...p, launchingLab: null }));
            alert(err.message);
        }
    };

    const stopLab = async (cid) => {
        const lab = state.labs[cid];
        if (!lab) return;
        try {
            await api(`/simulation/stop`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ container_id: lab.container_id })
            });
            setState((p) => { const nl = { ...p.labs }; delete nl[cid]; return { ...p, labs: nl }; });
        } catch (err) { alert(err.message); }
    };

    // ── AI Modal helpers ─────────────────────────────────────────────────────

    const closeAiModal = () => setAiModal((p) => ({ ...p, open: false }));

    const openHint = async (c) => {
        // Show cached if available
        if (aiCache[c.id]?.hint) {
            setAiModal({ open: true, type: "hint", challengeId: c.id, loading: false, content: aiCache[c.id].hint, title: c.title });
            return;
        }
        setAiModal({ open: true, type: "hint", challengeId: c.id, loading: true, content: null, title: c.title });
        try {
            const res = await fetch(`${API_BASE}/ai/hint`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "user-id": String(user.id) },
                body: JSON.stringify({ title: c.title, description: c.description, attempts: c.attempts || 0 })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "AI error");
            setAiCache(prev => ({ ...prev, [c.id]: { ...prev[c.id], hint: data.hint } }));
            setAiModal(prev => prev.open ? { ...prev, loading: false, content: data.hint } : prev);
        } catch (err) {
            const msg = "⚠ AI service unavailable: " + err.message;
            setAiCache(prev => ({ ...prev, [c.id]: { ...prev[c.id], hint: msg } }));
            setAiModal(prev => prev.open ? { ...prev, loading: false, content: msg } : prev);
        }
    };

    const openExplanation = async (c) => {
        // Show cached if available
        if (aiCache[c.id]?.expl) {
            setAiModal({ open: true, type: "expl", challengeId: c.id, loading: false, content: aiCache[c.id].expl, title: c.title });
            return;
        }
        setAiModal({ open: true, type: "expl", challengeId: c.id, loading: true, content: null, title: c.title });
        try {
            const res = await fetch(`${API_BASE}/ai/explanation`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "user-id": String(user.id) },
                body: JSON.stringify({ title: c.title, description: c.description, category: c.category || "General" })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "AI error");
            setAiCache(prev => ({ ...prev, [c.id]: { ...prev[c.id], expl: data.explanation } }));
            setAiModal(prev => prev.open ? { ...prev, loading: false, content: data.explanation } : prev);
        } catch (err) {
            const msg = "⚠ AI service unavailable: " + err.message;
            setAiCache(prev => ({ ...prev, [c.id]: { ...prev[c.id], expl: msg } }));
            setAiModal(prev => prev.open ? { ...prev, loading: false, content: msg } : prev);
        }
    };

    const renderAiText = (text) => {
        if (!text) return null;
        return text.split("\n").map((line, i) => {
            const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            return <p key={i} style={{ margin: "6px 0", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: bold }} />;
        });
    };

    // ── Render ──────────────────────────────────────────────────────────────

    if (state.loading) return <Loading text="Loading challenges..." />;
    if (state.error) return <ErrorBox error={state.error} />;

    const rows = state.rows || [];
    const easyCount = rows.filter((c) => String(c.difficulty || "").toLowerCase() === "easy").length;
    const mediumCount = rows.filter((c) => String(c.difficulty || "").toLowerCase() === "medium").length;
    const hardCount = rows.filter((c) => String(c.difficulty || "").toLowerCase() === "hard").length;
    const solvedCount = rows.filter((c) => c.status === "solved").length;
    const filtered = rows.filter((c) => {
        const diffOk = state.diff === "All" || String(c.difficulty || "").toLowerCase() === state.diff.toLowerCase();
        const q = state.q.trim().toLowerCase();
        const qOk = !q || String(c.title || "").toLowerCase().includes(q) || String(c.description || "").toLowerCase().includes(q) || String(c.category || "").toLowerCase().includes(q);
        return diffOk && qOk;
    });

    const isHint = aiModal.type === "hint";

    return (
        <div className="challenges-page">
            {/* ── Global AI Modal Styles ── */}
            <style>{`
                /* ── AI Popup Modal ── */
                .ai-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: rgba(0,0,0,0.72);
                    backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    animation: aiBgFade .25s ease;
                }
                @keyframes aiBgFade { from{opacity:0} to{opacity:1} }

                .ai-modal-box {
                    background: linear-gradient(145deg, #0d0d1a, #111827);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 620px;
                    max-height: 82vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: aiBoxSlide .28s cubic-bezier(.34,1.56,.64,1);
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 24px 64px rgba(0,0,0,0.6);
                }
                @keyframes aiBoxSlide { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

                .ai-modal-box--hint {
                    border-top: 3px solid #00d2ff;
                    box-shadow: 0 0 0 1px rgba(0,210,255,0.12), 0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(0,210,255,0.06);
                }
                .ai-modal-box--expl {
                    border-top: 3px solid #bc13fe;
                    box-shadow: 0 0 0 1px rgba(188,19,254,0.12), 0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(188,19,254,0.06);
                }

                .ai-modal-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    padding: 1.25rem 1.5rem 1rem;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    gap: 1rem;
                }
                .ai-modal-header-left {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .ai-modal-type-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    padding: 2px 10px;
                    border-radius: 20px;
                    width: fit-content;
                }
                .ai-modal-type-badge--hint {
                    background: rgba(0,210,255,0.12);
                    color: #00d2ff;
                    border: 1px solid rgba(0,210,255,0.25);
                }
                .ai-modal-type-badge--expl {
                    background: rgba(188,19,254,0.12);
                    color: #bc13fe;
                    border: 1px solid rgba(188,19,254,0.25);
                }
                .ai-modal-challenge-name {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin: 0;
                    line-height: 1.3;
                }
                .ai-modal-close {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #94a3b8;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                    transition: all .2s;
                    line-height: 1;
                }
                .ai-modal-close:hover {
                    background: rgba(255,80,80,0.15);
                    border-color: rgba(255,80,80,0.3);
                    color: #f87171;
                }

                .ai-modal-body {
                    padding: 1.25rem 1.5rem 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.1) transparent;
                }

                .ai-loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    padding: 2.5rem 1rem;
                    color: #64748b;
                }
                .ai-loading-spinner {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 3px solid rgba(255,255,255,0.05);
                    animation: aiSpin .8s linear infinite;
                }
                .ai-loading-spinner--hint { border-top-color: #00d2ff; }
                .ai-loading-spinner--expl { border-top-color: #bc13fe; }
                @keyframes aiSpin { to { transform: rotate(360deg); } }
                .ai-loading-text {
                    font-size: 0.85rem;
                    letter-spacing: 0.3px;
                }

                .ai-content {
                    font-size: 0.88rem;
                    line-height: 1.75;
                }
                .ai-content--hint { color: #bde8f5; }
                .ai-content--expl { color: #ddc8ff; }
                .ai-content p { margin: 6px 0; }
                .ai-content strong { font-weight: 700; }
                .ai-content--hint strong { color: #00d2ff; }
                .ai-content--expl strong { color: #cc44ff; }

                .ai-modal-footer {
                    padding: .75rem 1.5rem;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                }
                .ai-modal-footer-note {
                    font-size: 0.72rem;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .ai-modal-close-btn {
                    padding: .45rem 1.2rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    border: 1px solid rgba(255,255,255,0.12);
                    background: rgba(255,255,255,0.05);
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all .2s;
                }
                .ai-modal-close-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: #e2e8f0;
                }

                /* ── Card AI Buttons ── */
                .ai-btn-row {
                    display: flex;
                    gap: 8px;
                    margin-top: 10px;
                    flex-wrap: wrap;
                }
                .ai-btn {
                    background: none;
                    border: 1px solid rgba(0,210,255,0.3);
                    color: #00d2ff;
                    padding: 5px 12px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all .2s;
                    font-family: inherit;
                }
                .ai-btn:hover:not(:disabled) {
                    background: rgba(0,210,255,0.1);
                    border-color: #00d2ff;
                    box-shadow: 0 0 10px rgba(0,210,255,.2);
                }
                .ai-btn:disabled { opacity: .5; cursor: not-allowed; }
                .ai-btn--expl {
                    border-color: rgba(188,19,254,0.35);
                    color: #bc13fe;
                }
                .ai-btn--expl:hover:not(:disabled) {
                    background: rgba(188,19,254,0.1);
                    border-color: #bc13fe;
                    box-shadow: 0 0 10px rgba(188,19,254,.2);
                }
            `}</style>

            {/* ── AI Popup Modal ── */}
            {aiModal.open && (
                <div className="ai-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeAiModal(); }}>
                    <div className={`ai-modal-box ${isHint ? "ai-modal-box--hint" : "ai-modal-box--expl"}`}>
                        {/* Header */}
                        <div className="ai-modal-header">
                            <div className="ai-modal-header-left">
                                <span className={`ai-modal-type-badge ${isHint ? "ai-modal-type-badge--hint" : "ai-modal-type-badge--expl"}`}>
                                    <i className={`fas ${isHint ? "fa-robot" : "fa-brain"}`} />
                                    {isHint ? "AI Hint" : "Vulnerability Explanation"}
                                </span>
                                <p className="ai-modal-challenge-name">{aiModal.title}</p>
                            </div>
                            <button className="ai-modal-close" onClick={closeAiModal} title="Close (Esc)">×</button>
                        </div>

                        {/* Body */}
                        <div className="ai-modal-body">
                            {aiModal.loading ? (
                                <div className="ai-loading-state">
                                    <div className={`ai-loading-spinner ${isHint ? "ai-loading-spinner--hint" : "ai-loading-spinner--expl"}`} />
                                    <span className="ai-loading-text">
                                        {isHint ? "Generating contextual hint..." : "Analysing vulnerability..."}
                                    </span>
                                </div>
                            ) : (
                                <div className={`ai-content ${isHint ? "ai-content--hint" : "ai-content--expl"}`}>
                                    {renderAiText(aiModal.content)}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!aiModal.loading && (
                            <div className="ai-modal-footer">
                                <span className="ai-modal-footer-note">
                                    <i className="fas fa-shield-alt" />
                                    Powered by Groq · No flags or payloads revealed
                                </span>
                                <button className="ai-modal-close-btn" onClick={closeAiModal}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="chal-toolbar">
                <div className="chal-toolbar-title">
                    <span className="chal-title-big">Hacking Challenges</span>
                    <span className="chal-solved-count">{solvedCount} / {rows.length} solved</span>
                </div>
                <div className="chal-toolbar-right">
                    <div className="chal-filter-pills">
                        <button type="button" className={`chal-pill ${state.diff === "All" ? "active" : ""}`} onClick={() => setState((p) => ({ ...p, diff: "All" }))}>All <span className="pill-count">{rows.length}</span></button>
                        <button type="button" className={`chal-pill easy ${state.diff === "Easy" ? "active" : ""}`} onClick={() => setState((p) => ({ ...p, diff: "Easy" }))}>Easy <span className="pill-count">{easyCount}</span></button>
                        <button type="button" className={`chal-pill medium ${state.diff === "Medium" ? "active" : ""}`} onClick={() => setState((p) => ({ ...p, diff: "Medium" }))}>Medium <span className="pill-count">{mediumCount}</span></button>
                        <button type="button" className={`chal-pill hard ${state.diff === "Hard" ? "active" : ""}`} onClick={() => setState((p) => ({ ...p, diff: "Hard" }))}>Hard <span className="pill-count">{hardCount}</span></button>
                    </div>
                    <div className="chal-search-wrap">
                        <i className="fas fa-search chal-search-icon"></i>
                        <input className="chal-search-input" placeholder="Search challenges..." value={state.q} onChange={(e) => setState((p) => ({ ...p, q: e.target.value }))} />
                    </div>
                </div>
            </div>

            {/* ── Cards Grid ── */}
            <div className="challenges-grid">
                {filtered.map((c, idx) => {
                    const isSolved  = c.status === "solved";
                    const diff      = String(c.difficulty || "easy").toLowerCase();
                    const labActive = !!state.labs[c.id];
                    const CAT_ICONS = {
                        "Web Hacking":       "fa-globe",
                        "System Exploitation":"fa-terminal",
                        "Network":           "fa-network-wired",
                        "Cryptography":      "fa-lock",
                        "Authentication":    "fa-shield-alt",
                        "Forensics":         "fa-search",
                    };
                    const catIcon = CAT_ICONS[c.category] || "fa-crosshairs";

                    return (
                        <div key={c.id}
                             className={`chal-card diff-${diff} ${isSolved ? "solved-card" : ""}`}
                             style={{ animationDelay: `${idx * 0.055}s` }}>

                            {/* ── Header badges ── */}
                            <div className="chal-card-header">
                                <span className={`diff-badge ${diff}`}>{c.difficulty}</span>
                                {isSolved && (
                                    <span className="solved-badge">
                                        <i className="fas fa-check-circle"></i> Completed
                                    </span>
                                )}
                                {labActive && !isSolved && (
                                    <span className="solved-badge running-badge">
                                        <i className="fas fa-satellite-dish pulse"></i> Lab Live
                                    </span>
                                )}
                            </div>

                            {/* ── Body ── */}
                            <div className="chal-card-body">
                                <div className="chal-cat-tag">
                                    <i className={`fas ${catIcon}`}></i>
                                    {c.category || "General"}
                                </div>
                                <h3 className="chal-title">{c.title}</h3>
                                <p className="chal-desc">{c.description}</p>
                            </div>

                            {/* ── Points + category pills ── */}
                            <div className="chal-meta-row">
                                <span className="chal-pts-badge">
                                    <i className="fas fa-bolt"></i>
                                    {c.points} XP
                                </span>
                                <span className="chal-cat-badge">
                                    <i className={`fas ${catIcon}`}></i>
                                    {c.category || "General"}
                                </span>
                            </div>

                            {/* ── Lab controls ── */}
                            {c.sim_type && (
                                <div className="chal-lab-section">
                                    {!labActive ? (
                                        <button type="button"
                                                className="modal-submit-btn"
                                                onClick={() => launchLab(c)}
                                                disabled={state.launchingLab === c.id}>
                                            <i className={`fas ${state.launchingLab === c.id ? "fa-spinner fa-spin" : "fa-flask"}`}></i>
                                            {state.launchingLab === c.id ? "Launching..." : "Launch Simulation Lab"}
                                        </button>
                                    ) : (
                                        <div className="chal-lab-running">
                                            <button type="button" className="btn-outline"
                                                    onClick={() => window.open(state.labs[c.id].url, "_blank")}>
                                                <i className="fas fa-external-link-alt"></i> Reopen
                                            </button>
                                            <button type="button" className="btn-outline"
                                                    onClick={() => stopLab(c.id)}>
                                                <i className="fas fa-stop-circle"></i> Stop
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Flag submission ── */}
                            <div className="chal-flag-row">
                                <input
                                    className="modal-input"
                                    placeholder="EHSP{...}"
                                    value={state.flags[c.id] || ""}
                                    autoComplete="off" autoCorrect="off" spellCheck={false}
                                    onChange={e => setState(p => ({ ...p, flags: { ...p.flags, [c.id]: e.target.value } }))}
                                    onPaste={e => {
                                        e.stopPropagation();
                                        const text = e.clipboardData.getData("text");
                                        setState(p => ({ ...p, flags: { ...p.flags, [c.id]: text } }));
                                        e.preventDefault();
                                    }}
                                    onKeyDown={e => e.key === "Enter" && submit(c.id)}
                                />
                                <button type="button"
                                        className="modal-submit-btn"
                                        onClick={e => { e.preventDefault(); submit(c.id); }}>
                                    <i className="fas fa-paper-plane"></i> Submit
                                </button>
                            </div>

                            {/* ── AI Buttons ── */}
                            <div className="ai-btn-row">
                                {!isSolved && (
                                    <button type="button" className="ai-btn"
                                            onClick={e => { e.preventDefault(); openHint(c); }}
                                            title="Get an AI hint without spoiling the flag">
                                        <i className="fas fa-robot"></i> AI Hint
                                    </button>
                                )}
                                <button type="button" className="ai-btn ai-btn--expl"
                                        onClick={e => { e.preventDefault(); openExplanation(c); }}
                                        title="Get an AI explanation of the vulnerability">
                                    <i className="fas fa-brain"></i> Explain
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

