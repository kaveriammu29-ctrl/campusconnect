
const express = require("express");
const Opportunity = require("../models/Opportunity");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// View active opportunities
router.get("/", protect, async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ isActive: true })
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 });

    res.json({ opportunities });
  } catch (error) {
    res.status(500).json({
      message: "Could not load opportunities",
      error: error.message
    });
  }
});

// Admin creates opportunity
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { title, description, category, skills, deadline } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        message: "Title and description are required"
      });
    }

    const opportunity = await Opportunity.create({
      title: title.trim(),
      description: description.trim(),
      category,
      skills,
      deadline: deadline || null,
      createdBy: req.user._id
    });

    res.status(201).json({
      message: "Opportunity created successfully",
      opportunity
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not create opportunity",
      error: error.message
    });
  }
});

// Admin edits opportunity
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const allowed = ["title", "description", "category", "skills", "deadline", "isActive"];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    res.json({ message: "Opportunity updated", opportunity });
  } catch (error) {
    res.status(500).json({
      message: "Could not update opportunity",
      error: error.message
    });
  }
});

// Admin deletes opportunity
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    res.json({ message: "Opportunity deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete opportunity",
      error: error.message
    });
  }
});

module.exports = router;
