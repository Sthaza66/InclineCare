// routes/protected.js
const express = require('express');
const router = express.Router();
const { authMiddleware, permit } = require('../middleware/auth');
const User = require('../models/User');

// protected route to get profile (any authenticated user)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// students-only example
router.get('/student/dashboard', authMiddleware, permit('student'), (req, res) => {
  res.json({ message: 'Welcome to the student dashboard' });
});

// professionals-only example
router.get('/professional/dashboard', authMiddleware, permit('professional'), (req, res) => {
  res.json({ message: 'Welcome to the professional dashboard' });
});

module.exports = router;
