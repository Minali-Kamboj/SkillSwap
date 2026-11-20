const API = "";
const messageEl = document.getElementById("message");

async function submitAuth(form, endpoint) {
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch(`${API}/api/auth/${endpoint}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Something went wrong.");
    localStorage.setItem("skillswapToken", result.token);
    localStorage.setItem("skillswapUser", JSON.stringify(result.user));
    location.href = "/dashboard.html";
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message error";
  }
}

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
if (loginForm) loginForm.addEventListener("submit", e => {
  e.preventDefault(); submitAuth(loginForm, "login");
});
if (registerForm) registerForm.addEventListener("submit", e => {
  e.preventDefault(); submitAuth(registerForm, "register");
});
