const API_BASE = "http://127.0.0.1:8000";

// Auth guard — uses unified 'user' key
(function checkLegacyAuth() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) { window.location.replace("../user-login.html"); return; }
    const u = JSON.parse(raw);
    if ((u.role || "").toLowerCase() !== "user") {
      window.location.replace("../user-login.html");
    }
  } catch (e) {
    localStorage.clear();
    window.location.replace("../user-login.html");
  }
})();

const userId = (function () { try { return JSON.parse(localStorage.getItem("user"))?.id; } catch { return null; } })();
const token = localStorage.getItem("token");

async function api(path) {
  const res = await fetch(API_BASE + path, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) return null;
  return res.json();
}

async function initDashboard() {
  const data = await api(`/users/${userId}/dashboard`);

  if (!data) return;

  // HEADER
  document.getElementById("nav-username").innerText = data.username;
  document.getElementById("nav-level").innerText = "Level " + data.level;

  // WELCOME
  document.getElementById("welcome-msg").innerText =
    `Welcome back, ${data.username}!`;

  document.getElementById("user-lvl").innerText = data.level;
  document.getElementById("user-rank").innerText = data.rank;

  // XP
  document.getElementById("xp-total").innerText = data.total_points;
  document.getElementById("next-lvl").innerText = data.level + 1;
  document.getElementById("xp-fraction").innerText =
    `${data.total_points} / ${data.next_level_xp} XP`;

  document.getElementById("xp-bar").style.width =
    `${(data.total_points / data.next_level_xp) * 100}%`;

  // STATS
  document.getElementById("stat-solved").innerText = data.solved;
  document.getElementById("stat-rank").innerText = "#" + data.rank;
  document.getElementById("stat-level").innerText = data.level;

  renderRecent(data.recent);
  renderAchievements(data.achievements);
}

function renderRecent(items) {
  const list = document.getElementById("recent-items");
  list.innerHTML = items.map(i => `
    <div class="list-item">
      <div class="item-icon"><i class="fas fa-book"></i></div>
      <div class="item-info">
        <h4>${i.title}</h4>
        <p>${i.created_at}</p>
      </div>
    </div>
  `).join("");
}

function renderAchievements(items) {
  const list = document.getElementById("achievement-items");
  list.innerHTML = items.map(a => `
    <div class="list-item">
      <div class="item-icon gold"><i class="fas fa-trophy"></i></div>
      <div class="item-info">
        <h4>${a.name}</h4>
        <p>${a.description}</p>
      </div>
    </div>
  `).join("");
}

function logout() {
  localStorage.clear();
  window.location.href = "../index.html";
}

document.addEventListener("DOMContentLoaded", initDashboard);
