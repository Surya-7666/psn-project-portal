const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guide',
      required: true,
    },
    date: {
      type: String, // Stored as YYYY-MM-DD (e.g., "2026-11-26") for clean daily lookup
      required: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'OD'],
      default: 'Present',
    },
    remark: {
      type: String,
      trim: true,
      default: '',
    },
    editedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance entries for the same student on the same date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);