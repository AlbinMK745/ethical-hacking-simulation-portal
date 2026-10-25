/**
 * ANALYTICS VIEW
 * Visualizes system data including challenge difficulty distribution and solve frequency.
 */

function AnalyticsView({ user }) {
    const [state, setState] = React.useState({ loading: true, error: "", data: null });
    const diffRef = React.useRef(null);
    const solveRef = React.useRef(null);

    React.useEffect(() => {
        (async () => {
            try {
                const data = await api(`/admin/analytics`, {}, user.id);
                setState({ loading: false, error: "", data });
            } catch (err) {
                setState({ loading: false, error: err.message, data: null });
            }
        })();
    }, [user.id]);

    React.useEffect(() => {
        if (!state.data || !window.Chart || !diffRef.current || !solveRef.current) return;
        const diff = state.data.difficulty || { Easy: 0, Medium: 0, Hard: 0 };
        const solves = Array.isArray(state.data.solves) ? state.data.solves : [];

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff', font: { family: 'inherit', size: 11 } }
                }
            }
        };

        const diffChart = new window.Chart(diffRef.current.getContext("2d"), {
            type: "pie",
            data: {
                labels: ["Easy", "Medium", "Hard"],
                datasets: [{
                    data: [diff.Easy || 0, diff.Medium || 0, diff.Hard || 0],
                    backgroundColor: ["#00ffbf", "#ffcc00", "#ff3b3b"],
                    borderColor: "rgba(0,0,0,0.5)",
                    borderWidth: 2
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    legend: { position: 'top', labels: { color: 'rgba(255,255,255,0.7)' } }
                }
            }
        });

        const solveChart = new window.Chart(solveRef.current.getContext("2d"), {
            type: "bar",
            data: {
                labels: solves.map((s) => s.title),
                datasets: [{
                    label: 'Solve Frequency',
                    data: solves.map((s) => s.count || 0),
                    backgroundColor: "#00ffbf",
                    borderRadius: 4,
                    hoverBackgroundColor: "#fff"
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: 'rgba(255,255,255,0.6)',
                            font: { size: 10, family: 'Inter' },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: {
                            color: 'rgba(255,255,255,0.4)',
                            font: { size: 10 },
                            stepSize: 1
                        }
                    }
                }
            }
        });

        return () => {
            diffChart.destroy();
            solveChart.destroy();
        };
    }, [state.data]);

    if (state.loading) return <Loading text="Aggregating system intelligence..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    return (
        <div className="analytics-grid">
            <div className="card-panel">
                <h2 className="panel-title">Difficulty Distribution</h2>
                <div className="chart-container" style={{ height: '280px' }}><canvas ref={diffRef}></canvas></div>
                <div className="difficulty-cards">
                    <div className="diff-card"><div className="diff-dot" style={{ backgroundColor: "#00ffbf" }}></div><span className="diff-val">{state.data.difficulty?.Easy || 0}</span><label>EASY</label></div>
                    <div className="diff-card"><div className="diff-dot" style={{ backgroundColor: "#ffcc00" }}></div><span className="diff-val">{state.data.difficulty?.Medium || 0}</span><label>MEDIUM</label></div>
                    <div className="diff-card"><div className="diff-dot" style={{ backgroundColor: "#ff3b3b" }}></div><span className="diff-val">{state.data.difficulty?.Hard || 0}</span><label>HARD</label></div>
                </div>
            </div>
            <div className="card-panel">
                <h2 className="panel-title">Challenge Solve Counts</h2>
                <div className="chart-container" style={{ height: '350px' }}><canvas ref={solveRef}></canvas></div>
            </div>
        </div>
    );
}
