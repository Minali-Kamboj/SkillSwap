const express = require("express");
const Request = require("../models/Request");
const User = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { receiverId, learningMode, requestedSkill, offeredSkill, message } = req.body;
    if (!receiverId || !learningMode || !requestedSkill) {
      return res.status(400).json({ message: "Receiver, learning mode and requested skill are required." });
    }
    if (!["exchange", "volunteer", "mentorship"].includes(learningMode)) {
      return res.status(400).json({ message: "Invalid learning mode." });
    }
    if (String(receiverId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot send a request to yourself." });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver || !receiver.isActive) return res.status(404).json({ message: "Student not found." });

    if (learningMode === "exchange" && !offeredSkill) {
      return res.status(400).json({ message: "Please specify the skill you can offer in exchange." });
    }

    const duplicate = await Request.findOne({
      sender: req.user._id, receiver: receiverId,
      requestedSkill, status: { $in: ["pending", "accepted"] }
    });
    if (duplicate) return res.status(409).json({ message: "You already have an active request for this skill." });

    const request = await Request.create({
      sender: req.user._id, receiver: receiverId, learningMode,
      requestedSkill, offeredSkill: offeredSkill || "", message: message || ""
    });
    res.status(201).json({ message: "Request sent.", request });
  } catch (error) {
    res.status(500).json({ message: "Could not send request.", error: error.message });
  }
});

router.get("/received", protect, async (req, res) => {
  const requests = await Request.find({ receiver: req.user._id })
    .populate("sender", "name university country")
    .sort({ createdAt: -1 });
  res.json({ requests });
});

router.get("/sent", protect, async (req, res) => {
  const requests = await Request.find({ sender: req.user._id })
    .populate("receiver", "name university country")
    .sort({ createdAt: -1 });
  res.json({ requests });
});

router.put("/:id", protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid request status." });
    }
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    const isReceiver = String(request.receiver) === String(req.user._id);
    const isSender = String(request.sender) === String(req.user._id);

    if (status === "cancelled" && !isSender) {
      return res.status(403).json({ message: "Only the sender can cancel this request." });
    }
    if (status !== "cancelled" && !isReceiver) {
      return res.status(403).json({ message: "Only the receiver can accept or reject this request." });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be updated." });
    }

    request.status = status;
    await request.save();
    res.json({ message: `Request ${status}.`, request });
  } catch (error) {
    res.status(500).json({ message: "Could not update request.", error: error.message });
  }
});

module.exports = router;
