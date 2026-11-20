async function loadSessions() {
  try {
    const [received, sent, sessionData] = await Promise.all([
      api("/api/requests/received"), api("/api/requests/sent"), api("/api/sessions")
    ]);
    const accepted = [...received.requests, ...sent.requests].filter(r => r.status === "accepted");
    const container = document.getElementById("acceptedRequests");
    container.innerHTML = accepted.length ? accepted.map(r => {
      const other = r.sender?._id ? r.sender : r.receiver;
      return `<form class="schedule-form panel-soft" data-request="${r._id}" data-skill="${escapeHTML(r.requestedSkill)}">
        <b>${escapeHTML(r.requestedSkill)}</b><p class="muted">${escapeHTML(r.learningMode)} · ${escapeHTML(other?.name || "Connected student")}</p>
        <div class="filters compact"><label>Date<input name="date" type="date" min="${new Date().toISOString().slice(0,10)}" required></label><label>Start time<input name="startTime" type="time" required></label><label>Duration<select name="duration"><option value="30">30 minutes</option><option value="60" selected>1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option></select></label><label>Mode<select name="mode"><option value="online">Online</option><option value="offline">Offline</option></select></label></div>
        <label>Meeting details / place (optional)<input name="meetingDetails" placeholder="Meeting link or location"></label><button class="btn small">Schedule session</button></form>`;
    }).join("") : '<p class="empty">Accept a learning request first to schedule a session.</p>';

    document.getElementById("sessionsList").innerHTML = sessionData.sessions.length ? sessionData.sessions.map(s => `
      <article class="person-card"><span class="status ${s.status}">${s.status}</span><h3>${escapeHTML(s.skill)}</h3><p class="muted">${new Date(s.date).toLocaleDateString()} · ${escapeHTML(s.startTime)} · ${s.duration} min</p><p>Teacher: ${escapeHTML(s.teacher?.name || "")}</p><p>Learner: ${escapeHTML(s.learner?.name || "")}</p><p>${escapeHTML(s.mode)}</p>
      ${s.status === "scheduled" ? `<button class="btn small complete" data-id="${s._id}">Mark completed</button>` : ""}</article>`).join("") : '<div class="empty">No sessions scheduled yet.</div>';
  } catch (e) { alert(e.message); }
}
document.addEventListener("submit", async e => {
  const form = e.target.closest(".schedule-form");
  if (!form) return;
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.requestId = form.dataset.request;
  try {
    await api("/api/sessions", { method: "POST", body: JSON.stringify(data) });
    alert("Session scheduled!");
    loadSessions();
  } catch (error) { alert(error.message); }
});
document.addEventListener("click", async e => {
  const btn = e.target.closest(".complete");
  if (!btn) return;
  try {
    await api(`/api/sessions/${btn.dataset.id}/status`, {
      method: "PUT", body: JSON.stringify({ status: "completed" })
    });
    loadSessions();
  } catch (error) { alert(error.message); }
});
loadSessions();
