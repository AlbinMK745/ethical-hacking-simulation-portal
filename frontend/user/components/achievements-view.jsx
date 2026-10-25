/**
 * ACHIEVEMENTS VIEW
 * Tracking agent milestones and rewards.
 */

function AchievementsView({ user }) {
    const [data, setData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        (async () => {
            try {
                const res = await api(`/user/achievements/${user.id}`);
                setData(res);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        })();
    }, [user.id]);

    if (loading) return <Loading />;

    const unlockedCount = data.filter((a) => a.unlocked).length;
    const totalPoints = data.reduce((acc, a) => (a.unlocked ? acc + a.points : acc), 0);
    const completionRate = data.length > 0 ? Math.round((unlockedCount / data.length) * 100) : 0;

    return (
        <div className="achievements-view">
            <div className="achievements-summary">
                <div className="summary-card">
                    <div className="summary-icon cyan"><i className="fas fa-medal"></i></div>
                    <div className="summary-info">
                        <span className="summary-label">Achievements Unlocked</span>
                        <div className="summary-value-row">
                            <span className="summary-value">{unlockedCount} / {data.length}</span>
                        </div>
                        <div className="summary-progress-bg">
                            <div className="summary-progress-fill" style={{ width: `${completionRate}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon gold"><i className="fas fa-star"></i></div>
                    <div className="summary-info">
                        <span className="summary-label">Total Points Earned</span>
                        <span className="summary-value">{totalPoints}</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon blue"><i className="fas fa-chart-pie"></i></div>
                    <div className="summary-info">
                        <span className="summary-label">Completion Rate</span>
                        <span className="summary-value">{completionRate}%</span>
                    </div>
                </div>
            </div>

            <div className="achievements-grid">
                {data.map((ach) => (
                    <div key={ach.id} className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}>
                        <div className="ach-card-header">
                            <div className="ach-icon-wrap" style={{ color: ach.unlocked ? '#00ffbf' : '#666' }}>
                                <span className="ach-icon">{ach.icon || '🏆'}</span>
                            </div>
                            <div className={`ach-status-badge ${ach.unlocked ? 'unlocked' : 'locked'}`}>
                                <i className={`fas ${ach.unlocked ? 'fa-check-circle' : 'fa-lock'}`}></i>
                                {ach.unlocked ? 'Unlocked' : 'Locked'}
                            </div>
                        </div>

                        <div className="ach-card-body">
                            <h3 className="ach-title">{ach.title}</h3>
                            <p className="ach-desc">{ach.description}</p>

                            {!ach.unlocked && ach.target > 0 && (
                                <div className="ach-progress-section">
                                    <div className="ach-progress-text">
                                        <span>Progress</span>
                                        <span>{ach.progress} / {ach.target}</span>
                                    </div>
                                    <div className="ach-progress-bar-bg">
                                        <div
                                            className="ach-progress-bar-fill"
                                            style={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="ach-card-footer">
                            <span className="ach-points">
                                <i className="fas fa-plus-circle"></i> {ach.points} pts
                            </span>
                            {ach.unlocked_at && (
                                <span className="ach-date">
                                    {new Date(ach.unlocked_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
