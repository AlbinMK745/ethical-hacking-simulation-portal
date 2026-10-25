/**
 * MEGA PROFILE VIEW - Complete Rewrite
 * Tabs: Overview | Stats | Achievements | Activity
 */

// ── Utility: time ago ──────────────────────────────────────
function timeAgoStr(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Animated Counter Hook ──────────────────────────────────
function useCountUp(target, duration = 1200) {
    const [val, setVal] = React.useState(0);
    React.useEffect(() => {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setVal(target); clearInterval(timer); }
            else setVal(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [target]);
    return val;
}

// ── SVG Radar Chart ────────────────────────────────────────
function RadarChart({ skills }) {
    const labels = ['Web Hacking', 'Network', 'Cryptography', 'System', 'OSINT', 'Reverse Eng'];
    const values = labels.map(l => {
        const key = Object.keys(skills).find(k => k.toLowerCase().includes(l.split(' ')[0].toLowerCase()));
        return key ? Math.min(skills[key], 100) : 0;
    });
    const cx = 120, cy = 120, r = 90;
    const toXY = (i, v) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const d = (v / 100) * r;
        return [cx + d * Math.cos(angle), cy + d * Math.sin(angle)];
    };
    const gridLevels = [20, 40, 60, 80, 100];
    return (
        <svg viewBox="0 0 240 240" style={{ width: '100%', maxWidth: 240 }}>
            {gridLevels.map(g => {
                const pts = labels.map((_, i) => toXY(i, g).join(',')).join(' ');
                return <polygon key={g} points={pts} fill="none" stroke="rgba(0,255,191,0.08)" strokeWidth="1" />;
            })}
            {labels.map((_, i) => {
                const [x, y] = toXY(i, 100);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,255,191,0.08)" strokeWidth="1" />;
            })}
            <polygon
                points={values.map((v, i) => toXY(i, v).join(',')).join(' ')}
                fill="rgba(0,255,191,0.15)"
                stroke="#00ffbf"
                strokeWidth="2"
            />
            {values.map((v, i) => {
                const [x, y] = toXY(i, v);
                return <circle key={i} cx={x} cy={y} r="4" fill="#00ffbf" />;
            })}
            {labels.map((l, i) => {
                const [x, y] = toXY(i, 115);
                return <text key={i} x={x} y={y} fill="rgba(255,255,255,0.5)" fontSize="8" textAnchor="middle" dominantBaseline="middle">{l}</text>;
            })}
        </svg>
    );
}

// ── Activity Heatmap ───────────────────────────────────────
function ActivityHeatmap({ heatmap }) {
    const days = 182;
    const today = new Date();
    const cells = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const count = heatmap[key] || 0;
        let intensity = 'var(--hm-0)';
        if (count >= 5) intensity = 'var(--hm-4)';
        else if (count >= 3) intensity = 'var(--hm-3)';
        else if (count >= 2) intensity = 'var(--hm-2)';
        else if (count >= 1) intensity = 'var(--hm-1)';
        cells.push(
            <div key={key} className="hm-cell" style={{ background: intensity }} title={`${key}: ${count} activities`} />
        );
    }
    return (
        <div className="heatmap-wrapper">
            <div className="heatmap-grid">{cells}</div>
            <div className="heatmap-legend">
                <span>Less</span>
                {['var(--hm-0)', 'var(--hm-1)', 'var(--hm-2)', 'var(--hm-3)', 'var(--hm-4)'].map((c, i) => (
                    <div key={i} className="hm-cell" style={{ background: c }} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ icon, label, value, color, suffix = '' }) {
    const count = useCountUp(typeof value === 'number' ? value : 0);
    return (
        <div className="pstat-card" style={{ '--accent': color }}>
            <div className="pstat-icon"><i className={`fas ${icon}`} /></div>
            <div className="pstat-info">
                <h3>{typeof value === 'number' ? count : value}{suffix}</h3>
                <span>{label}</span>
            </div>
        </div>
    );
}

// ── Rarity Badge ───────────────────────────────────────────
function RarityBadge({ rarity }) {
    const colors = { Legendary: '#ffd700', Epic: '#a855f7', Rare: '#3b82f6', Common: '#6b7280' };
    return (
        <span className="rarity-badge" style={{ color: colors[rarity], borderColor: colors[rarity] + '44' }}>
            {rarity}
        </span>
    );
}

// ── Achievements Gallery Tab ───────────────────────────────
function AchievementsTab({ userId }) {
    const [achs, setAchs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState('all');

    React.useEffect(() => {
        fetch(`http://127.0.0.1:8000/user/profile/all-achievements`, { headers: { 'user-id': String(userId) } })
            .then(r => r.json()).then(d => { setAchs(d.achievements || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [userId]);

    if (loading) return <div className="profile-loading"><i className="fas fa-spinner fa-spin" /> Loading achievements...</div>;

    const filtered = filter === 'all' ? achs : filter === 'unlocked' ? achs.filter(a => a.unlocked) : achs.filter(a => !a.unlocked);

    return (
        <div className="ach-tab">
            <div className="ach-filter-row">
                {['all', 'unlocked', 'locked'].map(f => (
                    <button key={f} className={`ach-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>
            <div className="ach-gallery">
                {filtered.map(a => (
                    <div key={a.id} className={`ach-card ${a.unlocked ? 'unlocked' : 'locked'}`}>
                        <div className="ach-icon-wrap">
                            <i className={`fas ${a.icon || 'fa-medal'}`} />
                            {!a.unlocked && <div className="ach-lock-overlay"><i className="fas fa-lock" /></div>}
                        </div>
                        <div className="ach-card-info">
                            <h4>{a.title}</h4>
                            <p>{a.description}</p>
                            <RarityBadge rarity={a.rarity} />
                            {!a.unlocked && a.target > 0 && (
                                <div className="ach-progress-bar">
                                    <div className="ach-progress-fill" style={{ width: `${Math.min((a.progress / a.target) * 100, 100)}%` }} />
                                </div>
                            )}
                            {a.unlocked && <div className="ach-unlocked-date">Unlocked {new Date(a.unlocked_at).toLocaleDateString()}</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Activity Feed Tab ──────────────────────────────────────
function ActivityTab({ userId }) {
    const [feed, setFeed] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetch(`http://127.0.0.1:8000/user/profile/activity-feed`, { headers: { 'user-id': String(userId) } })
            .then(r => r.json()).then(d => { setFeed(d.feed || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [userId]);

    if (loading) return <div className="profile-loading"><i className="fas fa-spinner fa-spin" /> Loading activity...</div>;
    if (!feed.length) return <div className="profile-empty">No activity yet. Start solving challenges!</div>;

    return (
        <div className="activity-timeline">
            {feed.map((item, i) => (
                <div key={i} className="timeline-item">
                    <div className="timeline-dot" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}>
                        <i className={`fas ${item.icon}`} style={{ color: item.color }} />
                    </div>
                    <div className="timeline-content">
                        <div className="timeline-title">{item.title}</div>
                        <div className="timeline-detail">{item.detail}</div>
                        <div className="timeline-time">{timeAgoStr(item.ts)}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Stats Tab ──────────────────────────────────────────────
function StatsTab({ userId, baseData, extStats }) {
    const [xpHistory, setXpHistory] = React.useState([]);
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    React.useEffect(() => {
        fetch(`http://127.0.0.1:8000/user/profile/xp-history`, { headers: { 'user-id': String(userId) } })
            .then(r => r.json()).then(d => setXpHistory(d.xp_history || []))
            .catch(() => {});
    }, [userId]);

    React.useEffect(() => {
        if (!chartRef.current || !xpHistory.length) return;
        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: xpHistory.map(r => r.day ? r.day.slice(5) : ''),
                datasets: [{
                    label: 'XP',
                    data: xpHistory.map(r => r.xp),
                    borderColor: '#00ffbf',
                    backgroundColor: 'rgba(0,255,191,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#00ffbf'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: '#111' }, ticks: { color: '#555', font: { size: 10 } } },
                    y: { grid: { color: '#111' }, ticks: { color: '#555', font: { size: 10 } }, beginAtZero: true }
                }
            }
        });
    }, [xpHistory]);

    const u = baseData.user;
    const winRate = extStats ? extStats.win_rate : 0;
    const streak = extStats ? extStats.streak : (u.streak || 0);
    const shields = extStats ? extStats.streak_shields : 0;

    return (
        <div className="stats-tab">
            <div className="stats-grid-2">
                <StatCard icon="fa-fire" label="Current Streak" value={streak} color="#ff6b35" suffix=" days" />
                <StatCard icon="fa-bullseye" label="Win Rate" value={Math.round(winRate)} color="#00d2ff" suffix="%" />
                <StatCard icon="fa-terminal" label="Sandbox Sessions" value={extStats ? extStats.sandbox_sessions : 0} color="#a855f7" />
                <StatCard icon="fa-sticky-note" label="Notes Created" value={extStats ? extStats.notes_count : 0} color="#ffd700" />
                <StatCard icon="fa-bookmark" label="Saved Items" value={extStats ? extStats.saved_count : 0} color="#22c55e" />
                <StatCard icon="fa-shield-alt" label="Streak Shields" value={shields} color="#00ffbf" />
            </div>

            <div className="pcard" style={{ marginTop: 24 }}>
                <h3 className="pcard-title">XP Earned — Last 30 Days</h3>
                <div style={{ height: 200, position: 'relative' }}>
                    {xpHistory.length > 0
                        ? <canvas ref={chartRef} />
                        : <div className="profile-empty" style={{ padding: '4rem 0' }}>Solve challenges to see XP history.</div>
                    }
                </div>
            </div>

            <div className="pcard" style={{ marginTop: 24 }}>
                <h3 className="pcard-title">Skill Radar</h3>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <RadarChart skills={baseData.skills || {}} />
                </div>
            </div>
        </div>
    );
}

// ── Overview Tab ───────────────────────────────────────────
function OverviewTab({ baseData, heatmap, extStats, onEditProfile, onChangePassword }) {
    const u = baseData.user;
    const skills = u.skills ? (typeof u.skills === 'string' ? JSON.parse(u.skills) : u.skills) : [];

    const getAvatarDisplay = () => {
        const emojiMap = { hooded: '🥷', fawkes: '🎭', matrix: '💻', robot: '🤖', terminal: '⌨️', skull: '💀' };
        if (u.avatar && u.avatar.startsWith('data:')) return <img src={u.avatar} alt="avatar" className="avatar-img" />;
        return <span className="avatar-emoji">{emojiMap[u.avatar] || '🥷'}</span>;
    };

    const joinDate = u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';
    const radius = 70, circ = 2 * Math.PI * radius;
    const pct = (u.points % 100) / 100;
    const offset = circ - pct * circ;

    return (
        <div className="overview-grid">
            {/* Left sidebar */}
            <div className="overview-left">
                <div className="pcard profile-hero-card">
                    <div className="avatar-frame">
                        {getAvatarDisplay()}
                        <div className="online-dot" />
                    </div>
                    <h2 className="profile-hero-name">{u.username}</h2>
                    <div className="profile-hero-title">{u.hacker_title || (u.level >= 10 ? 'Advanced Hacker' : u.level >= 5 ? 'Intermediate Hacker' : 'Junior Pentester')}</div>
                    {u.country && <div className="profile-country">{u.country}</div>}
                    {u.bio && <div className="profile-bio-text">"{u.bio}"</div>}

                    {skills.length > 0 && (
                        <div className="profile-skill-chips">
                            {skills.map(s => <span key={s} className="skill-chip">{s}</span>)}
                        </div>
                    )}

                    <div className="profile-social-row">
                        {u.github_url && <a href={u.github_url} target="_blank" className="social-link" title="GitHub"><i className="fab fa-github" /></a>}
                        {u.twitter_url && <a href={u.twitter_url} target="_blank" className="social-link" title="Twitter/X"><i className="fab fa-x-twitter" /></a>}
                        {u.linkedin_url && <a href={u.linkedin_url} target="_blank" className="social-link" title="LinkedIn"><i className="fab fa-linkedin" /></a>}
                        {u.portfolio_url && <a href={u.portfolio_url} target="_blank" className="social-link" title="Portfolio"><i className="fas fa-globe" /></a>}
                        {u.htb_profile && <a href={`https://app.hackthebox.com/profile/${u.htb_profile}`} target="_blank" className="social-link" title="HackTheBox"><i className="fas fa-cube" /></a>}
                        {u.thm_profile && <a href={`https://tryhackme.com/p/${u.thm_profile}`} target="_blank" className="social-link" title="TryHackMe"><i className="fas fa-flag" /></a>}
                    </div>

                    <div className="profile-meta-list">
                        <div className="meta-row"><i className="fas fa-envelope" /><span>{u.email}</span></div>
                        <div className="meta-row"><i className="fas fa-calendar-alt" /><span>Member since {joinDate}</span></div>
                        <div className="meta-row"><i className="fas fa-trophy" /><span>{u.points || 0} Total Points</span></div>
                        <div className="meta-row"><i className="fas fa-crosshairs" /><span>{baseData.challenges_solved} Challenges Solved</span></div>
                        {extStats && <div className="meta-row"><i className="fas fa-fire" /><span>{extStats.streak || 0} day streak</span></div>}
                    </div>

                    <div className="profile-action-btns">
                        <button className="btn-primary-profile" onClick={onEditProfile}><i className="fas fa-user-edit" /> Edit Profile</button>
                        <button className="btn-secondary-profile" onClick={onChangePassword}><i className="fas fa-key" /> Change Password</button>
                    </div>
                </div>
            </div>

            {/* Right content */}
            <div className="overview-right">
                {/* Stat cards row */}
                <div className="overview-stat-row">
                    <div className="mini-stat-card"><span className="msc-val">{u.points || 0}</span><span className="msc-label">Points</span></div>
                    <div className="mini-stat-card"><span className="msc-val">{baseData.challenges_solved}</span><span className="msc-label">Solved</span></div>
                    <div className="mini-stat-card"><span className="msc-val">{baseData.badges_count || 0}</span><span className="msc-label">Badges</span></div>
                    <div className="mini-stat-card"><span className="msc-val">#{baseData.rank}</span><span className="msc-label">Rank</span></div>
                </div>

                {/* Level Progress ring */}
                <div className="pcard" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                        <svg width="160" height="160" className="progress-ring-svg">
                            <circle cx="80" cy="80" r={radius} className="ring-bg" />
                            <circle cx="80" cy="80" r={radius} className="ring-fill" strokeDasharray={circ} strokeDashoffset={offset} />
                        </svg>
                        <div className="ring-label">Level {u.level}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 className="pcard-title">Level Progress</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                            {u.points % 100} / 100 XP to Level {u.level + 1}
                        </p>
                        <div className="level-bar-bg"><div className="level-bar-fill" style={{ width: `${(u.points % 100)}%` }} /></div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8 }}>Security Level {String(u.level).padStart(2, '0')}</p>
                    </div>
                </div>

                {/* Skill bars */}
                <div className="pcard">
                    <h3 className="pcard-title">Skill Nodes Breakdown</h3>
                    {Object.entries(baseData.skills || {}).length > 0
                        ? Object.entries(baseData.skills).map(([name, val]) => (
                            <div key={name} className="skill-bar-row">
                                <div className="skill-bar-meta"><span>{name}</span><span>{val}%</span></div>
                                <div className="skill-bar-track"><div className="skill-bar-fill-anim" style={{ width: `${val}%` }} /></div>
                            </div>
                        ))
                        : <p className="profile-empty">Solve challenges to build your skill profile.</p>
                    }
                </div>

                {/* Heatmap */}
                {heatmap && (
                    <div className="pcard">
                        <h3 className="pcard-title">Activity Heatmap — Last 6 Months</h3>
                        <ActivityHeatmap heatmap={heatmap} />
                    </div>
                )}

                {/* Recent Achievements */}
                <div className="pcard">
                    <h3 className="pcard-title">Recent Achievements</h3>
                    {baseData.recent_achievements && baseData.recent_achievements.length > 0
                        ? baseData.recent_achievements.map((a, i) => (
                            <div key={i} className="recent-ach-row">
                                <div className="recent-ach-icon"><i className="fas fa-medal" /></div>
                                <div><div className="recent-ach-title">{a.title}</div><div className="recent-ach-date">{a.unlocked_at ? new Date(a.unlocked_at).toLocaleDateString() : ''}</div></div>
                            </div>
                        ))
                        : <p className="profile-empty">No achievements yet.</p>
                    }
                </div>
            </div>
        </div>
    );
}

// ── Main ProfileView ───────────────────────────────────────
function ProfileView({ user, onUserUpdate }) {
    const [tab, setTab] = React.useState('overview');
    const [state, setState] = React.useState({ loading: true, error: '', data: null });
    const [heatmap, setHeatmap] = React.useState(null);
    const [extStats, setExtStats] = React.useState(null);

    const load = async () => {
        setState(p => ({ ...p, loading: true, error: '' }));
        try {
            const data = await api('/user/profile/', { headers: { 'user-id': String(user.id) } });
            setState({ loading: false, error: '', data });
        } catch (err) {
            setState({ loading: false, error: err.message, data: null });
        }
    };

    React.useEffect(() => { load(); }, [user.id]);

    React.useEffect(() => {
        const h = { 'user-id': String(user.id) };
        fetch('http://127.0.0.1:8000/user/profile/activity-heatmap', { headers: h })
            .then(r => r.json()).then(d => setHeatmap(d.heatmap || {})).catch(() => setHeatmap({}));
        fetch('http://127.0.0.1:8000/user/profile/extended-stats', { headers: h })
            .then(r => r.json()).then(d => setExtStats(d)).catch(() => setExtStats(null));
    }, [user.id]);

    if (state.loading) return <Loading text="Initializing profile..." />;
    if (state.error) return <ErrorBox error={state.error} />;

    const d = state.data;

    const handleEdit = () => {
        if (typeof openEditProfileModal === 'function') openEditProfileModal({ ...user, ...d.user });
    };
    const handlePass = () => {
        if (typeof openChangePasswordModal === 'function') openChangePasswordModal();
    };

    const tabs = [
        { id: 'overview', icon: 'fa-user', label: 'Overview' },
        { id: 'stats', icon: 'fa-chart-bar', label: 'Stats' },
        { id: 'achievements', icon: 'fa-medal', label: 'Achievements' },
        { id: 'activity', icon: 'fa-stream', label: 'Activity' }
    ];

    return (
        <div className="mega-profile">
            <div className="profile-tab-bar">
                {tabs.map(t => (
                    <button key={t.id} className={`profile-tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                        <i className={`fas ${t.icon}`} />{t.label}
                    </button>
                ))}
            </div>

            <div className="profile-tab-content">
                {tab === 'overview' && (
                    <OverviewTab
                        baseData={d}
                        heatmap={heatmap}
                        extStats={extStats}
                        onEditProfile={handleEdit}
                        onChangePassword={handlePass}
                    />
                )}
                {tab === 'stats' && <StatsTab userId={user.id} baseData={d} extStats={extStats} />}
                {tab === 'achievements' && <AchievementsTab userId={user.id} />}
                {tab === 'activity' && <ActivityTab userId={user.id} />}
            </div>
        </div>
    );
}
