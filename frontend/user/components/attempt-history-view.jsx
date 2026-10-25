/**
 * ATTEMPT HISTORY VIEW
 * Chronological log of mission engagement and results.
 */

function AttemptHistoryView({ user }) {
    const [state, setState] = React.useState({ loading: true, error: "", data: null, filter: "All" });

    const load = async () => {
        setState(p => ({ ...p, loading: true, error: "" }));
        try {
            const data = await api(`/user/attempts/`, { headers: { "user-id": String(user.id) } });
            setState(p => ({ ...p, loading: false, data }));
        } catch (err) {
            setState(p => ({ ...p, loading: false, error: err.message }));
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    if (state.loading) return <Loading text="Retrieving mission history..." />;
    if (state.error) return <ErrorBox error={state.error} />;

    const { stats, history } = state.data || { stats: {}, history: [] };

    const filteredHistory = history.filter(a => {
        if (state.filter === "Completed") return a.is_correct;
        if (state.filter === "Failed") return !a.is_correct;
        return true;
    });

    return (
        <div className="attempt-history-view">
            {/* 1. Summary Stats */}
            <div className="history-stats-grid">
                <div className="hist-stat-card">
                    <div className="hist-stat-icon blue"><i className="fas fa-bullseye"></i></div>
                    <div className="hist-stat-info">
                        <span className="hist-stat-label">Total Attempts</span>
                        <span className="hist-stat-value">{stats.total || 0}</span>
                    </div>
                </div>
                <div className="hist-stat-card">
                    <div className="hist-stat-icon green"><i className="fas fa-check-circle"></i></div>
                    <div className="hist-stat-info">
                        <span className="hist-stat-label">Completed</span>
                        <span className="hist-stat-value text-green">{stats.completed || 0}</span>
                    </div>
                </div>
                <div className="hist-stat-card">
                    <div className="hist-stat-icon red"><i className="fas fa-times-circle"></i></div>
                    <div className="hist-stat-info">
                        <span className="hist-stat-label">Failed</span>
                        <span className="hist-stat-value text-red">{stats.failed || 0}</span>
                    </div>
                </div>
                <div className="hist-stat-card">
                    <div className="hist-stat-icon yellow"><i className="fas fa-chart-line"></i></div>
                    <div className="hist-stat-info">
                        <span className="hist-stat-label">Success Rate</span>
                        <span className="hist-stat-value text-yellow">{stats.success_rate || 0}%</span>
                    </div>
                </div>
            </div>

            {/* 2. Filters */}
            <div className="history-filters">
                <div className="filter-group">
                    <i className="fas fa-filter icon-muted"></i>
                    {["All", "Completed", "Failed"].map(f => (
                        <button
                            key={f}
                            className={`filter-pill ${state.filter === f ? "active" : ""}`}
                            onClick={() => setState(p => ({ ...p, filter: f }))}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. History List */}
            <div className="history-list">
                {filteredHistory.length === 0 ? (
                    <div className="empty-history">
                        <i className="fas fa-terminal"></i>
                        <p>No mission records found for this filter.</p>
                    </div>
                ) : (
                    filteredHistory.map((a, i) => (
                        <div key={i} className={`history-card ${a.is_correct ? "success-border" : "fail-border"}`}>
                            <div className="h-card-header">
                                <div className="h-card-title-wrap">
                                    <h3>{a.title} {a.is_daily && <span className="daily-tag-inline">Daily Challenge</span>}</h3>
                                    <div className="h-card-meta">
                                        <span className="meta-tag">{a.category}</span>
                                        <span className={`meta-tag difficulty ${String(a.difficulty || "Easy").toLowerCase()}`}>{a.difficulty}</span>
                                        <span className={`status-tag ${a.is_correct ? "completed" : "failed"}`}>
                                            {a.is_correct ? "Completed" : "Failed"}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-card-right">
                                    <div className="h-date"><i className="far fa-clock"></i> {new Date(a.attempted_at).toLocaleString()}</div>
                                    {a.is_correct && <div className="h-points">+{a.points} pts</div>}
                                </div>
                            </div>

                            <div className="h-card-details">
                                <div className="detail-item">
                                    <span className="detail-label">Flag Submitted</span>
                                    <span className="detail-value cyan-value">{a.submitted_flag}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Time Taken</span>
                                    <span className="detail-value">45 min</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Hints Used</span>
                                    <span className="detail-value">0</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
