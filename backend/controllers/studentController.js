const Student = require('../models/Student');
const Guide = require('../models/Guide');
const Attendance = require('../models/Attendance');

// @desc    Get all students (optionally filtered by ?guideId=...) with overall attendance %
// @route   GET /api/students
// @access  Public
const getStudents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.guideId) {
      filter.guideId = req.query.guideId;
    }

    const students = await Student.find(filter)
      .populate('guideId', 'name designation')
      .sort({ sno: 1, createdAt: 1 })
      .lean();

    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const records = await Attendance.find({ studentId: student._id }).lean();
        const totalClasses = records.length;
        const attendedCount = records.filter(
          (r) => r.status === 'Present' || r.status === 'OD'
        ).length;

        const attendancePercentage =
          totalClasses === 0
            ? 100
            : Math.round((attendedCount / totalClasses) * 100);

        return {
          ...student,
          totalClasses,
          attendedCount,
          attendancePercentage,
        };
      })
    );

    return res.json(studentsWithStats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new Student + Project Title under a specific Guide
// @route   POST /api/students
// @access  Public (Guide adds under their workspace; Admin can also add)
const createStudent = async (req, res) => {
  try {
    const { name, projectTitle, guideId } = req.body;

    if (!name || !name.trim() || !projectTitle || !projectTitle.trim() || !guideId) {
      return res.status(400).json({
        message: 'Student name, project title, and guide are required',
      });
    }

    const guideExists = await Guide.findById(guideId);
    if (!guideExists) {
      return res.status(404).json({ message: 'Selected guide not found' });
    }

    const lastStudent = await Student.findOne().sort({ sno: -1 }).lean();
    const nextSno = lastStudent && lastStudent.sno ? lastStudent.sno + 1 : 1;

    const student = await Student.create({
      sno: nextSno,
      name: name.trim(),
      projectTitle: projectTitle.trim(),
      guideId,
    });

    const populated = await Student.findById(student._id)
      .populate('guideId', 'name designation')
      .lean();

    return res.status(201).json({
      ...populated,
      totalClasses: 0,
      attendedCount: 0,
      attendancePercentage: 100,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update a Student's details (name, projectTitle, guideId)
// @route   PUT /api/students/:id
// @access  Private (Admin only)
const updateStudent = async (req, res) => {
  try {
    const { name, projectTitle, guideId } = req.body;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (name && name.trim()) student.name = name.trim();
    if (projectTitle && projectTitle.trim()) student.projectTitle = projectTitle.trim();
    if (guideId) student.guideId = guideId;

    await student.save();

    const updated = await Student.findById(student._id)
      .populate('guideId', 'name designation')
      .lean();

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a Student and their attendance logs
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Attendance.deleteMany({ studentId: student._id });
    await student.deleteOne();

    return res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};