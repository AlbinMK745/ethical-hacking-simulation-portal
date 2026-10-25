/* =========================================
   DASHBOARD MODULE
   ========================================= */

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
            fetch("http://127.0.0.1:8000/user/leaderboard")
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
