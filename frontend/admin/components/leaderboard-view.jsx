/**
 * LEADERBOARD VIEW
 * Global agent rankings, podium presentation, and performance metrics.
 */

function LeaderboardView({ user }) {
    const [state, setState] = React.useState({ loading: true, error: "", rows: [] });

    React.useEffect(() => {
        (async () => {
            try {
                const rows = await api(`/admin/users`, {}, user.id);
                const sorted = (Array.isArray(rows) ? rows : []).slice().sort((a, b) => (b.points || 0) - (a.points || 0));
                setState({ loading: false, error: "", rows: sorted.map((r, i) => ({ ...r, rank: i + 1 })) });
            } catch (err) {
                setState({ loading: false, error: err.message, rows: [] });
            }
        })();
    }, [user.id]);

    const stats = React.useMemo(() => {
        const total = state.rows.length;
        const topScore = state.rows[0] ? state.rows[0].points || 0 : 0;
        const avgScore = total ? Math.floor(state.rows.reduce((a, r) => a + (r.points || 0), 0) / total) : 0;

        // Active Today: last_active within 24h
        const now = new Date();
        const activeToday = state.rows.filter(r => {
            if (!r.last_active) return false;
            const d = new Date(r.last_active);
            return (now - d) < (24 * 60 * 60 * 1000);
        }).length;

        return { total, activeToday, topScore, avgScore };
    }, [state.rows]);

    if (state.loading) return <Loading text="Syncing Leaderboard Grid..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    const topThree = state.rows.slice(0, 3);
    const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean); // Silver, Gold, Bronze

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-header-tactical">
                <h2>LEADERBOARD MANAGEMENT</h2>
                <p>Monitor and manage platform rankings and agent performance.</p>
            </div>

            <div className="stats-row-premium">
                <div className="stat-card-premium" style={{ '--accent-color': 'var(--neon-blue)' }}>
                    <div className="stat-icon-box"><i className="fas fa-users"></i></div>
                    <div className="stat-info-box"><h4>{stats.total.toLocaleString()}</h4><p>Total Agents</p></div>
                </div>
                <div className="stat-card-premium" style={{ '--accent-color': 'var(--neon-green)' }}>
                    <div className="stat-icon-box"><i className="fas fa-user-check"></i></div>
                    <div className="stat-info-box"><h4>{stats.activeToday}</h4><p>Active Today</p></div>
                </div>
                <div className="stat-card-premium" style={{ '--accent-color': '#ffcc00' }}>
                    <div className="stat-icon-box"><i className="fas fa-trophy"></i></div>
                    <div className="stat-info-box"><h4>{stats.topScore.toLocaleString()}</h4><p>Top Score</p></div>
                </div>
                <div className="stat-card-premium" style={{ '--accent-color': '#bc13fe' }}>
                    <div className="stat-icon-box"><i className="fas fa-chart-line"></i></div>
                    <div className="stat-info-box"><h4>{stats.avgScore}</h4><p>Avg Score</p></div>
                </div>
            </div>

            <div className="leaderboard-podium-elite">
                {podiumOrder.map((r, idx) => {
                    const type = r.rank === 1 ? 'gold' : r.rank === 2 ? 'silver' : 'bronze';
                    return (
                        <div key={r.id} className={`podium-card-elite ${type}`}>
                            <div className="rank-pill">{r.rank}</div>
                            <div className="elite-avatar-box">
                                {r.rank === 1 && <i className="fas fa-crown medal-visual"></i>}
                                {r.rank !== 1 && <i className="fas fa-medal medal-visual"></i>}
                                {r.username[0].toUpperCase()}
                            </div>
                            <div className="podium-info-elite">
                                <h3>{r.username}</h3>
                                <p>{r.email}</p>
                                <div className="podium-score-elite">{r.points?.toLocaleString() || 0}</div>
                                <small style={{ color: 'var(--text-secondary)' }}>INTEL POINTS</small>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="standings-section-title">FULL RANKINGS</div>

            <GenericTable
                rows={state.rows}
                columns={[
                    {
                        key: "rank",
                        label: "Rank",
                        render: (r) => (
                            <div className="rank-col-tactical">
                                {r.rank <= 3 && <i className={`fas fa-medal rank-medal ${r.rank === 1 ? 'gold' : r.rank === 2 ? 'silver' : 'bronze'}`}></i>}
                                #{r.rank}
                            </div>
                        )
                    },
                    {
                        key: "username",
                        label: "User",
                        render: (r) => (
                            <div className="user-cell-tactical">
                                <div className="mini-avatar">{r.username[0].toUpperCase()}</div>
                                <div className="user-meta-tactical">
                                    <h4>{r.username}</h4>
                                    <p>{r.email}</p>
                                </div>
                            </div>
                        )
                    },
                    { key: "points", label: "Score", render: (r) => <span style={{ fontFamily: 'Orbitron', color: '#fff' }}>{r.points?.toLocaleString() || 0}</span> },
                    { key: "challenges", label: "Challenges", render: (r) => <span style={{ color: '#aaa' }}>{r.challenges || 0}</span> },
                ,
                    {
                        key: "status",
                        label: "Status",
                        render: (r) => <span className={`status-pill ${r.status || 'active'}`}>{r.status || 'active'}</span>
                    },
                    ,

                ]}
            />
        </div>
    );
}
