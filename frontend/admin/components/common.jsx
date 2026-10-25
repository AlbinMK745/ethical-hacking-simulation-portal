/**
 * COMMON ADMIN COMPONENTS
 * Reusable UI elements used across different views in the admin portal.
 */

/**
 * Animated loading spinner with optional text.
 */
function Loading({ text = "Loading..." }) {
    return (
        <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>{text}</p>
        </div>
    );
}

/**
 * Standard error display box.
 */
function ErrorBox({ text }) {
    return <div className="error-text">{text}</div>;
}

/**
 * A flexible, themed data table for displaying system records.
 * @param {string} title - Table header.
 * @param {array} columns - Column definitions {key, label, render}.
 * @param {array} rows - Data rows to display.
 */
function GenericTable({ title, columns, rows }) {
    return (
        <div className="user-management-container">
            {title && <h2>{title}</h2>}
            <div className="table-panel">
                <table className="cyber-table">
                    <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
                    <tbody>
                        {rows.length === 0 ? <tr><td colSpan={columns.length}>No data</td></tr> : rows.map((r, i) => (
                            <tr key={r.id || i}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : (r[c.key] ?? "-")}</td>)}</tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
