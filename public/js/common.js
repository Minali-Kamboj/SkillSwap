const token = localStorage.getItem("skillswapToken");
if (!token && !["/", "/index.html", "/login.html", "/register.html"].includes(location.pathname)) {
  location.href = "/login.html";
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem("skillswapToken");
    localStorage.removeItem("skillswapUser");
    location.href = "/login.html";
  }
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}
function logout() {
  localStorage.removeItem("skillswapToken");
  localStorage.removeItem("skillswapUser");
  location.href = "/login.html";
}
document.querySelectorAll("[data-logout], #logout").forEach(el => el.addEventListener("click", logout));
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}
function skillNames(list) {
  return (list || []).map(s => typeof s === "string" ? s : s.name).join(", ");
}
