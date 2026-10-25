const { useEffect } = React;

function LandingPage() {
  return (
    <div className="container">
      <header className="hero-logo">
        <div className="logo-icon">
          <i className="fas fa-shield-alt"></i>
        </div>
        <h1>Ethical Hacking Simulation Portal</h1>
        <p className="subtitle">
          Learn cybersecurity through interactive tutorials, simulated challenges, and competitive leaderboards
        </p>

        <div className="features">
          <span><i className="fas fa-code"></i> Real-time Challenges</span>
          <span><i className="fas fa-bolt"></i> Interactive Learning</span>
          <span><i className="fas fa-terminal"></i> Sandbox Environment</span>
        </div>
      </header>

      <div className="role-wrapper">
        <div className="role-card admin">
          <div className="card-icon">
            <i className="fas fa-user-cog"></i>
          </div>
          <h2>Admin</h2>
          <p className="role-desc">Manage users, challenges, tutorials, and monitor sandbox activities</p>

          <ul>
            <li><i className="fas fa-chevron-right"></i> User Management</li>
            <li><i className="fas fa-chevron-right"></i> Challenge Creation</li>
            <li><i className="fas fa-chevron-right"></i> System Monitoring</li>
          </ul>

          <a href="admin-login.html" className="role-link">
            Login as Admin <i className="fas fa-chevron-right"></i>
          </a>
        </div>

        <div className="role-card user">
          <div className="card-icon">
            <i className="fas fa-users"></i>
          </div>
          <h2>User</h2>
          <p className="role-desc">Access tutorials, complete challenges, and compete on the leaderboard</p>

          <ul>
            <li><i className="fas fa-chevron-right"></i> Interactive Tutorials</li>
            <li><i className="fas fa-chevron-right"></i> Hacking Challenges</li>
            <li><i className="fas fa-chevron-right"></i> Leaderboard Ranking</li>
          </ul>

          <a href="user-login.html" className="role-link">
            Login as User <i className="fas fa-chevron-right"></i>
          </a>
        </div>
      </div>

      <div className="footer-text">Secure • Educational • Ethical</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<LandingPage />);
