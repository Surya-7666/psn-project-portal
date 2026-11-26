const express = require('express');
const router = express.Router();
const {
  getAllGuides,
  createGuide,
  deleteGuide,
} = require('../controllers/guideController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', getAllGuides);
router.post('/', protectAdmin, createGuide);
router.delete('/:id', protectAdmin, deleteGuide);

module.exports = router;