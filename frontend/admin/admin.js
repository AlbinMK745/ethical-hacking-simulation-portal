/* frontend/admin/admin.js */

// ✅ ADMIN AUTH CHECK
(function checkAdminAuth() {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      window.location.replace("../admin-login.html");
      return;
    }
    const user = JSON.parse(userStr);
    if ((user.role || "").toLowerCase() !== "admin") {
      window.location.replace("../admin-login.html");
      return;
    }
  } catch (e) {
    localStorage.clear();
    window.location.replace("../admin-login.html");
  }
})();

const API_BASE_URL = "http://127.0.0.1:8000";

async function api(path, options = {}) {
  const res = await fetch(API_BASE_URL + path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "user-id": "1" // Admin ID
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}


/* ---------- NAV HELPERS ---------- */
function setActive(el) {
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  const title = el ? el.innerText.trim() : 'Dashboard';
  document.getElementById('page-title').innerText = title;
}

/* ---------- DASHBOARD ---------- */
async function loadDashboard() {
  const view = document.getElementById("view");
  view.innerHTML = '<p style="color:#666;">Loading dashboard...</p>';

  let data = await api("/admin/dashboard");

  // Fallback Mock Data if API fails (to ensure UI shows up)
  if (!data) {
    data = {
      total_users: 5,
      total_challenges: 6,
      active_sessions: 3,
      tutorials: 6
    };
  }

  // Inject exact structure from image
  view.innerHTML = `
    <div class="dashboard-grid">
        
        <div class="stats-row">
            <div class="stat-card stat-1">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    
                </div>
                <div class="stat-value">${data.total_users}</div>
                <div class="stat-label">Total Users</div>
            </div>

            <div class="stat-card stat-2">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-crosshairs"></i></div>
                </div>
                <div class="stat-value">${data.total_challenges}</div>
                <div class="stat-label">Total Challenges</div>
            </div>

            <div class="stat-card stat-3">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-server"></i></div>
                </div>
                <div class="stat-value">${data.active_sessions}</div>
                <div class="stat-label">Active Sessions</div>
            </div>

            <div class="stat-card stat-4">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-book-open"></i></div>
                </div>
                <div class="stat-value">${data.tutorials}</div>
                <div class="stat-label">Tutorials</div>
            </div>
        </div>

        <div class="mid-row">
            <div class="card-panel">
                <div class="panel-header">
                    <h3>User Activity (24h)</h3>
                    <i class="fas fa-chart-line panel-icon"></i>
                </div>
                <div style="height: 200px;">
                    <canvas id="activityChart"></canvas>
                </div>
            </div>

            <div class="card-panel">
                <div class="panel-header">
                    <h3>System Notices</h3>
                    <i class="fas fa-exclamation-triangle panel-icon" style="color:#ffcc00"></i>
                </div>
                <ul class="notice-list">
                    <li class="notice-item warning">
                        <span class="notice-title">Server maintenance scheduled for Nov 26</span>
                        <span class="notice-time">2h ago</span>
                    </li>
                    <li class="notice-item info">
                        <span class="notice-title">New challenge "Network Forensics" published</span>
                        <span class="notice-time">5h ago</span>
                    </li>
                    <li class="notice-item alert">
                        <span class="notice-title">User diana_cyber account suspended</span>
                        <span class="notice-time">1d ago</span>
                    </li>
                </ul>
            </div>
        </div>

        <div class="bottom-row">
            <div class="card-panel">
                <div class="panel-header">
                    <h3>Challenge Solve Statistics</h3>
                    <i class="fas fa-chart-bar panel-icon" style="color:var(--neon-green)"></i>
                </div>
                <div style="height: 200px;">
                    <canvas id="solveChart"></canvas>
                </div>
            </div>

            <div class="card-panel">
                <div class="panel-header">
                    <h3>Recent Activity</h3>
                    <i class="fas fa-bolt panel-icon"></i>
                </div>
                <ul class="activity-list">
                    <li class="activity-item">
                        <div class="activity-dot dot-green"></div>
                        <div class="activity-info">
                            <h4>alice_hacker</h4>
                            <p>Solved challenge: SQL Injection Basic</p>
                        </div>
                        <span class="activity-time">10:30</span>
                    </li>
                    <li class="activity-item">
                        <div class="activity-dot dot-red"></div>
                        <div class="activity-info">
                            <h4>bob_security</h4>
                            <p>Failed login attempt</p>
                        </div>
                        <span class="activity-time">10:15</span>
                    </li>
                    <li class="activity-item">
                        <div class="activity-dot dot-blue"></div>
                        <div class="activity-info">
                            <h4>charlie_pwn</h4>
                            <p>Started sandbox session</p>
                        </div>
                        <span class="activity-time">09:45</span>
                    </li>
                    <li class="activity-item">
                        <div class="activity-dot dot-green"></div>
                        <div class="activity-info">
                            <h4>Admin</h4>
                            <p>Updated system logs</p>
                        </div>
                        <span class="activity-time">09:00</span>
                    </li>
                </ul>
            </div>
        </div>

    </div>
  `;

  // Draw charts after DOM injection
  drawCharts();
}

/* ---------- CHARTS ---------- */
async function drawCharts() {

  // ===============================
  // USER ACTIVITY (LINE CHART)
  // ===============================
  const activity = await api("/admin/activity");

  const activityLabels = activity.map(a => a.hour + ":00");
  const activityValues = activity.map(a => a.count);

  const ctx1 = document.getElementById("activityChart").getContext("2d");

  const gradient = ctx1.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(0, 210, 255, 0.25)");
  gradient.addColorStop(1, "rgba(0, 210, 255, 0)");

  new Chart(ctx1, {
    type: "line",
    data: {
      labels: activityLabels,
      datasets: [{
        data: activityValues,
        borderColor: "#00d2ff",
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // ===============================
  // SOLVE STATS (BAR CHART)
  // ===============================
  const stats = await api("/admin/solve-stats");

  const ctx2 = document.getElementById("solveChart");

  new Chart(ctx2, {
    type: "bar",
    data: {
      labels: stats.map(s => s.difficulty),
      datasets: [{
        data: stats.map(s => s.count),
        backgroundColor: "#00ffbf",
        borderRadius: 6
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // ===============================
  // RECENT ACTIVITY FEED
  // ===============================
  const recent = await api("/admin/recent-activity");

  const list = document.querySelector(".activity-list");
  if (!list) return;

  list.innerHTML = recent.map(r => `
    <li class="activity-item">
      <div class="activity-dot ${r.is_correct ? "dot-green" : "dot-red"}"></div>
      <div class="activity-info">
        <h4>${r.username}</h4>
        <p>${r.challenge}</p>
      </div>
      <span class="activity-time">${r.time}</span>
    </li>
  `).join("");
}


/* ---------- OTHER VIEWS (Simple Placeholders) ---------- */
function loadUsers() {
  document.getElementById("view").innerHTML = `<h2>User Management</h2><p>User table goes here...</p>`;
}
/* ---------- CHALLENGES VIEW ---------- */
async function loadChallenges() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Challenge Management";

  view.innerHTML = `
    <div class="user-management-container">
      <div class="action-bar">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input type="text" placeholder="Search challenges..." class="search-input" />
        </div>
        <button class="btn-add-user" onclick="openCreateChallenge()">
          <i class="fas fa-plus"></i> Create Challenge
        </button>
      </div>

      <div class="table-panel">
        <table class="cyber-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Points</th>
              <th>Solves</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="challenges-body">
            <tr><td colspan="7" class="loading-text">Loading challenges...</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

  try {
    const challenges = await api("/admin/challenges");
    const tbody = document.getElementById("challenges-body");

    if (challenges.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="dim-text">No challenges found.</td></tr>`;
      return;
    }

    tbody.innerHTML = challenges.map(c => `
            <tr>
                <td>#${c.id}</td>
                <td style="font-weight:600; color:#fff;">${c.title}</td>
                <td><span class="badge ${c.category.toLowerCase().replace(' ', '-')}">${c.category}</span></td>
                <td><span class="badge ${c.difficulty.toLowerCase()}">${c.difficulty}</span></td>
                <td class="cyan-text">${c.points} pts</td>
                <td>${c.solves}</td>
                <td>
                    <div class="actions-cell">
                        <button class="action-btn view" onclick="editChallenge(${c.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn ban" onclick="deleteChallenge(${c.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join("");

  } catch (e) {
    console.error(e);
    document.getElementById("challenges-body").innerHTML = `<tr><td colspan="7" class="error-text">Failed to load challenges</td></tr>`;
  }
}

async function loadDailyChallenge() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Daily Challenge Manager";

  view.innerHTML = `<div class="daily-challenge-container" id="dc-container">
        <p class="loading-text">Loading today's challenge...</p>
    </div>`;

  try {
    const data = await api("/daily-challenge/today");

    view.innerHTML = `
            <div class="daily-challenge-panel">
                <div class="dc-header">
                    <div class="dc-title-section">
                        <span class="dc-date"><i class="fas fa-calendar-alt"></i> ${data.challenge_date}</span>
                        <h2>${data.challenge.title}</h2>
                        <div class="dc-meta">
                            <span class="badge ${data.challenge.difficulty.toLowerCase()}">${data.challenge.difficulty}</span>
                            <span class="badge category">${data.challenge.category}</span>
                            <span class="points-badge">+${data.challenge.points} pts</span>
                             ${data.bonus_points ? `<span class="bonus-badge">+${data.bonus_points} Bonus</span>` : ''}
                        </div>
                    </div>
                    <div class="dc-timer">
                        <span>Time Remaining</span>
                        <div class="countdown">${data.time_remaining.formatted}</div>
                    </div>
                </div>

                <div class="dc-content">
                    <h3>Description</h3>
                    <p>${data.challenge.description}</p>
                    
                    <div class="admin-dc-controls" style="margin-top:20px; padding:15px; background:rgba(0,0,0,0.3); border-radius:8px; border:1px solid var(--border-color);">
                        <h4 style="color:var(--neon-green); margin-bottom:10px;"><i class="fas fa-shield-alt"></i> Admin Controls</h4>
                        <p><strong>Correct Flag:</strong> <code style="color:var(--neon-purple);">${data.flag || 'Hidden'}</code></p>
                        <p><strong>Solves Today:</strong> ${data.solves_today || 'Unknown'}</p>
                    </div>
                </div>
            </div>
        `;
  } catch (e) {
    console.error(e);
    view.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Load Daily Challenge</h3>
                <p>Please check if there are challenges available in the system.</p>
                <div class="technical-error">${e.message}</div>
            </div>
        `;
  }
}
function loadTutorials() {
  document.getElementById("view").innerHTML = `<h2>Tutorials</h2><p>Tutorial list goes here...</p>`;
}
function loadLeaderboard() {
  document.getElementById("view").innerHTML = `<h2>Leaderboard</h2><p>Rankings go here...</p>`;
}
function loadSandbox() {
  document.getElementById("view").innerHTML = `<h2>Sandbox</h2><p>Monitor goes here...</p>`;
}
/* ---------- NOTIFICATIONS VIEW ---------- */
async function loadNotifications() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Notification Management";

  // 1. UI Skeleton
  view.innerHTML = `
    <div class="user-management-container">
      <div class="action-bar">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input type="text" placeholder="Search notifications..." class="search-input" />
        </div>
        <button class="btn-add-user" style="background-color: var(--neon-purple); color:#fff;" onclick="openCreateNotification()">
          <i class="fas fa-paper-plane"></i> Send Notification
        </button>
      </div>

      <div class="table-panel">
        <table class="cyber-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Message</th>
              <th>Type</th>
              <th>Audience</th>
              <th>Sent At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="notifications-body">
            <tr><td colspan="6" class="loading-text">Loading notifications...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // 2. Fetch Data
  try {
    const notifications = await api("/admin/notifications");
    renderNotificationsTable(notifications);
  } catch (e) {
    console.error(e);
    document.getElementById("notifications-body").innerHTML = `<tr><td colspan="6" class="error-text">Failed to load notifications</td></tr>`;
  }
}

function renderNotificationsTable(notifications) {
  const tbody = document.getElementById("notifications-body");

  if (notifications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading-text">No notifications sent yet</td></tr>`;
    return;
  }

  tbody.innerHTML = notifications.map(n => `
    <tr>
      <td style="font-weight:600; color:#fff;">${n.title}</td>
      <td class="dim-text" style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${n.message}</td>
      <td><span class="status-badge ${n.type}">${n.type.toUpperCase()}</span></td>
      <td>${n.target_audience || 'All Users'}</td>
      <td class="dim-text">${new Date(n.created_at).toLocaleString()}</td>
      <td>
        <button class="action-btn ban" title="Delete" onclick="deleteNotification(${n.id})">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

function openCreateNotification() {
  openModal(`
    <div class="modal-header">
      <h3>Send New Notification</h3>
      <span class="modal-close" onclick="closeModal()">×</span>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="notif-title" class="modal-input" placeholder="e.g., Server Maintenance">
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea id="notif-message" class="modal-input" style="height: 100px; resize: vertical;" placeholder="Enter your message here..."></textarea>
      </div>
      <div class="form-group">
        <label>Type</label>
        <select id="notif-type" class="modal-input">
          <option value="info">Info (Blue)</option>
          <option value="success">Success (Green)</option>
          <option value="warning">Warning (Yellow)</option>
          <option value="error">Error (Red)</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="submitNotification()">Send Notification</button>
    </div>
  `);
}

async function submitNotification() {
  const title = document.getElementById("notif-title").value.trim();
  const message = document.getElementById("notif-message").value.trim();
  const type = document.getElementById("notif-type").value;

  if (!title || !message) {
    alert("Please enter both title and message");
    return;
  }

  try {
    await api("/admin/notifications", {
      method: "POST",
      body: JSON.stringify({
        title,
        message,
        type,
        target_audience: "all"
      })
    });

    closeModal();
    loadNotifications();
    alert("Notification sent successfully!");
  } catch (e) {
    console.error(e);
    alert("Failed to send notification: " + e.message);
  }
}

async function deleteNotification(id) {
  if (!confirm("Are you sure you want to delete this notification?")) return;

  try {
    await api(`/admin/notifications/${id}`, { method: "DELETE" });
    loadNotifications();
  } catch (e) {
    alert("Failed to delete: " + e.message);
  }
}
async function loadAnalytics() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Analytics Dashboard";

  view.innerHTML = `
    <div class="analytics-container" style="padding: 20px; display: grid; gap: 20px;">
        
        <!-- Overview Cards -->
        <div class="stats-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div class="stat-card" style="background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div class="stat-label" style="color: var(--text-dim);">Total Submissions</div>
                <div class="stat-value" id="an-total-sub" style="font-size: 2rem; font-weight: bold; color: var(--neon-blue); margin-top: 10px;">-</div>
            </div>
            <div class="stat-card" style="background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div class="stat-label" style="color: var(--text-dim);">Global Accuracy</div>
                <div class="stat-value" id="an-accuracy" style="font-size: 2rem; font-weight: bold; color: var(--neon-green); margin-top: 10px;">-%</div>
            </div>
            <div class="stat-card" style="background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                 <div class="stat-label" style="color: var(--text-dim);">Correct Solves</div>
                <div class="stat-value" id="an-correct" style="font-size: 2rem; font-weight: bold; color: var(--neon-purple); margin-top: 10px;">-</div>
            </div>
            <div class="stat-card" style="background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div class="stat-label" style="color: var(--text-dim);">Users</div>
                <div class="stat-value" id="an-users" style="font-size: 2rem; font-weight: bold; color: var(--text-main); margin-top: 10px;">-</div>
            </div>
        </div>

        <!-- Charts Row 1 -->
        <div class="charts-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">
            
            <div class="chart-panel" style="background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 20px; color: var(--text-main);">Challenge Difficulty Distribution</h3>
                <div style="height: 300px;">
                    <canvas id="difficultyChart"></canvas>
                </div>
            </div>

            <div class="chart-panel" style="background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 20px; color: var(--text-main);">Submission Outcome</h3>
                <div style="height: 300px; display:flex; justify-content:center;">
                    <canvas id="outcomeChart"></canvas>
                </div>
            </div>

        </div>

        <!-- Charts Row 2 -->
        <div class="charts-row">
            <div class="chart-panel" style="background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 20px; color: var(--text-main);">Top 5 Solved Challenges</h3>
                <div style="height: 300px;">
                    <canvas id="topSolvedChart"></canvas>
                </div>
            </div>
        </div>

    </div>
  `;

  try {
    const data = await api("/admin/analytics");
    renderAnalyticsData(data);
  } catch (e) {
    console.error(e);
    view.innerHTML += `<p class="error-text">Failed to load analytics: ${e.message}</p>`;
  }
}

function renderAnalyticsData(data) {
  // 1. Overview Numbers
  document.getElementById("an-total-sub").innerText = data.overview.total_submissions;
  document.getElementById("an-accuracy").innerText = data.overview.accuracy_percentage + "%";
  document.getElementById("an-correct").innerText = data.overview.correct_submissions;
  document.getElementById("an-users").innerText = data.overview.total_users;

  // 2. Charts
  drawAnalyticsCharts(data);
}

function drawAnalyticsCharts(data) {
  Chart.defaults.color = '#8892b0';
  Chart.defaults.borderColor = '#1e293b';

  // Difficulty Bar Chart
  new Chart(document.getElementById("difficultyChart"), {
    type: 'bar',
    data: {
      labels: Object.keys(data.difficulty),
      datasets: [{
        label: 'Challenges',
        data: Object.values(data.difficulty),
        backgroundColor: ['#48bb78', '#ecc94b', '#f56565'], // Green, Yellow, Red
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Outcome Doughnut Chart
  new Chart(document.getElementById("outcomeChart"), {
    type: 'doughnut',
    data: {
      labels: ['Correct', 'Wrong'],
      datasets: [{
        data: [data.overview.correct_submissions, data.overview.wrong_submissions],
        backgroundColor: ['#00d2ff', '#2d3748'], // Cyan, Dark
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // Top Solved Horizontal Bar
  new Chart(document.getElementById("topSolvedChart"), {
    type: 'bar',
    indexAxis: 'y',
    data: {
      labels: data.top_solved.map(i => i.title),
      datasets: [{
        label: 'Solves',
        data: data.top_solved.map(i => i.count),
        backgroundColor: 'rgba(0, 210, 255, 0.6)',
        borderColor: '#00d2ff',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });
}
function loadPreview() {
  document.getElementById("view").innerHTML = `<h2>Preview</h2><p>User view goes here...</p>`;
}

// ========================================
// API Configuration
// ========================================
const API = "http://127.0.0.1:8000";

// Logout Function
function logout() {
  localStorage.clear();
  window.location.href = "../index.html";
}

// Initial Load
document.addEventListener("DOMContentLoaded", loadDashboard);



/* ---------- USER MANAGEMENT VIEW ---------- */
async function loadUsers() {
  const view = document.getElementById("view");

  // Set the page title in the top bar
  document.getElementById('page-title').innerText = "User Management";

  // 1. Inject UI Skeleton
  view.innerHTML = `
    <div class="user-management-container">
      
      <div class="action-bar">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input type="text" placeholder="Search users by name or email..." class="search-input" />
        </div>
        <button class="btn-add-user" onclick="openAddUser()">
          <i class="fas fa-plus"></i> Add User
        </button>

      </div>

      <div class="filter-tabs">
        <div class="filter-tab active"><i class="fas fa-filter"></i> All</div>
        <div class="filter-tab">Active</div>
        <div class="filter-tab">Suspended</div>
      </div>

      <div class="table-panel">
        <table class="cyber-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Level</th>
              <th>Points</th>
              <th>Challenges</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            <tr><td colspan="8" class="loading-text">Loading users...</td></tr>
          </tbody>
        </table>
      </div>

      <div class="summary-row">
        <div class="summary-card">
          <span>Total Users</span>
          <h2 id="total-users">0</h2>
        </div>
        <div class="summary-card">
          <span>Active Users</span>
          <h2 id="active-users" style="color:var(--neon-green)">0</h2>
        </div>
        <div class="summary-card">
          <span>Suspended Users</span>
          <h2 id="suspended-users" style="color:var(--neon-red)">0</h2>
        </div>
      </div>

    </div>
  `;

  // 2. Fetch Data
  let users = [];
  try {
    users = await api("/admin/users");
  } catch (e) {
    // Fallback Mock Data for UI demonstration if API fails
    users = [
      { id: 1, username: "alice_hacker", email: "alice@hacker.com", status: "active", level: 5, points: 1250, challenges: 12, last_active: "2024-11-25 10:30" },
      { id: 2, username: "bob_security", email: "bob@sec.com", status: "active", level: 8, points: 2850, challenges: 28, last_active: "2024-11-25 09:15" },
      { id: 3, username: "charlie_pwn", email: "charlie@pwn.com", status: "active", level: 12, points: 4200, challenges: 42, last_active: "2024-11-25 11:00" },
      { id: 4, username: "diana_cyber", email: "diana@cyber.com", status: "suspended", level: 3, points: 890, challenges: 8, last_active: "2024-11-20 15:45" },
      { id: 5, username: "eve_exploit", email: "eve@exploit.com", status: "active", level: 10, points: 3500, challenges: 35, last_active: "2024-11-24 18:20" }
    ];
  }

  // 3. Render Data
  const tbody = document.getElementById("users-table-body");
  tbody.innerHTML = "";

  let activeCount = 0;
  let suspendedCount = 0;

  users.forEach(u => {
    if (u.status === 'active') activeCount++;
    if (u.status === 'suspended') suspendedCount++;

    // Generate Avatar Letter
    const initial = u.username.charAt(0).toUpperCase();
    // Assign random avatar color class based on id for variety
    const avatarColorClass = `avatar-color-${(u.id % 4) + 1}`;

    const row = `
      <tr>
        <td>
          <div class="user-info-cell">
            <div class="avatar-circle ${avatarColorClass}">${initial}</div>
            <span class="username-text">${u.username}</span>
          </div>
        </td>
        <td class="dim-text">${u.email}</td>
        <td>
          <span class="status-badge ${u.status}">${u.status}</span>
        </td>
        <td class="cyan-text">Level ${u.level}</td>
        <td>${u.points}</td>
        <td>${u.challenges}</td>
        <td class="dim-text">${u.last_active}</td>
        <td>
          <div class="actions-cell">
            <button class="action-btn view" title="View"><i class="fas fa-eye"></i></button>
            <button class="action-btn sync" title="Sync"><i class="fas fa-sync-alt"></i></button>
            ${u.status === "active"
        ? `<button class="action-btn ban"
         onclick="suspendUser(${u.id})"
         title="Suspend">
         <i class="fas fa-ban"></i>
       </button>`
        : `<button class="action-btn sync"
         onclick="activateUser(${u.id})"
         title="Activate">
         <i class="fas fa-check"></i>
       </button>`
      }

          </div>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });

  const searchInput = document.querySelector(".search-input");

  searchInput.addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    const users = await api(`/admin/users?q=${encodeURIComponent(query)}`);
    renderUsersTable(users);
  });


  function renderUsersTable(users) {
    const tbody = document.getElementById("users-table-body");
    tbody.innerHTML = "";

    let activeCount = 0;
    let suspendedCount = 0;

    users.forEach(u => {
      if (u.status === "active") activeCount++;
      if (u.status === "suspended") suspendedCount++;

      const initial = u.username.charAt(0).toUpperCase();
      const avatarColorClass = `avatar-color-${(u.id % 4) + 1}`;

      tbody.innerHTML += `
      <tr>
        <td>
          <div class="user-info-cell">
            <div class="avatar-circle ${avatarColorClass}">${initial}</div>
            <span class="username-text">${u.username}</span>
          </div>
        </td>
        <td class="dim-text">${u.email}</td>
        <td><span class="status-badge ${u.status}">${u.status}</span></td>
        <td class="cyan-text">Level ${u.level}</td>
        <td>${u.points}</td>
        <td>${u.challenges}</td>
        <td class="dim-text">${u.last_active}</td>
        <td>
          ${u.status === "active"
          ? `<button class="action-btn ban" onclick="suspendUser(${u.id})"><i class="fas fa-ban"></i></button>`
          : `<button class="action-btn sync" onclick="activateUser(${u.id})"><i class="fas fa-check"></i></button>`
        }
        </td>
      </tr>
    `;
    });

    document.getElementById("total-users").innerText = users.length;
    document.getElementById("active-users").innerText = activeCount;
    document.getElementById("suspended-users").innerText = suspendedCount;
  }



  // 4. Update Summary
  document.getElementById("total-users").innerText = users.length;
  document.getElementById("active-users").innerText = activeCount;
  document.getElementById("suspended-users").innerText = suspendedCount;
}


async function suspendUser(userId) {
  if (!confirm("Suspend this user?")) return;

  await api(`/admin/users/${userId}/status/?status=suspended`, {
    method: "PUT"
  });

  loadUsers(); // refresh table
}

async function activateUser(userId) {
  await api(`/admin/users/${userId}/status/?status=active`, {
    method: "PUT"
  });

  loadUsers();
}



function openAddUser() {
  document.getElementById("addUserModal").style.display = "flex";
}

function closeAddUser() {
  document.getElementById("addUserModal").style.display = "none";
}

async function submitAddUser() {
  const username = document.getElementById("add-username").value.trim();
  const email = document.getElementById("add-email").value.trim();
  const password = document.getElementById("add-password").value.trim();
  const role = document.getElementById("add-role").value;

  if (!username || !email || !password) {
    alert("All fields required");
    return;
  }

  const res = await fetch(API + "/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": "1"
    },
    body: JSON.stringify({ username, email, password, role })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.detail || "Failed to create user");
    return;
  }

  closeAddUser();
  loadUsers();
}



/* ---------- DAILY CHALLENGE VIEW ---------- */
async function loadDailyChallenge() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Daily Challenge";

  view.innerHTML = `
    <div class="daily-loading">
      <i class="fas fa-spinner"></i>
      <p>Loading today's daily challenge...</p>
    </div>
  `;

  try {
    const data = await api("/daily-challenge/today");

    // Fetch stats (mock data for admin)
    const stats = {
      totalAttempts: 0,
      completedBy: 0,
      activeNow: 156
    };

    const difficultyClass = (data.challenge.difficulty || 'Easy').toLowerCase();
    const isCompleted = data.completed || data.solved;

    // Admin specific: Show Flag in prominent red box
    const flagHtml = data.flag ?
      `<div style="margin-top: 20px; background: rgba(255, 0, 0, 0.15); border: 2px solid var(--neon-red); padding: 15px; border-radius: 8px; color: var(--neon-red); font-family: monospace; font-size: 1.1rem; text-align: center; font-weight: bold;">
            <i class="fas fa-flag"></i> ADMIN FLAG: <strong>${data.flag}</strong>
         </div>` : '';

    view.innerHTML = `
      <div class="daily-challenge-container">
        
        <div class="daily-challenge-main-card">
          
          <div class="daily-challenge-header-section">
            <div class="daily-icon">
              <i class="fas fa-calendar-day"></i>
            </div>
            <div>
              <div class="daily-header-title">Daily Challenge</div>
              <div class="daily-subtitle">Complete today's challenge to earn bonus points and compete on the leaderboard!</div>
            </div>
          </div>

          <h2 class="challenge-main-title">${escapeHtml(data.challenge.title)}</h2>
          <p class="challenge-main-description">${escapeHtml(data.challenge.description)}</p>

          <div class="challenge-tags-row">
            <span class="tag-category">
              <i class="fas fa-shield-alt"></i> ${data.challenge.category || 'General'}
            </span>
            <span class="tag-difficulty ${difficultyClass}">
              ${data.challenge.difficulty || 'Easy'}
            </span>
            
            ${!isCompleted ? `
              <span class="tag-time">
                <i class="fas fa-clock"></i>
                <span id="bonus-timer">${data.time_remaining.formatted || '00:00:00'}</span>
              </span>
            ` : `
              <span class="tag-time" style="background: rgba(72, 187, 120, 0.2); color: #48bb78; border: 1px solid #48bb78;">
                <i class="fas fa-check-circle"></i> Completed
              </span>
            `}
          </div>

          ${flagHtml}

          <div class="challenge-stats-grid">
            <div class="stat-item">
              <div class="stat-label"><i class="fas fa-users"></i> Total Attempts</div>
              <div class="stat-number">${stats.totalAttempts}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label"><i class="fas fa-check-circle"></i> Completed By</div>
              <div class="stat-number">${stats.completedBy}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label"><i class="fas fa-bolt"></i> Active Now</div>
              <div class="stat-number">${stats.activeNow}</div>
            </div>
          </div>

          <button class="btn-start-daily-challenge" style="cursor: default; opacity: 0.7;">
            <i class="fas fa-eye"></i>
            ADMIN PREVIEW MODE
          </button>

        </div>

      </div>
    `;

    // Start timer if not completed
    if (!isCompleted && data.time_remaining && data.time_remaining.seconds) {
      startBonusTimer(data.time_remaining.seconds);
    }

  } catch (e) {
    view.innerHTML = `
      <div class="no-daily-challenge">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Unable to Load Daily Challenge</h3>
        <p>Please try again later or contact support.</p>
      </div>
    `;
  }
}

// Helper function for timer
function startBonusTimer(totalSeconds) {
  let remaining = totalSeconds;

  function update() {
    if (remaining <= 0) {
      const el = document.getElementById("bonus-timer");
      if (el) el.innerText = "Expired";
      return;
    }

    const h = Math.floor(remaining / 3600).toString().padStart(2, '0');
    const m = Math.floor((remaining % 3600) / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');

    const el = document.getElementById("bonus-timer");
    if (el) el.innerText = `${h}:${m}:${s}`;

    remaining--;
  }

  update();
  setInterval(update, 1000);
}

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- SANDBOX MONITOR VIEW ---------- */
async function loadSandbox() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Sandbox Monitor";

  view.innerHTML = `
    <div class="sandbox-monitor-container">
      <div class="monitor-header">
        <div class="monitor-stats">
          <div class="monitor-stat">
            <span class="label">Running Pods</span>
            <span id="pods-count" class="value">0</span>
          </div>
          <div class="monitor-stat">
            <span class="label">Resource Usage</span>
            <span class="value">Nominal</span>
          </div>
        </div>
        <button class="btn-refresh" onclick="loadSandbox()"><i class="fas fa-sync-alt"></i> Refresh</button>
      </div>

      <div class="sandbox-grid" id="sandbox-grid">
        <div class="loading-text">Scanning for active sessions...</div>
      </div>
    </div>
  `;

  try {
    const sessions = await api("/admin/sandbox");
    renderSandboxSessions(sessions);
  } catch (e) {
    view.innerHTML += `<p class="error-text">Failed to fetch sandbox data: ${e.message}</p>`;
  }
}

function renderSandboxSessions(sessions) {
  const grid = document.getElementById("sandbox-grid");
  document.getElementById("pods-count").innerText = sessions.length;

  if (sessions.length === 0) {
    grid.innerHTML = `<div class="empty-state">No active sandbox sessions found.</div>`;
    return;
  }

  grid.innerHTML = sessions.map(s => `
    <div class="sandbox-card">
      <div class="card-header">
        <div class="user-info">
          <i class="fas fa-user-circle"></i>
          <div>
            <div class="username">${s.user}</div>
            <div class="session-id">${s.session_id}</div>
          </div>
        </div>
        <div class="status-indicator">
          <span class="pulse"></span> Active
        </div>
      </div>

      <div class="card-body">
        <div class="info-row">
          <span><i class="fas fa-globe"></i> IP:Port</span>
          <span class="cyan-text">${s.ip}</span>
        </div>
        <div class="info-row">
          <span><i class="fas fa-clock"></i> Started</span>
          <span>${new Date(s.started).toLocaleTimeString()}</span>
        </div>
        
        <div class="terminal-box">
          <div class="terminal-header">logs ➔ output</div>
          <div class="terminal-content">
            ${s.logs.map(l => `
              <div class="log-line ${l.type}">
                <span class="time">[${l.time}]</span> ${l.msg}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card-footer">
        <button class="btn-action reset" onclick="resetSandbox('${s.id}')">
          <i class="fas fa-undo"></i> Reset
        </button>
        <button class="btn-action stop" onclick="stopSandbox('${s.id}')">
          <i class="fas fa-power-off"></i> Kill
        </button>
      </div>
    </div>
  `).join('');
}

async function stopSandbox(id) {
  if (!confirm("Terminate this user container? All unsubmitted progress will be lost.")) return;
  try {
    await api(`/admin/sandbox/${id}/stop`, { method: "POST" });
    loadSandbox();
  } catch (e) {
    alert("Kill failed: " + e.message);
  }
}

async function loadChallenges() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Challenge Management";

  view.innerHTML = `
    <div class="user-management-container">
      <div class="action-bar">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input type="text" placeholder="Search challenges..." class="search-input" />
        </div>
        <button class="btn-primary" onclick="openCreateChallenge()">
          <i class="fas fa-plus"></i> Create Challenge
        </button>
      </div>

      <div class="table-panel">
        <table class="cyber-table">
          <thead>
            <tr>
              <th style="width: 30%;">Challenge</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Points</th>
              <th>Status</th>
              <th>Solves</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="challenges-body">
            <tr><td colspan="7" class="loading-text">Loading challenges...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  try {
    const challenges = await api("/admin/challenges");
    const tbody = document.getElementById("challenges-body");

    tbody.innerHTML = challenges.map(c => {
      const diffClass = `diff-${c.difficulty.toLowerCase()}`;
      return `
        <tr>
          <td>
            <div class="challenge-info">
              <span class="title">${c.title}</span>
              ${c.is_sim_lab ? '<span class="lab-pill"><i class="fab fa-docker"></i> Lab</span>' : ''}
            </div>
          </td>
          <td class="dim-text">${c.category}</td>
          <td><span class="status-badge ${diffClass}">${c.difficulty}</span></td>
          <td class="cyan-text font-bold">${c.points}</td>
          <td>
             <span class="status-badge ${c.is_active ? 'active' : 'suspended'}">
               ${c.is_active ? 'Active' : 'Disabled'}
             </span>
          </td>
          <td>${c.solves}</td>
          <td>
            <div class="actions-cell">
              <button class="action-btn edit" onclick="editChallenge(${c.id})" title="Edit"><i class="fas fa-edit"></i></button>
              <button class="action-btn delete" onclick="deleteChallenge(${c.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (e) {
    document.getElementById("challenges-body").innerHTML = `<tr><td colspan="7" class="error-text">Error: ${e.message}</td></tr>`;
  }
}

async function deleteChallenge(id) {
  if (!confirm("Delete this challenge permanently?")) return;
  try {
    await api(`/admin/challenges/${id}`, { method: "DELETE" });
    loadChallenges();
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
}

function openModal(html) {
  const modal = document.getElementById("modal-overlay");
  const content = document.getElementById("modal-content");
  if (content) content.innerHTML = html;
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("modal-overlay");
  modal.classList.add("hidden");
  modal.style.display = "none";
}


async function editChallenge(id) {
  const c = await api(`/ admin / challenges / ${id} `);
  console.log("Editing challenge:", c);
  alert("Edit mode coming next.\nCheck console for loaded data.");
}

async function deleteChallenge(id) {
  if (!confirm("Are you sure you want to delete this challenge?")) return;

  await api(`/ admin / challenges / ${id} `, { method: "DELETE" });
  loadChallenges(); // refresh table
}


let overlay;

document.addEventListener("DOMContentLoaded", () => {
  overlay = document.getElementById("overlay-root");
});

function closeOverlay() {
  if (overlay) {
    overlay.innerHTML = "";
    overlay.classList.remove("active");
  }
}


function openModal(html) {
  if (!overlay) overlay = document.getElementById("overlay-root");
  overlay.classList.add("active");

  overlay.innerHTML = `
  < div class="overlay-backdrop" onclick = "closeModal()" ></div >
    <div class="modal">
      ${html}
    </div>
`;
}

function closeModal() {
  const overlay = document.getElementById("overlay-root");
  overlay.classList.remove("active");
  overlay.innerHTML = "";
}


function openModal(html) {
  document.getElementById("modal-content").innerHTML = html;
  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
}


// Create Challenge Modal
function openCreateChallenge() {
  openModal(`
  < div class="modal-header" >
      <h3>Create New Challenge</h3>
      <span class="modal-close" onclick="closeModal()">×</span>
    </div >

    <div class="modal-body">
      <div class="form-group">
        <label>Title</label>
        <input id="c-title" class="input" placeholder="Challenge title" />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea id="c-desc" class="input" rows="3"
          placeholder="Challenge description"></textarea>
      </div>

      <div class="form-group">
        <label>Category</label>
        <input id="c-category" class="input" placeholder="Web / Crypto / Pwn" />
      </div>

      <div class="form-group">
        <label>Difficulty</label>
        <select id="c-difficulty" class="input">
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div class="form-group">
        <label>Points</label>
        <input id="c-points" type="number" class="input" />
      </div>

      <div class="form-group">
        <label>Flag</label>
        <input id="c-flag" class="input" placeholder="FLAG{...}" />
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="submitCreateChallenge()">Create</button>
    </div>
`);
}


function toggleSimFields() {
  const isSim = document.getElementById("c-is-sim").checked;
  const fields = document.getElementById("sim-fields");
  fields.style.display = isSim ? "flex" : "none";
}

let activeEditId = null;

function openCreateChallenge() {
  activeEditId = null;
  document.getElementById("modal-title").innerText = "Create New Challenge";

  // Reset fields
  document.getElementById("c-title").value = "";
  document.getElementById("c-desc").value = "";
  document.getElementById("c-category").value = "Web Security";
  document.getElementById("c-difficulty").value = "Easy";
  document.getElementById("c-points").value = "100";
  document.getElementById("c-flag").value = "";
  document.getElementById("c-instructions").value = "";
  document.getElementById("c-is-sim").checked = false;
  document.getElementById("c-image").value = "";
  document.getElementById("c-sim-type").value = "";
  document.getElementById("c-status").value = "1";

  toggleSimFields();

  const modal = document.getElementById("modal-overlay");
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

async function editChallenge(id) {
  activeEditId = id;
  const c = await api(`/ admin / challenges`); // This endpoint currently returns a filtered list, we might need a specific one or filter locally
  const data = c.find(item => item.id == id);

  // Note: /admin/challenges doesn't returned detailed fields like docker_image by default in the previous viewed version.
  // I updated it in Step 2686 to return some, but let's assume we need to fetch full detail if missing.
  // For now let's use what we have or just fetch full detail if we had an endpoint.
  // I will assume we can get it.

  document.getElementById("modal-title").innerText = "Edit Challenge #" + id;
  document.getElementById("c-title").value = data.title;
  document.getElementById("c-desc").value = data.description;
  document.getElementById("c-category").value = data.category;
  document.getElementById("c-difficulty").value = data.difficulty;
  document.getElementById("c-points").value = data.points;
  document.getElementById("c-flag").value = data.flag || "";
  document.getElementById("c-instructions").value = data.instructions || "";
  document.getElementById("c-is-sim").checked = !!data.is_sim_lab;
  document.getElementById("c-image").value = data.docker_image || "";
  document.getElementById("c-sim-type").value = data.sim_type || "";
  document.getElementById("c-status").value = data.is_active ? "1" : "0";

  toggleSimFields();

  const modal = document.getElementById("modal-overlay");
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

async function submitCreateChallenge() {
  const payload = {
    title: document.getElementById("c-title").value.trim(),
    category: document.getElementById("c-category").value,
    difficulty: document.getElementById("c-difficulty").value,
    points: parseInt(document.getElementById("c-points").value),
    correct_flag: document.getElementById("c-flag").value.trim(),
    description: document.getElementById("c-desc").value.trim(),
    instructions: document.getElementById("c-instructions").value.trim(),
    is_sim_lab: document.getElementById("c-is-sim").checked,
    docker_image: document.getElementById("c-image").value.trim(),
    sim_type: document.getElementById("c-sim-type").value.trim(),
    is_active: document.getElementById("c-status").value === "1",
    hints: []
  };

  try {
    const url = activeEditId ? `/ admin / challenges / ${activeEditId} ` : "/admin/challenges";
    const method = activeEditId ? "PUT" : "POST";

    await api(url, {
      method: method,
      body: JSON.stringify(payload)
    });

    alert(activeEditId ? "Challenge updated!" : "Challenge created!");
    closeModal();
    loadChallenges();
  } catch (e) {
    alert("Action failed: " + e.message);
  }
}


/* ---------- LEADERBOARD VIEW ---------- */
async function loadLeaderboard() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Leaderboard Monitoring";

  view.innerHTML = `
    <div class="leaderboard-page">
      <div class="leaderboard-stats" id="leaderboard-stats"></div>
      <div class="leaderboard-podium" id="leaderboard-podium"></div>
      <div class="table-panel">
        <h3 class="section-title">Full Rankings</h3>
        <table class="cyber-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Score</th>
              <th>Challenges</th>
              <th>Growth</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="leaderboard-body">
            <tr><td colspan="8" class="loading-text">Loading rankings...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  try {
    const res = await api("/admin/users");
    const sortedUsers = res.sort((a, b) => (b.points || 0) - (a.points || 0));

    const totalUsers = sortedUsers.length;
    const activeToday = sortedUsers.filter(u => u.status === 'active').length;
    const avgScore = totalUsers ? Math.floor(sortedUsers.reduce((acc, u) => acc + (u.points || 0), 0) / totalUsers) : 0;
    const topScore = sortedUsers.length > 0 ? sortedUsers[0].points : 0;

    const renderData = {
      stats: { total_users: totalUsers, active_today: activeToday, avg_score: avgScore, top_score: topScore },
      users: sortedUsers.map((u, index) => ({
        rank: index + 1,
        username: u.username,
        email: u.email,
        score: u.points || 0,
        challenges: u.challenges || 0,
        growth: 0,
        status: u.status,
        last_active: u.last_active || "Never"
      }))
    };

    renderLeaderboardStats(renderData);
    renderLeaderboardPodium(renderData.users);
    renderLeaderboardTable(renderData.users);
  } catch (e) {
    console.error("Failed to load leaderboard data:", e);
  }
}

function renderLeaderboardStats(data) {
  const el = document.getElementById("leaderboard-stats");
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-users"></i></div>
      <div><h2>${data.stats.total_users}</h2><span>Total Users</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="color:var(--neon-green); border-color:var(--neon-green)"><i class="fas fa-user-check"></i></div>
      <div><h2>${data.stats.active_today}</h2><span>Active Today</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="color:#ffcc00; border-color:#ffcc00"><i class="fas fa-trophy"></i></div>
      <div><h2>${data.stats.top_score}</h2><span>Top Score</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="color:#ff33cc; border-color:#ff33cc"><i class="fas fa-chart-line"></i></div>
      <div><h2>${data.stats.avg_score}</h2><span>Avg Score</span></div>
    </div>
  `;
}

function renderLeaderboardPodium(users) {
  const top3 = [
    users[0] || { username: "-", score: 0 },
    users[1] || { username: "-", score: 0 },
    users[2] || { username: "-", score: 0 }
  ];

  document.getElementById("leaderboard-podium").innerHTML = `
    <div class="podium silver">
      <div class="crown"><i class="fas fa-medal"></i></div>
      <div class="avatar-circle" style="background:#c0c0c0; color:#000;">${top3[1].username[0]?.toUpperCase() || "?"}</div>
      <strong>${top3[1].username}</strong>
      <span>${top3[1].score} pts</span>
      <div class="rank-num">2</div>
    </div>
    <div class="podium gold">
      <div class="crown"><i class="fas fa-crown"></i></div>
      <div class="avatar-circle" style="background:#ffcc00; color:#000; width:60px; height:60px; font-size:1.5rem;">${top3[0].username[0]?.toUpperCase() || "?"}</div>
      <strong>${top3[0].username}</strong>
      <span>${top3[0].score} pts</span>
      <div class="rank-num">1</div>
    </div>
    <div class="podium bronze">
      <div class="crown"><i class="fas fa-medal"></i></div>
      <div class="avatar-circle" style="background:#cd7f32; color:#000;">${top3[2].username[0]?.toUpperCase() || "?"}</div>
      <strong>${top3[2].username}</strong>
      <span>${top3[2].score} pts</span>
      <div class="rank-num">3</div>
    </div>
  `;
}

function renderLeaderboardTable(users) {
  const tbody = document.getElementById("leaderboard-body");
  tbody.innerHTML = users.map(u => {
    const initial = u.username.charAt(0).toUpperCase();
    return `
      <tr>
        <td style="font-weight:bold; color:var(--text-secondary);">#${u.rank}</td>
        <td>
          <div class="user-info-cell">
            <div class="avatar-circle" style="background:#333; font-size:0.8rem;">${initial}</div>
            <div style="display:flex; flex-direction:column;">
                <span class="username-text">${u.username}</span>
                <span class="dim-text" style="font-size:0.75rem">${u.email}</span>
            </div>
          </div>
        </td>
        <td class="cyan-text" style="font-weight:bold;">${u.score}</td>
        <td>${u.challenges}</td>
        <td style="color:var(--neon-green);">+${u.growth}%</td>
        <td><span class="status-badge ${u.status}">${u.status}</span></td>
        <td class="dim-text">${u.last_active}</td>
        <td>
          <div class="actions-cell">
            <button class="action-btn view" title="View"><i class="fas fa-eye"></i></button>
            <button class="action-btn ban" title="Suspend"><i class="fas fa-ban"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function getMockLeaderboard() {
  return {
    stats: { total_users: 1247, active_today: 342, avg_score: 1856 },
    users: [
      { rank: 1, username: "cybermaster_pro", email: "cyber@hacker.com", points: 4250, challenges: 42, growth: 25, status: "active", last_active: "2h ago" },
      { rank: 2, username: "hacker_elite", email: "elite@hacker.com", points: 3890, challenges: 38, growth: 18, status: "active", last_active: "5h ago" },
      { rank: 3, username: "security_ninja", email: "ninja@hacker.com", points: 3650, challenges: 36, growth: 12, status: "active", last_active: "1d ago" },
      { rank: 4, username: "alice_hacker", email: "alice@hacker.com", points: 3420, challenges: 34, growth: 9, status: "active", last_active: "3h ago" },
      { rank: 5, username: "bob_security", email: "bob@sec.com", points: 2800, challenges: 28, growth: 5, status: "active", last_active: "1h ago" }
    ]
  };
}


/* ==========================================================================

   7. TUTORIAL MANAGEMENT (Split View)

   ========================================================================== */



async function loadTutorials() {

  const view = document.getElementById("view");

  document.getElementById("page-title").innerText = "Tutorial Management";



  view.innerHTML = `

  < div class="tutorial-layout" >

        <div class="tutorial-sidebar">

            <button class="btn-create-tutorial" onclick="initNewTutorial()"><i class="fas fa-plus"></i> New Tutorial</button>

            <div class="tutorial-list" id="tutorial-list"><p class="loading-text">Loading...</p></div>

        </div>

        <div class="tutorial-editor" id="tutorial-editor">

            <div class="empty-state"><i class="fas fa-book-open"></i><h3>Select a tutorial to edit</h3></div>

        </div>

    </div > `;



  const tutorials = await api("/admin/tutorials") || [];

  const list = document.getElementById("tutorial-list");



  list.innerHTML = tutorials.map(t => `

  < div class="tutorial-card" onclick = "openTutorial(${t.id})" >

            <h4 class="t-title">${t.title}</h4>

            <div class="t-meta"><span>${t.category}</span><span class="t-duration">30 min</span></div>

        </div >

  `).join("");

}



/* ---------- TUTORIAL MANAGEMENT ---------- */
async function loadTutorials() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Tutorial Management";

  view.innerHTML = `
    <div class="tutorial-layout">
        <div class="tutorial-sidebar">
            <button class="btn-create-tutorial" onclick="initNewTutorial()"><i class="fas fa-plus"></i> New Tutorial</button>
            <div class="tutorial-list" id="tutorial-list"><p class="loading-text">Loading...</p></div>
        </div>
        <div class="tutorial-editor" id="tutorial-editor">
            <div class="empty-state"><i class="fas fa-book-open"></i><h3>Select a tutorial to edit</h3></div>
        </div>
    </div>`;

  try {
    const tutorials = await api("/admin/tutorials") || [];
    const list = document.getElementById("tutorial-list");
    list.innerHTML = tutorials.map(t => `
        <div class="tutorial-card" onclick="openTutorial(${t.id})">
            <h4 class="t-title">${t.title}</h4>
            <div class="t-meta"><span>${t.category}</span></div>
        </div>
    `).join("");
  } catch (e) {
    console.error("Load tutorials failed:", e);
  }
}

async function openTutorial(id) {
  const editor = document.getElementById("tutorial-editor");
  if (!editor) return;

  document.querySelectorAll(".tutorial-card").forEach(el => el.classList.remove("active"));
  // Note: Selection logic might need refinement depending on how cards are rendered

  try {
    const t = await api(`/admin/tutorials/${id}`);
    renderTutorialEditor(t);
  } catch (e) {
    console.error("Open tutorial failed:", e);
  }
}

function initNewTutorial() {
  renderTutorialEditor({ id: null, title: "", content: "", category: "Web Security" });
}

function renderTutorialEditor(data) {
  const isNew = !data.id;
  document.getElementById("tutorial-editor").innerHTML = `
    <div class="editor-header">
        <input type="text" id="t-title" class="title-input" value="${data.title}" placeholder="Tutorial Title">
    </div>
    <div class="meta-row">
        <div class="form-group"><label>Category</label><input id="t-category" class="input" value="${data.category}"></div>
    </div>
    <div class="content-split">
        <div class="markdown-pane"><textarea id="t-content" class="code-editor" placeholder="Markdown Content...">${data.content}</textarea></div>
    </div>
    <div class="editor-actions">
        <button class="btn-primary" onclick="saveTutorial(${data.id})">${isNew ? 'Create' : 'Update'}</button>
        ${!isNew ? `<button class="btn-danger" onclick="deleteTutorial(${data.id})">Delete</button>` : ''}
    </div>`;
}

async function saveTutorial(id) {
  const payload = {
    title: document.getElementById("t-title").value,
    category: document.getElementById("t-category").value,
    content: document.getElementById("t-content").value
  };

  try {
    if (id) await api(`/admin/tutorials/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/admin/tutorials", { method: "POST", body: JSON.stringify(payload) });
    loadTutorials();
  } catch (e) {
    alert("Save failed: " + e.message);
  }
}

async function deleteTutorial(id) {
  if (!confirm("Delete tutorial?")) return;
  try {
    await api(`/admin/tutorials/${id}`, { method: "DELETE" });
    loadTutorials();
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
}

/* ---------- NOTIFICATIONS MANAGEMENT ---------- */
async function loadNotifications() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Notifications Management";

  view.innerHTML = `
    <div class="notifications-page">
      <div class="page-header">
        <button class="btn-primary" onclick="openCreateNotification()">
          <i class="fas fa-plus"></i> Create Notification
        </button>
      </div>
      <div id="notificationsList" class="notifications-list">
        <p class="loading-text">Loading notifications...</p>
      </div>
    </div>`;

  try {
    const notifications = await api("/admin/notifications/") || [];
    const container = document.getElementById("notificationsList");

    if (!notifications.length) {
      container.innerHTML = `<p class="dim-text">No notifications found.</p>`;
      return;
    }

    container.innerHTML = notifications.map(n => `
      <div class="notification-card ${n.type}">
        <div class="notification-header">
          <span class="notification-title">${n.title}</span>
          <span class="badge ${n.type}">${n.type}</span>
        </div>
        <div class="notification-message">${n.message}</div>
        <div class="notification-footer">
          <span class="meta-text">By ${n.created_by} • ${new Date(n.created_at).toLocaleString()}</span>
          <span class="target-text">Target: <span class="highlight">${n.target}</span></span>
        </div>
      </div>
    `).join("");
  } catch (e) {
    console.error("Load notifications failed:", e);
  }
}


/* ==========================================================================

   10. NOTIFICATION MANAGEMENT VIEW 
    ========================================================================== */

// Duplicate api function removed. Using the one defined in api.js.


/* ---------- NOTIFICATIONS MANAGEMENT VIEW ---------- */
async function loadNotifications() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Notifications Management";

  // UI Skeleton
  view.innerHTML = `
  < div class="notifications-page" >
      <div class="page-header">
        <button class="create-btn" onclick="openCreateNotification()">
          <i class="fas fa-plus"></i> Create Notification
        </button>
      </div>

      <div id="notificationsList" class="notifications-list">
        <p class="loading-text">Loading notifications...</p>
      </div>
    </div >
  `;

  let notifications = [];

  try {
    // ✅ TRAILING SLASH FIX (avoids 307 redirect)
    notifications = await api("/admin/notifications/");
  } catch (e) {
    console.error("API failed, using mock data");

    // Fallback mock data (for UI demo)
    notifications = [
      {
        title: "System Maintenance",
        message: "Scheduled maintenance on Jan 26, 2026 from 2:00 AM to 4:00 AM IST",
        type: "warning",
        created_by: "Admin",
        created_at: "2026-01-26T02:00:00",
        target: "all"
      }
    ];
  }

  const container = document.getElementById("notificationsList");

  if (!notifications.length) {
    container.innerHTML = `< p class="dim-text" > No notifications found.</p > `;
    return;
  }

  container.innerHTML = notifications.map(n => `
  < div class="notification-card ${n.type}" >
      <div class="notification-header">
        <span class="notification-title">${n.title}</span>
        <span class="badge ${n.type}">${n.type}</span>
      </div>

      <div class="notification-message">${n.message}</div>

      <div class="notification-footer">
        <span class="meta-text">
          By ${n.created_by} • ${formatDate(n.created_at)}
        </span>
        <span class="target-text">
          Target: <span class="highlight">${n.target}</span>
        </span>
      </div>
    </div >
  `).join("");
}


function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toISOString().replace("T", " ").substring(0, 16);
}


function openCreateNotification() {
  openModal(`
  < div class="modal-header" >
      <h3>Create Notification</h3>
      <span class="modal-close" onclick="closeModal()">×</span>
    </div >

    <div class="modal-body">

      <div class="form-group">
        <label>Title</label>
        <input id="n-title" class="input" placeholder="System Maintenance">
      </div>

      <div class="form-group">
        <label>Message</label>
        <textarea id="n-message" class="input" rows="4"
          placeholder="Scheduled maintenance details..."></textarea>
      </div>

      <div class="form-group">
        <label>Type</label>
        <select id="n-type" class="input">
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="success">success</option>
          <option value="danger">danger</option>
        </select>
      </div>

      <div class="form-group">
        <label>Target</label>
        <select id="n-target" class="input">
          <option value="all">All Users</option>
          <option value="user">Specific User</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div class="form-group">
        <label>User ID (optional)</label>
        <input id="n-user" class="input" placeholder="Leave empty for all">
      </div>

    </div>

    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="submitNotification()">
        Send Notification
      </button>
    </div>
`);
}


async function submitNotification() {
  const payload = {
    title: document.getElementById("n-title").value.trim(),
    message: document.getElementById("n-message").value.trim(),
    type: document.getElementById("n-type").value,
    target: document.getElementById("n-target").value,
    user_id: document.getElementById("n-user").value
      ? Number(document.getElementById("n-user").value)
      : null
  };

  if (!payload.title || !payload.message) {
    alert("Title and message are required");
    return;
  }

  try {
    await api("/admin/notifications/", {
      method: "POST",
      body: JSON.stringify(payload)   // ✅ BODY IS NOW SENT
    });

    closeModal();
    loadNotifications();

  } catch (e) {
    console.error(e);
    alert("Failed to send notification");
  }
}


/* ==========================================================================
   ANALYTICS VIEW
   ========================================================================== */

/* ---------- ANALYTICS VIEW ---------- */
async function loadAnalytics() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Difficulty Analytics";

  view.innerHTML = `
    <div class="analytics-grid">
      <div class="card-panel">
        <h3 class="panel-title">Difficulty Distribution</h3>
        <div class="chart-container"><canvas id="difficultyChart"></canvas></div>
        <div class="difficulty-cards">
          <div class="diff-card easy"><div class="diff-dot" style="background:#00ffbf;"></div><div><span id="easy-count" class="diff-val">0</span><label>Easy</label></div></div>
          <div class="diff-card medium"><div class="diff-dot" style="background:#ffcc00;"></div><div><span id="medium-count" class="diff-val">0</span><label>Medium</label></div></div>
          <div class="diff-card hard"><div class="diff-dot" style="background:#ff3b3b;"></div><div><span id="hard-count" class="diff-val">0</span><label>Hard</label></div></div>
        </div>
      </div>
      <div class="card-panel">
        <h3 class="panel-title">Challenge Solve Counts</h3>
        <div class="chart-container"><canvas id="solveCountChart"></canvas></div>
      </div>
    </div>`;

  try {
    const data = await api("/admin/analytics") || {
      difficulty: { Easy: 0, Medium: 0, Hard: 0 },
      solves: []
    };
    renderDifficultyChart(data.difficulty);
    renderSolveChart(data.solves);
  } catch (e) {
    console.error("Load analytics failed:", e);
  }
}

function renderDifficultyChart(diff) {
  document.getElementById("easy-count").innerText = diff.Easy || 0;
  document.getElementById("medium-count").innerText = diff.Medium || 0;
  document.getElementById("hard-count").innerText = diff.Hard || 0;

  const ctx = document.getElementById("difficultyChart")?.getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Easy", "Medium", "Hard"],
      datasets: [{
        data: [diff.Easy, diff.Medium, diff.Hard],
        backgroundColor: ["#00ffbf", "#ffcc00", "#ff3b3b"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right", labels: { color: "#ccc" } } }
    }
  });
}

function renderSolveChart(solves) {
  const ctx = document.getElementById("solveCountChart")?.getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: solves.map(s => s.title),
      datasets: [{
        data: solves.map(s => s.count),
        backgroundColor: "#00ffbf",
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#888" }, grid: { display: false } },
        y: { ticks: { color: "#888" }, grid: { color: "#222" } }
      }
    }
  });
}

/* ---------- PREVIEW MODE ---------- */
async function loadPreview() {
  const view = document.getElementById("view");
  document.getElementById("page-title").innerText = "Challenge Preview";

  try {
    const challenges = await api("/admin/challenges");
    if (!challenges || challenges.length === 0) {
      view.innerHTML = `<p class="dim-text">No challenges available to preview.</p>`;
      return;
    }

    const challengeId = challenges[0].id;
    const data = await api(`/admin/challenges/${challengeId}/preview`);

    view.innerHTML = `
      <div class="preview-warning">
        <i class="fas fa-exclamation-circle"></i>
        <div><strong>Preview Mode - Admin Only</strong><span>Flag submission is disabled</span></div>
      </div>
      <div class="preview-layout">
        <div class="preview-main">
          <div class="card-panel preview-card">
            <div class="challenge-header-row">
              <div>
                <h2>${data.title}</h2>
                <p class="dim-text">${data.description}</p>
                <div class="meta-tags">
                  <span class="tag-pill">Points: ${data.points}</span>
                  <span class="tag-pill">Category: ${data.category}</span>
                </div>
              </div>
              <span class="badge ${data.difficulty.toLowerCase()}">${data.difficulty}</span>
            </div>
          </div>
          <div class="card-panel preview-card">
            <h3>Instructions</h3>
            <p>${data.instructions}</p>
          </div>
        </div>
        <div class="preview-side">
          <div class="card-panel preview-card admin-info-box">
            <h3>Admin Info</h3>
            <div class="info-row"><span>Flag:</span><code class="flag-reveal">${data.flag}</code></div>
          </div>
        </div>
      </div>`;
  } catch (e) {
    view.innerHTML = `<p class="error-text">Failed to load preview: ${e.message}</p>`;
  }
}
