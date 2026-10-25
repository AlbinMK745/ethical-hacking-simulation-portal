/**
 * RECENTLY VIEWED PAGE VIEW
 * A premium card-based layout for the full "Recently Viewed" page.
 */

function RecentlyViewedPageView({ user, onNavigate }) {
    const [state, setState] = React.useState({ loading: true, error: "", items: [] });

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await api(`/user/modules/recently-viewed`, {
                    headers: { "user-id": String(user.id) }
                });
                if (!cancelled) setState({ loading: false, error: "", items: Array.isArray(data) ? data : [] });
            } catch (err) {
                if (!cancelled) setState({ loading: false, error: err.message, items: [] });
            }
        })();
        return () => { cancelled = true; };
    }, [user.id]);

    if (state.loading) return <Loading text="Loading intel archive..." />;
    if (state.error) return <ErrorBox error={state.error} />;

    const getIcon = (item) => {
        if (item.category?.includes("Web")) return "fa-globe";
        if (item.category?.includes("Network")) return "fa-network-wired";
        if (item.category?.includes("Binary")) return "fa-terminal";
        if (item.category?.includes("Crypto")) return "fa-key";
        return "fa-book-open";
    };

    const getStatusInfo = (item) => {
        if (item.completed) return { text: "Completed", cls: "rv-status-done", icon: "fa-check-double" };
        if (item.progress_percent > 0) return { text: `In Progress (${item.progress_percent}%)`, cls: "rv-status-progress", icon: "fa-spinner" };
        return { text: "Started", cls: "rv-status-started", icon: "fa-play" };
    };

    const formatDate = (raw) => {
        if (!raw) return "—";
        const d = new Date(raw);
        if (isNaN(d)) return "—";
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="rv-page">
            <div className="rv-page-header">
                <div>
                    <h2><i className="fas fa-clock"></i> Recently Viewed</h2>
                    <p className="rv-subtitle">{state.items.length} module{state.items.length !== 1 ? "s" : ""} in your intel archive</p>
                </div>
            </div>

            {state.items.length === 0 ? (
                <div className="rv-empty">
                    <i className="fas fa-ghost"></i>
                    <h3>Archive Empty</h3>
                    <p>Open any tutorial to start building your intel archive.</p>
                    <button className="btn-tactical-start" onClick={() => onNavigate("tutorials")}>
                        Browse Tutorials <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            ) : (
                <div className="rv-cards">
                    {state.items.map((item, i) => {
                        const status = getStatusInfo(item);
                        return (
                            <div
                                key={i}
                                className={`rv-card ${item.completed ? "rv-card-done" : ""}`}
                                onClick={() => onNavigate("tutorials", item.item_id)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="rv-card-icon">
                                    <i className={`fas ${getIcon(item)}`}></i>
                                </div>
                                <div className="rv-card-body">
                                    <div className="rv-card-top">
                                        <h3 className="rv-card-title">{item.title || "Untitled Module"}</h3>
                                        <span className={`rv-status ${status.cls}`}>
                                            <i className={`fas ${status.icon}`}></i> {status.text}
                                        </span>
                                    </div>
                                    <div className="rv-card-meta">
                                        {item.category && (
                                            <span className="rv-badge-cat">
                                                <i className="fas fa-tag"></i> {item.category}
                                            </span>
                                        )}
                                        {item.difficulty && (
                                            <span className={`rv-badge-diff ${(item.difficulty || "").toLowerCase()}`}>
                                                {item.difficulty}
                                            </span>
                                        )}
                                        <span className="rv-timestamp">
                                            <i className="fas fa-clock"></i> {formatDate(item.last_viewed_at)}
                                        </span>
                                    </div>
                                    {item.progress_percent > 0 && (
                                        <div className="rv-progress-bar-wrap">
                                            <div className="rv-progress-bar-bg">
                                                <div
                                                    className="rv-progress-bar-fill"
                                                    style={{ width: `${item.progress_percent}%` }}
                                                ></div>
                                            </div>
                                            <span className="rv-progress-pct">{item.progress_percent}%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="rv-card-action">
                                    <button className="rv-btn-action" onClick={(e) => { e.stopPropagation(); onNavigate("tutorials", item.item_id); }}>
                                        {item.completed ? (
                                            <><i className="fas fa-redo"></i> Re-read</>
                                        ) : item.progress_percent > 0 ? (
                                            <><i className="fas fa-play"></i> Continue</>
                                        ) : (
                                            <><i className="fas fa-bolt"></i> Open</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
