const express = require('express');
const router = express.Router();
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', getStudents);
router.post('/', createStudent);
router.put('/:id', protectAdmin, updateStudent);
router.delete('/:id', protectAdmin, deleteStudent);

module.exports = router;