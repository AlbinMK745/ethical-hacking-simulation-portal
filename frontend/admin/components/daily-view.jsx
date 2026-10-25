/**
 * DAILY CHALLENGE VIEW
 * Manages the rotating daily objective, including timer, stats, and top solvers.
 */

function DailyChallengeView({ user }) {
    const [state, setState] = React.useState({ loading: true, error: "", data: null, solvers: [] });
    const [secondsLeft, setSecondsLeft] = React.useState(0);

    const load = async () => {
        try {
            const [data, solvers] = await Promise.all([
                api(`/daily-challenge/today`, { headers: { "user-id": String(user.id) } }, user.id),
                api(`/daily-challenge/top-solvers`, {}, user.id)
            ]);
            setState({ loading: false, error: "", data, solvers: Array.isArray(solvers) ? solvers : [] });
            if (data.time_remaining) setSecondsLeft(data.time_remaining.seconds);
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err.message }));
        }
    };

    React.useEffect(() => {
        load();
        const refreshInterval = setInterval(load, 60000);
        return () => clearInterval(refreshInterval);
    }, [user.id]);

    React.useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft]);

    const formatTime = (s) => {
        if (s <= 0) return "00:00:00";
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    if (state.loading) return <Loading text="Syncing Daily Mission Intel..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    const { challenge, stats, flag } = state.data || {};

    return (
        <div className="daily-challenge-container-premium">
            {/* 1. Header */}
            <div className="daily-challenge-header-tactical">
                <h2><i className="fas fa-calendar-check"></i> DAILY MISSION</h2>
                <p>Complete today's specialized challenge to earn bonus intel points and climb the global rankings.</p>
            </div>

            {/* 2. Feature Card */}
            <div className="daily-feature-card">
                <div className="feature-main-content">
                    <div className="feature-info">
                        <h1>{challenge?.title || "No mission active"}</h1>
                        <p>{challenge?.description || "Awaiting central command for today's objective..."}</p>
                        <div className="feature-meta">
                            <span className="tag-pill-tactical">{challenge?.category || "Unknown Sector"}</span>
                            <span className="tag-pill-tactical" style={{ color: '#bc13fe' }}>{challenge?.difficulty || "TBD"}</span>
                            <span className="tag-pill-tactical" style={{ color: '#ffcc00' }}>{challenge?.points || 0} + 500 BONUS PTS</span>
                        </div>
                        {flag && (
                            <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Validation Token (Flag)</small>
                                <code style={{ color: 'var(--neon-green)', fontWeight: 600 }}>{flag}</code>
                            </div>
                        )}
                    </div>

                    <div className="feature-timer-box">
                        <small><i className="fas fa-clock"></i> DEPLETION TIMER</small>
                        <div className="timer-val">{formatTime(secondsLeft)}</div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="feature-stats-row">
                    <div className="feature-stat-item">
                        <div className="f-stat-icon"><i className="fas fa-fingerprint"></i></div>
                        <div className="f-stat-info">
                            <h3>{stats?.total_attempts || 0}</h3>
                            <p>Total Attempts</p>
                        </div>
                    </div>
                    <div className="feature-stat-item">
                        <div className="f-stat-icon" style={{ color: 'var(--neon-green)' }}><i className="fas fa-check-double"></i></div>
                        <div className="f-stat-info">
                            <h3>{stats?.completed_by || 0}</h3>
                            <p>Completed By</p>
                        </div>
                    </div>
                    <div className="feature-stat-item">
                        <div className="f-stat-icon" style={{ color: '#bc13fe' }}><i className="fas fa-wifi"></i></div>
                        <div className="f-stat-info">
                            <h3>{stats?.active_now || 0}</h3>
                            <p>Active Now</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Top Solvers */}
            <div className="solver-section-wrap">
                <div className="solver-section-title">
                    <i className="fas fa-bolt"></i> TODAY'S TOP SOLVERS
                </div>
                <div className="top-solvers-premium-list">
                    {state.solvers.map((s, idx) => (
                        <div key={idx} className={`solver-card-elite rank-${s.rank}`}>
                            <div className="solver-identity">
                                <div className="solver-rank-circle">{s.rank}</div>
                                <div>
                                    <span className="solver-name">{s.username}</span>
                                    <span className="solver-time">Completion Time: {s.time}</span>
                                </div>
                            </div>
                            <div className="solver-points">+{s.points} PTS</div>
                        </div>
                    ))}
                    {state.solvers.length === 0 && (
                        <div className="empty-registry" style={{ padding: '40px' }}>
                            <i className="fas fa-hourglass-half"></i>
                            <p>Awaiting the first agent to breach today's objective.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
