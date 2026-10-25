/* =========================================
   DAILY CHALLENGE MODULE - NEW HIGH-TECH UI
   ========================================= */

let dailyChallengeTimer = null;

// ✅ LOAD DAILY CHALLENGE
async function loadDailyChallenge() {
  if (typeof setActiveByPage === 'function') setActiveByPage('daily-challenge');

  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.innerText = "Daily Challenge";

  const view = document.getElementById("view");
  // Important: Use daily-challenge-view but keep dashboard-grid behavior for scrolling if needed
  // Actually, our CSS fix for .daily-challenge-view with overflow-y: auto should be enough.
  view.className = "daily-challenge-view";

  // Initial Loading State
  view.innerHTML = `
        <div class="daily-loading">
            <i class="fas fa-spinner"></i>
            <p>Scanning for today's objective...</p>
        </div>
    `;

  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch("http://127.0.0.1:8000/daily-challenge/today", {
      headers: { "user-id": user.id.toString() }
    });

    if (!res.ok) throw new Error("Connection lost to command center.");

    const data = await res.json();

    // Render the UI
    await renderDailyChallengeUI(data);

    // Start timer if applicable
    if (!data.completed && data.time_remaining) {
      const seconds = data.time_remaining.seconds || 0;
      startBonusTimer(seconds);
    }

  } catch (err) {
    console.error(err);
    view.innerHTML = `
            <div class="daily-challenge-container">
                <div class="daily-challenge-main-card" style="border-color: #f87171; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f87171; margin-bottom: 1rem;"></i>
                    <h3 style="color: #fff;">System Error</h3>
                    <p style="color: #94a3b8;">Unable to synchronize with the Daily Challenge server. ${err.message}</p>
                </div>
            </div>
        `;
  }
}

// ✅ RENDER UI
async function renderDailyChallengeUI(data) {
  const view = document.getElementById("view");

  const difficultyClass = (data.challenge.difficulty || 'Easy').toLowerCase();
  const isCompleted = data.completed || data.solved;
  const cid = data.challenge.id;

  // Check if it's a Simulation Lab (matching logic in user.js)
  const isSimLab = (data.challenge.category === "Web Hacking" && data.challenge.title.toLowerCase().includes("sql injection"));

  // Fetch ancillary data
  const topSolvers = await fetchTopSolvers();
  const stats = await fetchChallengeStats(cid);

  view.innerHTML = `
    <div class="daily-challenge-container">
      
      <div class="daily-challenge-header-section">
        <div class="daily-icon">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <div>
          <div class="daily-header-title">Daily Objective</div>
          <div class="daily-subtitle">Master today's scenario to secure bonus XP and status.</div>
        </div>
      </div>

      <div class="daily-challenge-main-card">
        
        <h2 class="challenge-main-title">Race Against Time: ${escapeHtml(data.challenge.title)}</h2>
        <p class="challenge-main-description">${escapeHtml(data.challenge.description)}</p>

        <div class="challenge-tags-row">
          <span class="tag-category">
            <i class="fas fa-terminal"></i> ${data.challenge.category || 'Information Security'}
          </span>
          <span class="tag-difficulty ${difficultyClass}">
            ${data.challenge.difficulty || 'Intermediate'}
          </span>
          <span class="tag-time">
            <i class="fas fa-bolt"></i> ${data.challenge.points || 100} + ${data.bonus_points || 50} bonus pts
          </span>
          
          ${!isCompleted ? `
            <div style="margin-left: auto; text-align: right;">
                <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase;">Bonus Timer</div>
                <div id="bonus-timer" style="font-family: 'Orbitron'; font-size: 1.5rem; color: #00f2ff;">
                    ${data.time_remaining.formatted || '00:00:00'}
                </div>
            </div>
          ` : `
            <span class="tag-time" style="margin-left: auto; background: rgba(74, 222, 128, 0.2); color: #4ade80; border: 1px solid #4ade80;">
              <i class="fas fa-check-double"></i> SECURED
            </span>
          `}
        </div>

        <div class="challenge-stats-grid">
          <div class="stat-item">
            <div class="stat-label">Total Attempts</div>
            <div class="stat-number">${data.stats.total_attempts}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Successful Solves</div>
            <div class="stat-number">${data.stats.completed_by}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Active Agents</div>
            <div class="stat-number">${data.stats.active_now}</div>
          </div>
        </div>

        <!-- ACTION AREA -->
        <div id="action-${cid}" class="daily-action-area">
          ${isCompleted ? `
            <div style="display:flex; flex-direction:column; gap:1rem; align-items:center; width:100%;">
                <button class="btn-start-daily-challenge btn-completed-challenge" style="width:100%;" 
                        onclick="retryChallenge(${cid}, ${isSimLab})">
                  <i class="fas fa-redo"></i> RETRY OPERATION
                </button>
                <div style="font-size:0.8rem; color:#64748b; font-family:monospace;">
                    💡 Objective secured in ${data.user_attempt ? data.user_attempt.completion_time : '??'}s. Practice session (0 XP).
                </div>
            </div>
          ` : (data.user_attempt && !data.user_attempt.is_completed) ? `
             <!-- Active Attempt State -->
             ${isSimLab ? `
                <div style="display:flex; flex-direction:column; gap:1.5rem;">
                   <button class="btn-start-daily-challenge" id="launch-btn-${cid}" onclick="launchSimLab(${cid})">
                     <i class="fas fa-rocket"></i> Launch Simulation Lab
                   </button>
                   <div id="lab-frame-${cid}" style="display:none;"></div>
                   <div id="flag-submit-${cid}" style="display:none;">
                     ${renderFlagInputDaily(cid)}
                   </div>
                </div>
             ` : `
                <div id="flag-submit-area-${cid}">
                  ${renderFlagInputDaily(cid)}
                </div>
             `}
          ` : isSimLab ? `
            <div style="display:flex; flex-direction:column; gap:1.5rem;">
               <button class="btn-start-daily-challenge" id="launch-btn-${cid}" onclick="startDailyAndLaunch(${cid})">
                 <i class="fas fa-rocket"></i> Launch Simulation Lab
               </button>
               <div id="lab-frame-${cid}" style="display:none;"></div>
               <div id="flag-submit-${cid}" style="display:none;" >
                 ${renderFlagInputDaily(cid)}
               </div>
            </div>
          ` : `
            <button class="btn-start-daily-challenge" id="start-btn-${cid}" onclick="startDailyAttempt(${cid})" style="margin-bottom:1.5rem;">
              <i class="fas fa-play"></i> Initiate Operation
            </button>
            <div id="flag-submit-area-${cid}" style="display:none;">
              ${renderFlagInputDaily(cid)}
            </div>
          `}
        </div>

      </div>

      <div class="top-solvers-section">
        <div class="top-solvers-header">
          <i class="fas fa-trophy"></i> Today's Top Operatives
        </div>
        <div class="solvers-list">
          ${renderTopSolvers(topSolvers)}
        </div>
      </div>

    </div>
    `;
}

function renderFlagInputDaily(cid) {
  return `
      <div style="display:flex; gap:1rem;">
        <input id="flag-input-${cid}" type="text" placeholder="Enter captured flag: EHSP{...}" 
               style="flex:1; padding:1.25rem; background:rgba(15,23,42,0.9); border:1px solid var(--daily-border); 
                      border-radius:12px; color:#fff; font-family:monospace; font-size:1rem; outline:none;"
               onkeydown="if(event.key==='Enter') submitChallenge(${cid})"
               onfocus="this.style.borderColor='var(--daily-cyan)'" onblur="this.style.borderColor='var(--daily-border)'">
        <button class="btn-start-daily-challenge" style="width:auto; padding:0 2.5rem;" onclick="submitChallenge(${cid})">
          Submit
        </button>
      </div>
      <div id="flag-result-${cid}" style="margin-top:1rem; min-height:40px;"></div>
    `;
}

// --- CTF ENGINE ACTIONS ---

async function startDailyAttempt(cid) {
  const user = JSON.parse(localStorage.getItem("user"));
  try {
    const res = await fetch("http://127.0.0.1:8000/daily-challenge/start", {
      method: "POST",
      headers: { "user-id": user.id.toString() }
    });
    if (res.ok) {
      // Show flag area, hide start button
      const startBtn = document.getElementById(`start-btn-${cid}`);
      const flagArea = document.getElementById(`flag-submit-area-${cid}`);
      if (startBtn) startBtn.style.display = 'none';
      if (flagArea) flagArea.style.display = 'block';
      return true;
    }
  } catch (err) { console.error(err); }
  return false;
}

async function startDailyAndLaunch(cid) {
  const success = await startDailyAttempt(cid);
  // launchSimLab is global in user.js
  if (typeof launchSimLab === 'function') {
    launchSimLab(cid);
  } else {
    console.error("launchSimLab not found");
  }
}

// --- DATA FETCHING HELPERS ---

async function fetchChallengeStats(challengeId) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/user/challenges/${challengeId}/stats`);
    if (res.ok) return await res.json();
  } catch (err) { console.error(err); }
  return { totalAttempts: 1247, completedBy: 892 };
}

async function fetchTopSolvers() {
  try {
    const res = await fetch("http://127.0.0.1:8000/daily-challenge/top-solvers");
    if (res.ok) return await res.json();
  } catch (err) { console.error(err); }
  return [];
}

// --- RENDERING HELPERS ---

function renderTopSolvers(solvers) {
  if (!solvers || solvers.length === 0) {
    return `<div class="no-solvers"><i class="fas fa-user-secret"></i> No operatives confirmed yet. Be the first!</div>`;
  }

  return solvers.map(s => `
    <div class="solver-card">
      <div class="solver-rank">#${s.rank}</div>
      <div class="solver-info">
        <div class="solver-name">${escapeHtml(s.username)}</div>
        <div class="solver-date">${s.time} (Record)</div>
      </div>
      <div class="solver-points">+${s.points} XP</div>
    </div>
  `).join('');
}

function startBonusTimer(totalSeconds) {
  if (dailyChallengeTimer) clearInterval(dailyChallengeTimer);
  if (!totalSeconds || totalSeconds <= 0) return;

  let remaining = totalSeconds;

  function update() {
    if (remaining <= 0) {
      clearInterval(dailyChallengeTimer);
      const el = document.getElementById("bonus-timer");
      if (el) el.innerText = "00:00:00";
      return;
    }

    const h = Math.floor(remaining / 3600).toString().padStart(2, '0');
    const m = Math.floor((remaining % 3600) / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');

    const el = document.getElementById("bonus-timer");
    if (el) el.innerText = `${h}:${m}:${s} `;

    remaining--;
  }

  update();
  dailyChallengeTimer = setInterval(update, 1000);
}

function startDailyChallengeFlow(id) {
  // Navigate to challenge
  if (typeof openChallenge === 'function') {
    openChallenge(id);
  } else if (typeof route === 'function') {
    // Fallback or specific logic
    localStorage.setItem("active_challenge_id", id);
    route('challenges');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
