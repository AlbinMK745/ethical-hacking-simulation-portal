/**
 * Social Tab Component
 * Handles friend discovery, requests, and friend list.
 */

function UserCard({ user, onAction }) {
    const getAvatar = (avatar) => {
        const emojiMap = { hooded: '🥷', fawkes: '🎭', matrix: '💻', robot: '🤖', terminal: '⌨️', skull: '💀' };
        if (avatar && avatar.startsWith('data:')) return <img src={avatar} alt="avatar" style={{width: '100%', height: '100%', borderRadius: '50%'}} />;
        return emojiMap[avatar] || '🥷';
    };

    return (
        <div className="user-card">
            <div className="user-card-avatar">{getAvatar(user.avatar)}</div>
            <div className="user-card-info">
                <span className="user-card-name">{user.username}</span>
                <div className="user-card-meta">Lvl {user.level} • {user.hacker_title || 'Novice'}</div>
            </div>
            <div className="user-card-actions">
                {user.friend_status === 'none' && (
                    <button className="btn-friend-action btn-add" onClick={() => onAction(user.id, 'request')}>
                        <i className="fas fa-user-plus" />
                    </button>
                )}
                {user.friend_status === 'sent' && (
                    <button className="btn-friend-action btn-pending">Pending</button>
                )}
                {user.friend_status === 'received' && (
                    <div style={{display: 'flex', gap: '4px'}}>
                        <button className="btn-friend-action btn-accept" onClick={() => onAction(user.request_id, 'accept')}>
                            <i className="fas fa-check" />
                        </button>
                        <button className="btn-friend-action btn-decline" onClick={() => onAction(user.request_id, 'decline')}>
                            <i className="fas fa-times" />
                        </button>
                    </div>
                )}
                {user.friend_status === 'accepted' && (
                    <span className="user-card-meta" style={{color: 'var(--primary-cyan)'}}><i className="fas fa-user-friends" /> Friend</span>
                )}
            </div>
        </div>
    );
}

function SocialView({ user }) {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState('discover');
    const [showGroupModal, setShowGroupModal] = React.useState(false);
    const [groupName, setGroupName] = React.useState('');
    const [selectedMembers, setSelectedMembers] = React.useState([]);

    const loadUsers = async () => {
        setLoading(true);
        console.log("[Social] Loading users for ID:", user.id);
        try {
            const data = await api('/social/users', {
                headers: { 'user-id': String(user.id) }
            });
            setUsers(data.users || []);
        } catch (err) {
            console.error("[Social] Failed to load users:", err);
        }
        setLoading(false);
    };

    React.useEffect(() => { 
        if (user && user.id) loadUsers(); 
    }, [user.id]);

    const handleAction = async (id, action) => {
        console.log(`[Social] Action: ${action} on ID: ${id}`);
        try {
            let url = '';
            let method = 'POST';
            let body = null;

            if (action === 'request') {
                url = `/social/friend-request/${id}`;
            } else if (action === 'accept' || action === 'decline') {
                url = `/social/friend-request/${id}`;
                method = 'PUT';
                body = JSON.stringify({ action });
            }

            await api(url, {
                method,
                headers: { 
                    'user-id': String(user.id),
                    'Content-Type': 'application/json'
                },
                body
            });

            console.log(`[Social] ${action} success`);
            loadUsers();
        } catch (err) {
            console.error(`[Social] ${action} failed:`, err);
            alert(`Action failed: ${err.message}`);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length === 0) {
            alert("Please enter a group name and select at least one member.");
            return;
        }
        try {
            await api('/social/groups', {
                method: 'POST',
                headers: { 
                    'user-id': String(user.id),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: groupName.trim(),
                    member_ids: selectedMembers
                })
            });
            setShowGroupModal(false);
            setGroupName('');
            setSelectedMembers([]);
            alert("Group created successfully!");
        } catch (err) { 
            console.error("[Social] Group creation failed:", err);
            alert(`Failed to create group: ${err.message}`);
        }
    };

    const toggleMember = (id) => {
        setSelectedMembers(prev => 
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const filteredUsers = users.filter(u => {
        if (filter === 'discover') return u.friend_status === 'none';
        if (filter === 'friends') return u.friend_status === 'accepted';
        if (filter === 'requests') return u.friend_status === 'received' || u.friend_status === 'sent';
        return true;
    });

    return (
        <div className="social-tab">
            <div className="ach-filter-row">
                <button className={`ach-filter-btn ${filter === 'discover' ? 'active' : ''}`} onClick={() => setFilter('discover')}>Discover</button>
                <button className={`ach-filter-btn ${filter === 'friends' ? 'active' : ''}`} onClick={() => setFilter('friends')}>Friends</button>
                <button className={`ach-filter-btn ${filter === 'requests' ? 'active' : ''}`} onClick={() => setFilter('requests')}>Requests</button>
                <button className="ach-filter-btn" style={{marginLeft: 'auto', background: 'rgba(0,255,191,0.1)', color: '#00ffbf'}} onClick={() => setShowGroupModal(true)}>
                    <i className="fas fa-plus" /> New Group
                </button>
            </div>

            {loading ? (
                <div className="profile-loading"><i className="fas fa-spinner fa-spin" /> Scanning for users...</div>
            ) : (
                <div className="user-discovery-grid">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                            <UserCard key={u.id} user={u} onAction={handleAction} />
                        ))
                    ) : (
                        <div className="profile-empty" style={{gridColumn: '1/-1'}}>
                            {filter === 'discover' ? "No new hackers found in the network." : 
                             filter === 'friends' ? "Your friend list is empty. Go connect with others!" : 
                             "No pending friend requests."}
                        </div>
                    )}
                </div>
            )}

            {showGroupModal && (
                <div className="modal-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
                    <div className="modal-content pcard" style={{width: '400px', padding: '24px'}}>
                        <h3 className="pcard-title">Create New Group</h3>
                        <div style={{display: 'grid', gap: '15px', marginBottom: '20px'}}>
                            <input type="text" 
                                   className="chat-input" 
                                   placeholder="Group Name" 
                                   value={groupName}
                                   onChange={e => setGroupName(e.target.value)} />
                            
                            <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px'}}>
                                <div style={{fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px'}}>Select Members:</div>
                                {users.filter(u => u.friend_status === 'accepted').map(u => (
                                    <div key={u.id} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0'}}>
                                        <input type="checkbox" checked={selectedMembers.includes(u.id)} onChange={() => toggleMember(u.id)} />
                                        <span style={{fontSize: '0.8rem', color: '#fff'}}>{u.username}</span>
                                    </div>
                                ))}
                                {users.filter(u => u.friend_status === 'accepted').length === 0 && (
                                    <div style={{fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)'}}>No friends to add.</div>
                                )}
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button className="btn-primary-profile" style={{flex: 1}} onClick={handleCreateGroup}>Create</button>
                            <button className="btn-secondary-profile" style={{flex: 1}} onClick={() => setShowGroupModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
