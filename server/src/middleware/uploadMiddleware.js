const path = require('path');
const multer = require('multer');

// Allowed MIME types and extensions (Strict: JPG, JPEG, PNG, WebP only)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // Strict 5MB limit

/**
 * Multer configuration for memory storage buffer.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeAllowed && extAllowed) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid image format (${ext || file.mimetype}). Only JPG, JPEG, PNG, and WebP are permitted. SVG and executable/script files are strictly rejected.`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Preconfigured middleware for CTF screenshot field
const uploadCtfScreenshotFile = upload.single('screenshot');

// Strict 1MB limit for payment screenshots to prevent storage exhaustion
const MAX_PAYMENT_SCREENSHOT_SIZE = 1 * 1024 * 1024;

const paymentScreenshotUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_PAYMENT_SCREENSHOT_SIZE,
    files: 1,
  },
});

/**
 * Dedicated middleware for payment screenshot upload.
 * Catches Multer limits (e.g. LIMIT_FILE_SIZE exceeding 1MB) and returns clean JSON error.
 */
const uploadPaymentScreenshotMiddleware = (req, res, next) => {
  paymentScreenshotUpload.any()(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Payment screenshot file size exceeds 1MB limit (must be 1MB or below).',
        });
      }
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    next();
  });
};

// Optional/legacy middleware for registration form data
const uploadAnyOrNone = upload.none();

module.exports = {
  upload,
  uploadCtfScreenshotFile,
  uploadPaymentScreenshotMiddleware,
  uploadAnyOrNone,
};
