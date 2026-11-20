const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  res.json({ user: req.user });
});

router.put("/profile", protect, async (req, res) => {
  try {
    const allowed = ["name", "university", "country", "languages", "teachingSkills",
      "learningSkills", "teachingModes", "availability", "sessionPreference", "bio"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) req.user[key] = req.body[key];
    }
    await req.user.save();
    res.json({ message: "Profile updated.", user: req.user });
  } catch (error) {
    res.status(400).json({ message: "Could not update profile.", error: error.message });
  }
});

router.get("/discover", protect, async (req, res) => {
  try {
    const { skill, language, university, mode, country } = req.query;
    const query = { _id: { $ne: req.user._id }, isActive: true };

    if (skill) query["teachingSkills.name"] = { $regex: skill.trim(), $options: "i" };
    if (language) query.languages = { $in: [new RegExp(`^${escapeRegex(language)}$`, "i")] };
    if (university) query.university = { $regex: escapeRegex(university), $options: "i" };
    if (country) query.country = { $regex: escapeRegex(country), $options: "i" };
    if (mode) query.teachingModes = mode;

    const users = await User.find(query)
      .select("name university country languages teachingSkills learningSkills teachingModes availability sessionPreference bio")
      .limit(100);

    const results = users.map(candidate => {
      const score = calculateScore(req.user, candidate, skill, language);
      const complementary = isComplementary(req.user, candidate);
      return { ...candidate.toObject(), matchScore: score, complementary };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ count: results.length, users: results });
  } catch (error) {
    res.status(500).json({ message: "Search failed.", error: error.message });
  }
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function norm(value) {
  return String(value || "").trim().toLowerCase();
}

function hasSkill(skills, name) {
  return (skills || []).some(s => norm(s.name) === norm(name));
}

function calculateScore(current, candidate, requestedSkill, requestedLanguage) {
  const skillMatch = requestedSkill
    ? (hasSkill(candidate.teachingSkills, requestedSkill) ? 1 : 0)
    : 0.7;

  const preferredLanguages = requestedLanguage
    ? [requestedLanguage]
    : (current.languages || []);
  const languageMatch = preferredLanguages.length
    ? ((candidate.languages || []).some(lang =>
        preferredLanguages.some(pref => norm(pref) === norm(lang))) ? 1 : 0.5)
    : 0.7;

  const levelMatch = 0.8; // MVP: experience-level preference can be added to the search form.
  const availabilityMatch = (current.availability || []).some(day =>
    (candidate.availability || []).includes(day)) ? 1 : 0.6;

  const score = (0.40 * skillMatch) + (0.20 * languageMatch) +
    (0.15 * levelMatch) + (0.15 * availabilityMatch) + (0.10 * 0.7);

  return Math.round(score * 100);
}

function isComplementary(a, b) {
  const aCanTeachB = (a.teachingSkills || []).some(s =>
    hasSkill(b.learningSkills, s.name));
  const bCanTeachA = (b.teachingSkills || []).some(s =>
    hasSkill(a.learningSkills, s.name));
  return aCanTeachB && bCanTeachA;
}

module.exports = router;
