const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skill: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  duration: { type: Number, min: 15, max: 240, required: true },
  mode: { type: String, enum: ["online", "offline"], default: "online" },
  meetingDetails: { type: String, default: "" },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled"
  }
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);
