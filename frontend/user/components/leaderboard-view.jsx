/**
 * LEADERBOARD VIEW
 * Global rankings and performance comparison.
 */

function LeaderboardView({ user }) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [data, setData] = React.useState([]);

    React.useEffect(() => {
        (async () => {
            try {
                const lb = await api("/user/leaderboard-data");
                setData(Array.isArray(lb) ? lb : []);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <Loading text="Fetching world rankings..." />;
    if (error) return <ErrorBox error={error} />;

    const top3 = data.slice(0, 3);
    const me = data.find(x => x.user_id === user.id);
    const myIndex = data.findIndex(x => x.user_id === user.id);
    const userAbove = myIndex > 0 ? data[myIndex - 1] : null;
    const pointsToNext = userAbove ? userAbove.points - (me?.points || 0) : 0;

    const totalUsers = data.length || 1;
    const percentile = me ? Math.max(1, Math.round((1 - (me.rank - 1) / totalUsers) * 100)) : "-";

    // Reorder top 3 for podium: [2nd, 1st, 3rd]
    const podiumOrder = [];
    if (top3[1]) podiumOrder.push(top3[1]); // 2nd
    if (top3[0]) podiumOrder.push(top3[0]); // 1st
    if (top3[2]) podiumOrder.push(top3[2]); // 3rd

    return (
        <div className="leaderboard-view">
            <div className="leaderboard-header">
                <h1>Global Leaderboard</h1>
                <p>Top ethical hackers worldwide</p>
            </div>

            <div className="leaderboard-podium">
                {podiumOrder.map((player) => (
                    <div key={player.user_id} className={`podium-card rank-${player.rank}`}>
                        <div className="podium-rank-badge">{player.rank}</div>
                        <div className="podium-icon-circle">
                            <i className={`fas ${player.rank === 1 ? 'fa-crown' : 'fa-trophy'}`}></i>
                        </div>
                        <span className="podium-user">{player.username}</span>
                        <span className="podium-score">{player.points}</span>
                        <span className="podium-solved">{player.solved} solved</span>
                    </div>
                ))}
            </div>

            <div className="rank-table-container">
                <div className="rank-table-header">
                    <i className="fas fa-list-ol"></i> Rankings
                </div>
                <table className="cyber-table">
                    <thead>
                        <tr>
                            <th>RANK</th>
                            <th>USER</th>
                            <th>SCORE</th>
                            <th>CHALLENGES SOLVED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((r) => (
                            <tr key={r.user_id} className={r.user_id === user.id ? "current-user-row" : ""}>
                                <td className="rank-cell">
                                    {r.rank <= 3 ? <i className={`fas fa-medal`} style={{ color: r.rank === 1 ? '#ffd700' : r.rank === 2 ? '#c0c0c0' : '#cd7f32' }}></i> : `#${r.rank}`}
                                </td>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar"><i className="fas fa-user"></i></div>
                                        <span>{r.username} {r.user_id === user.id && <span className="solved-badge" style={{ marginLeft: '10px' }}>You</span>}</span>
                                    </div>
                                </td>
                                <td className="points-cell">{r.points}</td>
                                <td>{r.solved}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rank-table-header" style={{ borderBottom: 'none', marginBottom: '-1rem' }}>
                Your Performance
            </div>
            <div className="performance-summary">
                <div className="perf-item">
                    <span className="perf-label">Current Rank</span>
                    <span className="perf-value">#{me ? me.rank : "-"}</span>
                </div>
                <div className="perf-item">
                    <span className="perf-label">Points to Next Rank</span>
                    <span className="perf-value">{pointsToNext}</span>
                </div>
                <div className="perf-item">
                    <span className="perf-label">Percentile</span>
                    <span className="perf-value">top {percentile}%</span>
                </div>
            </div>
        </div>
    );
}
