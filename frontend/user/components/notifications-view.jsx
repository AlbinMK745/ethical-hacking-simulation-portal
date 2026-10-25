/**
 * NOTIFICATIONS VIEW
 * System broadcasts and mission status alerts.
 */

function NotificationsView({ user }) {
    const [state, setState] = React.useState({ loading: true, error: "", rows: [] });

    const load = async () => {
        setState((p) => ({ ...p, loading: true, error: "" }));
        try {
            const rows = await api(`/user/notifications/?limit=50`, { headers: { "user-id": String(user.id) } });
            setState({ loading: false, error: "", rows: Array.isArray(rows) ? rows : [] });
        } catch (err) {
            setState({ loading: false, error: err.message, rows: [] });
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    const mark = async (id) => {
        await api(`/user/notifications/${id}/read`, { method: "PUT", headers: { "user-id": String(user.id) } });
        load();
    };

    const markAll = async () => {
        await api(`/user/notifications/mark-all-read`, { method: "PUT", headers: { "user-id": String(user.id) } });
        load();
    };

    if (state.loading) return <Loading text="Loading notifications..." />;
    if (state.error) return <ErrorBox error={state.error} />;

    return (
        <div className="notifications-page">
            <div className="notification-dropdown-header">
                <h3>Notifications</h3>
                <button className="mark-all-read-btn" onClick={markAll}>Mark all read</button>
            </div>
            <div className="notification-list">
                {state.rows.map((n) => (
                    <div key={n.id} className={`notification-item ${n.is_read ? "" : "unread"}`}>
                        <div className="notification-item-header">
                            <div className={`notification-type-icon ${n.type || "info"}`}><i className="fas fa-bell"></i></div>
                            <div className="notification-content">
                                <div className="notification-title">{n.title}</div>
                                <div className="notification-message">{n.message}</div>
                                <div className="notification-time">{new Date(n.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                        {!n.is_read ? <button className="mark-all-read-btn" onClick={() => mark(n.id)}>Mark read</button> : null}
                    </div>
                ))}
                {state.rows.length === 0 ? <div className="notification-empty"><p>No notifications found.</p></div> : null}
            </div>
        </div>
    );
}
