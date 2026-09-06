const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  createRegistration,
  getRegistration,
  uploadPaymentScreenshot,
  checkEmailAvailability,
} = require('../controllers/registrationController');
const {
  uploadCtfScreenshot,
  getCtfScreenshots,
} = require('../controllers/ctfController');
const {
  uploadCtfScreenshotFile,
  uploadPaymentScreenshotMiddleware,
  upload,
} = require('../middleware/uploadMiddleware');
const { validateRegistration } = require('../middleware/validationMiddleware');

// Dedicated rate limiter for payment screenshot uploads
// Limits public uploads to 10 requests per 15 minutes per IP to prevent storage exhaustion and abuse
const uploadPaymentScreenshotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 uploads per IP per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment screenshot upload attempts from this IP. Please try again after 15 minutes.',
  },
});

// Middleware to conditionally handle multipart form data if sent, without requiring file
const handleOptionalMultipart = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.any()(req, res, next);
  } else {
    next();
  }
};

// ── Registration Core Routes ──
// POST /api/registrations — Create confirmed registration (JSON or FormData with payment screenshot)
router.post(
  '/',
  handleOptionalMultipart,
  validateRegistration,
  createRegistration
);

// POST /api/registrations/upload-payment-screenshot — Pre-upload payment screenshot (protected by dedicated rate limiter and 500KB limit)
router.post(
  '/upload-payment-screenshot',
  uploadPaymentScreenshotLimiter,
  uploadPaymentScreenshotMiddleware,
  uploadPaymentScreenshot
);

// Check if an email is already registered for an event
router.post('/check-email', checkEmailAvailability);
router.get('/check-email', checkEmailAvailability);

// GET /api/registrations/:registrationId — Public lookup by Pass ID (non-sensitive)
router.get('/:registrationId', getRegistration);

// ── Capture the Flag (CTF) Screenshot Proof Routes ──
// POST /api/registrations/:registrationId/ctf/screenshots — Upload proof screenshot (max 5MB, JPG/PNG/WebP)
router.post(
  '/:registrationId/ctf/screenshots',
  uploadCtfScreenshotFile,
  uploadCtfScreenshot
);

// GET /api/registrations/:registrationId/ctf/screenshots — Retrieve team's uploaded screenshots
router.get(
  '/:registrationId/ctf/screenshots',
  getCtfScreenshots
);

module.exports = router;
