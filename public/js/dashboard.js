(async function () {
  try {
    const data = await api("/api/users/profile");
    const u = data.user;
    document.getElementById("welcome").textContent = `Welcome, ${u.name}`;
    document.getElementById("teachCount").textContent = (u.teachingSkills || []).length;
    document.getElementById("learnCount").textContent = (u.learningSkills || []).length;
    document.getElementById("teachingSkills").value = skillNames(u.teachingSkills);
    document.getElementById("learningSkills").value = skillNames(u.learningSkills);
    document.getElementById("languages").value = (u.languages || []).join(", ");
    document.getElementById("availability").value = (u.availability || []).join(", ");
    document.getElementById("bio").value = u.bio || "";
    document.getElementById("preference").value = u.sessionPreference || "online";
    [...document.getElementById("modes").options].forEach(o => o.selected = (u.teachingModes || []).includes(o.value));

    const [received, sent, sessions] = await Promise.all([
      api("/api/requests/received"), api("/api/requests/sent"), api("/api/sessions")
    ]);
    document.getElementById("requestCount").textContent =
      received.requests.filter(r => r.status === "pending").length;
    document.getElementById("sessionCount").textContent = sessions.sessions.length;
  } catch (e) { alert(e.message); }
})();

document.getElementById("profileForm").addEventListener("submit", async e => {
  e.preventDefault();
  const split = id => document.getElementById(id).value.split(",").map(x => x.trim()).filter(Boolean);
  const toSkills = id => split(id).map(name => ({ name, level: "Beginner" }));
  const payload = {
    teachingSkills: toSkills("teachingSkills"),
    learningSkills: toSkills("learningSkills"),
    languages: split("languages"),
    availability: split("availability"),
    teachingModes: [...document.getElementById("modes").selectedOptions].map(o => o.value),
    sessionPreference: document.getElementById("preference").value,
    bio: document.getElementById("bio").value
  };
  try {
    await api("/api/users/profile", { method: "PUT", body: JSON.stringify(payload) });
    const el = document.getElementById("profileMessage");
    el.textContent = "Profile saved successfully!";
    el.className = "message success";
    document.getElementById("teachCount").textContent = payload.teachingSkills.length;
    document.getElementById("learnCount").textContent = payload.learningSkills.length;
  } catch (error) { alert(error.message); }
});
