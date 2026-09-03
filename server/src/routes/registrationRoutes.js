const express = require('express');
const router = express.Router();
const {
  createRegistration,
  getRegistration,
  uploadPaymentScreenshot,
} = require('../controllers/registrationController');
const {
  uploadCtfScreenshot,
  getCtfScreenshots,
} = require('../controllers/ctfController');
const { uploadCtfScreenshotFile, upload } = require('../middleware/uploadMiddleware');
const { validateRegistration } = require('../middleware/validationMiddleware');

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

// POST /api/registrations/upload-payment-screenshot — Pre-upload payment screenshot
router.post(
  '/upload-payment-screenshot',
  upload.any(),
  uploadPaymentScreenshot
);

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
