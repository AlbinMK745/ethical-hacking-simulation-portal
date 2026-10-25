/**
 * TUTORIAL READER PAGE
 * Standalone page for reading a tutorial module.
 * Reads moduleId from URL query param: ?moduleId=X&from=tutorials
 * Session auth from localStorage (same as dashboard).
 *
 * NOTE: API_BASE, api(), useUserGuard(), Loading, ErrorBox
 * are all defined in utils.jsx + common.jsx loaded before this file.
 */


function TutorialReaderPage() {
    const user = useUserGuard();

    // Redirect to login if no session found
    React.useEffect(() => {
        if (!user) {
            window.location.href = "../user-login.html";
        }
    }, [user]);

    // Read moduleId from URL: ?moduleId=5
    const params = new URLSearchParams(window.location.search);
    const moduleIdRaw = params.get("moduleId");
    const moduleId = moduleIdRaw ? parseInt(moduleIdRaw, 10) : null;

    // Where to go back (tutorials or saved-tutorials)
    const backHash = params.get("from") || "tutorials";

    const goBack = () => {
        window.location.href = `dashboard.html#${backHash}`;
    };

    if (!user) return null;


    if (!moduleId) {
        return (
            <div style={{ padding: "3rem", textAlign: "center" }}>
                <p style={{ color: "#f87171" }}>No module specified. <a href="dashboard.html#tutorials" style={{ color: "#00d2ff" }}>Back to Tutorials</a></p>
            </div>
        );
    }

    return (
        <div>
            {/* Top navigation bar */}
            <div className="reader-topbar">
                <button className="reader-back-btn" onClick={goBack}>
                    <i className="fas fa-chevron-left"></i> BACK TO TUTORIALS
                </button>
                <span className="reader-topbar-title">
                    <i className="fas fa-book-open" style={{ marginRight: "6px", color: "#00d2ff" }}></i>
                    Tutorial Reader
                </span>
            </div>

            {/* Full-height reader body */}
            <div className="reader-page-body">
                <TutorialReadingView
                    user={user}
                    moduleId={moduleId}
                    onBack={goBack}
                    onUserUpdate={(updater) => {
                        // Persist level/points updates back to localStorage
                        const current = JSON.parse(localStorage.getItem("user") || "{}");
                        const updated = typeof updater === "function" ? updater(current) : { ...current, ...updater };
                        localStorage.setItem("user", JSON.stringify(updated));
                    }}
                    onSuccess={({ message, points }) => {
                        // Simple toast for point gains on this standalone page
                        const toast = document.createElement("div");
                        toast.style.cssText = `
                            position:fixed; bottom:2rem; right:2rem; z-index:9999;
                            background:linear-gradient(135deg,#0a1628,#0d2040);
                            border:1px solid rgba(0,210,255,0.3); border-radius:12px;
                            padding:1rem 1.5rem; color:#00d2ff;
                            box-shadow:0 8px 32px rgba(0,0,0,0.5);
                            font-family:Orbitron,monospace; font-size:0.8rem;
                            animation:slideIn .4s ease;
                        `;
                        toast.innerHTML = `<i class="fas fa-bolt" style="margin-right:8px;color:#f59e0b;"></i>${message}${points > 0 ? ` <strong style="color:#f59e0b">+${points} XP</strong>` : ""}`;
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 4000);
                    }}
                />
            </div>

            <style>{`
                @keyframes slideIn {
                    from { opacity:0; transform:translateX(20px); }
                    to   { opacity:1; transform:translateX(0); }
                }
            `}</style>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<TutorialReaderPage />);
