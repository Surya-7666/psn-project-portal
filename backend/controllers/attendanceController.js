const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Guide = require('../models/Guide');

// @desc    Submit daily attendance for a guide's batch (Locked once submitted; only HOD/Admin can edit)
// @route   POST /api/attendance/bulk
// @access  Public (Guide Portal)
const submitBulkAttendance = async (req, res) => {
  try {
    const { guideId, date, entries } = req.body;

    if (!guideId || !date || !Array.isArray(entries) || entries.length === 0) {
      return res
        .status(400)
        .json({ message: 'Guide ID, date, and attendance entries are required' });
    }

    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Project Guide not found' });
    }

    // Block re-submission if attendance is already recorded for this guide and date
    const existingCount = await Attendance.countDocuments({ guideId, date });
    if (existingCount > 0) {
      return res.status(403).json({
        message: `Attendance for ${date} is already locked. Only the HOD / Admin can edit submitted records.`,
      });
    }

    const docsToInsert = entries.map((entry) => ({
      studentId: entry.studentId,
      guideId,
      date,
      status: entry.status || 'Present',
      remark: entry.remark ? entry.remark.trim() : '',
    }));

    await Attendance.insertMany(docsToInsert);

    return res.status(201).json({
      message: `Attendance submitted and locked for ${date}`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(403).json({
        message: 'Attendance for this date is already locked. Only the HOD / Admin can edit submitted records.',
      });
    }
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance records filtered by date and/or guideId
// @route   GET /api/attendance?date=YYYY-MM-DD&guideId=...
// @access  Public / Admin
const getAttendance = async (req, res) => {
  try {
    const { date, guideId } = req.query;
    const filter = {};

    if (date) filter.date = date;
    if (guideId) filter.guideId = guideId;

    const records = await Attendance.find(filter)
      .populate('studentId', 'name projectTitle sno')
      .populate('guideId', 'name designation')
      .sort({ date: -1, createdAt: 1 })
      .lean();

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Admin/HOD override for an existing attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Admin only)
const updateAttendanceRecord = async (req, res) => {
  try {
    const { status, remark } = req.body;
    const record = await Attendance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (status) record.status = status;
    if (remark !== undefined) record.remark = remark.trim();
    record.editedByAdmin = true;

    const updated = await record.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitBulkAttendance,
  getAttendance,
  updateAttendanceRecord,
};