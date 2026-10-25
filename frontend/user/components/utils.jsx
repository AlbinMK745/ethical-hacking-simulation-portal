/**
 * USER PORTAL UTILITIES
 * Core functions for API interaction and security guards.
 */

const API_BASE = "http://127.0.0.1:8000";

/**
 * Global API wrapper for the user portal.
 */
async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, options);
    const contentType = res.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) {
        const msg = body && body.detail ? body.detail : (typeof body === "string" ? body : "Request failed");
        throw new Error(msg);
    }
    return body;
}

/**
 * Hook to retrieve and guard user session data.
 */
function useUserGuard() {
    return React.useMemo(() => {
        try {
            const raw = localStorage.getItem("user");
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }, []);
}
