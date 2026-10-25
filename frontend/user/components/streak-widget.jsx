/**
 * STREAK WIDGET — React Component
 * Shows the user's current streak, 7-dot weekly calendar, shields, and next milestone.
 * Usage: <StreakWidget streak={7} shields={1} />
 */

function StreakWidget({ streak = 0, shields = 0, loading = false }) {
    const [fillWidth, setFillWidth] = React.useState(0);

    const nextMilestone = Math.ceil((streak + 0.01) / 7) * 7;  // next multiple of 7
    const progressToMilestone = streak % 7;
    const milestonePct = Math.round((progressToMilestone / 7) * 100);

    const days = ["M", "T", "W", "T", "F", "S", "S"];
    // How many of the last 7 days are "filled" = streak % 7 (or 7 if at milestone)
    const filledCount = streak % 7 === 0 && streak > 0 ? 7 : streak % 7;

    React.useEffect(() => {
        const t = setTimeout(() => setFillWidth(milestonePct), 200);
        return () => clearTimeout(t);
    }, [streak]);

    if (loading) return (
        <div className="streak-card" style={{ opacity: 0.5 }}>
            <div className="streak-title">Daily Streak</div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: 8 }}>Loading streak...</p>
        </div>
    );

    return (
        <div className="streak-card">
            <div className="streak-header">
                <span className="streak-title">Daily Streak</span>
                {shields > 0 && (
                    <div className="streak-shields">
                        <span className="streak-shield-icon">🛡️</span>
                        <span className="streak-shield-count">{shields}</span>
                        <span>shield{shields !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            {/* Flame + Number */}
            <div className="streak-count-wrap" style={{ marginBottom: 16 }}>
                <span className="streak-flame-icon">🔥</span>
                <div>
                    <div className="streak-number">{streak}</div>
                    <div className="streak-label">day{streak !== 1 ? 's' : ''} in a row</div>
                </div>
            </div>

            {/* 7-dot weekly calendar */}
            <div className="streak-dots">
                {days.map((_, i) => (
                    <div key={i} className={`streak-dot ${i < filledCount ? 'filled' : ''}`} />
                ))}
            </div>
            <div className="streak-dot-labels">
                {days.map((d, i) => (
                    <div key={i} className="streak-dot-label">{d}</div>
                ))}
            </div>

            {/* Milestone progress */}
            <div className="streak-milestone-bar">
                <span style={{ whiteSpace: 'nowrap' }}>
                    Next milestone: {nextMilestone}d
                </span>
                <div className="streak-milestone-track">
                    <div className="streak-milestone-fill" style={{ width: `${fillWidth}%` }} />
                </div>
                <span>{progressToMilestone}/7</span>
            </div>

            {streak === 0 && (
                <p style={{
                    marginTop: 12,
                    fontSize: '0.78rem',
                    color: 'rgba(255,255,255,0.4)',
                    textAlign: 'center',
                }}>
                    Log in daily to build your streak! 🎯
                </p>
            )}

            {streak > 0 && streak % 7 === 0 && (
                <div style={{
                    marginTop: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,179,8,0.1))',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#fbbf24',
                    textAlign: 'center',
                }}>
                    🏆 {streak}-day milestone reached! +50 bonus XP
                </div>
            )}
        </div>
    );
}

// Make globally accessible
window.StreakWidget = StreakWidget;
