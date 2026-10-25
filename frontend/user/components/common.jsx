/**
 * COMMON USER PORTAL COMPONENTS
 * Reusable UI elements for the hacker dashboard.
 */

/**
 * Global Loading Spinner
 */
function Loading({ text = "Loading..." }) {
    return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>{text}</p>
        </div>
    );
}

/**
 * Error display box
 */
function ErrorBox({ error }) {
    return <p className="error-text">{error}</p>;
}

/**
 * Mission Success Notification Overlay
 */
function SuccessNotification({ message, points, onComplete }) {
    if (!message) return null;
    return (
        <div className="success-notification-overlay">
            <div className="success-notification-box">
                <div className="success-icon-wrap">
                    <i className="fas fa-check"></i>
                </div>
                <h2>Access Granted!</h2>
                <p>{message}</p>
                {points > 0 && (
                    <div className="points-badge-large">
                        +{points} PTS EARNED
                    </div>
                )}
                <button className="btn-notification-close" onClick={onComplete}>
                    Continue Mission
                </button>
            </div>
        </div>
    );
}

/**
 * Suspension Lock Screen
 */
function SuspendedOverlay() {
    return (
        <div className="suspended-view-overlay">
            <div className="suspended-content-box">
                <div className="lock-icon-wrap">
                    <i className="fas fa-lock"></i>
                </div>
                <h2 className="neon-red-text">COMMUNICATION TRUNCATED</h2>
                <p>Your agent status has been <strong>SUSPENDED</strong> by central command.</p>
                <div className="restriction-msg">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Access to tutorials, challenges, and daily missions is restricted until further notice.</span>
                </div>
                <p className="dim-text mt-20">Please contact the system administrator for restoration protocols.</p>
            </div>
        </div>
    );
}

/**
 * Generic Table Component for user data views
 */
function TablePage({ title, rows, columns }) {
    return (
        <div className="dashboard-grid">
            <div className="dash-card full-width">
                <h2>{title}</h2>
                <div className="lb-list-section">
                    <table className="cyber-table">
                        <thead>
                            <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? <tr><td colSpan={columns.length}>No data</td></tr> : rows.map((r, idx) => (
                                <tr key={r.id || idx}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : (r[c.key] ?? "-")}</td>)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/**
 * Utility view for fetching and displaying tabular data
 */
function FetchTableView({ title, loader, columns }) {
    const [state, setState] = React.useState({ loading: true, error: "", rows: [] });
    React.useEffect(() => {
        (async () => {
            try {
                const rows = await loader();
                setState({ loading: false, error: "", rows: Array.isArray(rows) ? rows : [] });
            } catch (err) {
                setState({ loading: false, error: err.message, rows: [] });
            }
        })();
    }, []);

    if (state.loading) return <Loading />;
    if (state.error) return <ErrorBox error={state.error} />;
    return <TablePage title={title} rows={state.rows} columns={columns} />;
}
