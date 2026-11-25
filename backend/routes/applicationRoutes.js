
const express = require("express");
const Application = require("../models/Application");
const { protect, authorize } = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");

const router = express.Router();

// Gmail email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// POST: Student submits application
router.post("/", protect, authorize("applicant"), async (req, res) => {
  try {
    const { projectTitle, description, skills } = req.body;

    if (!projectTitle || !description) {
      return res.status(400).json({
        message: "Project title and description are required",
      });
    }

    const application = await Application.create({
      student: req.user._id,
      projectTitle,
      description,
      skills,
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: View applications
router.get("/", protect, async (req, res) => {
  try {
    let query = {};

    // Students can see only their own applications
    if (req.user.role !== "admin") {
      query.student = req.user._id;
    }

    const applications = await Application.find(query)
      .populate("student", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Admin updates application status and emails student
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Shortlisted",
      "Selected",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid application status",
      });
    }

    const application = await Application.findById(req.params.id)
      .populate("student", "fullName email");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    const previousStatus = application.status;

    application.status = status;
    await application.save();

    let emailSent = false;
    let emailError = null;

    // Send notification only when status actually changes
    if (previousStatus !== status) {
      try {
        if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
          throw new Error("Email credentials are not configured");
        }

        if (!application.student || !application.student.email) {
          throw new Error("Student email address not found");
        }

        const studentName =
          application.student.fullName || "Student";

        await transporter.sendMail({
          from: `"CampusConnect" <${process.env.MAIL_USER}>`,
          to: application.student.email,
          subject: `Your CampusConnect application status: ${status}`,
          text: `
Hello ${studentName},

Your application status has been updated.

Opportunity / Project: ${application.projectTitle}

Previous Status: ${previousStatus}
New Status: ${status}

Please log in to your CampusConnect account to view your application.

Best regards,
CampusConnect Team
          `,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #ddd;border-radius:12px;">
              <h2 style="color:#2563eb;">CampusConnect</h2>
              <h3>Hello ${studentName},</h3>
              <p>Your application status has been updated.</p>
              <p><strong>Project:</strong> ${application.projectTitle}</p>
              <p><strong>Previous Status:</strong> ${previousStatus}</p>
              <p><strong>New Status:</strong> ${status}</p>
              <p>Please log in to your CampusConnect account to view your application.</p>
              <p>Best regards,<br>CampusConnect Team</p>
            </div>
          `,
        });

        emailSent = true;
      } catch (mailError) {
        emailError = mailError.message;
        console.error("Email notification failed:", mailError.message);
      }
    }

    res.status(200).json({
      message: emailSent
        ? "Application updated and email notification sent"
        : "Application status updated",
      application,
      emailSent,
      emailError,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
