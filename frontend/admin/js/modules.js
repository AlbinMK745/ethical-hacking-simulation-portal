/* Admin Modules Management Interface */

const ADMIN_MODULES_API = "http://127.0.0.1:8000/admin/modules";

let _adminModulesState = {
    modules: [],
    selectedModule: null,
    isEditing: false
};

// ============= MAIN ENTRY POINT =============

async function loadAdminModules() {
    document.getElementById("page-title").innerText = "Module Management";
    await renderAdminModulesPage();
    await fetchAdminModules();
}

function renderAdminModulesPage() {
    const view = document.getElementById("view");
    view.innerHTML = `
        <div class="admin-modules-container">
            <div class="admin-modules-header">
                <h2>Tutorial Modules</h2>
                <button class="btn-primary" onclick="openModuleEditor()">
                    <i class="fas fa-plus"></i> Create Module
                </button>
            </div>

            <div id="modulesListContainer" class="modules-list-admin">
                <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
            </div>

            <!-- Module Editor Modal -->
            <div id="moduleEditorModal" class="modal-overlay" style="display:none;">
                <div class="modal-box large">
                    <h2 id="editorTitle">Create Module</h2>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Title *</label>
                            <input type="text" id="moduleTitle" placeholder="Module title" />
                        </div>

                        <div class="form-group">
                            <label>Difficulty</label>
                            <select id="moduleDifficulty">
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Category</label>
                            <input type="text" id="moduleCategory" placeholder="e.g., Web Security" />
                        </div>

                        <div class="form-group">
                            <label>Thumbnail URL</label>
                            <input type="text" id="moduleThumbnail" placeholder="https://..." />
                        </div>

                        <div class="form-group full-width">
                            <label>Description</label>
                            <textarea id="moduleDescription" rows="3" placeholder="Module description"></textarea>
                        </div>

                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="modulePublished" checked />
                                Published (visible to users)
                            </label>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="closeModuleEditor()">Cancel</button>
                        <button class="btn-primary" onclick="saveModule()">Save Module</button>
                    </div>
                </div>
            </div>

            <!-- Room Editor Modal -->
            <div id="roomEditorModal" class="modal-overlay" style="display:none;">
                <div class="modal-box large">
                    <h2 id="roomEditorTitle">Create Task</h2>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Title *</label>
                            <input type="text" id="roomTitle" placeholder="Task title" />
                        </div>

                        <div class="form-group">
                            <label>Points</label>
                            <input type="number" id="roomPoints" value="10" min="0" />
                        </div>

                        <div class="form-group">
                            <label>Order</label>
                            <input type="number" id="roomOrder" value="0" min="0" />
                        </div>

                        <div class="form-group full-width">
                            <label>Description</label>
                            <textarea id="roomDescription" rows="2" placeholder="Short description"></textarea>
                        </div>

                        <div class="form-group full-width">
                            <label>Content (Supports basic markdown)</label>
                            <textarea id="roomContent" rows="10" placeholder="Task content..."></textarea>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="closeRoomEditor()">Cancel</button>
                        <button class="btn-primary" onclick="saveRoom()">Save Task</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============= FETCH MODULES =============

async function fetchAdminModules() {
    const container = document.getElementById("modulesListContainer");
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    const userId = getCurrentUserId();
    if (!userId) {
        window.location.replace("../admin-login.html");
        return;
    }

    try {
        const res = await fetch(ADMIN_MODULES_API, {
            headers: { "user-id": userId.toString() }
        });

        if (res.status === 401 || res.status === 403) {
            throw new Error("Unauthorized: Admin access required");
        }

        if (!res.ok) throw new Error("Failed to fetch modules");

        const data = await res.json();
        _adminModulesState.modules = data.modules || [];
        renderModulesList();

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="error-text">Error: ${err.message}</p>`;
    }
}

function renderModulesList() {
    const container = document.getElementById("modulesListContainer");

    if (_adminModulesState.modules.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:2rem;">No modules yet. Create one to get started!</p>';
        return;
    }

    container.innerHTML = _adminModulesState.modules.map(m => `
        <div class="module-card-admin" data-id="${m.id}">
            <div class="module-info">
                <h3>${m.title}</h3>
                <div class="module-meta">
                    <span class="badge ${m.difficulty.toLowerCase()}">${m.difficulty}</span>
                    <span class="meta-item"><i class="fas fa-tag"></i> ${m.category}</span>
                    <span class="meta-item"><i class="fas fa-list"></i> ${m.room_count || 0} tasks</span>
                    ${m.is_published ? '<span class="badge published">Published</span>' : '<span class="badge unpublished">Draft</span>'}
                </div>
            </div>
            <div class="module-actions">
                <button class="btn-icon" onclick="viewModuleRooms(${m.id})" title="View Tasks">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editModule(${m.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon danger" onclick="deleteModule(${m.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============= MODULE CRUD =============

function openModuleEditor(moduleId = null) {
    _adminModulesState.isEditing = !!moduleId;
    _adminModulesState.selectedModule = moduleId;

    const modal = document.getElementById("moduleEditorModal");
    const title = document.getElementById("editorTitle");

    if (moduleId) {
        title.innerText = "Edit Module";
        // Load module data
        const module = _adminModulesState.modules.find(m => m.id === moduleId);
        if (module) {
            document.getElementById("moduleTitle").value = module.title;
            document.getElementById("moduleDescription").value = module.description || "";
            document.getElementById("moduleDifficulty").value = module.difficulty;
            document.getElementById("moduleCategory").value = module.category;
            document.getElementById("moduleThumbnail").value = module.thumbnail_url || "";
            document.getElementById("modulePublished").checked = module.is_published;
        }
    } else {
        title.innerText = "Create Module";
        // Clear form
        document.getElementById("moduleTitle").value = "";
        document.getElementById("moduleDescription").value = "";
        document.getElementById("moduleDifficulty").value = "Beginner";
        document.getElementById("moduleCategory").value = "";
        document.getElementById("moduleThumbnail").value = "";
        document.getElementById("modulePublished").checked = true;
    }

    modal.style.display = "flex";
}

function closeModuleEditor() {
    document.getElementById("moduleEditorModal").style.display = "none";
}

async function saveModule() {
    const title = document.getElementById("moduleTitle").value.trim();
    if (!title) {
        alert("Title is required!");
        return;
    }

    const data = {
        title: title,
        description: document.getElementById("moduleDescription").value,
        difficulty: document.getElementById("moduleDifficulty").value,
        category: document.getElementById("moduleCategory").value,
        thumbnail_url: document.getElementById("moduleThumbnail").value || null,
        is_published: document.getElementById("modulePublished").checked
    };

    try {
        const url = _adminModulesState.isEditing
            ? `${ADMIN_MODULES_API}/${_adminModulesState.selectedModule}`
            : ADMIN_MODULES_API;

        const method = _adminModulesState.isEditing ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "user-id": getCurrentUserId()
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error("Failed to save module");

        closeModuleEditor();
        await fetchAdminModules();
        alert(_adminModulesState.isEditing ? "Module updated!" : "Module created!");

    } catch (err) {
        console.error(err);
        alert("Failed to save module. Check console.");
    }
}

function editModule(id) {
    openModuleEditor(id);
}

async function deleteModule(id) {
    if (!confirm("Delete this module and all its tasks? This cannot be undone.")) return;

    try {
        const res = await fetch(`${ADMIN_MODULES_API}/${id}`, {
            method: "DELETE",
            headers: { "user-id": getCurrentUserId() }
        });

        if (!res.ok) throw new Error("Failed to delete");

        await fetchAdminModules();
        alert("Module deleted successfully!");

    } catch (err) {
        console.error(err);
        alert("Failed to delete module.");
    }
}

// ============= ROOM MANAGEMENT =============

async function viewModuleRooms(moduleId) {
    try {
        const res = await fetch(`${ADMIN_MODULES_API}/${moduleId}`, {
            headers: { "user-id": getCurrentUserId() }
        });

        if (!res.ok) throw new Error("Failed to fetch module details");

        const data = await res.json();
        renderRoomsView(data.module, data.rooms);

    } catch (err) {
        console.error(err);
        alert("Failed to load module details.");
    }
}

function renderRoomsView(module, rooms) {
    const view = document.getElementById("view");
    view.innerHTML = `
        <div class="admin-modules-container">
            <div class="admin-modules-header">
                <button class="btn-secondary" onclick="loadAdminModules()">
                    <i class="fas fa-arrow-left"></i> Back to Modules
                </button>
                <h2>${module.title} - Tasks</h2>
                <button class="btn-primary" onclick="openRoomEditor(${module.id})">
                    <i class="fas fa-plus"></i> Add Task
                </button>
            </div>

            <div class="rooms-list-admin">
                ${rooms.length === 0 ? '<p style="text-align:center; color:#94a3b8; padding:2rem;">No tasks yet. Add one to get started!</p>' : ''}
                ${rooms.map(r => `
                    <div class="room-card-admin">
                        <div class="room-info">
                            <h4>${r.title}</h4>
                            <p>${r.description || 'No description'}</p>
                            <div class="room-meta">
                                <span><i class="fas fa-sort-numeric-up"></i> Order: ${r.order_index}</span>
                                <span><i class="fas fa-medal"></i> ${r.points} points</span>
                            </div>
                        </div>
                        <div class="room-actions">
                            <button class="btn-icon" onclick="editRoom(${module.id}, ${r.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon danger" onclick="deleteRoom(${module.id}, ${r.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Room Editor Modal (same as before) -->
            <div id="roomEditorModal" class="modal-overlay" style="display:none;">
                <div class="modal-box large">
                    <h2 id="roomEditorTitle">Create Task</h2>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Title *</label>
                            <input type="text" id="roomTitle" placeholder="Task title" />
                        </div>

                        <div class="form-group">
                            <label>Points</label>
                            <input type="number" id="roomPoints" value="10" min="0" />
                        </div>

                        <div class="form-group">
                            <label>Order</label>
                            <input type="number" id="roomOrder" value="0" min="0" />
                        </div>

                        <div class="form-group full-width">
                            <label>Description</label>
                            <textarea id="roomDescription" rows="2" placeholder="Short description"></textarea>
                        </div>

                        <div class="form-group full-width">
                            <label>Content (Supports basic markdown)</label>
                            <textarea id="roomContent" rows="10" placeholder="Task content..."></textarea>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="closeRoomEditor()">Cancel</button>
                        <button class="btn-primary" onclick="saveRoom()">Save Task</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    _adminModulesState.selectedModule = module.id;
}

let _roomEditId = null;

function openRoomEditor(moduleId, roomId = null) {
    _roomEditId = roomId;
    _adminModulesState.selectedModule = moduleId;

    const modal = document.getElementById("roomEditorModal");
    const title = document.getElementById("roomEditorTitle");

    if (roomId) {
        title.innerText = "Edit Task";
        // Fetch and load room data
        loadRoomData(moduleId, roomId);
    } else {
        title.innerText = "Create Task";
        // Clear form
        document.getElementById("roomTitle").value = "";
        document.getElementById("roomDescription").value = "";
        document.getElementById("roomContent").value = "";
        document.getElementById("roomPoints").value = "10";
        document.getElementById("roomOrder").value = "0";
    }

    modal.style.display = "flex";
}

async function loadRoomData(moduleId, roomId) {
    try {
        const res = await fetch(`${ADMIN_MODULES_API}/${moduleId}`, {
            headers: { "user-id": getCurrentUserId() }
        });

        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        const room = data.rooms.find(r => r.id === roomId);

        if (room) {
            document.getElementById("roomTitle").value = room.title;
            document.getElementById("roomDescription").value = room.description || "";
            document.getElementById("roomContent").value = room.content || "";
            document.getElementById("roomPoints").value = room.points;
            document.getElementById("roomOrder").value = room.order_index;
        }

    } catch (err) {
        console.error(err);
    }
}

function closeRoomEditor() {
    document.getElementById("roomEditorModal").style.display = "none";
}

async function saveRoom() {
    const title = document.getElementById("roomTitle").value.trim();
    if (!title) {
        alert("Title is required!");
        return;
    }

    const data = {
        title: title,
        description: document.getElementById("roomDescription").value,
        content: document.getElementById("roomContent").value,
        points: parseInt(document.getElementById("roomPoints").value),
        order_index: parseInt(document.getElementById("roomOrder").value)
    };

    try {
        const moduleId = _adminModulesState.selectedModule;
        const url = _roomEditId
            ? `${ADMIN_MODULES_API}/${moduleId}/rooms/${_roomEditId}`
            : `${ADMIN_MODULES_API}/${moduleId}/rooms`;

        const method = _roomEditId ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "user-id": getCurrentUserId()
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error("Failed to save room");

        closeRoomEditor();
        await viewModuleRooms(moduleId);
        alert(_roomEditId ? "Task updated!" : "Task created!");

    } catch (err) {
        console.error(err);
        alert("Failed to save task.");
    }
}

function editRoom(moduleId, roomId) {
    openRoomEditor(moduleId, roomId);
}

async function deleteRoom(moduleId, room_id) {
    if (!confirm("Delete this task?")) return;

    try {
        const res = await fetch(`${ADMIN_MODULES_API}/${moduleId}/rooms/${roomId}`, {
            method: "DELETE",
            headers: { "user-id": getCurrentUserId() }
        });

        if (!res.ok) throw new Error("Failed to delete");

        await viewModuleRooms(moduleId);
        alert("Task deleted!");

    } catch (err) {
        console.error(err);
        alert("Failed to delete task.");
    }
}

// Helper
function getCurrentUserId() {
    try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return null;
        const user = JSON.parse(userStr);
        return user.id;
    } catch (e) {
        return null;
    }
}
