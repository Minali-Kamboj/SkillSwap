const express = require("express");
const Session = require("../models/Session");
const Request = require("../models/Request");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { requestId, date, startTime, duration, mode, meetingDetails } = req.body;
    if (!requestId || !date || !startTime || !duration) {
      return res.status(400).json({ message: "Request, date, time and duration are required." });
    }

    const request = await Request.findById(requestId);
    if (!request || request.status !== "accepted") {
      return res.status(400).json({ message: "A session can only be scheduled for an accepted request." });
    }

    let teacher, learner, skill;

    if (request.learningMode === "exchange") {
      teacher = request.receiver;
      learner = request.sender;
      skill = request.requestedSkill;
    } else {
      teacher = request.receiver;
      learner = request.sender;
      skill = request.requestedSkill;
    }

    if (![String(request.sender), String(request.receiver)].includes(String(req.user._id))) {
      return res.status(403).json({ message: "You are not part of this request." });
    }

    const session = await Session.create({
      request: request._id, teacher, learner, skill,
      date, startTime, duration: Number(duration),
      mode: mode || "online", meetingDetails: meetingDetails || ""
    });

    res.status(201).json({ message: "Session scheduled.", session });
  } catch (error) {
    res.status(400).json({ message: "Could not schedule session.", error: error.message });
  }
});

router.get("/", protect, async (req, res) => {
  const sessions = await Session.find({
    $or: [{ teacher: req.user._id }, { learner: req.user._id }]
  }).populate("teacher learner", "name university").sort({ date: 1 });
  res.json({ sessions });
});

router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid session status." });
    }
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found." });

    const participant = [String(session.teacher), String(session.learner)]
      .includes(String(req.user._id));
    if (!participant) return res.status(403).json({ message: "Not authorized." });

    session.status = status;
    await session.save();
    res.json({ message: "Session updated.", session });
  } catch (error) {
    res.status(500).json({ message: "Could not update session.", error: error.message });
  }
});

module.exports = router;
