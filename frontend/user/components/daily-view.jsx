/**
 * DAILY CHALLENGE VIEW
 * Today's specialized hacking mission.
 */

function DailyChallengeView({ user, onSuccess }) {
    const [state, setState] = React.useState({
        loading: true,
        error: "",
        data: null,
        flag: "",
        lab: null,
        timer: "",
        launchingLab: false
    });

    const load = async () => {
        setState((p) => ({ ...p, loading: true, error: "" }));
        try {
            const data = await api(`/daily-challenge/today`, { headers: { "user-id": String(user.id) } });
            setState((p) => ({ ...p, loading: false, data, lab: data.active_lab || null }));
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err.message }));
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    React.useEffect(() => {
        if (!state.data || !state.data.time_remaining || !state.data.time_remaining.seconds) return;
        let remaining = Number(state.data.time_remaining.seconds);
        const tick = () => {
            const h = String(Math.floor(remaining / 3600)).padStart(2, "0");
            const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
            const s = String(remaining % 60).padStart(2, "0");
            setState((p) => ({ ...p, timer: `${h}:${m}:${s}` }));
            if (remaining > 0) remaining -= 1;
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [state.data]);

    const start = async () => {
        try {
            await api(`/daily-challenge/start`, { method: "POST", headers: { "user-id": String(user.id) } });
            alert("Daily challenge started.");
            load();
        } catch (err) { alert(err.message); }
    };

    const submit = async () => {
        const d = state.data;
        if (!d || !d.challenge) return;
        if (d.completed) return alert("Mission already secured for today.");
        try {
            const res = await api(`/user/challenges/submit/${d.challenge.id}`, {
                method: "POST",
                headers: {
                    "user-id": String(user.id),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ flag: state.flag })
            });
            if (res.correct) {
                onSuccess({ message: "Daily objective completed. System security confirmed.", points: res.points_earned || 0 });
                if (state.lab) stopLab();
            } else {
                alert("Wrong flag.");
            }
            load();
        } catch (err) { alert(err.message); }
    };

    const launchLab = async () => {
        const d = state.data;
        if (!d || !d.challenge) return;
        setState((p) => ({ ...p, launchingLab: true }));
        try {
            await start();
            const data = await api(`/simulation/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, sim_type: d.challenge.sim_type || "sqli" })
            });
            setState((p) => ({ ...p, lab: data, launchingLab: false }));
            window.open(data.url, "_blank");
        } catch (err) {
            setState((p) => ({ ...p, launchingLab: false }));
            alert(err.message);
        }
    };

    const stopLab = async () => {
        if (!state.lab) return;
        try {
            await api(`/simulation/stop`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ container_id: state.lab.container_id })
            });
            setState((p) => ({ ...p, lab: null }));
        } catch (err) {
            alert(err.message);
        }
    };

    if (state.loading) return <Loading text="Loading daily challenge..." />;
    if (state.error) return <ErrorBox error={state.error} />;

    const d = state.data;
    if (!d || !d.challenge) return <p className="dim-text">No daily challenge found.</p>;

    const rawDifficulty = String(d.challenge.difficulty || "easy").toLowerCase();
    const difficultyClass = rawDifficulty === "medium" ? "intermediate" : rawDifficulty;

    return (
        <div className="daily-challenge-view">
            <div className="daily-challenge-container">
                <div className="daily-challenge-main-card">
                    <div className="daily-challenge-header-section">
                        <div className="daily-icon"><i className="fas fa-bolt"></i></div>
                        <div>
                            <div className="daily-header-title">Daily Challenge {state.lab && !d.completed && <span className="solved-badge running-badge" style={{ marginLeft: "15px", display: "inline-flex" }}><i className="fas fa-satellite-dish pulse"></i> Lab Running</span>}</div>
                            <div className="daily-subtitle">Complete today's challenge for bonus points.</div>
                        </div>
                    </div>
                    <h2 className="challenge-main-title">{d.challenge.title}</h2>
                    <p className="challenge-main-description">{d.challenge.description}</p>
                    <div className="challenge-tags-row">
                        <span className="tag-category"><i className="fas fa-shield-alt"></i> {d.challenge.category}</span>
                        <span className={`tag-difficulty ${difficultyClass}`}>{d.challenge.difficulty}</span>
                        <span className="tag-difficulty" style={{ color: '#ffcc00', borderColor: '#ffcc00', background: 'rgba(255, 204, 0, 0.1)' }}>
                            <i className="fas fa-coins"></i> {d.challenge.points} + {d.bonus_points} PTS
                        </span>
                        <span className="tag-time"><i className="fas fa-clock"></i> {state.timer || (d.time_remaining && d.time_remaining.formatted) || "-"}</span>
                    </div>

                    {d.completed ? (
                        <div className="daily-completion-badge">
                            <i className="fas fa-check-circle"></i>
                            <span>MISSION COMPLETED</span>
                        </div>
                    ) : (
                        <>
                            {d.challenge.sim_type ? (
                                !state.lab ? (
                                    <button
                                        className="btn-start-daily-challenge"
                                        onClick={launchLab}
                                        disabled={state.launchingLab}
                                    >
                                        <i className="fas fa-rocket"></i> {state.launchingLab ? "Launching..." : "Launch Simulation Lab"}
                                    </button>
                                ) : (
                                    <div className="chal-toolbar-right" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                        <button className="btn-start-daily-challenge" onClick={() => window.open(state.lab.url, "_blank")}>Reopen Lab</button>
                                        <button className="btn-start-daily-challenge btn-completed-challenge" onClick={stopLab}>Stop Lab</button>
                                    </div>
                                )
                            ) : (
                                <button className="btn-start-daily-challenge" onClick={start}><i className="fas fa-play"></i> Start Mission</button>
                            )}
                            <div className="chal-toolbar-right" style={{ marginTop: "20px" }}>
                                <input className="modal-input" placeholder="EHSP{...}" value={state.flag} onChange={(e) => setState((p) => ({ ...p, flag: e.target.value }))} />
                                <button className="modal-submit-btn" onClick={submit}>Finalize Breach</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div >
    );
}
