const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();

function makeToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, university, country } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed, university, country,
      languages: ["English"],
      teachingModes: ["exchange"]
    });

    res.status(201).json({
      message: "Account created successfully.",
      token: makeToken(user._id),
      user: {
        id: user._id, name: user.name, email: user.email,
        university: user.university, country: user.country
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not register user.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() }).select("+password");
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    if (!user.isActive) return res.status(403).json({ message: "This account is inactive." });

    res.json({
      message: "Login successful.",
      token: makeToken(user._id),
      user: {
        id: user._id, name: user.name, email: user.email,
        university: user.university, country: user.country
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not log in.", error: error.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
