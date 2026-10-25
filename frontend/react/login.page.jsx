const { useState } = React;

const API_BASE = "http://127.0.0.1:8000";

function LoginPage({ role }) {
  const [view, setView] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState(role === "admin" ? "admin" : "");
  const [password, setPassword] = useState(role === "admin" ? "admin123" : "");

  // Registration state
  const [regData, setRegData] = useState({ username: "", email: "", password: "", confirm: "" });
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForms = () => {
    setEmail("");
    setPassword("");
    setRegData({ username: "", email: "", password: "", confirm: "" });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Please fill all signal headers");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Authentication Failed");
        return;
      }

      const user = {
        id: data.user_id,
        username: data.username,
        email: data.email,
        role: data.role,
        level: data.level || 1,
        points: data.points || 0
      };

      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "admin") {
        window.location.replace("/frontend/admin/admin.html");
      } else {
        window.location.replace("/frontend/user/dashboard.html");
      }
    } catch (err) {
      alert("Grid offline: Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regData.username || !regData.email || !regData.password) {
      alert("All identification protocols must be filled");
      return;
    }
    if (regData.password !== regData.confirm) {
      alert("Encryption keys (passwords) do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regData.username.trim(),
          email: regData.email.trim(),
          password: regData.password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Registration protocol failed");
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      alert("Grid offline: Registration unreachable");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="page" style={{ justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '4rem', color: '#00ffa6', marginBottom: '20px' }}>
            <i className="fas fa-fingerprint"></i>
          </div>
          <h2 style={{ color: '#fff', marginBottom: '10px' }}>Identity Forged</h2>
          <p style={{ color: '#9fdfff', fontSize: '14px', marginBottom: '30px' }}>
            Agent <strong>{regData.username}</strong>, your digital identity has been successfully registered on the EHSP grid.
          </p>
          <button className="login-btn" onClick={() => {
            setShowSuccess(false);
            setView("login");
            resetForms();
          }}>Initiate Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <div className="logo"><i className="fas fa-shield-alt"></i></div>
        <h1>Ethical Hacking Portal</h1>
        <p className="subtitle">{role === "admin" ? "Admin Command Center" : (view === "login" ? "Agent Verification" : "Forge Identity")}</p>
      </div>

      <div className="card">
        {view === "login" ? (
          <>
            <label>Username</label>
            <div className="input-box">
              <span className="icon">&gt;_</span>
              <input type="text" placeholder="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <label>Password</label>
            <div className="input-box">
              <span className="icon"><i className="fas fa-lock"></i></span>
              <input type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} />
            </div>

            

            <button className="login-btn" onClick={handleLogin} disabled={loading}>
              {loading ? "Authenticating..." : (role === "admin" ? "Admin Login" : "Agent Login")}
            </button>

            {role !== "admin" && (
              <>
                <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#9fdfff" }}>Don&apos;t have an account?</div>
                <button
                  onClick={() => { setView("register"); resetForms(); }}
                  style={{ marginTop: "10px", width: "100%", padding: "10px", borderRadius: "10px", background: "transparent", border: "1px solid #00ffa6", color: "#00ffa6", cursor: "pointer" }}
                >
                  Create Account
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <label>Username</label>
            <div className="input-box">
              <span className="icon"><i className="fas fa-user"></i></span>
              <input type="text" placeholder="Choose username" value={regData.username} onChange={(e) => setRegData(p => ({ ...p, username: e.target.value }))} />
            </div>

            <label>Email Address</label>
            <div className="input-box">
              <span className="icon"><i className="fas fa-envelope"></i></span>
              <input type="email" placeholder="agent@ehsp.local" value={regData.email} onChange={(e) => setRegData(p => ({ ...p, email: e.target.value }))} />
            </div>

            <label>Master Encryption Key (Password)</label>
            <div className="input-box">
              <span className="icon"><i className="fas fa-key"></i></span>
              <input type="password" placeholder="********" value={regData.password} onChange={(e) => setRegData(p => ({ ...p, password: e.target.value }))} />
            </div>

            <label>Confirm Key</label>
            <div className="input-box">
              <span className="icon"><i className="fas fa-check-circle"></i></span>
              <input type="password" placeholder="********" value={regData.confirm} onChange={(e) => setRegData(p => ({ ...p, confirm: e.target.value }))} />
            </div>

            <button className="login-btn" onClick={handleRegister} disabled={loading} style={{ marginTop: '20px' }}>
              {loading ? "Forging Identity..." : "Forge Identity"}
            </button>

            <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#9fdfff" }}>Already have an account?</div>
            <button
              onClick={() => { setView("login"); resetForms(); }}
              style={{ marginTop: "10px", width: "100%", padding: "10px", borderRadius: "10px", background: "transparent", border: "1px solid var(--neon-blue, #00d2ff)", color: "var(--neon-blue, #00d2ff)", cursor: "pointer" }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>

      <a className="back" href="index.html" role="button" aria-label="Back to role selection">&larr; Back to Role Selection</a>
    </div>
  );
}

const role = window.location.pathname.toLowerCase().includes("admin-login") ? "admin" : "user";
ReactDOM.createRoot(document.getElementById("root")).render(<LoginPage role={role} />);
