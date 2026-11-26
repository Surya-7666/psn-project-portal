const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Authenticate Main Admin (HOD / Class Advisor)
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (admin && (await admin.matchPassword(password))) {
      return res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin._id),
      });
    }

    return res.status(401).json({ message: 'Invalid Admin email or password' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged-in Admin profile
// @route   GET /api/auth/me
// @access  Private (Admin)
const getAdminProfile = async (req, res) => {
  return res.json(req.admin);
};

module.exports = { loginAdmin, getAdminProfile };