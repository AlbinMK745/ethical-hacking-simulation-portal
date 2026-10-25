
/* =========================================
   PROGRESS GRAPH - Complete Implementation
   ========================================= */

// Main function called from sidebar
function loadProgress() {
    loadProgressGraph();
}

// ✅ LOAD PROGRESS GRAPH
async function loadProgressGraph() {
    if (typeof setActiveByPage === 'function') setActiveByPage("progress");
    document.getElementById("page-title").innerText = "Progress Graph";

    const view = document.getElementById("view");
    const user = JSON.parse(localStorage.getItem("user"));

    // Loading state
    view.innerHTML = `<div style="text-align: center; padding: 3rem; color: #8892b0;">
    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-cyan);"></i>
    <p style="margin-top: 1rem;">Loading progress data...</p>
  </div>`;

    try {
        const res = await fetch(`http://127.0.0.1:8000/user/progress/${user.id}`);
        const data = await res.json();

        view.innerHTML = `
      <div class="progress-graph-container">
        
        <!-- Progress Insights Header -->
        <div class="progress-insights-header">
          <h2>Progress Insights</h2>
          <div class="insights-cards">
            <div class="insight-card">
              <div class="insight-icon" style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);">
                <i class="fas fa-fire"></i>
              </div>
              <div>
                <div class="insight-label">Current Streak</div>
                <div class="insight-value">${data.stats.current_streak} <span style="font-size: 1.2rem;">🔥</span></div>
                <div class="insight-sublabel">Day${data.stats.current_streak !== 1 ? 's' : ''} on fire</div>
              </div>
            </div>

            <div class="insight-card">
              <div class="insight-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <i class="fas fa-chart-line"></i>
              </div>
              <div>
                <div class="insight-label">Weekly Progress</div>
                <div class="insight-value">${data.stats.weekly_progress}%</div>
                <div class="insight-sublabel">This week</div>
              </div>
            </div>

            <div class="insight-card">
              <div class="insight-icon" style="background: linear-gradient(135deg, #00d9ff 0%, #64ffda 100%);">
                <i class="fas fa-star"></i>
              </div>
              <div>
                <div class="insight-label">Total XP</div>
                <div class="insight-value">${data.stats.total_points.toLocaleString()}</div>
                <div class="insight-sublabel">Points earned</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Points Over Time Chart -->
        <div class="chart-card">
          <h3 class="chart-title">Points Over Time</h3>
          <canvas id="pointsChart"></canvas>
        </div>

        <!-- Weekly Activity Chart -->
        <div class="chart-card">
          <h3 class="chart-title">Weekly Activity</h3>
          <canvas id="weeklyChart"></canvas>
        </div>

        <!-- Progress by Category -->
        <div class="category-progress-card">
          <h3 class="chart-title">Progress by Category</h3>
          <div class="category-bars">
            ${data.category_progress.map(cat => `
              <div class="category-bar-item">
                <div class="category-bar-header">
                  <span class="category-name">${cat.category}</span>
                  <span class="category-percentage">${cat.percentage}%</span>
                </div>
                <div class="category-bar-bg">
                  <div class="category-bar-fill" style="width: ${cat.percentage}%"></div>
                </div>
                <div class="category-bar-footer">
                  ${cat.solved} / ${cat.total} challenges
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

        // Render Charts using Chart.js
        renderProgressCharts(data);

    } catch (err) {
        console.error("Failed to load progress:", err);
        view.innerHTML = `<div class="error-text" style="padding: 2rem; text-align: center;">
      <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b;"></i>
      <p style="margin-top: 1rem;">Failed to load progress data. Please refresh the page.</p>
    </div>`;
    }
}

// Render both charts
function renderProgressCharts(data) {
    renderProgressPointsChart(data.points_over_time);
    renderProgressWeeklyChart(data.weekly_activity);
}

// Render Points Over Time Chart
function renderProgressPointsChart(data) {
    if (!data || data.length === 0) {
        document.getElementById("pointsChart").parentElement.innerHTML = '<p style="color: #8892b0; text-align: center; padding: 2rem;">No data available yet. Start solving challenges!</p>';
        return;
    }

    const ctx = document.getElementById("pointsChart").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Cumulative Points',
                data: data.map(d => d.cumulative_points),
                borderColor: '#00d9ff',
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#00d9ff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#8892b0'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#8892b0'
                    }
                }
            }
        }
    });
}

// Render Weekly Activity Chart
function renderProgressWeeklyChart(data) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);

    // Map day_of_week to counts
    data.forEach(d => {
        if (d.day_of_week >= 0 && d.day_of_week <= 6) {
            counts[d.day_of_week] = d.count;
        }
    });

    const ctx = document.getElementById("weeklyChart").getContext("2d");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: days,
            datasets: [{
                label: 'Attempts',
                data: counts,
                backgroundColor: counts.map(count =>
                    count > 0 ? '#00d9ff' : '#2a2a3e'
                ),
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#8892b0',
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#8892b0'
                    }
                }
            }
        }
    });
}
