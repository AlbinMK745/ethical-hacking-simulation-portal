/**
 * Messenger Panel Component
 * Floating chat interface for DMs and Groups.
 */

function MessengerPanel({ user }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [activeChat, setActiveChat] = React.useState(null); // { type: 'dm', id: 5, name: 'albin' } or { type: 'group', id: 1, name: 'Team Alpha' }
    const [contacts, setContacts] = React.useState([]);
    const [groups, setGroups] = React.useState([]);
    const [messages, setMessages] = React.useState([]);
    const [inputValue, setInputValue] = React.useState('');
    const [socket, setSocket] = React.useState(null);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        if (isOpen) {
            loadContacts();
            loadGroups();
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (activeChat) {
            loadMessages();
        }
    }, [activeChat]);

    React.useEffect(scrollToBottom, [messages]);

    // WebSocket Setup
    React.useEffect(() => {
        if (!user) return;
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/social/${user.id}`);
        
        ws.onopen = () => console.log("[Messenger] Connected to WS");
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'dm' || data.type === 'group_msg') {
                // If it's the current active chat, add to messages
                if (activeChat && (
                    (data.type === 'dm' && (data.sender_id === activeChat.id || data.sender_id === user.id)) ||
                    (data.type === 'group_msg' && data.group_id === activeChat.id)
                )) {
                    setMessages(prev => [...prev, data]);
                } else {
                    setUnreadCount(prev => prev + 1);
                }
            }
        };
        
        setSocket(ws);
        return () => ws.close();
    }, [user.id, activeChat]);

    const loadContacts = async () => {
        try {
            const data = await api('/social/friends', {
                headers: { 'user-id': String(user.id) }
            });
            setContacts(data.friends || []);
        } catch (err) { console.error("[Messenger] Contacts load failed:", err); }
    };

    const loadGroups = async () => {
        try {
            const data = await api('/social/groups', {
                headers: { 'user-id': String(user.id) }
            });
            setGroups(data.groups || []);
        } catch (err) { console.error("[Messenger] Groups load failed:", err); }
    };

    const loadMessages = async () => {
        try {
            const path = activeChat.type === 'dm' ? 
                `/social/dm/${activeChat.id}` : 
                `/social/groups/${activeChat.id}/messages`;
            
            const data = await api(path, {
                headers: { 'user-id': String(user.id) }
            });
            setMessages(data.messages || []);
        } catch (err) { console.error("[Messenger] Messages load failed:", err); }
    };

    const sendMessage = async () => {
        if (!inputValue.trim() || !activeChat || !socket) return;

        const content = inputValue.trim();
        const payload = {
            type: activeChat.type === 'dm' ? 'send_dm' : 'send_group_msg',
            content: content,
            sender_name: user.username
        };

        if (activeChat.type === 'dm') payload.receiver_id = activeChat.id;
        else payload.group_id = activeChat.id;

        socket.send(JSON.stringify(payload));
        setInputValue('');
        
        // Also save to DB via REST (stateless persistence)
        try {
            const path = activeChat.type === 'dm' ? `/social/dm/${activeChat.id}` : `/social/groups/${activeChat.id}/messages`;
            await api(path, {
                method: 'POST',
                headers: { 
                    'user-id': String(user.id),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
        } catch (err) {
            console.error("[Messenger] Message save failed:", err);
        }
    };

    const getAvatar = (avatar, type) => {
        if (type === 'group') return <i className="fas fa-users" />;
        const emojiMap = { hooded: '🥷', fawkes: '🎭', matrix: '💻', robot: '🤖', terminal: '⌨️', skull: '💀' };
        if (avatar && avatar.startsWith('data:')) return <img src={avatar} alt="av" style={{width: '100%', height: '100%', borderRadius: '50%'}} />;
        return emojiMap[avatar] || '🥷';
    };

    return (
        <div className="messenger-container">
            <div className="messenger-launcher" onClick={() => { setIsOpen(!isOpen); setUnreadCount(0); }}>
                <i className={isOpen ? "fas fa-times" : "fas fa-comments"} />
                {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
            </div>

            {isOpen && (
                <div className="messenger-panel">
                    <div className="messenger-header">
                        <h3>{activeChat ? activeChat.name : "MESSENGER"}</h3>
                        <div style={{display: 'flex', gap: '10px'}}>
                            {activeChat && <i className="fas fa-arrow-left" style={{cursor: 'pointer'}} onClick={() => setActiveChat(null)} />}
                            <i className="fas fa-minus" style={{cursor: 'pointer'}} onClick={() => setIsOpen(false)} />
                        </div>
                    </div>

                    <div className="messenger-body">
                        {/* Sidebar */}
                        <div className="messenger-sidebar">
                            {groups.map(g => (
                                <div key={`g-${g.id}`} 
                                     className={`contact-item ${activeChat?.id === g.id && activeChat?.type === 'group' ? 'active' : ''}`}
                                     title={g.name}
                                     onClick={() => setActiveChat({ type: 'group', id: g.id, name: g.name })}>
                                    {getAvatar(null, 'group')}
                                </div>
                            ))}
                            <div style={{width: '60%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0'}} />
                            {contacts.map(c => (
                                <div key={`c-${c.id}`} 
                                     className={`contact-item ${activeChat?.id === c.id && activeChat?.type === 'dm' ? 'active' : ''}`}
                                     title={c.username}
                                     onClick={() => setActiveChat({ type: 'dm', id: c.id, name: c.username })}>
                                    {getAvatar(c.avatar)}
                                    <div className="status-dot" />
                                </div>
                            ))}
                            {contacts.length === 0 && groups.length === 0 && (
                                <div style={{fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '0 5px'}}>Add friends to chat</div>
                            )}
                        </div>

                        {/* Chat Window */}
                        <div className="chat-area">
                            {activeChat ? (
                                <>
                                    <div className="chat-messages">
                                        {messages.map((m, i) => (
                                            <div key={i} className={`msg-bubble ${m.sender_id === user.id ? 'sent' : 'received'}`}>
                                                {activeChat.type === 'group' && m.sender_id !== user.id && (
                                                    <div style={{fontSize: '0.6rem', opacity: 0.5, marginBottom: '2px'}}>{m.sender_name}</div>
                                                )}
                                                {m.content}
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="chat-input-wrap">
                                        <input type="text" 
                                               className="chat-input" 
                                               placeholder="Type a message..." 
                                               value={inputValue}
                                               onChange={e => setInputValue(e.target.value)}
                                               onKeyPress={e => e.key === 'Enter' && sendMessage()} />
                                        <button className="btn-send" onClick={sendMessage}>
                                            <i className="fas fa-paper-plane" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', textAlign: 'center', padding: '20px'}}>
                                    Select a contact to start encryption...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
