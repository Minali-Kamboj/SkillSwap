const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    default: "Beginner"
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  university: { type: String, default: "", trim: true },
  country: { type: String, default: "India", trim: true },
  languages: [{ type: String, trim: true }],
  teachingSkills: [skillSchema],
  learningSkills: [skillSchema],
  teachingModes: [{
    type: String,
    enum: ["exchange", "volunteer", "mentorship"]
  }],
  availability: [{ type: String }],
  sessionPreference: {
    type: String,
    enum: ["online", "offline", "both"],
    default: "online"
  },
  bio: { type: String, default: "", maxlength: 500 },
  role: { type: String, enum: ["student", "admin"], default: "student" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
