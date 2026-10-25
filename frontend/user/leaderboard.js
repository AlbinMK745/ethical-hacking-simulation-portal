/* =========================================
   LEADERBOARD MODULE
   ========================================= */

async function loadLeaderboard() {
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

  // If no data, show empty state
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
