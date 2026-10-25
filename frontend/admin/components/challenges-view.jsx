/**
 * CHALLENGE MANAGEMENT VIEWS
 * Contains ChallengesView for deploying/managing tasks and PreviewView for testing user experience.
 */

function ChallengesView({ user }) {
    const [state, setState] = React.useState({
        loading: true,
        error: "",
        rows: [],
        showModal: false,
        showSuccess: false,
        newTitle: "" // for success msg
    });

    const [form, setForm] = React.useState({
        title: "",
        category: "Web Security",
        difficulty: "Easy",
        points: 100,
        correct_flag: "",
        description: "",
        is_sim_lab: false,
        docker_image: "",
        sim_type: "web-terminal"
    });

    const load = async () => {
        setState((p) => ({ ...p, loading: true, error: "" }));
        try {
            const rows = await api(`/admin/challenges`, {}, user.id);
            setState((p) => ({ ...p, loading: false, rows: Array.isArray(rows) ? rows : [] }));
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err.message, rows: [] }));
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    const deployChallenge = async () => {
        if (!form.title || !form.correct_flag || !form.description) {
            alert("Basic Intelligence fields (Title, Flag, Description) are required.");
            return;
        }
        try {
            await api(`/admin/challenges`, {
                method: "POST",
                body: JSON.stringify({
                    ...form,
                    points: Number(form.points),
                    is_sim_lab: form.is_sim_lab ? 1 : 0
                })
            }, user.id);

            const deployedTitle = form.title;
            setForm({ title: "", category: "Web Security", difficulty: "Easy", points: 100, correct_flag: "", description: "", is_sim_lab: false, docker_image: "", sim_type: "web-terminal" });
            setState(p => ({ ...p, showModal: false, showSuccess: true, newTitle: deployedTitle }));
            load();
        } catch (err) {
            alert(err.message);
        }
    };

    const deleteChallenge = async (id) => {
        if (!confirm("Confirm complete decommissioning of this challenge node?")) return;
        try {
            await api(`/admin/challenges/${id}`, { method: "DELETE" }, user.id);
            load();
        } catch (err) { alert(err.message); }
    };

    if (state.loading && state.rows.length === 0) return <Loading text="Syncing challenge database..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    const labCount = state.rows.filter(r => r.is_sim_lab || r.docker_image).length;
    const webCount = state.rows.filter(r => r.category === 'Web' || r.category === 'Web Security').length;

    return (
        <div className="user-management-container">
            {/* 1. Header & Actions */}
            <div className="user-management-actions">
                <div className="search-container">
                    <i className="fas fa-microchip search-icon"></i>
                    <input placeholder="Filter challenge database..." readOnly />
                </div>
                <button className="btn-deploy-primary" onClick={() => setState(p => ({ ...p, showModal: true }))}>
                    <i className="fas fa-upload"></i> Deploy Challenge
                </button>
            </div>

            {/* 2. Summary Stats */}
            <div className="summary-row" style={{ marginBottom: '24px' }}>
                <div className="admin-stat-card">
                    <div className="stat-content">
                        <div className="stat-lab">Total Nodes</div>
                        <div className="stat-val">{state.rows.length}</div>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-content">
                        <div className="stat-lab">Simulation Labs</div>
                        <div className="stat-val" style={{ color: '#bc13fe' }}>{labCount}</div>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-content">
                        <div className="stat-lab">Web Security</div>
                        <div className="stat-val" style={{ color: 'var(--neon-blue)' }}>{webCount}</div>
                    </div>
                </div>
            </div>

            {/* 3. Challenge Table */}
            <GenericTable
                title="Active Challenges"
                rows={state.rows}
                columns={[
                    {
                        key: "title",
                        label: "Challenge Node",
                        render: (r) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontWeight: 600, color: '#fff' }}>{r.title}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.category}</span>
                            </div>
                        )
                    },
                    {
                        key: "type",
                        label: "Type",
                        render: (r) => (
                            <span className={`challenge-type-badge ${r.docker_image ? 'type-lab' : 'type-static'}`}>
                                <i className={`fas ${r.docker_image ? 'fa-flask' : 'fa-file-alt'}`}></i>
                                {r.docker_image ? 'Simulation' : 'Standard'}
                            </span>
                        )
                    },
                    {
                        key: "difficulty",
                        label: "Difficulty",
                        render: (r) => <span className={`difficulty-badge difficulty-${r.difficulty.toLowerCase()}`}>{r.difficulty}</span>
                    },
                    { key: "points", label: "Reward", render: (r) => <span style={{ color: 'var(--neon-green)', fontWeight: 600 }}>{r.points} </span> },
                    { key: "solves", label: "Solves", render: (r) => <span style={{ color: 'var(--text-muted)' }}>{r.solves || 0} Agents</span> },
                    {
                        key: "actions",
                        label: "Operations",
                        render: (r) => (
                            <div className="actions-cell">
                                <button className="action-icon-btn"><i className="fas fa-edit"></i></button>
                                <button className="action-icon-btn ban" onClick={() => deleteChallenge(r.id)}><i className="fas fa-trash-alt"></i></button>
                            </div>
                        )
                    }
                ]}
            />

            {/* 4. Deployment Modal */}
            {state.showModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ width: '600px' }}>
                        <h2>New Challenge Deployment</h2>

                        <div className="form-stage-container">
                            {/* Stage 1: Basic Intel */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <i className="fas fa-info-circle"></i>
                                    <span>Basic Intelligence</span>
                                </div>
                                <div className="form-grid-dual">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label>Node Title</label>
                                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Challenge Name" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label>Category</label>
                                        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                            <option>Web Security</option>
                                            <option>Infrastructure</option>
                                            <option>Cryptography</option>
                                            <option>Reverse Engineering</option>
                                            <option>Forensics</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-grid-dual" style={{ marginTop: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label>Difficulty</label>
                                        <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label>Reward Points</label>
                                        <input type="number" value={form.points} onChange={e => setForm(p => ({ ...p, points: e.target.value }))} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                    <label>Decryption Flag</label>
                                    <input
                                        value={form.correct_flag}
                                        onChange={e => setForm(p => ({ ...p, correct_flag: e.target.value }))}
                                        placeholder="EHSP{your_flag_here}"
                                    />
                                    {form.correct_flag && !form.correct_flag.startsWith("EHSP{") && (
                                        <span style={{ color: '#ff6b6b', fontSize: '0.75rem' }}>
                                            ⚠ Flag should start with <code style={{ color: '#00ffa6' }}>EHSP{"{"}</code> — users will see this format hint
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                    <label>Intelligence Summary (Description)</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', padding: '10px', minHeight: '80px' }}
                                    />
                                </div>
                            </div>

                            {/* Stage 2: Simulation Config */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <i className="fas fa-server"></i>
                                    <span>Simulation Configuration</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <input
                                        type="checkbox"
                                        id="is_sim"
                                        checked={form.is_sim_lab}
                                        onChange={e => setForm(p => ({ ...p, is_sim_lab: e.target.checked }))}
                                    />
                                    <label htmlFor="is_sim" style={{ cursor: 'pointer' }}>Require Specialized Simulation Env</label>
                                </div>

                                {form.is_sim_lab && (
                                    <div className="lab-config-panel">
                                        <div className="form-grid-dual">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label>Docker Image</label>
                                                <input value={form.docker_image} onChange={e => setForm(p => ({ ...p, docker_image: e.target.value }))} placeholder="ehsp-web-..." />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label>Sim Type</label>
                                                <select value={form.sim_type} onChange={e => setForm(p => ({ ...p, sim_type: e.target.value }))}>
                                                    <option value="web-terminal">Web Terminal View</option>
                                                    <option value="kali-desktop">Kali Remote Desktop</option>
                                                    <option value="sandbox-app">Isolated Web App</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setState(p => ({ ...p, showModal: false }))}>Abort</button>
                            <button className="btn-deploy-primary" onClick={deployChallenge}>Deploy to Grid</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Success Notification */}
            {state.showSuccess && (
                <div className="success-overlay deployment-success-overlay">
                    <i className="fas fa-satellite-dish success-icon-large deployment-icon"></i>
                    <h2>Node Deployed</h2>
                    <p>Challenge <strong>{state.newTitle}</strong> has been successfully encrypted and broadcasted to the grid.</p>
                    <button className="btn-close-success" style={{ background: '#bc13fe' }} onClick={() => setState(p => ({ ...p, showSuccess: false }))}>Acknowledged</button>
                </div>
            )}
        </div>
    );
}

/**
 * PREVIEW VIEW
 * A sandbox mode for administrators to verify the user-facing interface of challenges.
 */
function PreviewView({ user }) {
    const [state, setState] = React.useState({ loading: true, error: "", list: [], selected: null, detail: null });

    const load = async () => {
        setState((p) => ({ ...p, loading: true, error: "" }));
        try {
            const list = await api(`/admin/challenges`, {}, user.id);
            const first = list && list.length ? list[0].id : null;
            let detail = null;
            if (first) detail = await api(`/admin/challenges/${first}/preview`, {}, user.id);
            setState({ loading: false, error: "", list: list || [], selected: first, detail });
        } catch (err) {
            setState({ loading: false, error: err.message, list: [], selected: null, detail: null });
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    const choose = async (id) => {
        try {
            const detail = await api(`/admin/challenges/${id}/preview`, {}, user.id);
            setState((p) => ({ ...p, selected: id, detail }));
        } catch (err) { alert(err.message); }
    };

    if (state.loading) return <Loading text="Loading preview..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    return (
        <div className="user-management-container">
            <div className="preview-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Preview Mode</strong>
                    <span>This preview shows challenge details as users will see them.</span>
                </div>
            </div>
            <div className="table-panel">
                <div className="modal-body">
                    <div className="form-group">
                        <label>Select Challenge</label>
                        <select value={state.selected || ""} onChange={(e) => choose(e.target.value)}>
                            {state.list.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            {state.detail ? (
                <div className="preview-layout">
                    <div className="preview-main">
                        <div className="card-panel preview-card">
                            <div className="challenge-header-row">
                                <div>
                                    <h2>{state.detail.title}</h2>
                                    <div className="meta-tags">
                                        <span className="tag-pill">{state.detail.category || "General"}</span>
                                        <span className="tag-pill">{state.detail.difficulty || "Easy"}</span>
                                        <span className="tag-pill">{state.detail.points || 0} pts</span>
                                    </div>
                                </div>
                            </div>
                            <p>{state.detail.description}</p>
                        </div>
                    </div>
                    <div className="preview-side">
                        <div className="card-panel preview-card admin-info-box">
                            <h3>Validation</h3>
                            <p className="dim-text">Flag: {state.detail.flag || "-"}</p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
