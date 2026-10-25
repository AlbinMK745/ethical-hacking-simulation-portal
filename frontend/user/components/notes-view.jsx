/**
 * NOTES VIEW
 * Personal storage for mission intel and tactical hints.
 */

function NotesView({ user }) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [rows, setRows] = React.useState([]);
    const [title, setTitle] = React.useState("");
    const [content, setContent] = React.useState("");
    const [editingNote, setEditingNote] = React.useState(null); // { id, title, content }

    const load = async () => {
        setLoading(true); setError("");
        try {
            const data = await api(`/user/notes/${user.id}`);
            setRows(Array.isArray(data) ? data : []);
        } catch (err) { setError(err.message); }
        setLoading(false);
    };

    React.useEffect(() => { load(); }, [user.id]);

    const add = async () => {
        if (!title.trim() || !content.trim()) return;
        try {
            if (editingNote) {
                // Update existing note
                await api(`/user/notes/${editingNote.id}?user_id=${user.id}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`, {
                    method: "PUT"
                });
                setEditingNote(null);
            } else {
                // Create new note
                await api(`/user/notes/?user_id=${user.id}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`, {
                    method: "POST"
                });
            }
            setTitle(""); setContent("");
            load();
        } catch (err) { alert(err.message); }
    };

    const startEdit = (note) => {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content);
        // Scroll sidebar to top to see the edit form if necessary
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingNote(null);
        setTitle("");
        setContent("");
    };

    const del = async (id) => {
        try {
            await api(`/user/notes/${id}?user_id=${user.id}`, { method: "DELETE" });
            load();
        } catch (err) { alert(err.message); }
    };

    if (loading) return <Loading text="Loading notes..." />;
    if (error) return <ErrorBox error={error} />;

    return (
        <div className="notes-layout">
            <div className="notes-sidebar-panel">
                <button className="btn-new-note" onClick={add}>
                    {editingNote ? "Update Note" : "+ New Note"}
                </button>
                {editingNote && (
                    <button className="btn-new-note" style={{ backgroundColor: '#ff4b4b', marginTop: '10px' }} onClick={cancelEdit}>
                        Cancel
                    </button>
                )}
                <div className="note-search-bar" style={{ marginTop: '20px' }}>
                    <i className="fas fa-heading"></i>
                    <input
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className="note-search-bar" style={{ flex: 1, height: 'auto', minHeight: '200px' }}>
                    <i className="fas fa-align-left" style={{ alignSelf: 'flex-start', marginTop: '12px' }}></i>
                    <textarea
                        placeholder="Note details..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            padding: '10px',
                            minHeight: '200px',
                            resize: 'none',
                            fontFamily: 'inherit',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>
            <div className="note-content-panel">
                <div className="notes-list-container">
                    {rows.map((n) => (
                        <div key={n.id} className="note-list-item">
                            <div className="n-item-top">
                                <h4>{n.title}</h4>
                                <div className="n-actions">
                                    <i
                                        className="fas fa-pen-to-square"
                                        onClick={() => startEdit(n)}
                                        style={{ marginRight: '15px', color: '#00ccff', cursor: 'pointer' }}
                                        title="Edit Note"
                                    ></i>
                                    <i
                                        className="fas fa-trash-alt"
                                        onClick={() => del(n.id)}
                                        style={{ cursor: 'pointer' }}
                                        title="Delete Note"
                                    ></i>
                                </div>
                            </div>
                            <span className="n-date">{new Date(n.created_at || Date.now()).toLocaleString()}</span>
                            <div className="note-body-text">
                                <p style={{ whiteSpace: 'pre-wrap' }}>{n.content}</p>
                            </div>
                        </div>
                    ))}
                    {rows.length === 0 ? <p className="dim-text">No mission intel found. Start documenting your findings.</p> : null}
                </div>
            </div>
        </div>
    );
}
