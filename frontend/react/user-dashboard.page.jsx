/**
 * USER DASHBOARD PAGE - ORCHESTRATOR
 * Main entry point for the user portal.
 * This file coordinates navigation, session management, and view rendering.
 */

function UserDashboardPage() {
  const guardedUser = useUserGuard();
  const [user, setUser] = React.useState(guardedUser);
  const [status, setStatus] = React.useState("active");
  const [page, setPage] = React.useState(() => {
    const hash = (window.location.hash || "").replace(/^#/, "");
    const map = {
      dashboard: "dashboard",
      tutorials: "tutorials",
      "saved-tutorials": "saved-tutorials",
      recent: "recent",
      challenges: "challenges",
      daily: "daily-challenge",
      "daily-challenge": "daily-challenge",
      "attempt-history": "attempt-history",
      leaderboard: "leaderboard",
      achievements: "achievements",
      notes: "notes",
      notifications: "notifications",
      progress: "progress",
      profile: "profile",
      social: "social"
    };
    return map[hash] || "dashboard";
  });
  const [success, setSuccess] = React.useState(null); // { message, points }
  const [selectedModuleId, setSelectedModuleId] = React.useState(null);

  const redirectedRef = React.useRef(false);

  React.useEffect(() => {
    if (redirectedRef.current) return;
    if (!guardedUser || (guardedUser.role || "").toLowerCase() !== "user") {
      redirectedRef.current = true;
      window.location.href = "../user-login.html";
      return;
    }
    // Connect WebSocket for real-time notifications
    if (window.WsNotifications) {
      window.WsNotifications.connect(guardedUser.id);
    }
    /**
     * Fetch current user status (active/suspended) and sync level
     */
    (async () => {
      try {
        const stats = await api(`/user/dashboard/stats/${guardedUser.id}`);
        if (stats.status) setStatus(stats.status);

        // Synchronize level and points from backend
        const calculatedLevel = Math.floor(stats.points / 100) + 1;
        setUser(prev => ({
          ...prev,
          points: stats.points,
          level: calculatedLevel
        }));
      } catch (err) { console.error("Status check failed:", err); }
    })();
    // Disconnect WS on page unload
    return () => { if (window.WsNotifications) window.WsNotifications.disconnect(); };
  }, [guardedUser]);

  React.useEffect(() => {
    const hashValue = page === "daily-challenge" ? "daily" : page;
    if ((window.location.hash || "").replace(/^#/, "") !== hashValue) {
      window.location.hash = hashValue;
    }
  }, [page]);

  if (!user) return null;

  const pageTitle = {
    dashboard: "Dashboard",
    tutorials: "Tutorials",
    "saved-tutorials": "Saved Tutorials",
    recent: "Recently Viewed",
    challenges: "Challenges",
    "daily-challenge": "Daily Challenge",
    "attempt-history": "Attempt History",
    leaderboard: "Leaderboard",
    achievements: "Achievements",
    notes: "My Notes",
    notifications: "Notifications",
    progress: "Progress Graph",
    profile: "Profile",
    social: "Social Network"
  }[page] || "Dashboard";

  const logout = () => {
    localStorage.clear();
    window.location.href = "../index.html";
  };

  return (
    <div className="layout">
      {/* 1. Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <i className="fas fa-shield-alt brand-icon"></i>
          <div className="brand-text"><h2>Hacker Portal</h2><span>Learn & Conquer</span></div>
        </div>

        <nav className="sidebar-nav">
          {[
            ["dashboard",       "fa-th-large",     "Dashboard"],
            ["tutorials",       "fa-book-open",    "Tutorials"],
            ["saved-tutorials", "fa-star",         "Saved Tutorials"],
            ["recent",          "fa-clock",        "Recently Viewed"],
            ["challenges",      "fa-crosshairs",   "Challenges"],
            ["daily-challenge", "fa-calendar-day", "Daily Challenge"],
            ["attempt-history", "fa-history",      "Attempt History"],
            ["leaderboard",     "fa-trophy",       "Leaderboard"],
            ["achievements",    "fa-medal",        "Achievements"],
            ["notes",           "fa-sticky-note",  "My Notes"],
            ["notifications",   "fa-bell",         "Notifications"],
            ["progress",        "fa-chart-line",   "Progress Graph"],
            ["profile",         "fa-user",         "Profile"],
            ["social",          "fa-users",        "Social Network"]
          ].map(([id, icon, label]) => (
            <a key={id} href="#"
               data-nav={id}
               className={`nav-link ${page === id ? "active" : ""}`}
               onClick={(e) => { e.preventDefault(); setPage(id); }}>
              <i className={`fas ${icon}`}></i> {label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a href="#" className="logout-btn" onClick={(e) => { e.preventDefault(); logout(); }}><i className="fas fa-sign-out-alt"></i> Logout</a>
        </div>
      </aside>

      {/* 2. Top Header Bar */}
      <main className="main-content">
        <header className="topbar">
          <h1>{pageTitle}</h1>
          <div className="top-actions">
            <div className="icon-wrap">
              <i className="fas fa-bell action-icon" onClick={() => setPage("notifications")}></i>
              <span className="dot"></span>
            </div>
            <div className="user-pill" onClick={() => setPage("profile")}>
              <div className="avatar"><i className="fas fa-user"></i></div>
              <div className="user-meta">
                <span className="name">{user.username}</span>
                <span className="level">Level {user.level || 1}</span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Dynamic View Engine */}
        <div id="view">
          {page === "dashboard" ? (
            <DashboardView
              user={user}
              onNavigate={(p, moduleId = null) => {
                if (moduleId) setSelectedModuleId(moduleId);
                setPage(p);
              }}
            />
          ) : null}
          {(page === "tutorials" || page === "saved-tutorials") ? (
            status === "suspended" ? <SuspendedOverlay /> : (
              <TutorialsView
                user={user}
                savedOnly={page === "saved-tutorials"}
                onUserUpdate={setUser}
                onSuccess={setSuccess}
              />
            )
          ) : null}
          {page === "challenges" ? (status === "suspended" ? <SuspendedOverlay /> : <ChallengesView user={user} onSuccess={setSuccess} />) : null}
          {page === "daily-challenge" ? (status === "suspended" ? <SuspendedOverlay /> : <DailyChallengeView user={user} onSuccess={setSuccess} />) : null}
          {page === "attempt-history" ? <AttemptHistoryView user={user} /> : null}

          {page === "leaderboard" ? <LeaderboardView user={user} /> : null}
          {page === "achievements" ? <AchievementsView user={user} /> : null}
          {page === "notes" ? <NotesView user={user} /> : null}
          {page === "notifications" ? <NotificationsView user={user} /> : null}
          {page === "progress" ? <ProgressView user={user} /> : null}
          {page === "profile" ? <ProfileView user={user} onUserUpdate={setUser} /> : null}
          {page === "recent" ? (
            <RecentlyViewedPageView user={user} onNavigate={(p, moduleId = null) => {
              if (moduleId) setSelectedModuleId(moduleId);
              setPage(p);
            }} />
          ) : null}
          {page === "social" ? <SocialView user={user} /> : null}
        </div>
      </main>

      {/* 4. Global Alerts */}
      <SuccessNotification
        message={success?.message}
        points={success?.points}
        onComplete={() => setSuccess(null)}
      />

      {/* 5. Real-time Social Messenger */}
      <MessengerPanel user={user} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<UserDashboardPage />);
