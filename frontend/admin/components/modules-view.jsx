/**
 * TUTORIAL MODULES VIEW
 * The Tutorial Architect interface for designing learning paths, modules, and individual tasks.
 */

function ModulesView({ user }) {
    const [state, setState] = React.useState({ loading: true, error: "", rows: [], selectedModule: null, rooms: [] });
    const [moduleForm, setModuleForm] = React.useState({ id: null, title: "", description: "", difficulty: "Beginner", category: "", thumbnail_url: "", is_published: true });
    const [roomForm, setRoomForm] = React.useState({ id: null, title: "", description: "", content: "", points: 10, order_index: 0 });
    const [showModuleModal, setShowModuleModal] = React.useState(false);
    const [showRoomModal, setShowRoomModal] = React.useState(false);

    const loadModules = async () => {
        setState((p) => ({ ...p, loading: true, error: "" }));
        try {
            const data = await api(`/admin/modules`, { headers: { "user-id": String(user.id) } }, user.id);
            setState((p) => ({ ...p, loading: false, rows: data.modules || [] }));
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err.message, rows: [] }));
        }
    };

    React.useEffect(() => { loadModules(); }, [user.id]);

    const stats = React.useMemo(() => {
        return {
            total: state.rows.length,
            published: state.rows.filter(m => m.is_published).length,
            tasks: state.rows.reduce((acc, m) => acc + (m.room_count || 0), 0)
        };
    }, [state.rows]);

    const editModule = (m) => {
        setModuleForm({
            id: m.id,
            title: m.title || "",
            description: m.description || "",
            difficulty: m.difficulty || "Beginner",
            category: m.category || "",
            thumbnail_url: m.thumbnail_url || "",
            is_published: !!m.is_published
        });
        setShowModuleModal(true);
    };

    const saveModule = async () => {
        if (!moduleForm.title.trim()) return alert("Module title is required");
        const payload = {
            title: moduleForm.title,
            description: moduleForm.description,
            difficulty: moduleForm.difficulty,
            category: moduleForm.category,
            thumbnail_url: moduleForm.thumbnail_url || null,
            is_published: moduleForm.is_published
        };
        try {
            if (moduleForm.id) {
                await api(`/admin/modules/${moduleForm.id}`, { method: "PUT", headers: { "user-id": String(user.id) }, body: JSON.stringify(payload) }, user.id);
            } else {
                await api(`/admin/modules`, { method: "POST", headers: { "user-id": String(user.id) }, body: JSON.stringify(payload) }, user.id);
            }
            setModuleForm({ id: null, title: "", description: "", difficulty: "Beginner", category: "", thumbnail_url: "", is_published: true });
            setShowModuleModal(false);
            loadModules();
        } catch (err) { alert(err.message); }
    };

    const deleteModule = async (id) => {
        if (!confirm("Delete this module and all tasks? This action cannot be reversed.")) return;
        try {
            await api(`/admin/modules/${id}`, { method: "DELETE", headers: { "user-id": String(user.id) } }, user.id);
            if (state.selectedModule === id) setState((p) => ({ ...p, selectedModule: null, rooms: [] }));
            loadModules();
        } catch (err) { alert(err.message); }
    };

    const viewRooms = async (moduleId) => {
        try {
            const data = await api(`/admin/modules/${moduleId}`, { headers: { "user-id": String(user.id) } }, user.id);
            setState((p) => ({ ...p, selectedModule: moduleId, rooms: data.rooms || [] }));
            setRoomForm({ id: null, title: "", description: "", content: "", points: 10, order_index: 0 });
        } catch (err) { alert(err.message); }
    };

    const editRoom = (r) => {
        setRoomForm({
            id: r.id,
            title: r.title || "",
            description: r.description || "",
            content: r.content || "",
            points: r.points || 10,
            order_index: r.order_index || 0
        });
        setShowRoomModal(true);
    };

    const saveRoom = async () => {
        if (!state.selectedModule) return alert("Select a module first");
        if (!roomForm.title.trim()) return alert("Task title is required");
        const payload = {
            title: roomForm.title,
            description: roomForm.description,
            content: roomForm.content,
            points: Number(roomForm.points),
            order_index: Number(roomForm.order_index)
        };
        try {
            if (roomForm.id) {
                await api(`/admin/modules/${state.selectedModule}/rooms/${roomForm.id}`, { method: "PUT", headers: { "user-id": String(user.id) }, body: JSON.stringify(payload) }, user.id);
            } else {
                await api(`/admin/modules/${state.selectedModule}/rooms`, { method: "POST", headers: { "user-id": String(user.id) }, body: JSON.stringify(payload) }, user.id);
            }
            await viewRooms(state.selectedModule);
            setRoomForm({ id: null, title: "", description: "", content: "", points: 10, order_index: 0 });
            setShowRoomModal(false);
        } catch (err) { alert(err.message); }
    };

    const deleteRoom = async (roomId) => {
        if (!state.selectedModule || !confirm("Erase this task-data?")) return;
        try {
            await api(`/admin/modules/${state.selectedModule}/rooms/${roomId}`, { method: "DELETE", headers: { "user-id": String(user.id) } }, user.id);
            viewRooms(state.selectedModule);
        } catch (err) { alert(err.message); }
    };

    if (state.loading) return <Loading text="Syncing Module Registry..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    return (
        <div className="admin-modules-container">
            <div className="admin-modules-header">
                <h2>Tutorial Architect</h2>
                <button className="create-btn" onClick={() => { setModuleForm({ id: null, title: "", description: "", difficulty: "Beginner", category: "", thumbnail_url: "", is_published: true }); setShowModuleModal(true); }}>
                    <i className="fas fa-plus"></i> Initialize Module
                </button>
            </div>

            <div className="tutorial-stats">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--neon-blue)' }}><i className="fas fa-book"></i></div>
                    <div className="stat-info"><h3>{stats.total}</h3><p>Total Modules</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(0, 255, 191, 0.1)', color: 'var(--neon-green)' }}><i className="fas fa-satellite-dish"></i></div>
                    <div className="stat-info"><h3>{stats.published}</h3><p>Active Paths</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 51, 51, 0.1)', color: 'var(--neon-red)' }}><i className="fas fa-list-check"></i></div>
                    <div className="stat-info"><h3>{stats.tasks}</h3><p>Global Tasks</p></div>
                </div>
            </div>

            <div className="modules-content-layout">
                <div className="modules-grid-admin">
                    {state.rows.map((m) => (
                        <div key={m.id} className={`module-card-premium ${state.selectedModule === m.id ? 'active' : ''}`}>
                            <div className="module-thumb" style={{ backgroundImage: `url(${m.thumbnail_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop'})` }}></div>
                            <div className="module-details">
                                <h3>{m.title}</h3>
                                <p className="module-description">{m.description || "No tactical description provided."}</p>
                                <div className="module-badges">
                                    <span className="cyber-badge">{m.category || "General"}</span>
                                    <span className={`cyber-badge ${(m.difficulty || "Beginner").toLowerCase()}`}>{m.difficulty}</span>
                                    <span className={`cyber-badge ${m.is_published ? 'published' : 'unpublished'}`}>{m.is_published ? 'LIVE' : 'DRAFT'}</span>
                                </div>
                            </div>
                            <div className="module-footer">
                                <div className="task-count"><i className="fas fa-layer-group"></i> {m.room_count || 0} SEQUESTED TASKS</div>
                                <div className="footer-actions">
                                    <button className="btn-action-glow" onClick={() => viewRooms(m.id)} title="Sequencer"><i className="fas fa-terminal"></i></button>
                                    <button className="btn-action-glow" onClick={() => editModule(m)} title="Edit Architect"><i className="fas fa-cog"></i></button>
                                    <button className="btn-action-glow danger" onClick={() => deleteModule(m.id)} title="Erase"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {state.rows.length === 0 && <div className="empty-registry"><i className="fas fa-ghost"></i><p>No module registry found. Initialize your first training path.</p></div>}
                </div>

                {state.selectedModule ? (
                    <div className="task-sequencer-panel">
                        <div className="sequencer-header">
                            <h3>Task Sequencer</h3>
                            <p>Module ID: #{state.selectedModule}</p>
                            <button className="create-btn" style={{ marginTop: '15px' }} onClick={() => { setRoomForm({ id: null, title: "", description: "", content: "", points: 10, order_index: state.rooms.length }); setShowRoomModal(true); }}>
                                <i className="fas fa-plus"></i> New Task Instance
                            </button>
                        </div>
                        <div className="task-list-minimal">
                            {state.rooms.map((r) => (
                                <div key={r.id} className="task-item-compact">
                                    <div className="task-main">
                                        <h4>{r.title}</h4>
                                        <div className="task-sub">{r.points} PTS • INDEX: {r.order_index}</div>
                                    </div>
                                    <div className="footer-actions">
                                        <button className="btn-action-glow" onClick={() => editRoom(r)}><i className="fas fa-edit"></i></button>
                                        <button className="btn-action-glow danger" onClick={() => deleteRoom(r.id)}><i className="fas fa-times"></i></button>
                                    </div>
                                </div>
                            ))}
                            {state.rooms.length === 0 && <p className="dim-text" style={{ textAlign: 'center', padding: '20px' }}>No tasks sequenced.</p>}
                        </div>
                    </div>
                ) : (
                    <div className="task-sequencer-panel" style={{ textAlign: 'center', opacity: 0.5 }}>
                        <i className="fas fa-info-circle" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                        <p>Select a module to access the Task Sequencer</p>
                    </div>
                )}
            </div>

            {showModuleModal && (
                <div className="modal-overlay">
                    <div className="modal-box large">
                        <div className="modal-header">
                            <h2><i className="fas fa-cube"></i> {moduleForm.id ? "Update Module Profile" : "Architect New Module"}</h2>
                            <button onClick={() => setShowModuleModal(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="architect-grid">
                                <div className="architect-field full">
                                    <label>Module Designation</label>
                                    <input className="architect-input" type="text" placeholder="e.g. Offensive Web Security" value={moduleForm.title} onChange={(e) => setModuleForm(p => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div className="architect-field full">
                                    <label>Tactical Description</label>
                                    <textarea className="architect-input" style={{ height: '100px' }} placeholder="Mission overview..." value={moduleForm.description} onChange={(e) => setModuleForm(p => ({ ...p, description: e.target.value }))}></textarea>
                                </div>
                                <div className="architect-field">
                                    <label>Difficulty Tier</label>
                                    <select className="architect-input" value={moduleForm.difficulty} onChange={(e) => setModuleForm(p => ({ ...p, difficulty: e.target.value }))}>
                                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                                    </select>
                                </div>
                                <div className="architect-field">
                                    <label>Sector Category</label>
                                    <input className="architect-input" type="text" placeholder="Web, Infra, Crypto..." value={moduleForm.category} onChange={(e) => setModuleForm(p => ({ ...p, category: e.target.value }))} />
                                </div>
                                <div className="architect-field full">
                                    <label>Visual Identity (Thumbnail URL)</label>
                                    <input className="architect-input" type="text" placeholder="https://" value={moduleForm.thumbnail_url} onChange={(e) => setModuleForm(p => ({ ...p, thumbnail_url: e.target.value }))} />
                                </div>
                            </div>
                            <label className="status-toggle">
                                <input type="checkbox" checked={moduleForm.is_published} onChange={(e) => setModuleForm(p => ({ ...p, is_published: e.target.checked }))} /> Deployment Ready (Published)
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowModuleModal(false)}>Abort</button>
                            <button className="btn-primary" onClick={saveModule}>Deploy Architect</button>
                        </div>
                    </div>
                </div>
            )}

            {showRoomModal && (
                <div className="modal-overlay">
                    <div className="modal-box large">
                        <div className="modal-header">
                            <h2><i className="fas fa-microchip"></i> {roomForm.id ? "Edit Task Instance" : "Sequence New Task"}</h2>
                            <button onClick={() => setShowRoomModal(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="architect-grid">
                                <div className="architect-field full">
                                    <label>Task Designation</label>
                                    <input className="architect-input" type="text" placeholder="Task Objective" value={roomForm.title} onChange={(e) => setRoomForm(p => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div className="architect-field full">
                                    <label>Briefing (Short Description)</label>
                                    <textarea className="architect-input" style={{ height: '80px' }} placeholder="Short briefing..." value={roomForm.description} onChange={(e) => setRoomForm(p => ({ ...p, description: e.target.value }))}></textarea>
                                </div>
                                <div className="architect-field full">
                                    <label>Intel Content (Markdown Supported)</label>
                                    <textarea className="architect-input" style={{ height: '300px' }} placeholder="Full instructional content..." value={roomForm.content} onChange={(e) => setRoomForm(p => ({ ...p, content: e.target.value }))}></textarea>
                                </div>
                                <div className="architect-field">
                                    <label>Reward Points</label>
                                    <input className="architect-input" type="number" value={roomForm.points} onChange={(e) => setRoomForm(p => ({ ...p, points: e.target.value }))} />
                                </div>
                                <div className="architect-field">
                                    <label>Order Index</label>
                                    <input className="architect-input" type="number" value={roomForm.order_index} onChange={(e) => setRoomForm(p => ({ ...p, order_index: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowRoomModal(false)}>Cancel Sequence</button>
                            <button className="btn-primary" onClick={saveRoom}>Forge Task</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
