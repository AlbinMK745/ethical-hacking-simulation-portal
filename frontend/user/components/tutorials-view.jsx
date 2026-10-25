/**
 * TUTORIALS AND MODULES VIEWS
 * Registry and reader for educational hacker paths.
 */

/**
 * Tactical Module Reader
 */
function TutorialReadingView({ user, moduleId, onBack, onUserUpdate, onSuccess }) {
    const [data, setData] = React.useState({ loading: true, module: null, rooms: [], activeRoomIdx: 0 });
    const [completing, setCompleting] = React.useState(false);

    const load = async () => {
        if (data.module && !data.loading) return;
        try {
            const res = await api(`/user/modules/${moduleId}`, { headers: { "user-id": String(user?.id || "") } });
            if (!res.module) throw new Error("Manifest incomplete: Module data missing.");

            // Find the first uncompleted room to continue where user left
            let firstUncompletedIdx = 0;
            if (res.rooms && res.rooms.length > 0) {
                const foundIdx = res.rooms.findIndex(r => !r.is_completed);
                if (foundIdx !== -1) firstUncompletedIdx = foundIdx;
            }

            setData({ loading: false, module: res.module, rooms: res.rooms || [], activeRoomIdx: firstUncompletedIdx });
        } catch (err) {
            console.error("[TutorialReader] Mission aborting due to error:", err);
            setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
    };

    React.useEffect(() => { load(); }, [moduleId]);

    if (data.loading) return <Loading text="Entering Tactical Reading Mode..." />;
    if (data.error) return (
        <div className="reader-tactical-layout">
            <div style={{ padding: '40px', textAlign: 'center', width: '100%' }}>
                <h2 style={{ color: 'var(--neon-red)', fontFamily: 'var(--font-heading)' }}>TACTICAL LINK FAILURE</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '15px 0 25px' }}>Error: {data.error}</p>
                <button className="btn-tactical-start" onClick={onBack}>RETURN TO REGISTRY</button>
            </div>
        </div>
    );
    if (!data.module) return <Loading text="Finalizing Mission Manifest..." />;

    const activeRoom = data.rooms[data.activeRoomIdx];

    const renderMarkdown = (content) => {
        const raw = content || "No mission intelligence available.";
        if (typeof marked === 'undefined') return `<pre>${raw}</pre>`;
        return marked.parse ? marked.parse(raw) : marked(raw);
    };

    const completeTask = async () => {
        if (!activeRoom || completing) return;
        setCompleting(true);
        try {
            const res = await api(`/user/modules/${moduleId}/rooms/${activeRoom.id}/complete`, {
                method: "POST",
                headers: { "user-id": String(user?.id || "") }
            });
            setData(prev => ({
                ...prev,
                rooms: prev.rooms.map((r, i) => i === prev.activeRoomIdx ? { ...r, is_completed: true } : r)
            }));
            if (res.points_earned > 0) {
                if (onSuccess) onSuccess({ message: `Mission room secured. Data integrity verified.`, points: res.points_earned });
                if (onUserUpdate) onUserUpdate(prev => ({ ...prev, points: (prev.points || 0) + res.points_earned }));
            }
            if (data.activeRoomIdx < (data.rooms?.length || 0) - 1) {
                setData(prev => ({ ...prev, activeRoomIdx: prev.activeRoomIdx + 1 }));
            }
        } catch (err) { alert("Completion Error: " + err.message); }
        finally { setCompleting(false); }
    };

    return (
        <div className="reader-tactical-layout">
            <aside className="reader-sidebar-elite">
                <div className="sidebar-header-elite">
                    <button className="btn-return" onClick={onBack}>
                        <i className="fas fa-chevron-left"></i> RETURN TO REGISTRY
                    </button>
                    <h2>{data.module.title}</h2>
                </div>
                <nav className="task-navigation-elite">
                    {(data.rooms || []).map((room, idx) => (
                        <div
                            key={room.id || idx}
                            className={`nav-task-item ${idx === data.activeRoomIdx ? "active" : ""} ${room.is_completed ? "completed" : ""}`}
                            onClick={() => setData(prev => ({ ...prev, activeRoomIdx: idx }))}
                        >
                            <div className="task-status-icon">
                                <i className={room.is_completed ? "fas fa-check-double" : (idx === data.activeRoomIdx ? "fas fa-dot-circle" : "far fa-circle")}></i>
                            </div>
                            <div className="task-info-minimal">
                                <h4>{room.title}</h4>
                                <span>{room.points || 10} XP • SEQUENCER {idx + 1}</span>
                            </div>
                        </div>
                    ))}
                    {(data.rooms?.length || 0) === 0 && <p className="dim-text" style={{ padding: '20px' }}>No tactical data found.</p>}
                </nav>
            </aside>

            <main className="reader-main-tactical">
                <div className="intel-container">
                    <div className="intel-header">
                        <h1>{activeRoom?.title || "Initialize Intel"}</h1>
                        <div className="intel-meta">
                            <span><i className="fas fa-shield-halved"></i> MISSION ID: {activeRoom?.id || "N/A"}</span>
                            <span><i className="fas fa-trophy"></i> REWARD: {activeRoom?.points || 10} XP</span>
                        </div>
                    </div>

                    <div
                        className="intel-body"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(activeRoom?.content || activeRoom?.description) }}
                    />

                    <div className="intel-footer">
                        <button
                            className={`btn-complete-tactical ${activeRoom?.is_completed ? 'completed-state' : ''}`}
                            onClick={completeTask}
                            disabled={completing || !activeRoom || activeRoom.is_completed}
                        >
                            {completing ? (
                                <><i className="fas fa-sync fa-spin"></i> SYNCING INTEL...</>
                            ) : (
                                activeRoom?.is_completed ? (
                                    <><i className="fas fa-check-double"></i> MISSION SECURED</>
                                ) : (
                                    <><i className="fas fa-upload"></i> SECURE INTEL & NEXT</>
                                )
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

/**
 * Module Registry View — ULTRA REDESIGN
 */
function TutorialsView({ user, savedOnly = false, onUserUpdate, onSuccess, onOpenModule }) {
    const [search, setSearch]           = React.useState("");
    const [activeCategory, setCategory] = React.useState("All");
    const [data, setData]               = React.useState({ loading: true, error: "", modules: [] });
    const [hoveredId, setHoveredId]     = React.useState(null);

    const load = React.useCallback(async () => {
        setData(p => ({ ...p, loading: true, error: "" }));
        try {
            let modules = [];
            if (savedOnly) {
                const res = await api(`/user/modules/saved`, { headers: { "user-id": String(user.id) } });
                modules = res.modules || [];
            } else {
                const params = new URLSearchParams({ page: "1", limit: "50", search, difficulty: "All", category: activeCategory });
                const res = await api(`/user/modules/?${params.toString()}`, { headers: { "user-id": String(user.id) } });
                modules = res.modules || [];
            }
            setData({ loading: false, error: "", modules: Array.isArray(modules) ? modules : [] });
        } catch (err) { setData({ loading: false, error: err.message, modules: [] }); }
    }, [savedOnly, activeCategory, search, user.id]);

    React.useEffect(() => { load(); }, [load]);

    const stats = React.useMemo(() => {
        const ms = data.modules || [];
        return {
            total:     ms.length,
            completed: ms.filter(m => m.completed_rooms_count > 0 && m.completed_rooms_count === m.room_count).length,
            points:    ms.reduce((a, m) => a + (m.earned_points || 0), 0),
        };
    }, [data.modules]);

    const toggleSave = async (e, module) => {
        e.stopPropagation();
        const isSaved = module.is_saved;
        setData(prev => ({ ...prev, modules: prev.modules.map(m => m.id === module.id ? { ...m, is_saved: !isSaved } : m) }));
        try {
            if (isSaved) await api(`/user/modules/${module.id}/save`, { method: "DELETE", headers: { "user-id": String(user.id) } });
            else          await api(`/user/modules/${module.id}/save`, { method: "POST",   headers: { "user-id": String(user.id) } });
            if (savedOnly) load();
        } catch {
            setData(prev => ({ ...prev, modules: prev.modules.map(m => m.id === module.id ? { ...m, is_saved: isSaved } : m) }));
        }
    };

    const CATEGORY_ICONS = {
        "Web Security":       "fa-globe",
        "Binary Exploitation":"fa-terminal",
        "Network Security":   "fa-network-wired",
        "Cryptography":       "fa-lock",
        "System Security":    "fa-server",
        "General":            "fa-shield-alt",
    };

    const THUMBNAILS = [
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=800&auto=format&fit=crop",
    ];

    const categories = ["All", "Web Security", "Binary Exploitation", "Network Security", "Cryptography", "System Security"];

    if (data.loading && data.modules.length === 0) return (
        typeof SkeletonGrid !== "undefined" ? <SkeletonGrid count={6} /> : <Loading text="Initializing Module Registry..." />
    );
    if (data.error) return <ErrorBox error={data.error} />;

    return (
        <div className="modules-page-container">
            {!savedOnly && (
                <>
                    {/* Stats Row */}
                    <div className="tactical-stats">
                        <div className="stat-card-premium">
                            <div className="stat-icon-box" style={{ color: '#00d2ff' }}><i className="fas fa-layer-group"></i></div>
                            <div className="stat-info-box"><h4>{stats.total}</h4><p>Tactical Modules</p></div>
                        </div>
                        <div className="stat-card-premium completed">
                            <div className="stat-icon-box" style={{ color: '#00ffbf' }}><i className="fas fa-check-double"></i></div>
                            <div className="stat-info-box"><h4>{stats.completed}</h4><p>Paths Secured</p></div>
                        </div>
                        <div className="stat-card-premium points">
                            <div className="stat-icon-box" style={{ color: '#bc13fe' }}><i className="fas fa-bolt"></i></div>
                            <div className="stat-info-box"><h4>{stats.points}</h4><p>Intel Points</p></div>
                        </div>
                    </div>

                    {/* Search + Filter */}
                    <div className="modules-header-tactical">
                        <div className="search-tactical">
                            <i className="fas fa-search"></i>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && load()}
                                placeholder="FILTER MODULE REGISTRY..."
                            />
                        </div>
                        <div className="filter-pills-tactical">
                            {categories.map(cat => (
                                <div key={cat}
                                     className={`pill-tactical ${activeCategory === cat ? "active" : ""}`}
                                     onClick={() => setCategory(cat)}>
                                    {cat}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Cards Grid */}
            <div className="modules-grid-premium">
                {data.modules.length === 0 ? (
                    <div className="empty-registry">
                        <i className="fas fa-ghost"></i>
                        <p>No tactical data matched your query.</p>
                    </div>
                ) : data.modules.map((m, idx) => {
                    const isComplete = m.completed_rooms_count > 0 && m.completed_rooms_count === m.room_count;
                    const pct = m.room_count > 0
                        ? Math.round((m.completed_rooms_count / m.room_count) * 100)
                        : 0;
                    const thumb = m.thumbnail_url || THUMBNAILS[idx % THUMBNAILS.length];
                    const catIcon = CATEGORY_ICONS[m.category] || "fa-shield-alt";

                    // SVG ring
                    const R = 18, C = 22, circumference = 2 * Math.PI * R;
                    const dashOffset = circumference - (pct / 100) * circumference;

                    return (
                        <div
                            key={m.id}
                            className={`module-card-elite ${isComplete ? "completed" : ""}`}
                            style={{ animationDelay: `${idx * 0.06}s` }}
                            onMouseEnter={() => setHoveredId(m.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => {
                                const from = savedOnly ? "saved-tutorials" : "tutorials";
                                window.location.href = `tutorial-reader.html?moduleId=${m.id}&from=${from}`;
                            }}
                        >
                            {/* ── Thumbnail ── */}
                            <div className="card-visuals"
                                 style={{ backgroundImage: `url(${thumb})` }}>

                                {/* Badges */}
                                <div className="card-badges">
                                    <span className={`elite-badge ${(m.difficulty || "Beginner").toLowerCase()}`}
                                          style={{ animationDelay: `${idx * 0.06 + 0.1}s` }}>
                                        {m.difficulty || "Beginner"}
                                    </span>
                                    <span className="elite-badge"
                                          style={{ animationDelay: `${idx * 0.06 + 0.18}s` }}>
                                        <i className={`fas ${catIcon}`} style={{ marginRight: 4 }}></i>
                                        {m.category || "General"}
                                    </span>
                                </div>

                                {/* Save button */}
                                <button
                                    className={`card-save-btn ${m.is_saved ? "saved" : ""}`}
                                    onClick={e => toggleSave(e, m)}
                                    title={m.is_saved ? "Unsave" : "Save"}
                                >
                                    <i className={m.is_saved ? "fas fa-bookmark" : "far fa-bookmark"}></i>
                                </button>

                                {/* Progress Ring */}
                                {m.room_count > 0 && (
                                    <div className="card-progress-ring">
                                        <svg width="44" height="44" viewBox="0 0 44 44">
                                            <circle className="ring-bg"   cx={C} cy={C} r={R} />
                                            <circle className="ring-fill" cx={C} cy={C} r={R}
                                                strokeDasharray={circumference}
                                                strokeDashoffset={hoveredId === m.id ? dashOffset : circumference}
                                                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)' }}
                                            />
                                        </svg>
                                        <div className="ring-label">
                                            {hoveredId === m.id ? `${pct}%` : <i className="fas fa-terminal" style={{ fontSize: '0.55rem', color: '#00ffbf' }}></i>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Body ── */}
                            <div className="card-body">
                                {/* Category tag */}
                                <div className="card-category-tag">
                                    <i className={`fas ${catIcon}`}></i>
                                    {m.category || "General"}
                                </div>

                                {/* Title + completed badge */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                    <h3>{m.title}</h3>
                                    {isComplete && (
                                        <span className="completed-crown" style={{ flexShrink: 0 }}>
                                            <i className="fas fa-check-circle"></i> Secured
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="description">
                                    {m.description || "Synthesizing instructional data for this mission."}
                                </p>

                                {/* Progress bar */}
                                {m.room_count > 0 && (
                                    <div className="card-progress-bar-wrap">
                                        <div className="card-progress-track">
                                            <div className="card-progress-fill"
                                                 style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="card-progress-pct">{pct}%</span>
                                    </div>
                                )}

                                {/* Meta + CTA */}
                                <div className="card-meta">
                                    <div className="meta-stats">
                                        <span><i className="fas fa-clock"></i>{m.duration || "45m"}</span>
                                        <span><i className="fas fa-list-check"></i>{m.room_count || 0} tasks</span>
                                    </div>
                                    <button className="btn-tactical-start"
                                            onClick={e => {
                                                e.stopPropagation();
                                                const from = savedOnly ? "saved-tutorials" : "tutorials";
                                                window.location.href = `tutorial-reader.html?moduleId=${m.id}&from=${from}`;
                                            }}>
                                        {isComplete ? "Review" : "Engage"} <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
