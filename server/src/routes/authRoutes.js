const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { validateLogin } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', validateLogin, login);

// GET /api/auth/me (protected)
router.get('/me', protect, getMe);

module.exports = router;
