const form = document.getElementById("searchForm");
const results = document.getElementById("results");

form.addEventListener("submit", async e => {
  e.preventDefault();
  const params = new URLSearchParams();
  ["skill", "language", "university", "mode"].forEach(id => {
    const value = document.getElementById(id).value.trim();
    if (value) params.set(id, value);
  });
  results.innerHTML = '<div class="empty">Searching students...</div>';
  try {
    const data = await api(`/api/users/discover?${params.toString()}`);
    document.getElementById("resultCount").textContent = `${data.count} student(s) found`;
    if (!data.users.length) {
      results.innerHTML = '<div class="empty">No exact match yet. Try another skill or remove a filter.</div>';
      return;
    }
    results.innerHTML = data.users.map(u => `
      <article class="person-card">
        <div class="person-top"><div class="person-avatar">${escapeHTML(u.name.charAt(0).toUpperCase())}</div><span class="match">${u.matchScore}% match</span></div>
        <h3>${escapeHTML(u.name)}</h3><p class="muted">${escapeHTML(u.university || "University not added")} · ${escapeHTML(u.country || "")}</p>
        <div class="tag-row">${(u.teachingSkills || []).map(s => `<span class="tag">${escapeHTML(s.name)}</span>`).join("")}</div>
        <p class="small-text"><b>Languages:</b> ${escapeHTML((u.languages || []).join(", ") || "Not specified")}</p>
        <p class="small-text"><b>Modes:</b> ${escapeHTML((u.teachingModes || []).join(", "))}</p>
        ${u.complementary ? '<span class="tag green">Complementary skill match</span>' : ""}
        <button class="btn full request-btn" data-id="${u._id}" data-name="${escapeHTML(u.name)}">Send learning request</button>
      </article>`).join("");
  } catch (error) { results.innerHTML = `<div class="empty">${escapeHTML(error.message)}</div>`; }
});

results.addEventListener("click", async e => {
  const btn = e.target.closest(".request-btn");
  if (!btn) return;
  const requestedSkill = document.getElementById("skill").value.trim();
  if (!requestedSkill) return alert("Enter the skill you want to learn before sending a request.");
  const learningMode = prompt("Choose mode: exchange, volunteer, or mentorship", "volunteer");
  if (!learningMode || !["exchange", "volunteer", "mentorship"].includes(learningMode.toLowerCase())) {
    return alert("Please enter exchange, volunteer, or mentorship.");
  }
  let offeredSkill = "";
  if (learningMode.toLowerCase() === "exchange") {
    offeredSkill = prompt("Which skill can you teach in return?");
    if (!offeredSkill) return;
  }
  const message = prompt("Add a short message (optional):", "") || "";
  try {
    await api("/api/requests", { method: "POST", body: JSON.stringify({
      receiverId: btn.dataset.id, requestedSkill,
      learningMode: learningMode.toLowerCase(), offeredSkill, message
    })});
    btn.textContent = "Request sent";
    btn.disabled = true;
  } catch (error) { alert(error.message); }
});
