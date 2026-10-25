/* =========================================
   NOTIFICATIONS MODULE
   ========================================= */

let notificationCheckInterval = null;

// Initialize notifications on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeNotifications();
});

function initializeNotifications() {
    // Add notification bell to header
    addNotificationBellToHeader();

    // Load initial unread count
    updateUnreadCount();

    // Poll for new notifications every 5 seconds
    notificationCheckInterval = setInterval(updateUnreadCount, 5000);
}

function addNotificationBellToHeader() {
    const userSection = document.querySelector('.user-section');
    if (!userSection) return;

    // Create notification bell HTML
    const bellHTML = `
        <div class="notification-bell" onclick="toggleNotificationDropdown()">
            <i class="fas fa-bell"></i>
            <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
        </div>
    `;

    // Insert before user section
    userSection.insertAdjacentHTML('beforebegin', bellHTML);
}

let lastUnreadCount = -1;

async function updateUnreadCount() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
        const res = await fetch("http://127.0.0.1:8000/user/notifications/unread-count", {
            headers: { "user-id": user.id.toString() }
        });

        const data = await res.json();
        const badge = document.getElementById("notificationBadge");

        if (badge) {
            if (data.unread_count > 0) {
                badge.textContent = data.unread_count > 99 ? '99+' : data.unread_count;
                badge.style.display = 'flex';
                // Animation effect when count changes
                if (lastUnreadCount !== -1 && data.unread_count > lastUnreadCount) {
                    badge.animate([
                        { transform: 'scale(1)' },
                        { transform: 'scale(1.5)' },
                        { transform: 'scale(1)' }
                    ], {
                        duration: 300
                    });
                }
            } else {
                badge.style.display = 'none';
            }
        }

        // If count changed or strictly periodically, refresh lists if visible
        // We do it every time there's a count change OR simply every poll if we want to catch non-count updates?
        // Actually, let's just refresh if dropdown is open OR if on notifications page
        const dropdown = document.getElementById("notificationDropdown");
        const isOpen = dropdown && dropdown.classList.contains('show');
        const isNotificationPage = document.getElementById("page-title") && document.getElementById("page-title").innerText === "Notifications";

        if (isOpen) {
            loadNotifications(true); // silent load
        }
        if (isNotificationPage) {
            loadNotificationsPage(true); // silent load
        }

        lastUnreadCount = data.unread_count;

    } catch (err) {
        console.error("Failed to fetch unread count:", err);
    }
}

function toggleNotificationDropdown() {
    let dropdown = document.getElementById("notificationDropdown");

    if (!dropdown) {
        createNotificationDropdown();
    } else {
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
            loadNotifications();
        }
    }
}

function createNotificationDropdown() {
    const dropdownHTML = `
        <div class="notification-dropdown show" id="notificationDropdown">
            <div class="notification-dropdown-header">
                <h3>Notifications</h3>
                <button class="mark-all-read-btn" onclick="markAllAsRead()">Mark all read</button>
            </div>
            <div class="notification-list" id="notificationList">
                <div style="text-align: center; padding: 2rem; color: #8892b0;">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading notifications...</p>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', dropdownHTML);

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        const dropdown = document.getElementById("notificationDropdown");
        const bell = document.querySelector('.notification-bell');

        if (dropdown && !dropdown.contains(e.target) && !bell.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    loadNotifications();
}

async function loadNotifications(silent = false) {
    const user = JSON.parse(localStorage.getItem("user"));
    const listEl = document.getElementById("notificationList");

    if (!listEl) return;

    try {
        const res = await fetch("http://127.0.0.1:8000/user/notifications/", {
            headers: { "user-id": user.id.toString() }
        });

        const notifications = await res.json();

        if (notifications.length === 0) {
            listEl.innerHTML = `
                <div class="notification-empty">
                    <i class="far fa-bell-slash"></i>
                    <p><strong>No notifications yet</strong></p>
                    <p>You're all caught up!</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = notifications.map(notif => renderNotificationItem(notif)).join('');
    } catch (err) {
        console.error("Failed to load notifications:", err);
        if (!silent) {
            listEl.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load notifications</p>
                </div>
            `;
        }
    }
}

function renderNotificationItem(notif) {
    const typeIcons = {
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle',
        success: 'fa-check-circle',
        error: 'fa-times-circle'
    };

    const icon = typeIcons[notif.type] || typeIcons.info;
    const unreadClass = !notif.is_read ? 'unread' : '';
    const timeAgo = getTimeAgo(notif.created_at);

    return `
        <div class="notification-item ${unreadClass}" onclick="markNotificationRead(${notif.id})">
            <div class="notification-item-header">
                <div class="notification-type-icon ${notif.type}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${escapeHtml(notif.title)}</div>
                    <div class="notification-message">${escapeHtml(notif.message)}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
            </div>
        </div>
    `;
}

async function markNotificationRead(notificationId) {
    const user = JSON.parse(localStorage.getItem("user"));

    try {
        await fetch(`http://127.0.0.1:8000/user/notifications/${notificationId}/read`, {
            method: "PUT",
            headers: { "user-id": user.id.toString() }
        });

        // Update UI
        const item = event.currentTarget;
        item.classList.remove('unread');

        // Update unread count
        updateUnreadCount();
    } catch (err) {
        console.error("Failed to mark as read:", err);
    }
}

async function markAllAsRead() {
    const user = JSON.parse(localStorage.getItem("user"));

    try {
        await fetch("http://127.0.0.1:8000/user/notifications/mark-all-read", {
            method: "PUT",
            headers: { "user-id": user.id.toString() }
        });

        // Reload notifications
        loadNotifications();
        updateUnreadCount();
    } catch (err) {
        console.error("Failed to mark all as read:", err);
    }
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return date.toLocaleDateString();
}

/* =========================================
   NOTIFICATIONS PAGE
   ========================================= */

async function loadNotificationsPage(silent = false) {
    if (typeof setActiveByPage === 'function' && !silent) setActiveByPage("notifications");
    if (!silent) document.getElementById("page-title").innerText = "Notifications";

    const view = document.getElementById("view");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!silent) {
        view.innerHTML = `<div style="text-align: center; padding: 3rem; color: #8892b0;">
        <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-cyan);"></i>
        <p style="margin-top: 1rem;">Loading full notification history...</p>
      </div>`;
    }

    try {
        // Fetch all notifications (limit=50 for the page view)
        const res = await fetch(`http://127.0.0.1:8000/user/notifications/?limit=50`, {
            headers: { "user-id": user.id.toString() }
        });
        const notifications = await res.json();

        // If silent refresh, we just update the list container if it exists
        if (silent) {
            const listContainer = document.querySelector(".notifications-full-list");
            if (listContainer) {
                listContainer.innerHTML = notifications.length > 0 ? notifications.map(notif => renderNotificationItemFull(notif)).join('') : renderEmptyState();
                return;
            }
            // If container doesn't exist (navigated away?), just return
            return;
        }

        view.innerHTML = `
      <div class="notifications-page-container" style="max-width: 800px; margin: 0 auto; padding: 2rem;">
        
        <div class="notifications-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h2 style="color: #fff; margin: 0;">All Notifications</h2>
          <div class="actions">
             <button class="btn-secondary" onclick="markAllAsReadAndRefresh()" style="border: 1px solid var(--primary-cyan); color: var(--primary-cyan); background: transparent; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-check-double"></i> Mark All Read
             </button>
          </div>
        </div>

        <div class="notifications-full-list" style="background: #0b0f14; border: 1px solid #1f2229; border-radius: 12px; overflow: hidden;">
            ${notifications.length > 0 ? notifications.map(notif => renderNotificationItemFull(notif)).join('') : renderEmptyState()}
        </div>

      </div>
    `;

    } catch (err) {
        console.error("Failed to load notifications page:", err);
        if (!silent) view.innerHTML = `<p class="error-text">Failed to load notifications.</p>`;
    }
}

async function markAllAsReadAndRefresh() {
    await markAllAsRead();
    loadNotificationsPage(); // Refresh the full page list
}

function renderEmptyState() {
    return `
    <div style="padding: 3rem; text-align: center; color: #8892b0;">
        <i class="far fa-bell-slash" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <p>No notifications found.</p>
    </div>
    `;
}

function renderNotificationItemFull(notif) {
    const typeIcons = {
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle',
        success: 'fa-check-circle',
        error: 'fa-times-circle'
    };

    const icon = typeIcons[notif.type] || typeIcons.info;
    const unreadStyle = !notif.is_read ? 'border-left: 3px solid var(--primary-cyan); background: rgba(0, 217, 255, 0.03);' : 'border-left: 3px solid transparent;';
    const timeAgo = getTimeAgo(notif.created_at);

    return `
        <div class="notification-item-full" style="padding: 1.5rem; border-bottom: 1px solid #1f2229; display: flex; gap: 1rem; align-items: flex-start; ${unreadStyle}" onclick="markNotificationReadFull(${notif.id}, this)">
            <div class="notification-type-icon ${notif.type}" style="width: 40px; height: 40px; font-size: 1.2rem;">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content" style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <h3 style="color: #fff; font-size: 1rem; margin: 0; font-weight: 600;">${escapeHtml(notif.title)}</h3>
                    <span style="color: #666; font-size: 0.8rem;">${timeAgo}</span>
                </div>
                <p style="color: #8892b0; font-size: 0.9rem; line-height: 1.5; margin: 0;">${escapeHtml(notif.message)}</p>
            </div>
        </div>
    `;
}

async function markNotificationReadFull(notificationId, element) {
    // If it's already read (no border/bg), we might not need to do anything visually, 
    // but the API call is idempotent.
    // However, if it has the unread style, we strip it.
    if (element.style.borderLeftColor === 'transparent') return;

    const user = JSON.parse(localStorage.getItem("user"));
    try {
        await fetch(`http://127.0.0.1:8000/user/notifications/${notificationId}/read`, {
            method: "PUT",
            headers: { "user-id": user.id.toString() }
        });

        // Remove 'unordered' styling visually
        element.style.borderLeft = "3px solid transparent";
        element.style.background = "transparent";

        // Update global unread count
        updateUnreadCount();

    } catch (err) {
        console.error(err);
    }
}
