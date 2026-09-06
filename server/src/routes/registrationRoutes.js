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

// Dedicated rate limiter for main registration creation
// Intentionally generous (70 req / 15 min per IP) to accommodate campus NAT / shared Wi-Fi
const createRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 70, // 70 requests per IP per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration requests from this network. Please try again after 15 minutes.',
  },
});

// Dedicated rate limiter for email availability check
// Generous (100 req / 15 min per IP) to support normal typing/blur without enumeration abuse
const checkEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many email verification requests. Please try again after 15 minutes.',
  },
});

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
// Middleware order: Rate Limiter -> Multipart Parsing -> Input Validation -> Registration Controller
router.post(
  '/',
  createRegistrationLimiter,
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

// Check if an email is already registered for an event (protected by dedicated 100 req / 15 min limiter)
router.post('/check-email', checkEmailLimiter, checkEmailAvailability);
router.get('/check-email', checkEmailLimiter, checkEmailAvailability);

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
