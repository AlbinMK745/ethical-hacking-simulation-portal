/* Modules System Logic */

const MODULES_API_BASE = "http://127.0.0.1:8000/user/modules";

let _modulesState = {
    page: 1,
    limit: 12,
    search: "",
    difficulty: "All",
    category: "All",
    total_pages: 1,
    isLoading: false
};

// Entry Point
async function loadModules() {
    if (typeof setActiveByPage === 'function') setActiveByPage('tutorials'); // Keep 'tutorials' for sidebar active state or add 'modules'
    document.getElementById("page-title").innerText = "Learning Modules";

    // Render Initial Skeleton
    renderModulesLayout();

    // Fetch Data
    await fetchModules();
}

function renderModulesLayout() {
    const view = document.getElementById("view");
    view.innerHTML = `
        <div class="modules-page-container">
            
            <!-- Header -->
            <div class="modules-header">
                <div class="modules-title">
                    <h1>Explore Modules</h1>
                    <p>Hands-on labs and guided learning paths.</p>
                </div>

                <div class="modules-actions">
                    <div class="search-input-group">
                        <i class="fas fa-search"></i>
                        <input type="text" id="moduleSearch" placeholder="Search modules..." 
                               onkeyup="debounceSearch(this.value)">
                    </div>

                    <select class="filter-select" id="difficultyFilter" onchange="filterModules('difficulty', this.value)">
                        <option value="All">All Difficulty</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                </div>
            </div>

            <!-- Grid Content -->
            <div id="modulesGrid" class="modules-grid">
                <!-- Loading State -->
                <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
            </div>

            <!-- Pagination -->
            <div id="modulesPagination" class="modules-pagination"></div>

        </div>
    `;
}

// Fetch Logic
async function fetchModules() {
    _modulesState.isLoading = true;
    const grid = document.getElementById("modulesGrid");
    if (grid) grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#94a3b8;">Loading modules...</p>`;

    const user = JSON.parse(localStorage.getItem("user"));
    const queryParams = new URLSearchParams({
        page: _modulesState.page,
        limit: _modulesState.limit,
        search: _modulesState.search,
        difficulty: _modulesState.difficulty,
        category: _modulesState.category
    });

    try {
        const res = await fetch(`${MODULES_API_BASE}/?${queryParams}`, {
            headers: { "user-id": user?.id.toString() }
        });

        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        _modulesState.total_pages = data.total_pages;
        renderModulesGrid(data.modules);
        renderPagination();

    } catch (err) {
        console.error(err);
        if (grid) grid.innerHTML = `
            <div class="error-state" style="grid-column:1/-1; text-align:center; padding:2rem;">
                <i class="fas fa-exclamation-circle" style="font-size:2rem; color:#ef4444; margin-bottom:1rem;"></i>
                <p class="error-text">Failed to load modules.</p>
                <button onclick="fetchModules()" style="margin-top:1rem; padding:0.5rem 1rem; background:#334155; color:#fff; border:none; border-radius:4px; cursor:pointer;">Retry</button>
            </div>
        `;
    } finally {
        _modulesState.isLoading = false;
    }
}

// Render Grid
function renderModulesGrid(modules) {
    const grid = document.getElementById("modulesGrid");
    if (!grid) return;

    if (modules.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#94a3b8; padding: 2rem;">No modules found matching filters.</p>`;
        return;
    }

    grid.innerHTML = modules.map(m => {
        const diffClass = (m.difficulty || 'Beginner').toLowerCase();
        const progress = m.progress || 0;
        const isSaved = m.is_saved || false;
        const starClass = isSaved ? 'fas fa-star' : 'far fa-star';
        const savedClass = isSaved ? 'saved' : '';

        return `
        <div class="module-card" onclick="openModule(${m.id})">
            <button type="button" class="save-btn ${savedClass}" onclick="event.stopPropagation(); toggleSaveModule(${m.id}, this);" title="${isSaved ? 'Unsave' : 'Save'} module">
                <i class="${starClass}"></i>
            </button>
            
            <div class="module-card-content">
                <div class="module-thumb">
                    ${m.thumbnail_url
                ? `<img src="${m.thumbnail_url}" alt="${m.title}">`
                : `<i class="fas fa-cube module-thumb-placeholder"></i>`
            }
                </div>
                
                <div class="module-content">
                    <div class="module-meta">
                        <span class="module-cat">${m.category || 'General'}</span>
                        <span class="module-difficulty ${diffClass}">${m.difficulty || 'Beginner'}</span>
                    </div>
                    
                    <h3 class="module-title">${m.title}</h3>
                    <p class="module-desc">${m.description || 'No description.'}</p>
                    
                    <div class="module-footer">
                        <div class="progress-wrapper">
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${progress}%"></div>
                            </div>
                            <span>${progress}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join("");
}

// Pagination Rendering
function renderPagination() {
    const container = document.getElementById("modulesPagination");
    if (!container) return;

    let html = '';

    // Prev
    html += `<button class="page-btn" ${_modulesState.page === 1 ? 'disabled' : ''} 
             onclick="changeModulePage(${_modulesState.page - 1})"><i class="fas fa-chevron-left"></i></button>`;

    // Page Numbers (Simple logic for now)
    for (let i = 1; i <= _modulesState.total_pages; i++) {
        if (i === 1 || i === _modulesState.total_pages || (i >= _modulesState.page - 1 && i <= _modulesState.page + 1)) {
            html += `<button class="page-btn ${i === _modulesState.page ? 'active' : ''}" 
                      onclick="changeModulePage(${i})">${i}</button>`;
        } else if (i === _modulesState.page - 2 || i === _modulesState.page + 2) {
            html += `<span style="color:#666;">...</span>`;
        }
    }

    // Next
    html += `<button class="page-btn" ${_modulesState.page === _modulesState.total_pages ? 'disabled' : ''} 
             onclick="changeModulePage(${_modulesState.page + 1})"><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;
}

// Interactions
let searchTimeout;
function debounceSearch(val) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        _modulesState.search = val;
        _modulesState.page = 1; // Reset to page 1
        fetchModules();
    }, 400);
}

function filterModules(key, val) {
    _modulesState[key] = val;
    _modulesState.page = 1;
    fetchModules();
}

function changeModulePage(newPage) {
    if (newPage < 1 || newPage > _modulesState.total_pages) return;
    _modulesState.page = newPage;
    fetchModules();
}

// --- MODULE DETAIL VIEW ---
async function openModule(id) {
    const view = document.getElementById("view");
    view.innerHTML = `<p class="loading-text">Loading module...</p>`;

    const user = JSON.parse(localStorage.getItem("user"));

    try {
        const res = await fetch(`${MODULES_API_BASE}/${id}`, {
            headers: { "user-id": user?.id.toString() }
        });

        if (!res.ok) throw new Error("Load failed");

        const data = await res.json();
        renderModuleDetail(data); // Implement Detail Rendering

    } catch (err) {
        console.error(err);
        view.innerHTML = `
            <div class="error-state" style="text-align:center; padding:3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#ef4444; margin-bottom:1rem;"></i>
                <h3>Failed to load module content</h3>
                <button onclick="loadModules()" style="margin-top:1rem; padding:0.8rem 1.5rem; background:#334155; color:#fff; border:none; border-radius:4px; cursor:pointer;">Back to Modules</button>
            </div>
        `;
    }
}

function renderModuleDetail(data) {
    const view = document.getElementById("view");
    const { module, rooms } = data;

    // Simple Vertical Layout for Rooms
    view.innerHTML = `
        <div class="module-detail-page" style="padding: 2rem; max-width: 1000px; margin: 0 auto; color: #fff;">
            
            <button onclick="loadModules()" class="btn-back" style="margin-bottom: 1rem; background:transparent; border:1px solid #334155; color:#94a3b8; padding:0.5rem 1rem; border-radius:4px; cursor:pointer;">
                <i class="fas fa-arrow-left"></i> Back to Modules
            </button>

            <header style="margin-bottom: 3rem; border-bottom: 1px solid #334155; padding-bottom: 2rem;">
                <div style="display:flex; gap:10px; margin-bottom:1rem;">
                    <span class="module-difficulty ${module.difficulty.toLowerCase()}">${module.difficulty}</span>
                    <span style="background:#0f172a; padding:2px 8px; border-radius:4px; font-size:0.8rem; border:1px solid #334155;">${module.category}</span>
                </div>
                <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">${module.title}</h1>
                <p style="color:#94a3b8; line-height:1.6;">${module.description}</p>
                
                <div style="margin-top: 1.5rem;">
                    <div class="progress-wrapper" style="max-width:300px;">
                        <span>Progress: ${module.user_progress?.progress_percent || 0}%</span>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${module.user_progress?.progress_percent || 0}%"></div>
                        </div>
                    </div>
                </div>
            </header>

            <div class="rooms-list-container">
                <h2 style="margin-bottom: 1.5rem;"><i class="fas fa-list-ul"></i> Tasks</h2>
                ${rooms.map(room => `
                    <div class="room-card" style="background: #1e293b; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid ${room.is_completed ? '#22c55e' : '#334155'}; position:relative;">
                        <h3 style="margin-bottom: 0.5rem; display:flex; align-items:center; gap:10px;">
                            ${room.title}
                            ${room.is_completed ? '<i class="fas fa-check-circle" style="color:#22c55e;"></i>' : ''}
                        </h3>
                        <p style="color:#94a3b8; font-size:0.9rem; margin-bottom:1rem;">${room.description || ''}</p>
                        
                        <div class="room-content" style="background:#0f172a; padding:1rem; border-radius:6px; margin-bottom:1rem; color:#cbd5e1; font-size:0.95rem; line-height:1.6;">
                            ${formatContent(room.content)}
                        </div>

                        ${!room.is_completed ? `
                            <button onclick="completeRoom(${module.id}, ${room.id})" 
                                    style="background: #00ffbf; color: #000; border: none; padding: 0.5rem 1.5rem; border-radius: 4px; font-weight: bold; cursor: pointer;">
                                Complete Task (+${room.points} pts)
                            </button>
                        ` : `
                            <button disabled style="background: #1e293b; border: 1px solid #22c55e; color: #22c55e; padding: 0.5rem 1.5rem; border-radius: 4px; cursor: default;">
                                Completed
                            </button>
                        `}
                    </div>
                `).join("")}
            </div>

        </div>
    `;
}

// Helper: Format Content for Display
function formatContent(content) {
    if (!content) return '<p style="color:#94a3b8;">No content available.</p>';

    // Simple markdown-like processing
    let formatted = content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/`([^`]+)`/g, '<code style="background:#0f172a; padding:2px 6px; border-radius:3px; color:#00ffbf;">$1</code>');

    return `<p>${formatted}</p>`;
}

async function completeRoom(moduleId, roomId) {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
        const res = await fetch(`${MODULES_API_BASE}/${moduleId}/rooms/${roomId}/complete`, {
            method: "POST",
            headers: { "user-id": user?.id.toString() }
        });

        if (res.ok) {
            // Reload to show update
            openModule(moduleId);
            // Optionally show toast
        } else {
            alert("Failed to update progress");
        }
    } catch (e) {
        console.error(e);
    }
}

// Toggle Save/Bookmark Module
async function toggleSaveModule(moduleId, buttonEl) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Please log in to save modules");
        return;
    }

    const isSaved = buttonEl.classList.contains('saved');
    const method = isSaved ? 'DELETE' : 'POST';

    try {
        const res = await fetch(`${MODULES_API_BASE}/${moduleId}/save`, {
            method: method,
            headers: { "user-id": user.id.toString() }
        });

        if (res.ok) {
            // Toggle UI
            buttonEl.classList.toggle('saved');
            const icon = buttonEl.querySelector('i');
            if (isSaved) {
                icon.className = 'far fa-star';
                buttonEl.title = 'Save module';
            } else {
                icon.className = 'fas fa-star';
                buttonEl.title = 'Unsave module';
            }
        } else {
            alert("Failed to update saved status");
        }
    } catch (e) {
        console.error(e);
        alert("Failed to update saved status");
    }
}
