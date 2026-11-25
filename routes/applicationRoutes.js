
const express = require("express");
const Application = require("../models/Application");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Submit an application as a student
router.post("/", protect, authorize("applicant"), async (req, res) => {
  try {
    const { projectTitle, description, skills } = req.body;

    if (!projectTitle?.trim() || !description?.trim() || !skills?.trim()) {
      return res.status(400).json({
        message: "Please complete all application fields"
      });
    }

    const application = await Application.create({
      student: req.user._id,
      projectTitle: projectTitle.trim(),
      description: description.trim(),
      skills: skills.trim()
    });

    res.status(201).json({
      message: "Application submitted successfully!",
      application
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not submit application",
      error: error.message
    });
  }
});

// Admin sees all applications; students see only their own
router.get("/", protect, async (req, res) => {
  try {
    const query = req.user.role === "admin"
      ? {}
      : { student: req.user._id };

    const applications = await Application.find(query)
      .populate("student", "fullName email college course")
      .sort({ createdAt: -1 });

    const results = applications.map(app => {
      const item = app.toObject();
      item.fullName = item.student?.fullName || "Student";
      return item;
    });

    res.json({ applications: results });
  } catch (error) {
    res.status(500).json({
      message: "Could not load applications",
      error: error.message
    });
  }
});

// Admin updates application status
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "Pending",
      "Shortlisted",
      "Selected",
      "Rejected"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("student", "fullName email");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({
      message: "Application status updated",
      application
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not update application",
      error: error.message
    });
  }
});

module.exports = router;
