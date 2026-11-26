const Guide = require('../models/Guide');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// @desc    Get all Project Guides with their student counts
// @route   GET /api/guides
// @access  Public (Zero-login Guide Portal)
const getAllGuides = async (req, res) => {
  try {
    const guides = await Guide.find().sort({ createdAt: 1 }).lean();

    const guidesWithCounts = await Promise.all(
      guides.map(async (guide) => {
        const studentCount = await Student.countDocuments({ guideId: guide._id });
        return {
          ...guide,
          studentCount,
        };
      })
    );

    return res.json(guidesWithCounts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new Project Guide
// @route   POST /api/guides
// @access  Private (Admin only)
const createGuide = async (req, res) => {
  try {
    const { name, designation } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Guide name is required' });
    }

    const existing = await Guide.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({ message: 'This guide already exists' });
    }

    const guide = await Guide.create({
      name: name.trim().toUpperCase(),
      designation: designation ? designation.trim().toUpperCase() : '',
    });

    return res.status(201).json({ ...guide.toObject(), studentCount: 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a Project Guide (and cascade remove their students/attendance)
// @route   DELETE /api/guides/:id
// @access  Private (Admin only)
const deleteGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    await Student.deleteMany({ guideId: guide._id });
    await Attendance.deleteMany({ guideId: guide._id });
    await guide.deleteOne();

    return res.json({ message: 'Guide and associated records deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllGuides, createGuide, deleteGuide };