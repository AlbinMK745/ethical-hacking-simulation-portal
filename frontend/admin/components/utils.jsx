/**
 * ADMIN DASHBOARD UTILITIES
 * This file contains core functions for API interaction and session management.
 */

const API_BASE = "http://127.0.0.1:8000";

/**
 * Generic API wrapper with error handling and user-id header injection.
 * @param {string} path - The API endpoint path.
 * @param {object} options - Fetch options (method, body, headers).
 * @param {number|string} userId - Optional user ID for authorization.
 */
async function api(path, options = {}, userId = null) {
  const headers = Object.assign({}, options.headers || {});
  if (!headers["Content-Type"] && options.body) headers["Content-Type"] = "application/json";
  if (userId != null && !headers["user-id"]) headers["user-id"] = String(userId);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = body && body.detail ? body.detail : (typeof body === "string" ? body : "Request failed");
    throw new Error(msg);
  }
  return body;
}

/**
 * Retrieves the currently logged-in user from localStorage.
 * @returns {object|null} The user object or null if not found.
 */
function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
