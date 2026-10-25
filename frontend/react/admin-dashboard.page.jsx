/**
 * ADMIN DASHBOARD ORCHESTRATOR
 * This is the main entry point for the Admin Portal.
 * It manages routing between different views and handles the root layout.
 */

const { useEffect, useMemo, useState } = React;

function AdminDashboardPage() {
  const initial = useMemo(() => getUser(), []);
  const [user] = useState(initial);
  const [page, setPage] = useState("dashboard");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const redirectedRef = React.useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    if (!initial || (initial.role || "").toLowerCase() !== "admin") {
      redirectedRef.current = true;
      window.location.href = "../admin-login.html";
    }
  }, [initial]);

  if (!user) return null;

  // Map internal page IDs to human-readable titles
  const pageTitle = {
    dashboard: "Dashboard",
    users: "User Management",
    "user-profile": "User Profile Audit",
    challenges: "Challenges",
    daily: "Daily Challenge",
    modules: "Tutorial Architect",
    leaderboard: "Leaderboard",
    sandbox: "Sandbox Monitor",
    notifications: "System Broadcast",
    analytics: "Intelligence Analytics",
    preview: "Live Preview Mode"
  }[page] || "Dashboard";

  const logout = () => {
    localStorage.clear();
    window.location.href = "../index.html";
  };

  return (
    <div className="layout">
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <i className="fas fa-shield-alt logo-icon"></i>
          <div className="logo-text">
            <h2>Admin Portal</h2>
            <small>Control Center</small>
          </div>
        </div>

        <nav className="nav-links">
          {[
            ["dashboard", "fa-th-large", "Dashboard"],
            ["users", "fa-user-friends", "User Management"],
            ["challenges", "fa-crosshairs", "Challenges"],
            ["daily", "fa-calendar-day", "Daily Challenge"],
            ["modules", "fa-book-open", "Tutorials"],
            ["leaderboard", "fa-trophy", "Leaderboard"],
            ["sandbox", "fa-server", "Sandbox Monitor"],
            ["notifications", "fa-bell", "Notifications"],
            ["analytics", "fa-chart-bar", "Analytics"],
            ["preview", "fa-eye", "Preview Mode"]
          ].map(([id, icon, label]) => (
            <a
              key={id}
              href="#"
              className={page === id ? "active" : ""}
              onClick={(e) => { e.preventDefault(); setPage(id); }}
            >
              <i className={`fas ${icon}`}></i> {label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a href="#" className="logout-btn" onClick={(e) => { e.preventDefault(); logout(); }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <h1>{pageTitle}</h1>
          <div className="topbar-actions">
            <button className="icon-btn"><i className="fas fa-cog"></i></button>
            <div className="profile-pill">
              <div className="profile-icon"><i className="fas fa-user"></i></div>
              <span>{user.username || "Admin"}</span>
            </div>
          </div>
        </header>

        <section id="view" className="content-area">
          {/* View Router */}
          {page === "dashboard" && <DashboardView user={user} />}
          {page === "users" && (
            <UsersView
              user={user}
              onViewProfile={(id) => { setSelectedUserId(id); setPage("user-profile"); }}
            />
          )}
          {page === "user-profile" && (
            <UserProfileView
              user={user}
              targetUserId={selectedUserId}
              onBack={() => { setPage("users"); setSelectedUserId(null); }}
            />
          )}
          {page === "challenges" && <ChallengesView user={user} />}
          {page === "daily" && <DailyChallengeView user={user} />}
          {page === "modules" && <ModulesView user={user} />}
          {page === "sandbox" && <SandboxView user={user} />}
          {page === "notifications" && <NotificationsView user={user} />}
          {page === "analytics" && <AnalyticsView user={user} />}
          {page === "preview" && <PreviewView user={user} />}
          {page === "leaderboard" && <LeaderboardView user={user} />}
        </section>
      </main>
    </div>
  );
}

// Initialize the root component
ReactDOM.createRoot(document.getElementById("root")).render(<AdminDashboardPage />);
