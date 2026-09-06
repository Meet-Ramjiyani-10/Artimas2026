const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * @desc    Login admin user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { password } = req.body;
    const rawIdentifier = req.body.username || req.body.email || req.body.identifier;
    const identifier = rawIdentifier ? String(rawIdentifier).trim().toLowerCase() : '';

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Username or email is required',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    const query = {
      $or: [
        { email: identifier },
        { username: identifier },
      ],
    };

    // Find admin with password hash included
    const admin = await Admin.findOne(query).select('+passwordHash');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Compare password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT with admin details
    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        eventId: admin.eventId || null,
        eventSlug: admin.eventSlug || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          username: admin.username || '',
          email: admin.email,
          role: admin.role,
          eventId: admin.eventId || null,
          eventSlug: admin.eventSlug || null,
          eventName: admin.eventName || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in admin profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.admin._id,
      name: req.admin.name,
      username: req.admin.username || '',
      email: req.admin.email,
      role: req.admin.role,
      eventId: req.admin.eventId || null,
      eventSlug: req.admin.eventSlug || null,
      eventName: req.admin.eventName || null,
    },
  });
};

module.exports = { login, getMe };
