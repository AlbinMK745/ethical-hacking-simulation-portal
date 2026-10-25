/**
 * USER MANAGEMENT VIEWS
 * Contains UsersView for listing/actions and UserProfileView for detailed agent intelligence.
 */

function UsersView({ user, onViewProfile }) {
    const [state, setState] = React.useState({
        loading: true,
        error: "",
        rows: [],
        q: "",
        filterStatus: "all",
        showModal: false,
        showSuccess: false,
        newUsername: "" // for success msg
    });

    const [form, setForm] = React.useState({ username: "", email: "", password: "", role: "user" });

    const load = async (q = "") => {
        setState((p) => ({ ...p, loading: true, error: "", q }));
        try {
            const path = q ? `/admin/users?q=${encodeURIComponent(q)}` : `/admin/users`;
            const rows = await api(path, {}, user.id);
            setState((p) => ({ ...p, loading: false, rows: Array.isArray(rows) ? rows : [] }));
        } catch (err) {
            setState((p) => ({ ...p, loading: false, error: err.message, rows: [] }));
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    const changeStatus = async (uid, status) => {
        try {
            await api(`/admin/users/${uid}/status/?status=${status}`, { method: "PUT" }, user.id);
            load(state.q);
        } catch (err) { alert(err.message); }
    };

    const addUser = async () => {
        if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
            alert("All fields required");
            return;
        }
        try {
            await api(`/admin/users`, {
                method: "POST",
                body: JSON.stringify({
                    username: form.username.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    role: form.role
                })
            }, user.id);
            const addedUsername = form.username;
            setForm({ username: "", email: "", password: "", role: "user" });
            setState(p => ({ ...p, showModal: false, showSuccess: true, newUsername: addedUsername }));
            load(state.q);
        } catch (err) {
            alert(err.message);
        }
    };

    if (state.loading && state.rows.length === 0) return <Loading text="Loading users..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    const filteredRows = state.rows.filter(r => {
        if (state.filterStatus === "all") return true;
        return r.status === state.filterStatus;
    });

    const activeCount = state.rows.filter((r) => r.status === "active").length;
    const suspendedCount = state.rows.filter((r) => r.status === "suspended").length;

    return (
        <div className="user-management-container">
            {/* 1. Header & Search Bar */}
            <div className="user-management-actions">
                <div className="search-container">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        placeholder="Search users by name or email..."
                        value={state.q}
                        onChange={(e) => setState((p) => ({ ...p, q: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && load(state.q)}
                    />
                </div>
                <button className="btn-add-primary" onClick={() => setState(p => ({ ...p, showModal: true }))}>
                    <i className="fas fa-plus"></i> Add User
                </button>
            </div>

            {/* Statistics Overview */}
            <div className="summary-row" style={{ marginBottom: '24px' }}>
                <div className="admin-stat-card">
                    <div className="stat-content">
                        <div className="stat-lab">Total Users</div>
                        <div className="stat-val">{state.rows.length}</div>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-content">
                        <div className="stat-lab">Active Users</div>
                        <div className="stat-val" style={{ color: 'var(--neon-green)' }}>{activeCount}</div>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-content">
                        <div className="stat-lab">Suspended Users</div>
                        <div className="stat-val" style={{ color: 'var(--neon-red)' }}>{suspendedCount}</div>
                    </div>
                </div>
            </div>

            {/* 2. Filter Bar */}
            <div className="filter-bar">
                <i className="fas fa-filter filter-icon"></i>
                <div className="filter-tabs">
                    <button className={`filter-btn ${state.filterStatus === 'all' ? 'active' : ''}`} onClick={() => setState(p => ({ ...p, filterStatus: 'all' }))}>All</button>
                    <button className={`filter-btn ${state.filterStatus === 'active' ? 'active' : ''}`} onClick={() => setState(p => ({ ...p, filterStatus: 'active' }))}>Active</button>
                    <button className={`filter-btn ${state.filterStatus === 'suspended' ? 'active' : ''}`} onClick={() => setState(p => ({ ...p, filterStatus: 'suspended' }))}>Suspended</button>
                </div>
            </div>

            {/* 3. Main Data Table */}
            <GenericTable
                title="User Base"
                rows={filteredRows}
                columns={[
                    {
                        key: "username",
                        label: "User",
                        render: (r) => (
                            <div className="user-row">
                                <div className="user-avatar-initial">{r.username[0].toUpperCase()}</div>
                                <span className="username-text">{r.username}</span>
                            </div>
                        )
                    },
                    { key: "email", label: "Email" },
                    {
                        key: "status",
                        label: "Status",
                        render: (r) => <span className={`status-badge ${r.status}`}>{r.status}</span>
                    },
                    {
                        key: "level",
                        label: "Level",
                        render: (r) => <span className="level-text">Level {r.level || 0}</span>
                    },
                    {
                        key: "points",
                        label: "Points",
                        render: (r) => <span className="points-text">{r.points || 0}</span>
                    },
                    { key: "challenges", label: "Challenges" },
                    {
                        key: "last_active",
                        label: "Last Active",
                        render: (r) => <span className="last-active-text">{r.last_active}</span>
                    },
                    {
                        key: "actions",
                        label: "Actions",
                        render: (r) => (
                            <div className="actions-cell">
                                <button className="action-icon-btn" onClick={() => onViewProfile(r.id)}><i className="fas fa-eye"></i></button>
                                <button className="action-icon-btn sync" onClick={() => changeStatus(r.id, "active")}><i className="fas fa-sync-alt"></i></button>
                                <button className="action-icon-btn ban" onClick={() => changeStatus(r.id, "suspended")}><i className="fas fa-ban"></i></button>
                            </div>
                        )
                    }
                ]}
            />


            {/* 5. Add User Modal */}
            {state.showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>Access Registry</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label>Username</label>
                            <input value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))} />
                            <label>Email Address</label>
                            <input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
                            <label>Security Key (Password)</label>
                            <input type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} />
                            <label>Authorization Level</label>
                            <select value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                                <option value="user">Agent</option>
                                <option value="admin">Overseer</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setState(p => ({ ...p, showModal: false }))}>Abort</button>
                            <button className="btn-primary" onClick={addUser}>Initialize</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Success Modal */}
            {state.showSuccess && (
                <div className="success-overlay">
                    <i className="fas fa-user-check success-icon-large"></i>
                    <h2>Identity Created</h2>
                    <p>Access for <strong>{state.newUsername}</strong> has been successfully registered in the system nodes.</p>
                    <button className="btn-close-success" onClick={() => setState(p => ({ ...p, showSuccess: false }))}>Confirm</button>
                </div>
            )}
        </div>
    );
}

/**
 * USER PROFILE VIEW
 * Detailed audit of a specific user's performance, solved nodes, and recent neural activity.
 */
function UserProfileView({ user, targetUserId, onBack }) {
    const [state, setState] = React.useState({ loading: true, error: "", data: null });

    React.useEffect(() => {
        (async () => {
            try {
                const data = await api(`/admin/users/${targetUserId}/profile`, {}, user.id);
                setState({ loading: false, error: "", data });
            } catch (err) {
                setState({ loading: false, error: err.message, data: null });
            }
        })();
    }, [targetUserId, user.id]);

    if (state.loading) return <Loading text="Fetching user intelligence..." />;
    if (state.error) return <ErrorBox text={state.error} />;

    const { user: u, solved_count, recent_activity } = state.data;

    return (
        <div className="user-management-container">
            <div className="action-bar">
                <button className="btn-secondary" onClick={onBack}>
                    <i className="fas fa-arrow-left"></i> Back to Registry
                </button>
            </div>

            <div className="user-profile-layout">
                <div className="profile-sidebar">
                    <div className="admin-panel">
                        <div className="user-avatar-large">{u.username[0].toUpperCase()}</div>
                        <h2 className="username-display">{u.username}</h2>
                        <span className={`status-badge ${u.status}`}>{u.status}</span>
                        <div className="profile-meta-list">
                            <div className="meta-item"><i className="fas fa-envelope"></i> {u.email}</div>
                            <div className="meta-item"><i className="fas fa-id-badge"></i> ID: {u.id}</div>
                            <div className="meta-item"><i className="fas fa-calendar-alt"></i> Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>

                <div className="profile-main">
                    <div className="summary-row">
                        <div className="admin-stat-card">
                            <div className="stat-content">
                                <div className="stat-lab">Total Points</div>
                                <div className="stat-val">{u.points || 0}</div>
                            </div>
                        </div>
                        <div className="admin-stat-card">
                            <div className="stat-content">
                                <div className="stat-lab">Combat Level</div>
                                <div className="stat-val" style={{ color: 'var(--neon-blue)' }}>{u.level || 1}</div>
                            </div>
                        </div>
                        <div className="admin-stat-card">
                            <div className="stat-content">
                                <div className="stat-lab">Solved Nodes</div>
                                <div className="stat-val" style={{ color: 'var(--neon-green)' }}>{solved_count}</div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel mt-24">
                        <div className="panel-header">
                            <h3>Recent Neural Activity</h3>
                            <i className="fas fa-brain"></i>
                        </div>
                        <div className="activity-list">
                            {recent_activity.map((a, i) => (
                                <div key={i} className="activity-row">
                                    <div className={`status-dot ${a.is_correct ? 'success' : 'fail'}`}></div>
                                    <div className="act-info">
                                        <strong>{a.title}</strong>
                                        <span>{a.is_correct ? 'Successfully Breached' : 'Failed Attempt'}</span>
                                    </div>
                                    <span className="act-time">{new Date(a.created_at).toLocaleString()}</span>
                                </div>
                            ))}
                            {recent_activity.length === 0 && <div className="empty-feed">No recent activity logged</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
