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

// Optional/legacy middleware for registration form data
const uploadAnyOrNone = upload.none();

module.exports = {
  upload,
  uploadCtfScreenshotFile,
  uploadAnyOrNone,
};
