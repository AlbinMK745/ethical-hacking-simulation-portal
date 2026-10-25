/**
 * NOTIFICATIONS VIEW
 * System-wide broadcast interface for sending alerts and news to all agents.
 */

function NotificationsView({ user }) {
    const [state, setState] = React.useState({
        loading: true,
        error: "",
        rows: [],
        showModal: false,
        showSuccess: false,
        newTitle: ""
    });

    const [form, setForm] = React.useState({
        title: "",
        message: "",
        type: "info"
    });

    const load = async () => {
        setState((p) => ({ ...p, loading: true, error: "" }));
        try {
            const rows = await api(`/admin/notifications`, {}, user.id);
            setState((p) => ({ ...p, loading: false, rows: Array.isArray(rows) ? rows : [] }));
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err.message, rows: [] }));
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    const send = async () => {
        if (!form.title || !form.message) {
            alert("Transmission headers (Title and Message) are required.");
            return;
        }
        try {
            await api(`/admin/notifications`, {
                method: "POST",
                body: JSON.stringify(form)
            }, user.id);
            const sentTitle = form.title;
            setForm({ title: "", message: "", type: "info" });
            setState(p => ({ ...p, showModal: false, showSuccess: true, newTitle: sentTitle }));
            load();
        } catch (err) { alert(err.message); }
    };

    const del = async (id) => {
        if (!confirm("Decommission this signal history?")) return;
        try {
            await api(`/admin/notifications/${id}`, { method: "DELETE" }, user.id);
            load();
        } catch (err) { alert(err.message); }
    };

    if (state.loading && state.rows.length === 0) return <Loading text="Syncing broadcast history..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    const todayCount = state.rows.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;
    const criticalCount = state.rows.filter(r => r.type === 'error' || r.type === 'warning').length;

    return (
        <div className="user-management-container">
            {/* 1. Header & Actions */}
            <div className="user-management-actions">
                <div className="search-container">
                    <i className="fas fa-satellite search-icon"></i>
                    <input placeholder="Search transmission logs..." readOnly />
                </div>
                <button className="btn-broadcast-primary" onClick={() => setState(p => ({ ...p, showModal: true }))}>
                    <i className="fas fa-rss"></i> Broadcast Signal
                </button>
            </div>

            {/* 2. Summary Stats */}
            <div className="summary-row" style={{ marginBottom: '24px' }}>
                <div className="admin-stat-card">
                    <div className="stat-content">
                        <div className="stat-lab">Total Transmissions</div>
                        <div className="stat-val">{state.rows.length}</div>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-content">
                        <div className="stat-lab">Today's Traffic</div>
                        <div className="stat-val" style={{ color: 'var(--neon-blue)' }}>{todayCount}</div>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-content">
                        <div className="stat-lab">Priority Alerts</div>
                        <div className="stat-val" style={{ color: 'var(--neon-red)' }}>{criticalCount}</div>
                    </div>
                </div>
            </div>

            {/* 3. History Table */}
            <GenericTable
                title="Broadcast History"
                rows={state.rows}
                columns={[
                    {
                        key: "title",
                        label: "Transmission Name",
                        render: (r) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontWeight: 600, color: '#fff' }}>{r.title}</span>
                                <span className="notif-message-preview">{r.message}</span>
                            </div>
                        )
                    },
                    {
                        key: "type",
                        label: "Signal Type",
                        render: (r) => <span className={`notif-type-badge notif-type-${r.type}`}>{r.type}</span>
                    },
                    {
                        key: "created_at",
                        label: "Time Broadcasted",
                        render: (r) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(r.created_at).toLocaleString()}</span>
                    },
                    {
                        key: "actions",
                        label: "Operations",
                        render: (r) => (
                            <div className="actions-cell">
                                <button className="action-icon-btn"><i className="fas fa-eye"></i></button>
                                <button className="action-icon-btn ban" onClick={() => del(r.id)}><i className="fas fa-trash-alt"></i></button>
                            </div>
                        )
                    }
                ]}
            />

            {/* 4. Broadcast Modal */}
            {state.showModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ width: '500px' }}>
                        <h2>New System Broadcast</h2>

                        <div className="form-stage-container">
                            <div className="form-section">
                                <div className="form-section-header">
                                    <i className="fas fa-paper-plane"></i>
                                    <span>Transmission Intel</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    <label>Signal Title</label>
                                    <input
                                        value={form.title}
                                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g., System Maintenance"
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    <label>Transmission Payload (Message)</label>
                                    <textarea
                                        value={form.message}
                                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                        placeholder="Enter message for all agents..."
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', padding: '10px', minHeight: '100px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label>Priority Protocol</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                        <option value="info">Standard Info</option>
                                        <option value="success">Success Signal</option>
                                        <option value="warning">System Warning</option>
                                        <option value="error">Critical Error</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setState(p => ({ ...p, showModal: false }))}>Abort</button>
                            <button className="btn-broadcast-primary" onClick={send}>Begin Broadcast</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Success Notification */}
            {state.showSuccess && (
                <div className="success-overlay broadcast-success-overlay">
                    <i className="fas fa-wifi success-icon-large broadcast-icon"></i>
                    <h2>Signal Transmitted</h2>
                    <p>Transmission <strong>{state.newTitle}</strong> has been successfully broadcasted across the encrypted network.</p>
                    <button className="btn-close-success" style={{ background: 'var(--neon-blue)' }} onClick={() => setState(p => ({ ...p, showSuccess: false }))}>Terminat Connectivity</button>
                </div>
            )}
        </div>
    );
}
