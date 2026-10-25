/**
 * REAL-TIME WEBSOCKET NOTIFICATION CLIENT
 * =========================================
 * Connects to ws://localhost:8000/ws/notifications/{userId}
 * Shows live toast notifications with type icons
 * Auto-reconnects on disconnect with exponential backoff
 */

const WsNotifications = (function () {

    let socket      = null;
    let userId      = null;
    let reconnectMs = 1500;
    let reconnectTimer = null;
    let isIntentionalClose = false;

    // ── Inject CSS ──────────────────────────────────────────────────────────
    (function injectStyles() {
        if (document.getElementById("ws-notif-styles")) return;
        const s = document.createElement("style");
        s.id = "ws-notif-styles";
        s.textContent = `
/* ─── WS Notification Toasts ───────────────────────── */
#ws-notif-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99998;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
    max-width: 340px;
}

.ws-toast {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: ws-slide-in 0.4s cubic-bezier(.34,1.56,.64,1) forwards;
    pointer-events: all;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}
.ws-toast::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    border-radius: 2px 0 0 2px;
}
@keyframes ws-slide-in {
    from { opacity:0; transform:translateX(60px) scale(0.92); }
    to   { opacity:1; transform:translateX(0) scale(1); }
}
@keyframes ws-slide-out {
    from { opacity:1; transform:translateX(0) scale(1); max-height:200px; margin-bottom:0; }
    to   { opacity:0; transform:translateX(60px) scale(0.9); max-height:0; margin-bottom:-10px; }
}
.ws-toast.dismissing { animation: ws-slide-out 0.35s ease forwards; }

.ws-toast-icon { font-size: 1.4rem; flex-shrink: 0; margin-top: 1px; }

.ws-toast-body { flex: 1; min-width: 0; }
.ws-toast-title {
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
    opacity: 0.75;
}
.ws-toast-msg {
    font-size: 0.88rem;
    font-weight: 500;
    line-height: 1.4;
    color: #fff;
}
.ws-toast-time {
    font-size: 0.68rem;
    opacity: 0.4;
    margin-top: 4px;
}
.ws-toast-close {
    font-size: 0.9rem;
    opacity: 0.4;
    cursor: pointer;
    padding: 2px 4px;
    background: none;
    border: none;
    color: #fff;
    flex-shrink: 0;
    transition: opacity 0.2s;
}
.ws-toast-close:hover { opacity: 0.9; }

/* ── Type colours ───────────────────────────────── */
.ws-toast.type-info     { background: linear-gradient(135deg,rgba(0,210,255,0.15),rgba(10,14,20,0.9)); }
.ws-toast.type-info::before { background: #00d2ff; }

.ws-toast.type-success  { background: linear-gradient(135deg,rgba(34,197,94,0.15),rgba(10,14,20,0.9)); }
.ws-toast.type-success::before { background: #22c55e; }

.ws-toast.type-warning  { background: linear-gradient(135deg,rgba(249,115,22,0.15),rgba(10,14,20,0.9)); }
.ws-toast.type-warning::before { background: #f97316; }

.ws-toast.type-error    { background: linear-gradient(135deg,rgba(239,68,68,0.15),rgba(10,14,20,0.9)); }
.ws-toast.type-error::before { background: #ef4444; }

.ws-toast.type-xp       { background: linear-gradient(135deg,rgba(139,92,246,0.15),rgba(10,14,20,0.9)); }
.ws-toast.type-xp::before { background: #8b5cf6; }

.ws-toast.type-achievement { background: linear-gradient(135deg,rgba(234,179,8,0.18),rgba(10,14,20,0.9)); }
.ws-toast.type-achievement::before { background: #eab308; }

/* ── Connection status dot ────────────────────── */
#ws-status-dot {
    position: fixed;
    bottom: 14px;
    right: 14px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    z-index: 99999;
    transition: background 0.4s, box-shadow 0.4s;
}
#ws-status-dot.connected {
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34,197,94,0.8);
    animation: ws-pulse 2s ease-in-out infinite;
}
@keyframes ws-pulse {
    0%,100% { box-shadow: 0 0 6px rgba(34,197,94,0.8); }
    50%      { box-shadow: 0 0 14px rgba(34,197,94,1); }
}
#ws-status-dot.disconnected { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.6); }
#ws-status-dot.connecting   { background: #f97316; box-shadow: 0 0 6px rgba(249,115,22,0.6); }
        `;
        document.head.appendChild(s);
    })();

    // ── Toast container ────────────────────────────────────────────────────
    function getContainer() {
        let c = document.getElementById("ws-notif-container");
        if (!c) {
            c = document.createElement("div");
            c.id = "ws-notif-container";
            document.body.appendChild(c);
        }
        return c;
    }

    // ── Status dot ─────────────────────────────────────────────────────────
    function setStatus(status) {
        let dot = document.getElementById("ws-status-dot");
        if (!dot) {
            dot = document.createElement("div");
            dot.id = "ws-status-dot";
            dot.title = "Real-time connection";
            document.body.appendChild(dot);
        }
        dot.className = status; // 'connected' | 'disconnected' | 'connecting'
    }

    // ── Show notification toast ────────────────────────────────────────────
    const TYPE_ICONS = {
        info:        "ℹ️",
        success:     "✅",
        warning:     "⚠️",
        error:       "🚨",
        xp:          "⚡",
        achievement: "🏆",
        announcement:"📢",
        challenge:   "🎯",
        streak:      "🔥",
    };

    function showToast(message, type = "info", duration = 5000) {
        const container = getContainer();
        const toast     = document.createElement("div");
        const typeKey   = TYPE_ICONS[type] ? type : "info";

        toast.className = `ws-toast type-${typeKey}`;
        toast.innerHTML = `
            <span class="ws-toast-icon">${TYPE_ICONS[typeKey] || "ℹ️"}</span>
            <div class="ws-toast-body">
                <div class="ws-toast-title">${typeKey}</div>
                <div class="ws-toast-msg">${message}</div>
                <div class="ws-toast-time">${new Date().toLocaleTimeString()}</div>
            </div>
            <button class="ws-toast-close" title="Dismiss">✕</button>
        `;

        const dismiss = () => {
            toast.classList.add("dismissing");
            setTimeout(() => toast.remove(), 380);
        };

        toast.querySelector(".ws-toast-close").addEventListener("click", dismiss);
        toast.addEventListener("click", (e) => { if (!e.target.classList.contains("ws-toast-close")) dismiss(); });

        container.appendChild(toast);
        if (duration > 0) setTimeout(dismiss, duration);
    }

    // ── Handle incoming WS message ─────────────────────────────────────────
    function handleMessage(raw) {
        let data;
        try { data = JSON.parse(raw); } catch { return; }

        switch (data.type) {
            case "notification":
                showToast(data.message, data.notif_type || "info");
                // Also refresh the notification bell count if function exists
                if (typeof window.refreshNotificationCount === "function") {
                    window.refreshNotificationCount();
                }
                break;
            case "announcement":
                showToast(data.message, "announcement", 10000);
                break;
            case "xp_awarded":
                if (window.XpSystem) {
                    window.XpSystem.showXpToast(data.amount, data.reason);
                    if (data.leveled_up && data.level_info) {
                        setTimeout(() => window.XpSystem.showLevelUpModal(data.level_info), 600);
                    }
                }
                break;
            case "connected":
                console.log("[WS] Connected:", data.message);
                setStatus("connected");
                break;
            case "pong":
                break;
            default:
                console.log("[WS] Unknown message:", data);
        }
    }

    // ── Connect ────────────────────────────────────────────────────────────
    function connect(uid) {
        if (socket && socket.readyState === WebSocket.OPEN) return;

        userId = uid;
        isIntentionalClose = false;
        setStatus("connecting");

        const protocol = location.protocol === "https:" ? "wss" : "ws";
        const wsUrl    = `${protocol}://${location.hostname}:8000/ws/notifications/${userId}`;

        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            setStatus("connected");
            reconnectMs = 1500;
            // Start keepalive pings
            clearInterval(window._wsPingInterval);
            window._wsPingInterval = setInterval(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send("ping");
                }
            }, 25000);
        };

        socket.onmessage = (e) => handleMessage(e.data);

        socket.onclose = () => {
            setStatus("disconnected");
            clearInterval(window._wsPingInterval);
            if (!isIntentionalClose) {
                // Exponential backoff reconnect
                clearTimeout(reconnectTimer);
                reconnectTimer = setTimeout(() => {
                    reconnectMs = Math.min(reconnectMs * 1.5, 30000);
                    connect(userId);
                }, reconnectMs);
            }
        };

        socket.onerror = (e) => {
            console.warn("[WS] Error:", e);
            setStatus("disconnected");
        };
    }

    function disconnect() {
        isIntentionalClose = true;
        clearTimeout(reconnectTimer);
        clearInterval(window._wsPingInterval);
        if (socket) { socket.close(); socket = null; }
        setStatus("disconnected");
    }

    // ── Public ────────────────────────────────────────────────────────────
    return { connect, disconnect, showToast, setStatus };

})();

window.WsNotifications = WsNotifications;
