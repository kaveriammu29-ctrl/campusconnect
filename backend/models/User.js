
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true, select: false },
  phone: { type: String, default: "" },
  college: { type: String, default: "" },
  course: { type: String, default: "" },
  year: { type: String, default: "" },
  role: {
    type: String,
    enum: ["admin", "applicant"],
    default: "applicant"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
