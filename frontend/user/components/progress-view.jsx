/**
 * PROGRESS VIEW
 * Comprehensive operational analytics and skill tracking.
 */

function ProgressView({ user }) {
    const [state, setState] = React.useState({ loading: true, error: "", data: null });
    // Refs for all charts
    const radarRef = React.useRef(null);
    const rankRef = React.useRef(null);
    const pointsRef = React.useRef(null);
    const weeklyRef = React.useRef(null);
    const speedRef = React.useRef(null);
    const difficultyRef = React.useRef(null);

    const load = async () => {
        try {
            const data = await api(`/user/progress/${user.id}`);
            setState({ loading: false, error: "", data });
        } catch (err) {
            setState({ loading: false, error: err.message, data: null });
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    React.useEffect(() => {
        if (state.loading || !state.data || !window.Chart) return;

        const d = state.data;
        const charts = [];

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } } } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
            }
        };

        // 1. Skill Radar Chart
        if (radarRef.current) {
            charts.push(new window.Chart(radarRef.current, {
                type: 'radar',
                data: {
                    labels: d.radar_data.map(r => r.subject),
                    datasets: [{
                        label: 'Skill Proficiency',
                        data: d.radar_data.map(r => r.A),
                        backgroundColor: 'rgba(0, 242, 255, 0.2)',
                        borderColor: '#00f2ff',
                        pointBackgroundColor: '#00f2ff',
                        borderWidth: 2
                    }]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        r: {
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            angleLines: { color: 'rgba(255,255,255,0.1)' },
                            pointLabels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } },
                            ticks: { display: false }
                        }
                    }
                }
            }));
        }

        // 2. Rank Evolution (Line)
        if (rankRef.current) {
            charts.push(new window.Chart(rankRef.current, {
                type: 'line',
                data: {
                    labels: d.rank_evolution.map(r => r.date),
                    datasets: [{
                        label: 'Global Rank',
                        data: d.rank_evolution.map(r => r.rank),
                        borderColor: '#ffcc00',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        y: { reverse: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', stepSize: 50 } },
                        x: { display: false }
                    }
                }
            }));
        }

        // 3. Points Over Time (Line)
        if (pointsRef.current) {
            charts.push(new window.Chart(pointsRef.current, {
                type: 'line',
                data: {
                    labels: d.points_over_time.map(p => p.date),
                    datasets: [{
                        label: 'Cumulative Points',
                        data: d.points_over_time.map(p => p.cumulative_points),
                        borderColor: '#00f2ff',
                        backgroundColor: 'rgba(0, 242, 255, 0.05)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2
                    }]
                },
                options: commonOptions
            }));
        }

        // 4. Weekly Activity (Stacked Bar)
        if (weeklyRef.current) {
            charts.push(new window.Chart(weeklyRef.current, {
                type: 'bar',
                data: {
                    labels: d.weekly_activity.map(a => a.day),
                    datasets: [
                        { label: 'Offensive', data: d.weekly_activity.map(a => a.challenges), backgroundColor: '#00f2ff' },
                        { label: 'Defensive', data: d.weekly_activity.map(a => a.tutorials), backgroundColor: '#a855f7' }
                    ]
                },
                options: { ...commonOptions, scales: { ...commonOptions.scales, x: { stacked: true }, y: { stacked: true, ...commonOptions.scales.y } } }
            }));
        }

        // 5. Difficulty Distribution (Pie)
        if (difficultyRef.current) {
            charts.push(new window.Chart(difficultyRef.current, {
                type: 'doughnut',
                data: {
                    labels: d.difficulty_dist.map(i => i.difficulty),
                    datasets: [{
                        data: d.difficulty_dist.map(i => i.count),
                        backgroundColor: ['#4ade80', '#fbbf24', '#f87171', '#a855f7'],
                        borderWidth: 0
                    }]
                },
                options: { ...commonOptions, cutout: '70%' }
            }));
        }

        // 6. Exploit Speed (Horizontal Bar)
        if (speedRef.current) {
            charts.push(new window.Chart(speedRef.current, {
                type: 'bar',
                data: {
                    labels: d.exploit_speed.map(s => s.difficulty),
                    datasets: [{
                        label: 'Avg Completion (min)',
                        data: d.exploit_speed.map(s => s.time),
                        backgroundColor: 'rgba(0, 242, 255, 0.5)',
                        borderRadius: 4
                    }]
                },
                options: { ...commonOptions, indexAxis: 'y' }
            }));
        }

        return () => charts.forEach(c => c.destroy());
    }, [state.loading, state.data]);

    if (state.loading) return <Loading text="Initializing Mission Analytics..." />;
    if (state.error) return <ErrorBox error={state.error} />;

    const { stats, sandbox_stats, off_def } = state.data;

    return (
        <div className="progress-elite-dashboard">
            <div className="elite-header">
                <div className="elite-title-group">
                    <h1>OPERATIONAL ANALYTICS</h1>
                    <p>Tactical data feed for Unit #{user.id} - Protocol EHSP-01</p>
                </div>
                <div className="elite-summary-stats">
                    <div className="e-stat"><span>PTS</span><strong>{stats.total_pts?.toLocaleString()}</strong></div>
                    <div className="e-stat"><span>RANK</span><strong>#{state.data.rank_evolution.slice(-1)[0]?.rank || 'N/A'}</strong></div>
                    <div className="e-stat"><span>STREAK</span><strong>{stats.current_streak}D</strong></div>
                </div>
            </div>

            <div className="elite-grid-main">
                {/* Top Row: Radar & Rank */}
                <div className="elite-card radar-card">
                    <div className="elite-card-label"><i className="fas fa-brain"></i> SKILL RADAR</div>
                    <div className="chart-canvas-wrap"><canvas ref={radarRef}></canvas></div>
                </div>
                <div className="elite-card rank-card">
                    <div className="elite-card-label"><i className="fas fa-level-up-alt"></i> RANK EVOLUTION</div>
                    <div className="chart-canvas-wrap"><canvas ref={rankRef}></canvas></div>
                </div>

                {/* Big Middle Graph */}
                <div className="elite-card points-card full-width">
                    <div className="elite-card-label"><i className="fas fa-chart-line"></i> PERFORMANCE FREQUENCY (PTS)</div>
                    <div className="chart-canvas-wrap-large"><canvas ref={pointsRef}></canvas></div>
                </div>

                {/* Small Analytics Row */}
                <div className="elite-card weekly-card">
                    <div className="elite-card-label"><i className="fas fa-calendar-check"></i> WEEKLY MISSION LOAD</div>
                    <div className="chart-canvas-wrap"><canvas ref={weeklyRef}></canvas></div>
                </div>
                <div className="elite-card diff-card">
                    <div className="elite-card-label"><i className="fas fa-adjust"></i> TARGET DISTRIBUTION</div>
                    <div className="chart-canvas-wrap-pie"><canvas ref={difficultyRef}></canvas></div>
                </div>
                <div className="elite-card speed-card">
                    <div className="elite-card-label"><i className="fas fa-bolt"></i> EXPLOIT VELOCITY</div>
                    <div className="chart-canvas-wrap"><canvas ref={speedRef}></canvas></div>
                </div>

                {/* Sandbox & Category Bottom */}
                <div className="elite-card sandbox-card half-width">
                    <div className="elite-card-label"><i className="fab fa-docker"></i> SANDBOX PROTOCOL UTILIZATION</div>
                    <div className="sandbox-stats-compact">
                        <div className="sb-stat-item">
                            <span className="sb-val">{sandbox_stats.containers}</span>
                            <span className="sb-lab">Containers Launched</span>
                        </div>
                        <div className="sb-stat-item">
                            <span className="sb-val">{sandbox_stats.lab_time}m</span>
                            <span className="sb-lab">Total Simulation Time</span>
                        </div>
                        <div className="sb-stat-item">
                            <span className="sb-val neon-green-text">{sandbox_stats.active}</span>
                            <span className="sb-lab">Active Labs</span>
                        </div>
                    </div>
                    <div className="category-bars-mini">
                        {state.data.category_progress.map(cat => (
                            <div key={cat.category} className="cat-mini-box">
                                <div className="cat-mini-labels"><span>{cat.category}</span><span>{cat.percentage}%</span></div>
                                <div className="cat-mini-bar"><div className="cat-mini-fill" style={{ width: `${cat.percentage}%` }}></div></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="elite-card usage-card half-width">
                    <div className="elite-card-label"><i className="fas fa-shield-alt"></i> MISSION BALANCE</div>
                    <div className="mission-balance-content">
                        <div className="balance-info">
                            <div className="bal-item">
                                <span className="off-label">OFFENSIVE</span>
                                <span className="off-val">{off_def[0].value} Missions</span>
                            </div>
                            <div className="bal-item text-right">
                                <span className="def-label">DEFENSIVE</span>
                                <span className="def-val">{off_def[1].value} Labs</span>
                            </div>
                        </div>
                        <div className="balance-meter">
                            <div className="bal-off" style={{ width: `${off_def[0].value / (off_def[0].value + off_def[1].value + 1) * 100}%` }}></div>
                            <div className="bal-def" style={{ width: `${off_def[1].value / (off_def[0].value + off_def[1].value + 1) * 100}%` }}></div>
                        </div>
                        <div className="extra-tips">
                            <i className="fas fa-info-circle"></i> Complete more Defensive labs to increase system hardening score.
                        </div>
                    </div>
                </div>
            </div>

            {/* ── AI Skill Report Section ── */}
            <AiSkillReport user={user} stats={stats} categoryProgress={state.data.category_progress} />
        </div>
    );
}

// ── AI Skill Report Component ───────────────────────────────────────────────

function AiSkillReport({ user, stats, categoryProgress }) {
    const [report, setReport] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const generate = async () => {
        setLoading(true);
        setError("");
        setReport(null);
        const userStats = {
            "Total Points": stats.total_pts,
            "Challenges Solved": stats.challenges_solved,
            "Current Streak (days)": stats.current_streak,
            "Longest Streak (days)": stats.longest_streak,
            "Tutorials Completed": stats.tutorials_completed,
            "Category Breakdown": categoryProgress.map(c => `${c.category}: ${c.percentage}%`).join(", ")
        };
        try {
            const res = await fetch(`${API_BASE}/ai/skill-report`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "user-id": String(user.id) },
                body: JSON.stringify({ user_stats: userStats })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "AI error");
            setReport(data.report);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderReport = (text) => {
        if (!text) return null;
        return text.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} style={{ height: "8px" }} />;
            const withBold = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#e0c8ff'>$1</strong>");
            return <p key={i} style={{ margin: "3px 0", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: withBold }} />;
        });
    };

    return (
        <div style={{ marginTop: "24px" }}>
            <style>{`
                .ai-report-card {
                    background: linear-gradient(135deg, rgba(188,19,254,0.07), rgba(0,0,0,0.3));
                    border: 1px solid rgba(188,19,254,0.3);
                    border-radius: 14px;
                    padding: 24px 28px;
                    animation: reportFadeIn .5s ease;
                }
                @keyframes reportFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                .ai-report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .ai-report-title {
                    font-family: var(--font-heading, 'Orbitron', sans-serif);
                    font-size: 0.9rem;
                    color: #bc13fe;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .ai-generate-btn {
                    background: linear-gradient(135deg, #bc13fe, #7c00b5);
                    border: none;
                    color: #fff;
                    padding: 10px 22px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-family: var(--font-heading, 'Orbitron', sans-serif);
                    font-size: 0.78rem;
                    cursor: pointer;
                    transition: all .2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    letter-spacing: .5px;
                }
                .ai-generate-btn:hover:not(:disabled) {
                    box-shadow: 0 0 22px rgba(188,19,254,.45);
                    transform: translateY(-1px);
                }
                .ai-generate-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
                .ai-report-body {
                    color: #d0baff;
                    font-size: 0.875rem;
                    line-height: 1.7;
                }
                .ai-report-placeholder {
                    color: #444;
                    font-size: 0.85rem;
                    text-align: center;
                    padding: 30px 0;
                }
                .ai-report-error {
                    color: #ff6b6b;
                    font-size: 0.83rem;
                    padding: 12px;
                    background: rgba(255,51,51,.07);
                    border-radius: 6px;
                    border: 1px solid rgba(255,51,51,.2);
                }
                .ai-spin { animation: spin .7s linear infinite; display: inline-block; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="ai-report-card">
                <div className="ai-report-header">
                    <div className="ai-report-title">
                        <i className="fas fa-microchip" />
                        AI SKILL ANALYSIS REPORT
                    </div>
                    <button type="button" className="ai-generate-btn" onClick={(e) => { e.preventDefault(); generate(); }} disabled={loading}>
                        {loading
                            ? <><span className="ai-spin"><i className="fas fa-circle-notch" /></span> Analysing...</>
                            : <><i className="fas fa-bolt" /> {report ? "Regenerate Report" : "Generate AI Report"}</>
                        }
                    </button>
                </div>

                <div className="ai-report-body">
                    {error && <div className="ai-report-error"><i className="fas fa-exclamation-triangle" /> {error}</div>}
                    {!report && !loading && !error && (
                        <div className="ai-report-placeholder">
                            <i className="fas fa-robot" style={{ fontSize: "2rem", display: "block", marginBottom: "10px", color: "#333" }} />
                            Click <strong style={{ color: "#bc13fe" }}>Generate AI Report</strong> to get a personalised skill gap analysis based on your performance data.
                        </div>
                    )}
                    {loading && (
                        <div className="ai-report-placeholder">
                            <i className="fas fa-circle-notch ai-spin" style={{ fontSize: "1.5rem", display: "block", marginBottom: "10px", color: "#bc13fe" }} />
                            Gemini is analysing your performance data...
                        </div>
                    )}
                    {report && renderReport(report)}
                </div>
            </div>
        </div>
    );
}
