async function loadRequests() {
  try {
    const [received, sent] = await Promise.all([api("/api/requests/received"), api("/api/requests/sent")]);
    document.getElementById("received").innerHTML = received.requests.length ? received.requests.map(r => `
      <div class="request-item"><div><b>${escapeHTML(r.sender?.name || "Student")}</b><p class="muted">${escapeHTML(r.requestedSkill)} · ${escapeHTML(r.learningMode)}</p><p>${escapeHTML(r.message || "")}</p><span class="status ${r.status}">${r.status}</span></div>
      ${r.status === "pending" ? `<div class="button-row"><button class="btn small accept" data-id="${r._id}" data-status="accepted">Accept</button><button class="btn small danger reject" data-id="${r._id}" data-status="rejected">Reject</button></div>` : ""}</div>`).join("") : '<p class="empty">No received requests yet.</p>';
    document.getElementById("sent").innerHTML = sent.requests.length ? sent.requests.map(r => `
      <div class="request-item"><div><b>${escapeHTML(r.receiver?.name || "Student")}</b><p class="muted">${escapeHTML(r.requestedSkill)} · ${escapeHTML(r.learningMode)}</p><span class="status ${r.status}">${r.status}</span></div></div>`).join("") : '<p class="empty">You have not sent any requests.</p>';
  } catch (e) { alert(e.message); }
}
document.addEventListener("click", async e => {
  const btn = e.target.closest("[data-status]");
  if (!btn) return;
  try {
    await api(`/api/requests/${btn.dataset.id}`, { method: "PUT", body: JSON.stringify({ status: btn.dataset.status }) });
    loadRequests();
  } catch (error) { alert(error.message); }
});
loadRequests();
