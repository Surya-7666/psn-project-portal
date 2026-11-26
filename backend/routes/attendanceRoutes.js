const express = require('express');
const router = express.Router();
const {
  submitBulkAttendance,
  getAttendance,
  updateAttendanceRecord,
} = require('../controllers/attendanceController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/bulk', submitBulkAttendance);
router.get('/', getAttendance);
router.put('/:id', protectAdmin, updateAttendanceRecord);

module.exports = router;