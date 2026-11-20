const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  learningMode: {
    type: String,
    enum: ["exchange", "volunteer", "mentorship"],
    required: true
  },
  requestedSkill: { type: String, required: true, trim: true },
  offeredSkill: { type: String, default: "", trim: true },
  message: { type: String, default: "", maxlength: 500 },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
