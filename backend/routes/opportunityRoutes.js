
const express = require("express");
const Opportunity = require("../models/Opportunity");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Convert skills into an array
function formatSkills(skills) {
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills.split(",").map((skill) => skill.trim()).filter(Boolean);
  }

  return [];
}

// GET all active opportunities
router.get("/", protect, async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ isActive: true })
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({ opportunities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create opportunity
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { title, description, category, skills, deadline } = req.body;

    if (!title || !description || !category || !deadline) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const opportunity = await Opportunity.create({
      title: title.trim(),
      description: description.trim(),
      category,
      skills: formatSkills(skills),
      deadline,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Opportunity created successfully",
      opportunity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update opportunity
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { title, description, category, skills, deadline, isActive } = req.body;

    const updates = {};

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category;
    if (skills !== undefined) updates.skills = formatSkills(skills);
    if (deadline !== undefined) updates.deadline = deadline;
    if (isActive !== undefined) updates.isActive = isActive;

    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!opportunity) {
      return res.status(404).json({
        message: "Opportunity not found",
      });
    }

    res.status(200).json({
      message: "Opportunity updated successfully",
      opportunity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE opportunity
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        message: "Opportunity not found",
      });
    }

    res.status(200).json({
      message: "Opportunity deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
