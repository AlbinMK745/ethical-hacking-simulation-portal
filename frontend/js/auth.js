const API_BASE = "http://127.0.0.1:8000";

async function login(role) {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  let res, data;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: email,
        password: password
      })
    });

    data = await res.json();
  } catch (err) {
    alert("Backend not reachable");
    return;
  }

  if (!res.ok) {
    alert(data.detail || "Login failed");
    return;
  }

  // ✅ SINGLE SOURCE OF TRUTH
  const user = {
    id: data.user_id,
    username: data.username,
    email: data.email,
    role: data.role,
    level: data.level || 1,
    points: data.points || 0
  };

  localStorage.setItem("user", JSON.stringify(user));

  if (user.role === "admin") {
    window.location.replace("/frontend/admin/admin.html");
  } else {
    window.location.replace("/frontend/user/dashboard.html");
  }
}
