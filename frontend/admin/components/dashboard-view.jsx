/**
 * DASHBOARD VIEW
 * Displays high-level system metrics, user activity charts, and recent audit logs.
 */

function DashboardView({ user }) {
    const [state, setState] = React.useState({
        loading: true,
        error: "",
        stats: null,
        activity: [],
        solveStats: [],
        recent: [],
        notices: []
    });

    const activityChartRef = React.useRef(null);
    const solvesChartRef = React.useRef(null);

    const loadAll = async () => {
        setState(p => ({ ...p, loading: true, error: "" }));
        try {
            const [stats, activity, solveStats, recent, notices] = await Promise.all([
                api(`/admin/dashboard`, {}, user.id),
                api(`/admin/activity`, {}, user.id),
                api(`/admin/solve-stats`, {}, user.id),
                api(`/admin/recent-activity`, {}, user.id),
                api(`/admin/notices`, {}, user.id)
            ]);
            setState({ loading: false, error: "", stats, activity, solveStats, recent, notices });
        } catch (err) {
            setState(p => ({ ...p, loading: false, error: err.message }));
        }
    };

    React.useEffect(() => { loadAll(); }, [user.id]);

    React.useEffect(() => {
        if (state.loading || !window.Chart) return;

        let actChart, slvChart;

        if (activityChartRef.current) {
            actChart = new window.Chart(activityChartRef.current.getContext('2d'), {
                type: 'line',
                data: {
                    labels: state.activity.map(a => a.hour),
                    datasets: [{
                        label: 'Users',
                        data: state.activity.map(a => a.count),
                        borderColor: '#00d2ff',
                        backgroundColor: 'rgba(0, 210, 255, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: '#00d2ff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                    }
                }
            });
        }

        if (solvesChartRef.current) {
            slvChart = new window.Chart(solvesChartRef.current.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: state.solveStats.map(s => s.category),
                    datasets: [{
                        data: state.solveStats.map(s => s.count),
                        backgroundColor: '#00ffbf',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                    }
                }
            });
        }

        return () => {
            if (actChart) actChart.destroy();
            if (slvChart) slvChart.destroy();
        };
    }, [state.loading, state.activity, state.solveStats]);

    if (state.loading) return <Loading text="Loading system metrics..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    const s = state.stats || {};

    return (
        <div className="admin-dashboard-root">
            {/* 1. Header Stats */}
            <div className="admin-stats-header">
                <div className="admin-stat-card">
                    <div className="stat-icon-box"><i className="fas fa-users"></i></div>
                    <div className="stat-content">
                        <div className="stat-val">{s.total_users || 0}</div>
                        <div className="stat-lab">Total Users</div>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon-box cyan"><i className="fas fa-shield-alt"></i></div>
                    <div className="stat-content">
                        <div className="stat-val">{s.total_challenges || 0}</div>
                        <div className="stat-lab">Total Challenges</div>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon-box gold"><i className="fas fa-terminal"></i></div>
                    <div className="stat-content">
                        <div className="stat-val">{s.active_sessions || 0}</div>
                        <div className="stat-lab">Active Sessions</div>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon-box red"><i className="fas fa-book-open"></i></div>
                    <div className="stat-content">
                        <div className="stat-val">{s.tutorials || 0}</div>
                        <div className="stat-lab">Tutorials</div>
                    </div>
                </div>
            </div>

            {/* 2. Main Grid Layout */}
            <div className="admin-dashboard-grid">
                {/* Left Column - Larger Charts */}
                <div className="admin-grid-main">
                    <div className="admin-panel activity-panel">
                        <div className="panel-header">
                            <h3>User Activity (24h)</h3>
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div className="chart-wrapper">
                            <canvas ref={activityChartRef}></canvas>
                        </div>
                    </div>

                    <div className="admin-panel solves-panel">
                        <div className="panel-header">
                            <h3>Challenge Solve Statistics</h3>
                            <i className="fas fa-poll"></i>
                        </div>
                        <div className="chart-wrapper">
                            <canvas ref={solvesChartRef}></canvas>
                        </div>
                    </div>
                </div>

                {/* Right Column - Feeds */}
                <div className="admin-grid-side">
                    <div className="admin-panel notices-panel">
                        <div className="panel-header">
                            <h3>System Notices</h3>
                            <i className="fas fa-broadcast-tower"></i>
                        </div>
                        <div className="feed-list">
                            {state.notices.map((n, i) => (
                                <div key={i} className={`feed-item border-${n.type || 'info'}`}>
                                    <h4>{n.title}</h4>
                                    <p>{n.message}</p>
                                    <span className="feed-time">{new Date(n.time).toLocaleString()}</span>
                                </div>
                            ))}
                            {state.notices.length === 0 && <div className="empty-feed">No active notices</div>}
                        </div>
                    </div>

                    <div className="admin-panel activity-feed-panel">
                        <div className="panel-header">
                            <h3>Recent Activity</h3>
                            <i className="fas fa-history"></i>
                        </div>
                        <div className="activity-list">
                            {state.recent.map((r, i) => (
                                <div key={i} className="activity-row">
                                    <div className={`status-dot ${r.is_correct ? 'success' : 'fail'}`}></div>
                                    <div className="act-info">
                                        <strong>{r.username}</strong>
                                        <span>{r.is_correct ? 'Solved' : 'Attempted'}: {r.challenge}</span>
                                    </div>
                                    <span className="act-time">{new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                            {state.recent.length === 0 && <div className="empty-feed">No recent activity</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
