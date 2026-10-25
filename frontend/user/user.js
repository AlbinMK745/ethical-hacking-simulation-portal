// Global Error Handler for Debugging
window.onerror = function (msg, url, line, col, error) {
  const errStr = `JS Error: ${msg}\nFile: ${url}\nLine: ${line}`;
  console.error(errStr, error);
  if (msg.includes("launchSimLab")) alert(errStr);
  return false;
};

// ✅ SESSION CHECK
(function checkUserAuth() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) { window.location.replace("../user-login.html"); return; }
    const stored = JSON.parse(raw);
    if ((stored.role || "").toLowerCase() !== "user") {
      window.location.replace("../user-login.html");
    }
  } catch (e) {
    localStorage.clear();
    window.location.replace("../user-login.html");
  }
})();

const user = (function () {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
})();


// Placeholder functions for sidebar clicks
/* =========================================
   TUTORIALS LOGIC (TryHackMe Style Paths)
   ========================================= */

let _allTutorials = [];

async function loadTutorials() {
  setActiveByPage("tutorials");
  document.getElementById("page-title").innerText = "Learning Paths";

  const view = document.getElementById("view");
  view.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading Learning Paths...</p></div>';

  try {
    const res = await fetch("http://127.0.0.1:8000/user/tutorials/");
    if (!res.ok) throw new Error("Failed to load");
    _allTutorials = await res.json();
    renderTutorialsPage(_allTutorials, "Learning Paths");
  } catch (err) {
    console.error(err);
    view.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Connection Failed</h3>
        <p>Could not load learning paths. Please try again later.</p>
        <button class="retry-btn" onclick="loadTutorials()">Retry</button>
      </div>`;
  }
}



// --- RENDERING ---

function renderTutorialsPage(tutorials, pageTitle) {
  const view = document.getElementById("view");

  // Group by Category
  const grouped = tutorials.reduce((acc, t) => {
    const cat = t.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  // Sort Categories
  const categories = Object.keys(grouped).sort();

  view.innerHTML = `
    <div class="tutorials-container">
      
      <div class="intro-header">
        <h1>${pageTitle}</h1>
        <p>Follow these guided paths to master specific cybersecurity skills.</p>
      </div>

      <div class="learning-paths-list">
        ${categories.map(cat => renderLearningPath(cat, grouped[cat])).join("")}
      </div>

    </div>
  `;

  // Event delegation is now handled globally in document.body listener
}

function renderLearningPath(category, tutorials) {
  const total = tutorials.length;
  // Mock progress or duration
  const duration = tutorials.length * 30 + " Mins";

  return `
    <div class="learning-path-card">
      <div class="path-info">
        <h2 class="path-title">${category}</h2>
        <p class="path-desc">${getPathDescription(category)}</p>
        
        <div class="path-meta">
          <span><i class="fas fa-book"></i> ${total} Modules</span>
          <span><i class="fas fa-clock"></i> ${duration}</span>
        </div>
      </div>

      <div class="path-modules-scroll">
        ${tutorials.map(t => renderPathModuleCard(t)).join("")}
      </div>
    </div>
  `;
}

// Make globally available to ensure inline onclick works
window.handleTutorialClick = function (event, id) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  console.log("Tutorial clicked:", id);
  openUserTutorial(id);
};

function renderPathModuleCard(t) {
  const diffClass = (t.difficulty || "Beginner").toLowerCase();

  // Icon selection based on category/difficulty
  let iconClass = "beginner";
  if (diffClass === "medium" || diffClass === "intermediate") iconClass = "intermediate";
  if (diffClass === "hard" || diffClass === "expert") iconClass = "advanced";

  return `
    <div class="path-module-item" data-tutorial-id="${t.id}">
      <div class="pm-icon ${iconClass}">
        <i class="fas fa-cube"></i>
      </div>
      <div class="pm-content">
        <h4>${t.title}</h4>
        <div class="pm-meta-row" style="display:flex; gap:10px; font-size:0.8rem; color:#64748b;">
            <span class="pm-difficulty ${diffClass}">${t.difficulty || "Beginner"}</span>
            <span><i class="far fa-clock"></i> ${t.duration || "30 min"}</span>
        </div>
      </div>
      <div class="pm-action">
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
  `;
}

function getPathDescription(cat) {
  const descriptions = {
    "Web Hacking": "Master the art of exploiting web applications, from SQLi to XSS.",
    "Network Security": "Learn to analyze traffic, secure ports, and defend networks.",
    "System Hacking": "Deep dive into OS vulnerabilities, privilege escalation, and exploits.",
    "Cryptography": "Understand encryption, hashing, and how to break weak ciphers.",
    "General": "Essential skills for every ethical hacker."
  };
  return descriptions[cat] || "A guided path to master this topic.";
}





function route(page) {
  // ✅ Highlight sidebar
  setActiveByPage(page);

  // ✅ Update top title
  const titleEl = document.getElementById("page-title");
  if (titleEl && PAGE_TITLES[page]) {
    titleEl.innerText = PAGE_TITLES[page];
  }

  // ✅ Load content
  switch (page) {
    case "dashboard":
      loadDashboard();
      break;

    case "tutorials":
      if (typeof loadModules === 'function') loadModules();
      else loadTutorials(); // Fallback
      break;

    case "saved-tutorials":
      loadSavedTutorials();
      break;

    case "search-tutorials":
      loadSearchTutorials();
      break;

    case "challenges":
      loadChallenges();
      break;

    case "search-challenges":
      loadSearchChallenges();
      break;

    case "daily-challenge":
      loadDailyChallenge();
      break;

    case "attempt-history":
      loadAttemptHistory();
      break;

    case "leaderboard":
      loadLeaderboard();
      break;

    case "achievements":
      loadAchievements();
      break;

    case "notes":
      loadNotes();
      break;

    case "recent":
      loadRecent();
      break;

    case "progress":
      loadProgress();
      break;

    case "profile":
      loadProfile();
      break;
    case "notifications":
      loadNotificationsPage();
      break;
  }
}



document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      console.log("Nav link clicked:", link.dataset.page);
      /*const page = link.dataset.page;
      setActive(link);*/
      route(link.dataset.page);
    });
  });

  // Global Event Delegation for Tutorials (Covers both regular cards and path items)
  document.body.addEventListener('click', (e) => {
    const card = e.target.closest('.module-card, .path-module-item');
    if (card && card.dataset.tutorialId) {
      e.preventDefault();
      e.stopPropagation();
      const id = card.dataset.tutorialId;
      console.log("Global Delegated Click:", id);
      openUserTutorial(id);
    }
  });

});

function logout() {
  localStorage.clear();
  window.location.href = "../index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "../index.html";
    });
  }
});


function setActiveByPage(page) {
  document.querySelectorAll(".sidebar-nav a").forEach(link => {
    link.classList.remove("active");
    if (link.dataset.page === page) {
      link.classList.add("active");
    }
  });
}

const PAGE_TITLES = {
  dashboard: "Dashboard",
  tutorials: "Tutorials",
  "saved-tutorials": "Saved Tutorials",
  "search-tutorials": "Search Tutorials",
  challenges: "Challenges",
  "search-challenges": "Search Challenges",
  "daily-challenge": "Daily Challenge",
  "attempt-history": "Attempt History",
  leaderboard: "Leaderboard",
  achievements: "Achievements",
  notes: "My Notes",
  recent: "Recently Viewed",
  progress: "Progress Graph",
  profile: "Profile"
};


// ✅ LOAD DASHBOARD (UI Construction)
document.addEventListener("DOMContentLoaded", () => {
  // 1. Update Sidebar/Top Bar info
  document.getElementById("nav-username").innerText = user.username;
  document.getElementById("nav-level").innerText = "Level " + (user.level || 1);

  loadDashboard();
});

async function loadDashboard() {
  const view = document.getElementById("view");

  // Loading state
  view.innerHTML = `<div style="text-align: center; padding: 3rem; color: #8892b0;">
    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-cyan);"></i>
    <p style="margin-top: 1rem;">Loading dashboard...</p>
  </div>`;

  try {
    // Fetch real data from API
    const [statsRes, leaderboardRes] = await Promise.all([
      fetch(`http://127.0.0.1:8000/user/dashboard/stats/${user.id}`),
      fetch("http://127.0.0.1:8000/user/leaderboard-data")
    ]);

    const stats = await statsRes.json();
    const leaderboardData = await leaderboardRes.json();

    // Find user's rank from leaderboard
    const userEntry = leaderboardData.find(u => u.user_id === user.id);
    const userRank = userEntry ? userEntry.rank : '-';

    // Calculate level based on points (every 100 points = 1 level)
    const level = Math.floor(stats.points / 100) + 1;
    const currentLevelPoints = stats.points % 100;
    const pointsToNextLevel = 100;

    view.innerHTML = `
      <div class="dash-card welcome-section full-width" style="grid-column: 1 / -1; margin-top:0;">
          <div class="welcome-header">
              <div>
                  <h2>Welcome back, ${user.username}!</h2>
                  <p class="sub-text">Level ${level} • Rank #${userRank}</p>
              </div>
              <div class="xp-stat">
                  <h2>${stats.points}</h2>
                  <span class="sub-text">Total Points</span>
              </div>
          </div>
          
          <div class="progress-container">
              <div class="progress-labels">
                  <span>XP Progress to Level ${level + 1}</span>
                  <span>${currentLevelPoints} / ${pointsToNextLevel} XP</span>
              </div>
              <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${(currentLevelPoints / pointsToNextLevel) * 100}%"></div>
              </div>
          </div>
      </div>

      <div class="dash-card daily-card">
          <div class="card-header">
              <span><i class="fas fa-calendar-alt"></i> Daily Challenge</span>
          </div>
          <div class="card-body">
              <div class="daily-meta">
                  <span class="tag-blue">Complete by Today</span>
                  <span class="xp-reward">+50 Bonus Points</span>
              </div>
              <h3>Today's Challenge</h3>
              <p class="desc">Complete today's daily challenge to earn bonus points!</p>
              <button class="btn-outline mt-15" onclick="route('daily-challenge')">View Challenge</button>
          </div>
      </div>

      <div class="stats-row full-width" style="grid-column: 1 / -1;">
          <div class="dash-card stat-mini">
              <div class="stat-icon blue"><i class="fas fa-crosshairs"></i></div>
              <div>
                  <h2>${stats.solved}</h2>
                  <p>Challenges Solved</p>
              </div>
          </div>
          <div class="dash-card stat-mini">
              <div class="stat-icon green"><i class="fas fa-trophy"></i></div>
              <div>
                  <h2>#${userRank}</h2>
                  <p>Global Rank</p>
              </div>
          </div>
          <div class="dash-card stat-mini">
              <div class="stat-icon yellow"><i class="fas fa-chart-line"></i></div>
              <div>
                  <h2>${level}</h2>
                  <p>Current Level</p>
              </div>
          </div>
          <div class="dash-card stat-mini">
              <div class="stat-icon purple"><i class="fas fa-percentage"></i></div>
              <div>
                  <h2>${stats.completion_percentage}%</h2>
                  <p>Completion Rate</p>
              </div>
          </div>
      </div>

      <div class="dash-card achievements-list">
          <div class="card-header flex-row-between">
              <span>Quick Actions</span>
          </div>
          <div class="list-items">
              <div class="list-item" onclick="route('tutorials')" style="cursor: pointer;">
                  <div class="item-icon"><i class="fas fa-book"></i></div>
                  <div class="item-info">
                      <h4>Browse Tutorials</h4>
                      <p>Learn new techniques</p>
                  </div>
              </div>
              <div class="list-item" onclick="route('challenges')" style="cursor: pointer;">
                  <div class="item-icon"><i class="fas fa-crosshairs"></i></div>
                  <div class="item-info">
                      <h4>Try Challenges</h4>
                      <p>Test your skills</p>
                  </div>
              </div>
              <div class="list-item" onclick="route('leaderboard')" style="cursor: pointer;">
                  <div class="item-icon gold"><i class="fas fa-trophy"></i></div>
                  <div class="item-info">
                      <h4>View Leaderboard</h4>
                      <p>See your ranking</p>
                  </div>
              </div>
          </div>
      </div>

      <div class="dash-card recent-list">
          <div class="card-header flex-row-between">
              <span><i class="fas fa-chart-bar"></i> Your Stats</span>
          </div>
          <div class="list-items">
              <div class="list-item">
                  <div class="item-icon blue"><i class="fas fa-check-circle"></i></div>
                  <div class="item-info">
                      <h4>Success Rate</h4>
                      <p>${stats.attempts > 0 ? Math.round((stats.solved / stats.attempts) * 100) : 0}% of attempts successful</p>
                  </div>
              </div>
              <div class="list-item">
                  <div class="item-icon yellow"><i class="fas fa-fire"></i></div>
                  <div class="item-info">
                      <h4>Total Attempts</h4>
                      <p>${stats.attempts} challenge attempts made</p>
                  </div>
              </div>
              <div class="list-item">
                  <div class="item-icon green"><i class="fas fa-star"></i></div>
                  <div class="item-info">
                      <h4>Points Earned</h4>
                      <p>${stats.points} total points from ${stats.solved} solved challenges</p>
                  </div>
              </div>
          </div>
      </div>
    `;
  } catch (err) {
    console.error("Failed to load dashboard:", err);
    view.innerHTML = `<div class="error-text" style="padding: 2rem; text-align: center;">
      <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b;"></i>
      <p style="margin-top: 1rem;">Failed to load dashboard. Please refresh the page.</p>
    </div>`;
  }
}

// Helpers for List Items
function renderListItem(icon, title, date) {
  return `
    <div class="list-item">
        <div class="item-icon"><i class="${icon}"></i></div>
        <div class="item-info">
            <h4>${title}</h4>
            <p>${date}</p>
        </div>
    </div>`;
}

function renderAchievement(title, desc) {
  return `
    <div class="list-item">
        <div class="item-icon gold"><i class="fas fa-trophy"></i></div>
        <div class="item-info">
            <h4>${title}</h4>
            <p>${desc}</p>
        </div>
    </div>`;
}





function renderModules(tutorials, savedIds = null) {
  if (savedIds) _savedTutorialIds = savedIds;
  _allTutorials = tutorials;

  const container = document.getElementById("modules-container");
  if (!container) return;

  // Flat Grid Render
  if (tutorials.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color: #667;">No modules found matching your criteria.</div>`;
    return;
  }

  container.innerHTML = tutorials.map(t => renderNewModuleCard(t)).join('');
}

function applyFilters() {
  const diff = document.getElementById('diff-filter').value;
  const query = document.querySelector('.tutorials-search-box-large input').value.toLowerCase();

  const filtered = _allTutorials.filter(t => {
    const matchesDiff = (diff === 'All') || (t.difficulty === diff);
    const matchesSearch = t.title.toLowerCase().includes(query) || (t.category && t.category.toLowerCase().includes(query));
    return matchesDiff && matchesSearch;
  });

  // Render filtered subset, preserving savedIds
  const container = document.getElementById("modules-container");
  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color: #667;">No modules found.</div>`;
  } else {
    container.innerHTML = filtered.map(t => renderNewModuleCard(t)).join('');
  }
}

function filterModules(query) {
  applyFilters();
}

// Helper to render the specific card UI from the image
// Helper to render the specific card UI from the image
function renderNewModuleCard(t) {
  // Visual defaults
  const difficulty = t.difficulty || "Beginner";
  const diffClass = difficulty.toLowerCase();
  const time = t.duration || "30 min";
  const views = t.views || 0;

  // Progress is separate logic (not yet in tutorials table, usually user_progress)
  // For now we keep the mock or checks if backend sends 'progress' for user-specific calls
  const progress = t.progress || 0;

  // Determine Gradient Class and Icon based on Category
  let category = t.category || "General";
  let gradClass = 'grad-general';
  let iconClass = 'fa-book';

  if (category.includes('Web')) { gradClass = 'grad-web'; iconClass = 'fa-globe'; }
  else if (category.includes('Crypto')) { gradClass = 'grad-crypto'; iconClass = 'fa-key'; }
  else if (category.includes('Network')) { gradClass = 'grad-forensics'; iconClass = 'fa-network-wired'; }
  else if (category.includes('System') || category.includes('Linux')) { gradClass = 'grad-pwn'; iconClass = 'fa-terminal'; }

  return `
    <div class="module-card" data-tutorial-id="${t.id}">
      
      <div class="module-header-img ${gradClass}">
        <i class="fas ${iconClass}"></i>
      </div>

      <div class="module-body">
        <div class="module-meta-top">
            <span>${category.toUpperCase()}</span>
            <span class="diff-badge diff-${diffClass}">${difficulty}</span>
        </div>

        <h3 class="module-title">${t.title}</h3>
        <p class="module-desc">${t.content || t.description || "Learn essential concepts in this comprehensive module."}</p>

        <div class="module-stats">
             <div class="stat-item"><i class="far fa-clock"></i> ${time}</div>
             <div class="stat-item"><i class="far fa-user"></i> ${views}</div>
        </div>

        <div class="module-progress-wrapper">
             <div class="progress-info">
                <span>Progress</span>
                <span>${progress}%</span>
             </div>
             <div class="progress-track">
                <div class="progress-fill" style="width: ${progress}%"></div>
             </div>
        </div>

      </div>

    </div>
  `;
}

async function toggleSave(e, tutorialId, el) {
  // Prevent ALL navigation and bubbling
  if (e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  // If already saved -> remove, otherwise save
  if (el.classList.contains('saved')) {
    const ok = await removeSavedTutorialApi(tutorialId);
    if (ok) {
      el.classList.remove('saved');
      el.classList.remove('fas');
      el.classList.add('far');

      // If on Saved Tutorials page, refresh that page specifically
      const currentPage = document.getElementById('page-title')?.innerText;
      if (currentPage === 'Saved Tutorials') {
        loadSavedTutorials();
      }
    } else {
      alert('Failed to remove saved tutorial');
    }
  } else {
    const ok = await saveTutorial(tutorialId);
    if (ok) {
      el.classList.add('saved');
      el.classList.remove('far');
      el.classList.add('fas');
    } else {
      alert('Failed to save tutorial');
    }
  }

  // Prevent any further event handling
  return false;
}

async function saveTutorial(tutorialId) {
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/user/tutorials/save/${tutorialId}?user_id=${user.id}`,
      { method: "POST" }
    );

    if (!res.ok) throw new Error();
    return true;
  } catch {
    return false;
  }
}

async function removeSavedTutorialApi(tutorialId) {
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/user/tutorials/saved/${tutorialId}?user_id=${user.id}`,
      { method: "DELETE" }
    );

    if (!res.ok) throw new Error();
    return true;
  } catch {
    return false;
  }
}

async function removeSavedTutorial(tutorialId) {
  const ok = await removeSavedTutorialApi(tutorialId);
  if (ok) loadSavedTutorials();
  else alert('Failed to remove tutorial');
}

// function openUserTutorial(id) removed - duplicate definition
// See newer definition below around line 917


/* =========================================
   SAVED TUTORIALS LOGIC - NEW DESIGN
   ========================================= */

async function loadSavedTutorials() {
  if (typeof setActiveByPage === 'function') setActiveByPage('saved-tutorials');
  document.getElementById("page-title").innerText = "Saved Modules";

  const view = document.getElementById("view");
  view.innerHTML = `<p class="loading-text">Loading...</p>`;

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    view.innerHTML = `<p class="error-text">Please log in to view saved modules</p>`;
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/user/modules/saved", {
      headers: { "user-id": user.id.toString() }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const modules = data.modules || [];

    if (modules.length === 0) {
      view.innerHTML = `
        <div style="text-align:center; padding:3rem;">
          <i class="far fa-bookmark" style="font-size:4rem; color:#475569; margin-bottom:1rem;"></i>
          <h3>No Saved Modules</h3>
          <p style="color:#94a3b8;">Bookmark modules to save them here!</p>
          <button onclick="route('tutorials')" style="margin-top:1.5rem; padding:0.8rem 1.5rem; background:#0ea5e9; color:#fff; border:none; border-radius:6px; cursor:pointer;">Browse Modules</button>
        </div>
      `;
      return;
    }

    view.innerHTML = `
      <div style="padding:2rem;">
        <h2 style="margin-bottom:0.5rem;">Saved Modules</h2>
        <p style="color:#94a3b8">${modules.length} saved</p>
        <div class="modules-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.5rem; margin-top:2rem;">
          ${modules.map(m => `
            <div class="module-card" onclick="openModule(${m.id})">
              <button type="button" class="save-btn saved" onclick="event.stopPropagation(); toggleSaveModule(${m.id}, this); setTimeout(() => loadSavedTutorials(), 500);"><i class="fas fa-star"></i></button>
              <div>
                <div class="module-thumb">${m.thumbnail_url ? `<img src="${m.thumbnail_url}">` : `<i class="fas fa-cube module-thumb-placeholder"></i>`}</div>
                <div class="module-content">
                  <div class="module-meta"><span>${m.category || 'General'}</span><span class="module-difficulty ${(m.difficulty || 'Beginner').toLowerCase()}">${m.difficulty || 'Beginner'}</span></div>
                  <h3 class="module-title">${m.title}</h3>
                  <p class="module-desc">${m.description || ''}</p>
                  <div class="module-footer"><div class="progress-wrapper"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${m.progress_percent || 0}%"></div></div><span>${m.progress_percent || 0}%</span></div></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error loading saved modules:', err);
    view.innerHTML = `<p class="error-text">Failed to load saved modules: ${err.message}</p>`;
  }
}

function renderSavedTutorialCard(tutorial) {
  // Defaults
  const difficulty = tutorial.difficulty || 'Beginner';
  const diffClass = difficulty.toLowerCase();
  const duration = tutorial.duration || '30 min';
  const views = tutorial.views || 1200;
  const category = tutorial.category || 'General';
  const description = tutorial.content || tutorial.description || 'Learn essential concepts and techniques for ethical hacking.';

  return `
    <div class="saved-tutorial-card" onclick="openUserTutorial(${tutorial.id})">
      
      <!-- Card Header -->
      <div class="saved-card-header">
        <span class="saved-difficulty-badge ${diffClass}">${difficulty}</span>
        <i class="fas fa-star saved-star-icon" 
           onclick="event.stopPropagation(); removeSavedTutorial(${tutorial.id}); return false;"
           title="Remove from saved">
        </i>
      </div>

      <!-- Card Content -->
      <h3 class="saved-card-title">${escapeHtml(tutorial.title)}</h3>
      <p class="saved-card-description">${escapeHtml(description)}</p>

      <!-- Card Footer -->
      <div class="saved-card-footer">
        <div class="saved-card-meta">
          <span class="saved-meta-item">
            <i class="far fa-clock"></i>
            ${duration}
          </span>
          <span class="saved-meta-item">
            <i class="far fa-eye"></i>
            ${views}
          </span>
        </div>
        <span class="saved-category-tag">${category}</span>
      </div>

    </div>
  `;
}

async function removeSavedTutorial(tutorialId) {
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/user/tutorials/saved/${tutorialId}?user_id=${user.id}`,
      { method: "DELETE" }
    );

    if (!res.ok) throw new Error();

    // Reload the saved tutorials page
    loadSavedTutorials();
  } catch (err) {
    console.error(err);
    alert("Failed to remove tutorial");
  }
}

/* =========================================
   SEARCH TUTORIALS LOGIC
   ========================================= */

function loadSearchTutorials(el) {
  if (typeof setActiveByPage === 'function') setActiveByPage('search-tutorials');
  document.getElementById("page-title").innerText = "Search Tutorials";

  const view = document.getElementById("view");

  // 1. Initial UI Layout
  view.innerHTML = `
    <div class="search-page-layout">
      
      <div class="search-header-row">
        <div class="search-bar-neon">
            <i class="fas fa-search"></i>
            <input 
                id="search-input" 
                placeholder="Search tutorials instantly..." 
                onkeyup="searchTutorials(this.value)"
                autofocus
            >
        </div>
      </div>

      <p id="result-status" class="result-count-text">Start typing to search...</p>

      <div id="search-results" class="tutorials-list-container"></div>
    </div>
  `;

  // Load all tutorials initially
  searchTutorials("");
}

async function searchTutorials(query) {
  const results = document.getElementById("search-results");
  const status = document.getElementById("result-status");

  status.innerText = query.trim() ? "Searching..." : "Loading tutorials...";

  let tutorials = [];
  try {
    const url = query.trim()
      ? `http://127.0.0.1:8000/user/tutorials/search?q=${encodeURIComponent(query)}`
      : `http://127.0.0.1:8000/user/tutorials`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    tutorials = await res.json();
  } catch (err) {
    console.error(err);
    status.innerText = "Failed to load tutorials";
    results.innerHTML = `<p class="error-text">Unable to fetch tutorials right now.</p>`;
    return;
  }

  if (!tutorials || tutorials.length === 0) {
    status.innerText = "0 results found";
    results.innerHTML = `<p class="dim-text">No tutorials found.</p>`;
    return;
  }

  status.innerText = `${tutorials.length} results found`;

  // Render Cards (Row Layout)
  results.innerHTML = tutorials.map(t => {
    const diffClass = (t.difficulty || 'Beginner').toLowerCase();

    return `
        <div class="tut-search-card" onclick="openUserTutorial(${t.id})">
          
          <div class="tut-search-header">
            <h3 class="tut-search-title">${escapeHtml(t.title)}</h3>
            <span class="badge ${diffClass}">${t.difficulty}</span>
          </div>

          <p class="tut-search-desc">${escapeHtml(t.description || t.content || "No description available.")}</p>

          <div class="tut-search-meta">
            <span class="tag-pill tiny">${t.category}</span>
            <span class="meta-item"><i class="far fa-clock"></i> ${t.duration || '30 min'}</span>
            <span class="meta-item"><i class="far fa-eye"></i> ${t.views || 0} views</span>
          </div>

        </div>
      `;
  }).join('');
}

// ✅ OPEN TUTORIAL (Display Content)
async function openUserTutorial(id) {
  console.log("Opening tutorial with ID:", id);
  const view = document.getElementById("view");
  view.innerHTML = `<p class="loading-text">Loading content...</p>`;

  try {
    const res = await fetch(`http://127.0.0.1:8000/user/tutorials/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (!data || data.id === undefined || data.content === undefined) {
        throw new Error("Tutorial data is incomplete");
      }

      // LOG TO RECENTLY VIEWED
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        fetch("http://127.0.0.1:8000/user/dashboard/recently-viewed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": user.id.toString()
          },
          body: JSON.stringify({
            item_id: id,
            item_type: 'tutorial',
            title: data.title,
            category: data.category
          })
        }).catch(err => console.warn("Recent log failed", err));
      } catch (e) { console.warn("Skipping recent log", e); }


      // Render Detail View
      const difficulty = data.difficulty || 'Beginner';
      const category = data.category || 'General';

      view.innerHTML = `
            <div class="tutorial-detail-view">
                <button class="btn-back" onclick="loadTutorials()">← Back to Tutorials</button>
                <div class="detail-header">
                    <h2>${data.title}</h2>
                    <div class="detail-meta">
                        <span class="badge ${difficulty.toLowerCase()}">${difficulty}</span>
                        <span class="tag-pill">${category}</span>
                    </div>
                </div>
                <div class="detail-content-box">
                    ${data.content}
                </div>
            </div>
        `;
    } else {
      let message = "Failed to fetch tutorial";
      try {
        const errData = await res.json();
        if (errData && errData.detail) message = errData.detail;
      } catch (_) { }
      throw new Error(message);
    }
  } catch (e) {
    console.error("Error loading tutorial:", e);
    // Error state
    view.innerHTML = `
        <div class="tutorial-detail-view">
            <button class="btn-back" onclick="loadTutorials()">← Back to Tutorials</button>
            <div class="detail-content-box">
                <h2>Failed to Load Tutorial</h2>
                <p>Unable to load tutorial content. Please try again later.</p>
                <p class="error-text">Error: ${e.message}</p>
            </div>
        </div>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}


// ✅ LOAD LEADERBOARD (UI Construction)
async function loadLeaderboard() {
  // Navigation helper (if exists in your codebase)
  if (typeof setActiveByPage === 'function') setActiveByPage('leaderboard');

  document.getElementById("page-title").innerText = "Leaderboard";

  const view = document.getElementById("view");
  view.innerHTML = `<p class="loading-text">Loading leaderboard...</p>`;

  let data = [];

  try {
    const res = await fetch("http://127.0.0.1:8000/user/leaderboard-data");
    data = await res.json();
  } catch (err) {
    console.error(err);
    view.innerHTML = `<p class="error-text">Failed to load leaderboard</p>`;
    return;
  }

  // If no data, show empty state instead of mock data
  if (!data.length) {
    view.innerHTML = `
      <div class="leaderboard-container">
        <div class="lb-header-text">
          <h2>Global Leaderboard</h2>
          <p>No users have completed challenges yet. Be the first!</p>
        </div>
      </div>
    `;
    return;
  }

  // Find current user's data from the leaderboard
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const userEntry = data.find(u => u.user_id === currentUser.id);
  const userRank = userEntry ? userEntry.rank : '-';
  const userPoints = userEntry ? userEntry.points : 0;

  // Calculate points to next rank
  let pointsToNext = 0;
  if (userEntry && userEntry.rank > 1) {
    const nextRankUser = data.find(u => u.rank === userEntry.rank - 1);
    if (nextRankUser) {
      pointsToNext = nextRankUser.points - userPoints;
    }
  }

  // Split top 3 for Podium
  const top1 = data.find(u => u.rank === 1) || { username: '-', points: 0, solved: 0 };
  const top2 = data.find(u => u.rank === 2) || { username: '-', points: 0, solved: 0 };
  const top3 = data.find(u => u.rank === 3) || { username: '-', points: 0, solved: 0 };

  view.innerHTML = `
    <div class="leaderboard-container">
      
      <div class="lb-header-text">
        <h2>Global Leaderboard</h2>
        <p>Top ethical hackers worldwide</p>
      </div>

      <div class="lb-podium">
        
        <div class="podium-card silver">
            <div class="crown-icon">🥈</div>
            <div class="podium-avatar">${top2.username.charAt(0).toUpperCase()}</div>
            <div class="podium-user">${top2.username}</div>
            <div class="podium-score">${top2.points}</div>
            <div class="podium-sub">${top2.solved} solved</div>
        </div>

        <div class="podium-card gold">
            <div class="crown-icon">👑</div>
            <div class="podium-avatar">${top1.username.charAt(0).toUpperCase()}</div>
            <div class="podium-user">${top1.username}</div>
            <div class="podium-score">${top1.points}</div>
            <div class="podium-sub">${top1.solved} solved</div>
        </div>

        <div class="podium-card bronze">
            <div class="crown-icon">🥉</div>
            <div class="podium-avatar">${top3.username.charAt(0).toUpperCase()}</div>
            <div class="podium-user">${top3.username}</div>
            <div class="podium-score">${top3.points}</div>
            <div class="podium-sub">${top3.solved} solved</div>
        </div>

      </div>

      <div class="lb-list-section">
        <h3 class="section-title"><i class="fas fa-trophy"></i> Rankings</h3>
        
        <table class="cyber-table">
          <thead>
            <tr>
              <th style="width: 80px;">Rank</th>
              <th>User</th>
              <th class="text-right">Score</th>
              <th class="text-right">Challenges Solved</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(u => {
    // Highlight current user
    const isMe = (currentUser && currentUser.id === u.user_id) ? 'active-row' : '';

    // Rank Icons
    let rankDisplay = `#${u.rank}`;
    if (u.rank === 1) rankDisplay = '🏆';
    if (u.rank === 2) rankDisplay = '🥈';
    if (u.rank === 3) rankDisplay = '🥉';

    return `
              <tr class="${isMe}">
                <td class="rank-col">${rankDisplay}</td>
                <td class="user-col">
                    ${u.username} 
                    ${isMe ? '<span class="me-badge">You</span>' : ''}
                </td>
                <td class="text-right cyan-text">${u.points}</td>
                <td class="text-right dim-text">${u.solved}</td>
              </tr>
              `;
  }).join("")}
          </tbody>
        </table>
      </div>

      <div class="lb-footer">
        <h4 style="color:var(--primary-cyan); margin-bottom:10px;">Your Performance</h4>
        <div class="perf-stats">
            <div>
                <span>Current Rank</span>
                <h3>#${userRank}</h3>
            </div>
            <div>
                <span>Points to Next Rank</span>
                <h3>${pointsToNext > 0 ? pointsToNext : (userRank === 1 ? '🏆' : '-')}</h3>
            </div>
            <div>
                <span>Percentile</span>
                <h3>${userEntry ? `Top ${Math.round((userEntry.rank / data.length) * 100)}%` : '-'}</h3>
            </div>
        </div>
      </div>

    </div>
  `;
}

// ✅ LOAD ATTEMPT HISTORY 
async function loadAttemptHistory() {
  if (typeof setActiveByPage === 'function') setActiveByPage('attempt-history');
  document.getElementById("page-title").innerText = "Attempt History";

  const view = document.getElementById("view");
  view.innerHTML = `<p class="loading-text">Loading attempt history...</p>`;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    view.innerHTML = `<p class="error-text">User not logged in</p>`;
    return;
  }

  let attempts = [];

  try {
    const res = await fetch(`http://127.0.0.1:8000/user/attempts/${user.id}`);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || res.statusText);
    }
    attempts = await res.json();
  } catch (err) {
    console.error('Attempt history load error:', err);
    view.innerHTML = `<p class="error-text">Failed to load attempts</p>`;
    return;
  }

  // --- UI CALCULATION (For the Stats Row in the image) ---
  const total = attempts.length;
  const completed = attempts.filter(a => a.is_correct).length;
  const failed = total - completed;
  const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

  if (!attempts || !attempts.length) {
    view.innerHTML = `<p class="dim-text">No attempts yet</p>`;
    return;
  }

  // --- RENDER UI ---
  view.innerHTML = `
    <div class="history-page">
      
      <div class="hist-stats-row">
        <div class="hist-stat-card">
            <div class="stat-label"><i class="fas fa-history" style="color:#00d2ff"></i> Total Attempts</div>
            <div class="stat-num">${total}</div>
        </div>
        <div class="hist-stat-card">
            <div class="stat-label"><i class="fas fa-check-circle" style="color:#00ffbf"></i> Completed</div>
            <div class="stat-num">${completed}</div>
        </div>
        <div class="hist-stat-card">
            <div class="stat-label"><i class="fas fa-times-circle" style="color:#ff3333"></i> Failed</div>
            <div class="stat-num">${failed}</div>
        </div>
        <div class="hist-stat-card">
            <div class="stat-label"><i class="fas fa-chart-line" style="color:#ffcc00"></i> Success Rate</div>
            <div class="stat-num">${successRate}%</div>
        </div>
      </div>

      <div class="hist-filters">
        <button class="filter-chip active">All</button>
        <button class="filter-chip">Completed</button>
        <button class="filter-chip">Failed</button>
      </div>

      <div class="hist-list">
        ${attempts.map(a => {
    const isSuccess = a.is_correct;
    const statusLabel = isSuccess ? 'Completed' : 'Failed';
    const statusClass = isSuccess ? 'completed' : 'failed';
    const pointsDisplay = isSuccess ? `+${a.points || 0} pts` : '0 pts';
    const pointsClass = isSuccess ? 'pts-green' : 'pts-gray';

    // Visual mock data for fields not yet in DB (Time Taken, Hints) to match image
    const timeTaken = "45 min";
    const hintsUsed = "2";

    return `
            <div class="attempt-item-card">
                
                <div class="att-row-top">
                    <div class="att-main-info">
                        <h4>${a.title}</h4>
                        <div class="att-tags">
                            <span class="cat-pill intermediate">${a.category || 'General'}</span>
                            <span class="status-pill ${statusClass}">${statusLabel}</span>
                        </div>
                    </div>
                    <div class="att-meta-right">
                        <span class="att-date"><i class="far fa-clock"></i> ${a.submitted_at || 'Just now'}</span>
                        <span class="att-points ${pointsClass}">${pointsDisplay}</span>
                    </div>
                </div>

                <div class="att-divider"></div>

                <div class="att-row-bot">
                    <div class="att-field">
                        <label>Flag Submitted</label>
                        <code class="flag-code">CTF{${a.submitted_flag || 'hidden'}}</code>
                    </div>
                    <div class="att-field">
                        <label>Time Taken</label>
                        <span>${timeTaken}</span>
                    </div>
                    <div class="att-field">
                        <label>Hints Used</label>
                        <span>${hintsUsed}</span>
                    </div>
                </div>

            </div>
            `;
  }).join('')}
      </div>

    </div>
  `;
}

// ✅ LOAD ACHIEVEMENTS (UI Construction)
async function loadAchievements() {
  if (typeof setActiveByPage === 'function') setActiveByPage('achievements');
  document.getElementById("page-title").innerText = "Achievements";

  const view = document.getElementById("view");
  view.innerHTML = `<p class="loading-text">Loading achievements...</p>`;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    view.innerHTML = `<p class="error-text">User not logged in</p>`;
    return;
  }

  let achievements = [];

  try {
    const res = await fetch(`http://127.0.0.1:8000/user/achievements/${user.id}`);
    achievements = await res.json();
  } catch {
    view.innerHTML = `<p class="error-text">Failed to load achievements</p>`;
    return;
  }

  if (!achievements.length) {
    view.innerHTML = `<p class="dim-text">No achievements found</p>`;
    return;
  }

  // --- UI-Only Calculations for Header Stats ---
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.points || 0), 0);
  const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // --- Render UI ---
  view.innerHTML = `
    <div class="achievements-page">
      
      <div class="ach-stats-row">
        <div class="ach-stat-card">
            <div class="stat-icon"><i class="fas fa-trophy"></i></div>
            <div>
                <span>Achievements Unlocked</span>
                <h3>${unlockedCount} / ${totalCount}</h3>
                <div class="mini-progress"><div class="fill" style="width:${completionRate}%"></div></div>
            </div>
        </div>
        <div class="ach-stat-card">
            <div class="stat-icon"><i class="fas fa-star"></i></div>
            <div>
                <span>Total Points Earned</span>
                <h3>${totalPoints}</h3>
            </div>
        </div>
        <div class="ach-stat-card">
            <div class="stat-icon"><i class="fas fa-chart-pie"></i></div>
            <div>
                <span>Completion Rate</span>
                <h3>${completionRate}%</h3>
            </div>
        </div>
      </div>

      <div class="achievements-grid">
        ${achievements.map(a => {
    const percent = Math.min(Math.round((a.progress / a.target) * 100), 100);
    const stateClass = a.unlocked ? 'unlocked' : 'locked';
    const iconColor = a.unlocked ? 'colored' : 'grey';

    // Use FontAwesome icons based on title/category keywords if specific icon not provided
    let iconClass = "fas fa-medal";
    if (a.title.includes("First")) iconClass = "fas fa-bullseye";
    if (a.title.includes("Speed")) iconClass = "fas fa-bolt";
    if (a.title.includes("SQL")) iconClass = "fas fa-syringe";
    if (a.title.includes("Week")) iconClass = "fas fa-fire";
    if (a.title.includes("Master")) iconClass = "fas fa-book";
    if (a.title.includes("King") || a.title.includes("Elite")) iconClass = "fas fa-crown";

    return `
            <div class="ach-card ${stateClass}">
              
              <div class="ach-card-header">
                <div class="ach-icon-box ${stateClass}">
                    <i class="${iconClass}"></i>
                </div>
                <span class="ach-status-badge ${stateClass}">
                    <i class="fas ${a.unlocked ? 'fa-check' : 'fa-lock'}"></i> 
                    ${a.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>

              <div class="ach-content">
                <h4>${a.title}</h4>
                <p>${a.description}</p>
              </div>

              <div class="ach-footer">
                ${a.unlocked
        ? `
                        <div class="ach-meta">
                            <span class="pts-val success"><i class="fas fa-bolt"></i> +${a.points} pts</span>
                            <span class="date-val">${a.unlocked_at || '2025-11-28'}</span>
                        </div>
                      `
        : `
                        <div class="ach-progress-wrapper">
                            <div class="prog-labels">
                                <span>Progress</span>
                                <span>${a.progress || 0} / ${a.target}</span>
                            </div>
                            <div class="ach-progress-bar">
                                <div class="ach-fill" style="width:${percent}%"></div>
                            </div>
                            <div class="ach-meta locked-meta">
                                <span class="pts-val locked"><i class="fas fa-bolt"></i> +${a.points} pts</span>
                            </div>
                        </div>
                      `
      }
              </div>

            </div>
          `;
  }).join("")}
      </div>

    </div>
  `;
}

// ✅ LOAD NOTES (UI Construction)
/* =========================================
   PROGRESS GRAPH PAGE
   ========================================= */

async function loadProgress() {
  setActiveByPage("progress");
  document.getElementById("page-title").innerText = "Progress Graph";

  const view = document.getElementById("view");
  view.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading progress data...</p></div>';

  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch(`http://127.0.0.1:8000/user/profile/${user.id}`, {
      headers: { "user-id": user.id }
    });

    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();

    // Use activity data or fallback to empty array
    const activity = data.activity || [];
    const activeDays = activity.length;

    // Render progress page
    view.innerHTML = `
      <div class="progress-page-container">
        <div class="progress-header">
          <h1>📈 Your Progress Over Time</h1>
          <p>Track your learning journey and achievements</p>
        </div>

        <div class="progress-stats-row">
          <div class="progress-stat-card">
            <i class="fas fa-trophy"></i>
            <h3>${data.user.points || 0}</h3>
            <span>Total Points</span>
          </div>
          <div class="progress-stat-card">
            <i class="fas fa-crosshairs"></i>
            <h3>${data.challenges_solved || 0}</h3>
            <span>Challenges Solved</span>
          </div>
          <div class="progress-stat-card">
            <i class="fas fa-fire"></i>
            <h3>${activeDays}</h3>
            <span>Active Days</span>
          </div>
          <div class="progress-stat-card">
            <i class="fas fa-chart-line"></i>
            <h3>Level ${data.user.level || 1}</h3>
            <span>Current Level</span>
          </div>
        </div>

        <div class="progress-chart-container">
          <h2>Activity Over Time</h2>
          ${activity.length > 0
        ? '<canvas id="progressActivityChart"></canvas>'
        : '<p style="text-align:center; color:#888; padding:3rem;">No activity data yet. Complete challenges to see your progress!</p>'
      }
        </div>

        <div class="progress-recent-activity">
          <h2>Recent Activity</h2>
          <div class="activity-list">
            ${activity.length > 0
        ? activity.slice(0, 7).map(act => `
                  <div class="activity-item">
                    <div class="activity-date">
                      <i class="fas fa-calendar"></i>
                      ${new Date(act.day).toLocaleDateString()}
                    </div>
                    <div class="activity-points">
                      <i class="fas fa-star"></i>
                      ${act.points} pts
                    </div>
                  </div>
                `).join('')
        : '<p style="text-align:center; color:#888; padding:2rem;">No recent activity. Start solving challenges!</p>'
      }
          </div>
        </div>
      </div>
    `;

    // Render chart only if there's activity data
    if (activity.length > 0) {
      renderProgressChart(activity);
    }

  } catch (err) {
    console.error(err);
    view.innerHTML = `
      <div class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to Load Progress Data</h3>
        <button onclick="loadProgress()" class="retry-btn">Retry</button>
      </div>
    `;
  }
}

function renderProgressChart(activity) {
  if (!activity || activity.length === 0) return;

  const ctx = document.getElementById("progressActivityChart").getContext("2d");

  const labels = activity.map(a => new Date(a.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const points = activity.map(a => a.points);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Points Earned",
        data: points,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-cyan').trim() || '#00ffbf',
        backgroundColor: 'rgba(0, 255, 191, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-cyan').trim() || '#00ffbf',
        pointBorderWidth: 2,
        pointBorderColor: '#000'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#000',
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-cyan').trim() || '#00ffbf',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#888' },
          grid: { color: '#222' }
        },
        x: {
          ticks: { color: '#888' },
          grid: { color: '#222' }
        }
      }
    }
  });
}

/* =========================================
   NOTES MODULE
   ========================================= */

// Keep track of notes locally for UI updates
let _currentNotes = [];

async function loadNotes() {
  if (typeof setActiveByPage === 'function') setActiveByPage('notes');
  document.getElementById("page-title").innerText = "My Notes";

  const view = document.getElementById("view");
  view.innerHTML = `<p class="loading-text">Loading notes...</p>`;

  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch(`http://127.0.0.1:8000/user/notes/${user.id}`);
    if (!res.ok) throw new Error("API error");
    _currentNotes = await res.json();
  } catch {
    view.innerHTML = `<p class="error-text">Failed to load notes</p>`;
    return;
  }

  // UI State: Default to first note
  const activeNote = _currentNotes.length > 0 ? _currentNotes[0] : null;

  // 1. Render Layout
  view.innerHTML = `
    <div class="notes-layout">
      
      <div class="notes-sidebar-panel">
        <button class="btn-new-note" onclick="openNoteModal('create')">+ New Note</button>
        
        <div class="note-search-bar">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search notes..." onkeyup="filterNotes(this.value)">
        </div>

        <div class="notes-list-container" id="notesList">
            ${renderNotesList(activeNote ? activeNote.id : null)}
        </div>
      </div>

      <div class="note-content-panel" id="noteContent">
        ${activeNote ? renderNoteDetail(activeNote) : renderEmptyState()}
      </div>

    </div>

    <div id="note-modal-overlay" class="custom-modal-overlay" style="display:none;">
        <div class="custom-modal-box">
            <div class="modal-header">
                <h3 id="modal-title">New Note</h3>
                <span class="close-modal" onclick="closeNoteModal()">×</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="modal-note-title" class="modal-input" placeholder="e.g. SQL Injection Tips">
                </div>
                <div class="form-group">
                    <label>Content (Markdown supported)</label>
                    <textarea id="modal-note-content" class="modal-textarea" placeholder="Type your notes here..."></textarea>
                </div>
                <input type="hidden" id="modal-note-id">
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeNoteModal()">Cancel</button>
                <button class="btn-save" onclick="saveNoteFromModal()">Save Note</button>
            </div>
        </div>
    </div>
  `;
}

/* --- RENDER HELPERS --- */

function renderNotesList(activeId) {
  if (_currentNotes.length === 0) return `<p class="dim-text" style="padding:20px; text-align:center;">No notes found</p>`;

  return _currentNotes.map(n => `
        <div class="note-list-item ${n.id === activeId ? 'active' : ''}" onclick="viewNote(${n.id})">
            <div class="n-item-top">
                <h4>${n.title}</h4>
                <div class="n-actions">
                    <i class="fas fa-edit" onclick="event.stopPropagation(); openNoteModal('edit', ${n.id});"></i>
                    <i class="fas fa-trash-alt" onclick="event.stopPropagation(); deleteNote(${n.id});"></i>
                </div>
            </div>
            <div class="n-tags-row">
                <span class="n-tag-mini blue">Note</span>
                <span class="n-tag-mini">General</span>
            </div>
            <span class="n-date">${new Date(n.created_at).toLocaleString()}</span>
        </div>
    `).join("");
}

function renderNoteDetail(note) {
  return `
        <div class="note-main-header">
            <div>
                <h2 class="note-title-large">${note.title}</h2>
                <div class="note-tags-large">
                    <span class="tag-pill cyan">Note</span>
                    <span class="tag-pill blue">General</span>
                </div>
            </div>
            <button class="btn-edit-note" onclick="openNoteModal('edit', ${note.id})">
                <i class="fas fa-edit"></i> Edit
            </button>
        </div>
        <div class="note-body-text">
            ${formatNoteContent(note.content)}
        </div>
    `;
}

function renderEmptyState() {
  return `
        <div class="empty-note-state">
            <i class="fas fa-sticky-note"></i>
            <p>Select a note to view details</p>
        </div>
    `;
}

/* --- LOGIC HANDLERS --- */

function viewNote(id) {
  const note = _currentNotes.find(n => n.id === id);
  if (!note) return;

  // Update List Active State
  document.querySelectorAll('.note-list-item').forEach(el => el.classList.remove('active'));
  // We re-render list to ensure state consistency or just toggle class (simpler here to toggle)
  loadNotes(); // Reloading full view to sync active state easily with the new layout
}

// Open Modal (Replaces Prompt)
function openNoteModal(mode, id = null) {
  const overlay = document.getElementById("note-modal-overlay");
  const titleInput = document.getElementById("modal-note-title");
  const contentInput = document.getElementById("modal-note-content");
  const idInput = document.getElementById("modal-note-id");
  const headerTitle = document.getElementById("modal-title");

  overlay.style.display = "flex";

  if (mode === 'edit' && id) {
    const note = _currentNotes.find(n => n.id === id);
    headerTitle.innerText = "Edit Note";
    titleInput.value = note.title;
    contentInput.value = note.content;
    idInput.value = id;
  } else {
    headerTitle.innerText = "New Note";
    titleInput.value = "";
    contentInput.value = "";
    idInput.value = "";
  }
}

function closeNoteModal() {
  document.getElementById("note-modal-overlay").style.display = "none";
}

// Save Logic (Connected to your API logic)
async function saveNoteFromModal() {
  const title = document.getElementById("modal-note-title").value;
  const content = document.getElementById("modal-note-content").value;
  const id = document.getElementById("modal-note-id").value;
  const user = JSON.parse(localStorage.getItem('user'));

  if (!title || !content) return alert("Title and content required");

  try {
    if (id) {
      // Edit Mode (Delete old + Create new as per your logic limitation)
      await fetch(`http://127.0.0.1:8000/user/notes/?user_id=${user.id}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`, { method: 'POST' });
      await fetch(`http://127.0.0.1:8000/user/notes/${id}?user_id=${user.id}`, { method: 'DELETE' });
    } else {
      // Create Mode
      await fetch(`http://127.0.0.1:8000/user/notes/?user_id=${user.id}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`, { method: 'POST' });
    }

    closeNoteModal();
    loadNotes(); // Refresh UI
  } catch (err) {
    alert('Operation failed');
    console.error(err);
  }
}

async function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  const user = JSON.parse(localStorage.getItem('user'));
  try {
    await fetch(`http://127.0.0.1:8000/user/notes/${id}?user_id=${user.id}`, { method: 'DELETE' });
    loadNotes();
  } catch (err) {
    console.error(err);
  }
}

function formatNoteContent(text) {
  if (!text) return "";
  return text
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\n/g, '<br>');
}

function filterNotes(query) {
  // Simple client-side filter
  const term = query.toLowerCase();
  const items = document.querySelectorAll('.note-list-item');
  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    item.style.display = text.includes(term) ? 'block' : 'none';
  });
}


// ✅ LOAD RECENTLY VIEWED ITEMS
async function loadRecent() {
  const view = document.getElementById("view");
  const user = JSON.parse(localStorage.getItem("user"));

  view.innerHTML = `
    <div class="recent-page">
      <div class="recent-header">
        <h2>Recently Viewed</h2>
        <p class="sub-text">Continue where you left off</p>
        <button class="btn-danger small">Clear History</button>
      </div>

      <div id="recent-list" class="recent-list">
        <p class="loading-text">Loading...</p>
      </div>
    </div>
  `;

  const list = document.getElementById("recent-list");


  try {
    const res = await fetch(
      "http://127.0.0.1:8000/user/modules/recently-viewed",
      {
        headers: { "user-id": user.id }
      }
    );

    if (!res.ok) {
      list.innerHTML = "<p class='error-text'>Failed to load history</p>";
      return;
    }

    const data = await res.json();
    const items = data.modules || [];

    if (!items.length) {
      list.innerHTML = "<p class='dim-text'>No recent activity</p>";
      return;
    }

    list.innerHTML = items.map(renderRecentCard).join("");

  } catch (err) {
    console.error(err);
    list.innerHTML = "<p class='error-text'>Connection failed</p>";
  }
}


// ✅ RENDER CARD (WIDE LIST STYLE)
function renderRecentCard(item) {
  const progress = item.progress_percent ?? 0;
  const isComplete = progress === 100;
  const actionText = isComplete ? "Review" : "Continue";

  const displayTitle = item.title || `Module #${item.id}`;
  const displayCategory = item.category || "General";

  return `
    <div class="recent-card-wide" onclick="openModule(${item.id})">
      
      <div class="recent-icon-box tutorial">
        <i class="fas fa-book-open"></i>
      </div>

      <div class="recent-content">
        
        <div class="recent-top-row">
            <h3 class="recent-title">${displayTitle}</h3>
            <div class="recent-time"><i class="far fa-clock"></i> ${timeAgo(item.last_accessed)}</div>
        </div>

        <div class="recent-badges-row">
            <span class="badge-type tutorial">Module</span>
            <span class="badge-cat">${displayCategory}</span>
            <span class="badge-cat">${item.difficulty || 'Beginner'}</span>
        </div>

        <div class="recent-progress-row">
            <div class="prog-label">
                <span>Progress</span>
                <span>${progress}%</span>
            </div>
            <div class="prog-bar-bg">
                <div class="prog-bar-fill" style="width: ${progress}%"></div>
            </div>
        </div>

        <button class="btn-recent-action">
           ${actionText}
        </button>

      </div>
    </div>
  `;
}


// ✅ OPEN RECENT ITEM
function openRecent(type, id) {
  if (type === "tutorial") {
    openUserTutorial(id);
  }
}


// ✅ TIME FORMATTER
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 3600) return Math.floor(diff / 60) + " min ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hours ago";
  return Math.floor(diff / 86400) + " days ago";
}





// ✅ LOAD PROFILE (UI Construction)
async function loadProfile() {
  // Navigation Helper
  if (typeof setActiveByPage === 'function') setActiveByPage("profile");
  document.getElementById("page-title").innerText = "Profile";

  const view = document.getElementById("view");
  const user = JSON.parse(localStorage.getItem("user"));

  view.innerHTML = `<p class="loading-text">Loading profile...</p>`;

  try {
    const res = await fetch("http://127.0.0.1:8000/user/profile", {
      headers: { "user-id": user.id }
    });

    // Merge API data with UI defaults (to ensure layout doesn't break if fields are missing)
    let apiData = {};
    if (res.ok) {
      apiData = await res.json();
    }

    console.log("🔍 Profile Debug:");
    console.log("localStorage user:", user);
    console.log("API response:", apiData);

    const data = {
      user: { ...user, ...(apiData.user || {}) },
      challenges_solved: apiData.challenges_solved || 0,
      recent_achievements: apiData.recent_achievements || [],
      rank: apiData.rank || 47,
      badges: apiData.badges_count || 4,
      chartData: apiData.points_over_time || []
    };

    console.log("Final merged data:", data);



    // Render Layout
    view.innerHTML = `
      <div class="profile-page-grid">

        <div class="profile-header-card">
            <div class="profile-avatar">
                ${data.user.avatar && data.user.avatar.startsWith('data:')
        ? `<img src="${data.user.avatar}" alt="Avatar" />`
        : `<div style="font-size: 4rem;">${getAvatarEmoji(data.user.avatar)}</div>`
      }
            </div>

            <h2 class="profile-name">${data.user.username}</h2>
            <div class="profile-level">Level ${data.user.level}</div>
            <div class="rank-badge">Rank #${data.rank}</div>

            ${data.user.bio ? `
                <div class="profile-bio">
                    <i class="fas fa-terminal"></i>
                    <em>"${data.user.bio}"</em>
                </div>
            ` : ''}

            ${(data.user.github_url || data.user.portfolio_url || data.user.htb_profile || data.user.thm_profile) ? `
                <div class="profile-social-links">
                    ${data.user.github_url ? `<a href="${data.user.github_url}" target="_blank" title="GitHub"><i class="fab fa-github"></i></a>` : ''}
                    ${data.user.portfolio_url ? `<a href="${data.user.portfolio_url}" target="_blank" title="Portfolio"><i class="fas fa-globe"></i></a>` : ''}
                    ${data.user.htb_profile ? `<a href="https://app.hackthebox.com/profile/${data.user.htb_profile}" target="_blank" title="HackTheBox"><i class="fas fa-cube"></i></a>` : ''}
                    ${data.user.thm_profile ? `<a href="https://tryhackme.com/p/${data.user.thm_profile}" target="_blank" title="TryHackMe"><i class="fas fa-flag"></i></a>` : ''}
                </div>
            ` : ''}

            ${data.user.skills && data.user.skills !== '[]' ? `
                <div class="profile-skills">
                    <h4><i class="fas fa-code"></i> Skills</h4>
                    <div class="profile-skill-tags">
                        ${JSON.parse(data.user.skills).map(skill => `
                            <span class="profile-skill-tag">${skill}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="profile-info-list">
                <div class="p-info-row">
                    <i class="fas fa-envelope"></i> <span>${data.user.email}</span>
                </div>
                <div class="p-info-row">
                    <i class="fas fa-calendar-alt"></i> <span>Joined ${data.user.created_at ? new Date(data.user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}</span>
                </div>
                <div class="p-info-row">
                    <i class="fas fa-trophy"></i> <span>${data.user.points || 0} Total Points</span>
                </div>
                <div class="p-info-row">
                    <i class="fas fa-crosshairs"></i> <span>${data.challenges_solved} Challenges Solved</span>
                </div>
            </div>

            <button class="btn-edit-profile"><i class="fas fa-edit"></i> Edit Profile</button>
            <button class="btn-change-pass"><i class="fas fa-lock"></i> Change Password</button>
        </div>

        <div class="profile-content-area">
            
            <div class="profile-stats-row">
                <div class="p-stat-card">
                    <span>Total Points</span>
                    <h3>${data.user.points || 0}</h3>
                </div>
                <div class="p-stat-card">
                    <span>Challenges</span>
                    <h3>${data.challenges_solved}</h3>
                </div>
                <div class="p-stat-card">
                    <span>Badges</span>
                    <h3>${data.badges}</h3>
                </div>
                <div class="p-stat-card">
                    <span>Rank</span>
                    <h3>#${data.rank}</h3>
                </div>
            </div>

            ${data.chartData && data.chartData.length > 0 ? `
            <div class="profile-graph-card">
                <h3>Points Over Time</h3>
                <div class="chart-container">
                    <canvas id="profileChart"></canvas>
                </div>
            </div>
            ` : ''}

            <div class="profile-bottom-grid">
                
                <div class="profile-section-card">
                    <h3>Recent Achievements</h3>
                    <div class="p-achievements-list">
                        ${data.recent_achievements.length > 0 ? data.recent_achievements.map(a => `
                            <div class="p-ach-item">
                                <div class="p-ach-icon"><i class="fas fa-medal"></i></div>
                                <div class="p-ach-text">
                                    <h4>${a.title}</h4>
                                    <p>${a.description || 'No description'}</p>
                                </div>
                            </div>
                        `).join('') : `
                            <p style="color: #999;">No achievements earned yet</p>
                        `}
                    </div>
                </div>

                </div>

            </div>
        </div>

      </div>
    `;

    // Render the Chart only if there's data
    if (typeof Chart !== "undefined" && data.chartData && data.chartData.length > 0) {
      renderProfileChart(data.chartData);
    }

    // Attach event listeners to buttons
    setTimeout(() => {
      const editBtn = document.querySelector('.btn-edit-profile');
      const changePassBtn = document.querySelector('.btn-change-pass');

      if (editBtn) {
        editBtn.onclick = () => openEditProfileModal(data.user);
      }

      if (changePassBtn) {
        changePassBtn.onclick = () => openChangePasswordModal();
      }
    }, 100);


  } catch (err) {
    console.error(err);
    view.innerHTML = `<p class="error-text">Failed to load profile</p>`;
  }
}

// --- UI Helpers ---

function renderSkillBar(name, val, color) {
  return `
    <div class="skill-item">
        <div class="skill-meta">
            <span>${name}</span>
            <span style="color:${color}">${val}%</span>
        </div>
        <div class="skill-track">
            <div class="skill-fill" style="width:${val}%; background:${color}; box-shadow: 0 0 10px ${color}40;"></div>
        </div>
    </div>`;
}

function renderProfileChart(chartData = []) {
  const ctx = document.getElementById('profileChart').getContext('2d');

  const labels = chartData.length
    ? chartData.map(d => d.date)
    : ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];

  const points = chartData.length
    ? chartData.map(d => d.points)
    : [150, 320, 580, 750, 920, 1250];

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Points',
        data: points,
        borderColor: '#00ffbf',
        backgroundColor: 'rgba(0, 255, 191, 0.05)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: '#00ffbf',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#222' },
          ticks: { color: '#666' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#666' }
        }
      }
    }
  });
}



/* =========================================
   CHALLENGES LOGIC (UI Update)
   ========================================= */

let _currentChallenges = [];

async function loadChallenges() {
  if (typeof setActiveByPage === 'function') setActiveByPage("challenges");
  document.getElementById("page-title").innerText = "Challenges";

  const user = JSON.parse(localStorage.getItem("user"));
  const view = document.getElementById("view");

  view.innerHTML = `<p class="loading-text">Loading challenges...</p>`;

  let challenges = [];
  try {
    const res = await fetch("http://127.0.0.1:8000/user/challenges/", {
      headers: { "user-id": user.id }
    });
    if (res.ok) {
      challenges = await res.json();
      _currentChallenges = challenges;
    }
  } catch (e) {
    console.error(e);
    view.innerHTML = `<p class="error-text">Failed to load challenges.</p>`;
    return;
  }

  // Compute stats
  const solved = challenges.filter(c => c.status === 'solved').length;
  const easyCnt = challenges.filter(c => (c.difficulty || '').toLowerCase() === 'easy').length;
  const medCnt = challenges.filter(c => (c.difficulty || '').toLowerCase() === 'medium').length;
  const hardCnt = challenges.filter(c => (c.difficulty || '').toLowerCase() === 'hard').length;

  // Render UI Layout
  view.innerHTML = `
    <div class="challenges-page">

      <!-- Challenges Toolbar -->
      <div class="chal-toolbar">
        <!-- Left: Title + Solved Count -->
        <div class="chal-toolbar-title">
          <span class="chal-title-big">🎯 Hacking Challenges</span>
          <span class="chal-solved-count">${solved} / ${challenges.length} solved</span>
        </div>

        <!-- Right: Filter Pills + Search -->
        <div class="chal-toolbar-right">
          <!-- Filter Pills (clickable stat badges) -->
          <div class="chal-filter-pills" id="chal-filter-pills">
            <button class="chal-pill active" data-diff="All"   onclick="filterChallenges('All', this)">All <span class="pill-count">${challenges.length}</span></button>
            <button class="chal-pill easy"   data-diff="Easy"  onclick="filterChallenges('Easy', this)">Easy <span class="pill-count">${easyCnt}</span></button>
            <button class="chal-pill medium" data-diff="Medium" onclick="filterChallenges('Medium', this)">Medium <span class="pill-count">${medCnt}</span></button>
            <button class="chal-pill hard"   data-diff="Hard"  onclick="filterChallenges('Hard', this)">Hard <span class="pill-count">${hardCnt}</span></button>
          </div>

          <!-- Search Input -->
          <div class="chal-search-wrap">
            <i class="fas fa-search chal-search-icon"></i>
            <input
              id="chal-search-input"
              class="chal-search-input"
              type="text"
              placeholder="Search challenges..."
              oninput="filterChallenges(window._chalActiveDiff || 'All', null)"
            />
          </div>
        </div>
      </div>

      <!-- Challenge Cards Grid -->
      <div class="challenges-grid" id="challenges-grid">
        ${challenges.length > 0
      ? challenges.map(c => renderChallengeCard(c)).join('')
      : `<p class="dim-text">No challenges found.</p>`}
      </div>

    </div>
  `;

  // Track active difficulty filter globally
  window._chalActiveDiff = 'All';
}

function filterChallenges(difficulty, btn) {
  // Update active pill state
  if (btn) {
    const pills = document.querySelectorAll('#chal-filter-pills .chal-pill');
    pills.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    window._chalActiveDiff = difficulty;
  }

  const grid = document.getElementById('challenges-grid');
  if (!grid) return;

  const searchVal = (document.getElementById('chal-search-input')?.value || '').toLowerCase().trim();
  const activeDiff = window._chalActiveDiff || 'All';

  let filtered = _currentChallenges;

  // Apply difficulty filter
  if (activeDiff !== 'All') {
    filtered = filtered.filter(c =>
      (c.difficulty || '').toLowerCase() === activeDiff.toLowerCase()
    );
  }

  // Apply search filter
  if (searchVal) {
    filtered = filtered.filter(c =>
      (c.title || '').toLowerCase().includes(searchVal) ||
      (c.description || '').toLowerCase().includes(searchVal) ||
      (c.category || '').toLowerCase().includes(searchVal)
    );
  }

  // Re-render grid
  if (filtered.length > 0) {
    grid.innerHTML = filtered.map(renderChallengeCard).join('');
  } else {
    grid.innerHTML = `<p class="dim-text">No challenges match your search.</p>`;
  }
}

// Keep old name for backwards compat
function filterChallengesByDifficulty(difficulty, btn) { filterChallenges(difficulty, btn); }

function renderChallengeCard(c) {
  const solved = c.status === "solved";
  const diffClass = c.difficulty ? c.difficulty.toLowerCase() : 'easy';
  const solvesCount = c.solves || Math.floor(Math.random() * 200) + 50;
  const isSimLab = c.is_sim_lab === true;

  return `
    <div class="chal-card ${solved ? 'solved-card' : ''}" onclick="openChallenge('${c.id}', event)" data-sim-type="${c.sim_type || ''}" data-is-sim="${isSimLab}">
      
      <div class="chal-card-header">
        <span class="diff-badge ${diffClass}">${c.difficulty}</span>
        ${isSimLab ? '<span class="lab-badge"><i class="fab fa-docker"></i> Lab</span>' : ''}
        ${solved ? '<span class="solved-badge"><i class="fas fa-check-circle"></i> Completed</span>' : ''}
      </div>

      <h3 class="chal-title">${c.title}</h3>
      <p class="chal-desc">${c.description}</p>

      <div class="chal-footer">
        <div class="chal-metadata">
          <span class="chal-pts-badge">${c.points} PTS</span>
          <span class="chal-cat-badge">${c.category}</span>
        </div>
        <div class="chal-solves-text">${solvesCount} solves</div>
      </div>
      
    </div>
  `;
}

// Track active sim lab containers: { challengeId: { containerId, url } }
const _activeSimLabs = {};

// Open Submission Modal (handles both regular challenges and Sim Labs)
function openChallenge(id, event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }

  // Find challenge data to check if it's a sim lab
  const chal = _currentChallenges.find(c => String(c.id) === String(id));
  const isSimLab = chal && chal.is_sim_lab;
  const simType = chal ? chal.sim_type : null;

  // Remove old modal if exists
  const old = document.getElementById('chal-modal-overlay');
  if (old) old.remove();

  const isActive = !!_activeSimLabs[id];
  const labInfo = _activeSimLabs[id] || {};

  if (isSimLab) {
    // === SIM LAB MODAL ===
    document.body.insertAdjacentHTML('beforeend', `
      <div id="chal-modal-overlay" class="chal-modal-overlay">
        <div class="chal-modal-box" style="max-width:560px;">
          <div class="chal-modal-header">
            <h3><i class="fab fa-docker" style="color:#a78bfa;margin-right:.4rem;"></i>${chal.title}</h3>
            <span onclick="closeChallengeModal()" class="close-modal">×</span>
          </div>
          <div class="chal-modal-body">
            <p class="modal-desc" style="margin-bottom:1rem;">${chal.description}</p>

            ${chal.status === 'solved' ? `
              <div style="background:#1e1b4b;border:1px solid #3730a3;color:#818cf8;padding:.75rem;border-radius:8px;font-size:.8rem;margin-bottom:1rem;display:flex;align-items:center;gap:.6rem;">
                <i class="fas fa-info-circle"></i>
                <span>You have completed this challenge. You can retry it, but no additional points will be awarded.</span>
              </div>
            ` : ''}

            <div id="sim-status-area">
              ${isActive ? `
                <div style="background:#0d1b0d;border:1px solid #22c55e;border-radius:8px;padding:1rem;margin-bottom:1rem;">
                  <div style="font-size:.8rem;color:#4ade80;margin-bottom:.5rem;">✅ Lab is running</div>
                  <a href="${labInfo.url}" target="_blank" 
                     style="display:inline-flex;align-items:center;gap:.4rem;background:#7c3aed;color:#fff;
                            padding:.5rem 1rem;border-radius:6px;font-size:.85rem;text-decoration:none;">
                    <i class="fas fa-external-link-alt"></i> Open Lab
                  </a>
                  <button onclick="stopSimLab('${id}')" style="margin-left:.5rem;background:#450a0a;color:#f87171;
                          border:1px solid #ef4444;padding:.5rem 1rem;border-radius:6px;font-size:.85rem;cursor:pointer;">
                    <i class="fas fa-stop"></i> Stop Lab
                  </button>
                </div>
              ` : `
                <button id="launch-lab-btn" onclick="launchSimLab('${id}', '${simType}')" 
                        style="width:100%;padding:.75rem;background:#7c3aed;border:none;border-radius:8px;
                               color:#fff;font-size:1rem;font-weight:600;cursor:pointer;margin-bottom:1rem;
                               display:flex;align-items:center;justify-content:center;gap:.5rem;">
                  <i class="fab fa-docker"></i> Launch Lab Container
                </button>
              `}
            </div>

            <div style="border-top:1px solid #334155;padding-top:1rem;margin-top:.5rem;">
              <p style="font-size:.82rem;color:#64748b;margin-bottom:.6rem;">Submit the flag you found in the lab:</p>
              <input id="flag-input" class="modal-input" placeholder="EHSP{...}" autocomplete="off" />
              <button class="modal-submit-btn" onclick="submitFlag('${id}')" style="margin-top:.5rem;">Submit Flag</button>
            </div>
          </div>
        </div>
      </div>
    `);
  } else {
    // === REGULAR CHALLENGE MODAL ===
    document.body.insertAdjacentHTML('beforeend', `
      <div id="chal-modal-overlay" class="chal-modal-overlay">
        <div class="chal-modal-box">
          <div class="chal-modal-header">
            <h3>${chal ? chal.title : 'Submit Flag'}</h3>
            <span onclick="closeChallengeModal()" class="close-modal">×</span>
          </div>
          <div class="chal-modal-body">
            ${chal && chal.status === 'solved' ? `
              <div style="background:#1e1b4b;border:1px solid #3730a3;color:#818cf8;padding:.75rem;border-radius:8px;font-size:.8rem;margin-bottom:1rem;display:flex;align-items:center;gap:.6rem;">
                <i class="fas fa-info-circle"></i>
                <span>You have completed this challenge. Retrying will not add points.</span>
              </div>
            ` : ''}
            <p class="modal-desc">Enter the flag you found to complete this challenge.</p>
            <input id="flag-input" class="modal-input" placeholder="FLAG{...}" autocomplete="off" />
            <button class="modal-submit-btn">Submit Flag</button>
          </div>
        </div>
      </div>
    `);

    const overlay = document.getElementById('chal-modal-overlay');
    const btn = overlay.querySelector('.modal-submit-btn');
    const input = overlay.querySelector('#flag-input');
    btn.onclick = (e) => { e.preventDefault(); submitFlag(id); };
    input.value = '';
    setTimeout(() => {
      input.focus();
      input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); submitFlag(id); } };
    }, 50);
  }

  document.getElementById('chal-modal-overlay').style.display = 'flex';
}

// Explicitly expose to window for dynamic HTML onclick handlers
window.launchSimLab = async function (challengeId, simType) {
  console.log("🚀 launchSimLab triggered:", { challengeId, simType });
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    alert("Error: User session not found. Please log in again.");
    return;
  }
  const user = JSON.parse(userStr);
  const btn = document.getElementById('launch-lab-btn');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Spinning up...';
    btn.style.opacity = '0.7';
  }

  try {
    const payload = { user_id: parseInt(user.id), sim_type: simType };
    console.log("POSTing to simulation start:", payload);

    const res = await fetch(`${API_BASE}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Launch failed" }));
      throw new Error(errData.detail || "Server error");
    }

    const data = await res.json();
    console.log("Lab started successfully:", data);

    _activeSimLabs[challengeId] = { containerId: data.container_id, url: data.url };

    const statusArea = document.getElementById('sim-status-area');
    if (statusArea) {
      statusArea.innerHTML = `
        <div class="lab-success-box" style="background:#0d1b0d;border:1px solid #22c55e;border-radius:10px;padding:1.25rem;margin-bottom:1.25rem;">
          <div style="display:flex;align-items:center;gap:.6rem;color:#4ade80;font-weight:700;margin-bottom:1rem;font-size:.95rem;">
             <span class="status-pulse"></span> ✅ Lab is Ready!
          </div>
          <div style="display:flex;flex-direction:column;gap:.75rem;">
            <a href="${data.url}" target="_blank" class="lab-link-btn"
               style="display:flex;align-items:center;justify-content:center;gap:.6rem;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;
                      padding:.75rem;border-radius:8px;font-weight:700;text-decoration:none;box-shadow:0 4px 12px rgba(124,58,237,0.3);transition:transform 0.2s;">
              <i class="fas fa-external-link-alt"></i> Open Lab Workspace
            </a>
            <button onclick="stopSimLab('${challengeId}')" 
                    style="background:transparent;color:#f87171;border:1px solid #7f1d1d;padding:.65rem;border-radius:8px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;">
              <i class="fas fa-power-off"></i> Stop & Destroy Lab
            </button>
          </div>
          <p style="font-size:.72rem;color:#64748b;margin-top:1rem;text-align:center;">
             <i class="far fa-clock"></i> Auto-cleanup in 15 minutes.
          </p>
        </div>
      `;
    }
  } catch (err) {
    console.error("Launch error:", err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fab fa-docker"></i> Launch Lab Container';
      btn.style.opacity = '1';
    }
    alert('Failed to launch simulation lab:\n' + err.message + '\n\nPlease ensure Docker Desktop is running.');
  }
};

window.stopSimLab = async function (challengeId) {
  const lab = _activeSimLabs[challengeId];
  if (!lab) return;

  try {
    const res = await fetch(`${API_BASE}/simulation/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ container_id: lab.containerId })
    });
    if (res.ok) {
      delete _activeSimLabs[challengeId];
      // Close modal or update UI
      closeChallengeModal();
    }
  } catch (err) {
    console.error("Stop error:", err);
  }
};

function closeChallengeModal() {
  const overlay = document.getElementById('chal-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function submitFlag(id) {
  const user = JSON.parse(localStorage.getItem("user"));
  const flagInput = document.getElementById("flag-input");
  const flag = flagInput.value.trim();

  if (!flag) return;

  try {
    const res = await fetch(`${API_BASE}/user/challenges/submit/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "user-id": user.id },
      body: JSON.stringify({ flag })
    });

    if (!res.ok) {
      if (res.status === 422) {
        console.error("Validation error: Backend expects a different body format.");
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Submission failed");
    }

    const result = await res.json();
    if (result.correct) {
      if (result.already_solved) {
        alert("🎉 Correct! (Retry: No points added)");
      } else {
        alert("🎉 Correct Flag! Points Added.");
      }
      closeChallengeModal();
      loadChallenges();
    } else {
      alert("❌ Wrong Flag. Try again.");
      flagInput.style.borderColor = "#ff3333";
    }
  } catch (e) {
    console.error("Submission Error:", e);
    alert("Submission Error: " + e.message);
  }
}

// =========================================
// DASHBOARD INITIALIZATION & THEME
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  // Apply user's theme color
  applyUserTheme();

  const hash = window.location.hash;
  if (hash === "#profile") {
    loadProfile();
  } else if (hash === "#challenges") {
    loadChallenges();
  } else if (hash === "#tutorials") {
    initTutorials();
  } else if (hash === "#leaderboard") {
    loadLeaderboard();
  } else if (hash === "#daily") {
    loadDailyChallenge();
  } else {
    loadDashboard();
  }
});

/* =========================================
   SEARCH CHALLENGES LOGIC
   ========================================= */

let allChallenges = [];

async function loadSearchChallenges() {
  if (typeof setActiveByPage === 'function') setActiveByPage("search-challenges");
  document.getElementById("page-title").innerText = "Search Challenges";

  const user = JSON.parse(localStorage.getItem("user"));
  const view = document.getElementById("view");

  // 1. Render Initial Layout
  view.innerHTML = `
    <div class="search-page-layout">
      
      <div class="search-header-row">
        <div class="search-bar-neon">
            <i class="fas fa-search"></i>
            <input 
                type="text" 
                id="challenge-search" 
                placeholder="Search challenges..." 
                oninput="filterSearchChallenges(this.value)"
                autofocus
            >
        </div>
      </div>

      <p class="result-count-text" id="result-count">Loading challenges...</p>

      <div class="challenges-grid" id="search-results"></div>
    </div>
  `;

  try {
    const res = await fetch("http://127.0.0.1:8000/user/challenges/", {
      headers: { "user-id": user.id }
    });
    if (res.ok) {
      allChallenges = await res.json();
      renderSearchResults(allChallenges);
    } else {
      document.getElementById("search-results").innerHTML = `<p class="error-text">Failed to fetch challenges</p>`;
    }
  } catch (e) {
    document.getElementById("search-results").innerHTML = `<p class="error-text">Connection error</p>`;
  }
}

function renderSearchResults(challenges) {
  const container = document.getElementById("search-results");
  const countEl = document.getElementById("result-count");

  countEl.innerText = `${challenges.length} challenges found`;

  if (challenges.length === 0) {
    container.innerHTML = `<p class="dim-text">No challenges found matching your query.</p>`;
    return;
  }

  container.innerHTML = challenges.map(renderSearchCard).join("");
}

function renderSearchCard(c) {
  const solved = c.status === "solved";
  const diffClass = c.difficulty ? c.difficulty.toLowerCase() : 'easy';

  // Reuse the exact card styling from the main challenges page for consistency
  return `
    <div class="chal-card ${solved ? 'solved-card' : ''}" onclick="openChallenge('${c.id}', event)">
      
      <div class="chal-card-header">
        <span class="diff-badge ${diffClass}">${c.difficulty}</span>
        ${solved ? '<i class="far fa-check-circle solved-icon"></i>' : ''}
      </div>

      <h3 class="chal-title">${c.title}</h3>
      <p class="chal-desc">${c.description}</p>

      <div class="chal-footer">
        <span class="chal-pts">${c.points} pts</span>
        <span class="chal-cat">${c.category}</span>
      </div>
      
    </div>
  `;
}

function filterSearchChallenges(query) {
  const q = query.toLowerCase();
  const filtered = allChallenges.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q) ||
    (c.difficulty && c.difficulty.toLowerCase().includes(q))
  );
  renderSearchResults(filtered);
}



// ✅ LOAD PROGRESS GRAPH (UI Construction)
async function loadProgressGraph() {
  if (typeof setActiveByPage === 'function') setActiveByPage("progress-graph");
  document.getElementById("page-title").innerText = "Progress Graph";

  const view = document.getElementById("view");
  const user = JSON.parse(localStorage.getItem("user"));

  view.innerHTML = `<p class="loading-text">Loading progress...</p>`;

  try {
    const res = await fetch("http://127.0.0.1:8000/user/progress-graph", {
      headers: { "user-id": user.id }
    });

    const api = await res.json();

    const data = {
      stats: api.stats || {
        total_challenges: 0,
        total_points: 0,
        success_rate: 0,
        current_streak: 0
      },
      points_over_time: api.points_over_time || [],
      weekly_activity: api.weekly_activity || [],
      category_progress: api.category_progress || []
    };


    view.innerHTML = `
      <div class="progress-grid">

        <div class="stats-row">
          ${renderStat("Total Challenges", data.stats.total_challenges)}
          ${renderStat("Total Points", data.stats.total_points)}
          ${renderStat("Success Rate", data.stats.success_rate + "%")}
          ${renderStat("Current Streak", data.stats.current_streak + " days")}
        </div>

        <div class="card">
          <h3>Points Over Time</h3>
          <canvas id="pointsChart"></canvas>
        </div>

        <div class="card">
          <h3>Weekly Activity</h3>
          <canvas id="weeklyChart"></canvas>
        </div>

        <div class="card">
          <h3>Progress by Category</h3>
          <div class="skills-list">
            ${data.category_progress.map(c =>
      renderSkillBar(c.category, c.value, "#00ffbf")
    ).join("")}
          </div>
        </div>

      </div>
    `;

    if (typeof Chart !== "undefined") {
      renderPointsChart(data.points_over_time);
      renderWeeklyChart(data.weekly_activity);
    }


  } catch (err) {
    console.error(err);
    view.innerHTML = `<p class="error-text">Failed to load progress graph</p>`;
  }
}

function renderPointsChart(data = []) {
  if (!data.length) return;

  const ctx = document.getElementById("pointsChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        data: data.map(d => d.points),
        borderColor: "#00ffbf",
        tension: 0.4,
        fill: false
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}


function renderWeeklyChart(data = []) {
  if (!data.length) return;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const counts = Array(7).fill(0);

  data.forEach(d => {
    if (d.day >= 0 && d.day <= 6) counts[d.day] = d.count;
  });

  const ctx = document.getElementById("weeklyChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: days,
      datasets: [{
        data: counts,
        backgroundColor: "#00ffbf"
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

// Helper function to get avatar emoji
function getAvatarEmoji(avatarId) {
  const avatarMap = {
    'hooded': '🥷',
    'fawkes': '🎭',
    'matrix': '💻',
    'robot': '🤖',
    'terminal': '⌨️',
    'skull': '💀',
    'default': '👤'
  };
  return avatarMap[avatarId] || '👤';
}

// =========================================
// THEME APPLICATION
// =========================================

function applyUserTheme() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.theme_color) {
    applyThemeColor(user.theme_color);
  }
}

function applyThemeColor(color) {
  // Apply theme color to CSS custom properties
  document.documentElement.style.setProperty('--primary-cyan', color);
  document.documentElement.style.setProperty('--secondary-blue', color);

  // Store in localStorage for persistence
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    user.theme_color = color;
    localStorage.setItem("user", JSON.stringify(user));
  }

  console.log('🎨 Theme applied:', color);
}



function renderSimLabAction(cid) {
  return `
    <div style="display:flex;flex-direction:column;gap:.75rem;">
      <button onclick="launchSimLab(${cid})" id="launch-btn-${cid}"
        style="width:100%;padding:.75rem;background:linear-gradient(135deg,#0ea5e9,#6366f1);
               border:none;border-radius:8px;color:#fff;font-weight:700;font-size:.9rem;
               cursor:pointer;letter-spacing:.5px;transition:opacity .2s;">
        🚀 Launch Lab
      </button>
      <div id="lab-frame-${cid}" style="display:none;"></div>
      <div id="flag-submit-${cid}" style="display:none;">
        ${renderFlagInputHtml(cid)}
      </div>
    </div>`;
}

function renderFlagAction(cid) {
  return renderFlagInputHtml(cid);
}

function renderFlagInputHtml(cid) {
  return `
    <div style="display:flex;gap:.5rem;" onclick="event.stopPropagation()">
      <input id="flag-input-${cid}" type="text" placeholder="Enter flag: EHSP{...}"
        style="flex:1;padding:.65rem .9rem;background:#0f172a;border:1px solid #334155;
               border-radius:6px;color:#e2e8f0;font-size:.85rem;font-family:monospace;outline:none;"
        onkeydown="if(event.key==='Enter'){event.stopPropagation();event.preventDefault();submitChallenge(${cid});}"
        onfocus="this.style.borderColor='#38bdf8'" onblur="this.style.borderColor='#334155'">
      <button type="button" onclick="event.stopPropagation();submitChallenge(${cid})"
        style="padding:.65rem 1.1rem;background:#0ea5e9;border:none;border-radius:6px;
               color:#fff;font-weight:700;cursor:pointer;font-size:.85rem;">
        Submit
      </button>
    </div>
    <div id="flag-result-${cid}" style="margin-top:.5rem;display:none;"></div>`;
}

async function launchSimLab(challengeId) {
  const u = JSON.parse(localStorage.getItem("user"));
  const btn = document.getElementById(`launch-btn-${challengeId}`);
  const frameArea = document.getElementById(`lab-frame-${challengeId}`);
  const flagArea = document.getElementById(`flag-submit-${challengeId}`);

  if (!btn) return;

  btn.disabled = true;
  btn.textContent = "⏳ Spinning up container...";
  btn.style.opacity = "0.7";

  try {
    const res = await fetch("http://127.0.0.1:8000/simulation/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: u.id, sim_type: "sqli" })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to start container");
    }

    const data = await res.json();
    _activeSimulations[challengeId] = data;

    // Wait 2 seconds for the container to start accepting connections
    await new Promise(r => setTimeout(r, 2000));

    btn.textContent = "🔄 Restart Lab";
    btn.disabled = false;
    btn.style.opacity = "1";

    // Open the lab in a new browser tab
    window.open(data.url, "_blank");

    // Show a compact status card below the button
    frameArea.style.display = "block";
    frameArea.innerHTML = `
      <div style="padding:.85rem 1rem;background:#0f172a;border:1px solid #334155;border-radius:8px;
                  display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:.5rem;">
          <span style="width:8px;height:8px;border-radius:50%;background:#4ade80;display:inline-block;
                       box-shadow:0 0 6px #4ade80;animation:pulse 1.5s infinite;"></span>
          <span style="font-size:.8rem;color:#94a3b8;font-family:monospace;">Lab running at ${data.url}</span>
        </div>
        <div style="display:flex;gap:.5rem;">
          <button onclick="window.open('${data.url}','_blank')"
            style="padding:.35rem .75rem;background:#334155;border:none;border-radius:5px;color:#94a3b8;font-size:.75rem;cursor:pointer;">
            Reopen ↗
          </button>
          <button onclick="stopSimLab(${challengeId})"
            style="padding:.35rem .75rem;background:#450a0a;border:none;border-radius:5px;color:#f87171;font-size:.75rem;cursor:pointer;">
            Stop Lab
          </button>
        </div>
      </div>
      <p style="font-size:.72rem;color:#475569;margin:.4rem 0 0;text-align:center;">
        ⏱ Auto-stops after 15 min · Find the flag, then submit it below
      </p>`;

    // Show flag input below
    flagArea.style.display = "block";

  } catch (err) {
    btn.disabled = false;
    btn.textContent = "🚀 Launch Lab";
    btn.style.opacity = "1";
    console.error(err);
    frameArea.style.display = "block";
    frameArea.innerHTML = `
      <div style="padding:1rem;background:#450a0a22;border:1px solid #7f1d1d;border-radius:8px;color:#f87171;font-size:.85rem;">
        ❌ ${err.message}<br>
        <small style="color:#64748b;">Make sure Docker Desktop is running.</small>
      </div>`;
  }
}

async function stopSimLab(challengeId) {
  const sim = _activeSimulations[challengeId];
  if (!sim) return;

  await fetch("http://127.0.0.1:8000/simulation/stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ container_id: sim.container_id })
  }).catch(() => { });

  delete _activeSimulations[challengeId];

  const frameArea = document.getElementById(`lab-frame-${challengeId}`);
  if (frameArea) {
    frameArea.innerHTML = `
      <div style="padding:.75rem;background:#1e293b;border-radius:8px;color:#64748b;text-align:center;font-size:.85rem;">
        🛑 Lab stopped. Click Launch Lab to restart.
      </div>`;
  }
}

async function submitChallenge(challengeId) {
  const u = JSON.parse(localStorage.getItem("user"));
  const input = document.getElementById(`flag-input-${challengeId}`);
  const resultDiv = document.getElementById(`flag-result-${challengeId}`);

  if (!input || !resultDiv) return;

  const flag = input.value.trim();
  if (!flag) {
    resultDiv.style.display = "block";
    resultDiv.innerHTML = `<span style="color:#f59e0b;font-size:.82rem;">⚠️ Please enter a flag first</span>`;
    return;
  }

  resultDiv.style.display = "block";
  resultDiv.innerHTML = `<span style="color:#94a3b8;font-size:.82rem;">⏳ Checking flag...</span>`;

  try {
    // Ensure challenge is started
    await fetch(`http://127.0.0.1:8000/user/challenges/start/${challengeId}`, {
      method: "POST",
      headers: { "user-id": u.id.toString() }
    }).catch(() => { });

    const res = await fetch(
      `http://127.0.0.1:8000/user/challenges/submit/${challengeId}?flag=${encodeURIComponent(flag)}`,
      { method: "POST", headers: { "user-id": u.id.toString() } }
    );

    const data = await res.json();

    if (data.correct) {
      const pts = data.points_earned || 0;

      resultDiv.innerHTML = `
        <div style="padding:.75rem;background:#14532d33;border:1px solid #22c55e55;border-radius:8px;
                    color:#4ade80;font-size:.85rem;font-weight:600;text-align:center;">
          🎉 Correct Flag! +${pts} pts awarded!
        </div>`;

      // 1️⃣ Show floating "+pts" toast
      showPointsToast(pts);

      // 🎁 Check for Daily Challenge Bonus
      if (data.daily_challenge && data.daily_challenge.bonus_earned) {
        const bonus = data.daily_challenge.bonus_points || 50;
        setTimeout(() => showPointsToast(bonus, "🔥 Daily Bonus"), 800);
      }

      // 2️⃣ Update nav level display immediately
      if (data.total_points !== undefined) {
        refreshNavPoints(data.total_points);
      }

      // Stop any running lab container
      if (_activeSimulations[challengeId]) {
        stopSimLab(challengeId);
      }

      // 3️⃣ Update the card to Solved + Retry state after short delay
      setTimeout(() => {
        const card = document.getElementById(`challenge-card-${challengeId}`);
        if (card) card.style.borderColor = '#22c55e55';

        const actionArea = document.getElementById(`action-${challengeId}`);
        if (actionArea) {
          const isSimLab = actionArea.querySelector(`#launch-btn-${challengeId}`) !== null
            || document.getElementById(`lab-frame-${challengeId}`) !== null;
          actionArea.innerHTML = renderSolvedWithRetry(challengeId, pts, isSimLab);
        }
      }, 1200);

    } else {
      resultDiv.innerHTML = `
        <div style="padding:.6rem;background:#450a0a22;border:1px solid #7f1d1d;border-radius:6px;
                    color:#f87171;font-size:.82rem;">
          ❌ Wrong flag. Keep trying!
        </div>`;
      input.value = "";
      input.focus();
    }

  } catch (err) {
    resultDiv.innerHTML = `<span style="color:#f87171;font-size:.82rem;">Error: ${err.message}</span>`;
  }
}

// ── Renders the solved badge + retry option ──────────────────────
function renderSolvedWithRetry(challengeId, pts, isSimLab) {
  return `
    <div style="display:flex;flex-direction:column;gap:.6rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;
                  padding:.65rem .9rem;background:#14532d22;border:1px solid #22c55e44;border-radius:8px;">
        <span style="color:#4ade80;font-size:.85rem;font-weight:700;">✅ Solved · ${pts} pts</span>
        <button type="button"
          onclick="event.stopPropagation();retryChallenge(${challengeId},${isSimLab})"
          style="padding:.3rem .75rem;background:#1e293b;border:1px solid #334155;border-radius:5px;
                 color:#94a3b8;font-size:.75rem;cursor:pointer;transition:border-color .2s;"
          onmouseover="this.style.borderColor='#38bdf8';this.style.color='#38bdf8'"
          onmouseout="this.style.borderColor='#334155';this.style.color='#94a3b8'">
          🔁 Retry
        </button>
      </div>
      <div style="font-size:.72rem;color:#64748b;text-align:center;padding:0 .5rem;">
        💡 Points are only awarded once. Practice session only.
      </div>
    </div>`;
}

// ── Retry: restore the lab / flag input for a solved challenge ───
function retryChallenge(challengeId, isSimLab) {
  const actionArea = document.getElementById(`action-${challengeId}`);
  const card = document.getElementById(`challenge-card-${challengeId}`);
  const dailyCard = document.querySelector('.daily-challenge-main-card');

  if (!actionArea) return;

  // Restore original border
  if (card) card.style.borderColor = '#334155';
  if (dailyCard) dailyCard.style.borderColor = 'var(--daily-border)';

  // Re-render the appropriate input
  // Check if we are in daily challenge view
  if (document.querySelector('.daily-challenge-view')) {
    actionArea.innerHTML = isSimLab ? `
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
           <button class="btn-start-daily-challenge" id="launch-btn-${challengeId}" onclick="launchSimLab(${challengeId})">
             <i class="fas fa-rocket"></i> Launch Simulation Lab
           </button>
           <div id="lab-frame-${challengeId}" style="display:none;"></div>
           <div id="flag-submit-${challengeId}" style="display:none;">
             ${renderFlagInputDaily(challengeId)}
           </div>
        </div>
      ` : renderFlagInputDaily(challengeId);
  } else {
    actionArea.innerHTML = isSimLab ? renderSimLabAction(challengeId) : renderFlagAction(challengeId);
  }
}

// ── Show a floating "+N pts" toast notification ──────────────────
function showPointsToast(pts) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position:fixed;bottom:2rem;right:2rem;z-index:9999;
    padding:.75rem 1.25rem;background:#14532d;border:1px solid #22c55e;
    border-radius:10px;color:#4ade80;font-weight:700;font-size:1rem;
    box-shadow:0 8px 30px rgba(34,197,94,.3);
    animation:slideInRight .3s ease,fadeOut .4s 2s forwards;
    pointer-events:none;`;
  toast.textContent = `+${pts} pts 🎉`;
  document.body.appendChild(toast);

  // Inject keyframes once
  if (!document.getElementById("toast-style")) {
    const s = document.createElement("style");
    s.id = "toast-style";
    s.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(80px); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to   { opacity: 0; transform: translateY(12px); }
      }`;
    document.head.appendChild(s);
  }

  setTimeout(() => toast.remove(), 2500);
}

// ── Refresh the nav-level display from new total points ──────────
function refreshNavPoints(totalPoints) {
  const level = Math.max(1, Math.floor(totalPoints / 100) + 1);
  const el = document.getElementById("nav-level");
  if (el) {
    el.textContent = `Level ${level} · ${totalPoints} pts`;
    el.style.animation = "none";
    // Quick flash
    el.style.color = "#4ade80";
    setTimeout(() => { el.style.color = ""; }, 1500);
  }
  // Update localStorage so other parts of the app stay in sync
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    if (u) {
      u.points = totalPoints;
      u.level = level;
      localStorage.setItem("user", JSON.stringify(u));
    }
  } catch (_) { }
}

function loadAttemptHistory() {
  const view = document.getElementById("view");
  const u = JSON.parse(localStorage.getItem("user"));
  setActiveByPage("attempt-history");
  document.getElementById("page-title").innerText = "Attempt History";

  view.innerHTML = `<div class="loading-container"><div class="spinner"></div><p>Loading history...</p></div>`;

  fetch(`http://127.0.0.1:8000/user/attempts/${u.id}`)
    .then(r => r.json())
    .then(data => {
      if (!data.length) {
        view.innerHTML = `<div style="text-align:center;padding:3rem;color:#64748b;">
          <i class="fas fa-history" style="font-size:3rem;margin-bottom:1rem;"></i>
          <p>No attempts yet. Try a challenge!</p></div>`;
        return;
      }
      view.innerHTML = `
        <div style="padding:2rem;">
          <h2 style="margin-bottom:1.5rem;">Attempt History</h2>
          <div style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
            <table style="width:100%;border-collapse:collapse;font-size:.875rem;">
              <thead>
                <tr style="background:#0f172a;">
                  <th style="padding:.9rem 1rem;text-align:left;color:#64748b;font-weight:600;">Challenge</th>
                  <th style="padding:.9rem 1rem;text-align:left;color:#64748b;font-weight:600;">Flag Submitted</th>
                  <th style="padding:.9rem 1rem;text-align:center;color:#64748b;font-weight:600;">Result</th>
                  <th style="padding:.9rem 1rem;text-align:right;color:#64748b;font-weight:600;">Points</th>
                  <th style="padding:.9rem 1rem;text-align:left;color:#64748b;font-weight:600;">Time</th>
                </tr>
              </thead>
              <tbody>
                ${data.map((a, i) => `
                  <tr style="border-top:1px solid #334155;${i % 2 === 1 ? 'background:#0f172a10;' : ''}">
                    <td style="padding:.75rem 1rem;color:#e2e8f0;">${a.title}</td>
                    <td style="padding:.75rem 1rem;font-family:monospace;color:#94a3b8;font-size:.8rem;">${a.submitted_flag}</td>
                    <td style="padding:.75rem 1rem;text-align:center;">
                      ${a.is_correct
          ? '<span style="color:#4ade80;font-weight:700;">✓ Correct</span>'
          : '<span style="color:#f87171;">✗ Wrong</span>'}
                    </td>
                    <td style="padding:.75rem 1rem;text-align:right;color:${a.is_correct ? '#4ade80' : '#64748b'};">
                      ${a.is_correct ? '+' + a.points : '—'}
                    </td>
                    <td style="padding:.75rem 1rem;color:#64748b;font-size:.8rem;">
                      ${a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '—'}
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    })
    .catch(err => {
      view.innerHTML = `<div class="error-state"><p>Failed to load history: ${err.message}</p></div>`;
    });
}


// ── Achievements Page ─────────────────────────────────────────────
async function loadAchievements() {
  const view = document.getElementById("view");
  const u = JSON.parse(localStorage.getItem("user"));
  setActiveByPage("achievements");
  document.getElementById("page-title").innerText = "Achievements";

  view.innerHTML = `<div class="loading-container"><div class="spinner"></div><p>Loading achievements...</p></div>`;

  try {
    const [achRes, statsRes] = await Promise.all([
      fetch(`http://127.0.0.1:8000/user/achievements/${u.id}`),
      fetch(`http://127.0.0.1:8000/user/dashboard/stats/${u.id}`)
    ]);

    const achievements = await achRes.json();
    const stats = await statsRes.json();

    const unlocked = achievements.filter(a => a.unlocked).length;
    const totalPoints = stats.points || 0;
    const completionPct = stats.completion_percentage || 0;

    view.innerHTML = `
      <div style="padding:2rem;max-width:900px;">
        <h2 style="margin-bottom:1.5rem;">🏆 Achievements</h2>

        <!-- Stats row -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem;">
          <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:1.25rem;text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:#f59e0b;">🏅 ${unlocked} / ${achievements.length}</div>
            <div style="font-size:.8rem;color:#64748b;margin-top:.25rem;">Achievements Unlocked</div>
          </div>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:1.25rem;text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:#f43f5e;">⭐ ${totalPoints}</div>
            <div style="font-size:.8rem;color:#64748b;margin-top:.25rem;">Total Points Earned</div>
          </div>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:1.25rem;text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:#06b6d4;">📊 ${completionPct}%</div>
            <div style="font-size:.8rem;color:#64748b;margin-top:.25rem;">Completion Rate</div>
          </div>
        </div>

        <!-- Achievement cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;">
          ${achievements.map(a => `
            <div style="background:#1e293b;border:1px solid ${a.unlocked ? '#22c55e44' : '#334155'};
                        border-radius:10px;padding:1.25rem;position:relative;
                        opacity:${a.unlocked ? '1' : '0.65'};">
              ${!a.unlocked ? '<div style="position:absolute;top:.75rem;right:.75rem;font-size:.7rem;color:#64748b;background:#0f172a;padding:.2rem .5rem;border-radius:4px;">🔒 Locked</div>' : ''}
              <div style="font-size:2.5rem;margin-bottom:.75rem;">${a.icon || '🏆'}</div>
              <h4 style="color:${a.unlocked ? '#4ade80' : '#e2e8f0'};margin-bottom:.4rem;">${a.title}</h4>
              <p style="font-size:.82rem;color:#94a3b8;margin-bottom:.75rem;">${a.description}</p>
              <div style="background:#0f172a;border-radius:6px;height:6px;overflow:hidden;margin-bottom:.5rem;">
                <div style="background:${a.unlocked ? '#22c55e' : '#3b82f6'};height:100%;
                            width:${a.target > 0 ? Math.min(100, (a.progress / a.target) * 100) : 0}%;
                            transition:width .6s ease;"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:.75rem;color:#64748b;">
                <span>Progress: ${a.progress} / ${a.target}</span>
                <span style="color:#f59e0b;">+${a.points} pts</span>
              </div>
              ${a.unlocked ? `<div style="margin-top:.5rem;font-size:.72rem;color:#4ade80;">✅ Unlocked ${a.unlocked_at ? new Date(a.unlocked_at).toLocaleDateString() : ''}</div>` : ''}
            </div>`).join('')}
        </div>
      </div>`;

  } catch (err) {
    view.innerHTML = `<div class="error-state"><p>Failed to load achievements: ${err.message}</p></div>`;
  }
}

