const API_BASE = "http://127.0.0.1:8000";

async function api(path, method = "GET", body = null) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No auth token found");
  }

  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("API ERROR:", text);
    throw new Error("API error");
  }

  return res.json();
}
