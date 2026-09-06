const { v2: cloudinary } = require('cloudinary');

// Configure primary Cloudinary account globally
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Determines whether an upload error is a genuine Cloudinary service, network,
 * or infrastructure failure suitable for fallback to a secondary account.
 *
 * Client/validation errors (e.g. corrupt file, unsupported format, HTTP 400)
 * MUST NOT trigger fallback because retrying on another account would fail identically.
 *
 * @param {Error|Object} error
 * @returns {boolean}
 */
const isCloudinaryServiceFailure = (error) => {
  if (!error) return false;

  // 1. Node.js network / connection error codes
  const networkCodes = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'EAI_AGAIN',
    'EPIPE',
    'ESOCKETTIMEDOUT',
    'UND_ERR_CONNECT_TIMEOUT',
  ];
  if (error.code && networkCodes.includes(error.code)) {
    return true;
  }

  // 2. HTTP status codes from Cloudinary
  const httpCode = Number(error.http_code || error.status || error.statusCode);
  if (httpCode) {
    // 5xx: Server errors (Cloudinary outage, bad gateway, service unavailable, gateway timeout)
    if (httpCode >= 500 && httpCode <= 599) {
      return true;
    }
    // 429: Rate limit / request quota exceeded
    // 402: Payment required / monthly credit limit reached on primary account
    if (httpCode === 429 || httpCode === 402) {
      return true;
    }
    // 401 / 403: Primary credentials revoked, invalid, or account suspended
    if (httpCode === 401 || httpCode === 403) {
      return true;
    }
    // 400: Client / validation / bad request error -> DO NOT FALLBACK
    if (httpCode === 400) {
      return false;
    }
  }

  // 3. Message pattern inspection for common Cloudinary validation vs infrastructure errors
  const message = String(error.message || '').toLowerCase();

  // Explicit non-fallback validation patterns
  if (
    message.includes('unsupported image format') ||
    message.includes('invalid image') ||
    message.includes('corrupted') ||
    message.includes('empty file') ||
    message.includes('file is empty') ||
    message.includes('file size exceeds') ||
    message.includes('format not allowed')
  ) {
    return false;
  }

  // Explicit fallback-worthy infrastructure patterns
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('credit') ||
    message.includes('disabled') ||
    message.includes('unavailable') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('socket hang up') ||
    message.includes('network error') ||
    message.includes('internal server error') ||
    message.includes('gateway')
  ) {
    return true;
  }

  // If httpCode is 4xx other than 401/403/429/402, default to false
  if (httpCode && httpCode >= 400 && httpCode < 500) {
    return false;
  }

  // If error has no httpCode but occurred during upload stream, treat as network failure
  return true;
};

/**
 * Internal helper to upload a stream buffer to Cloudinary with given options.
 *
 * @param {Buffer} fileBuffer
 * @param {Object} uploadOptions
 * @returns {Promise<Object>}
 */
const uploadStreamPromise = (fileBuffer, uploadOptions) => {
  return new Promise((resolve, reject) => {
    // If credentials are not configured yet in development, provide safe fallback
    const targetCloud = uploadOptions.cloud_name || process.env.CLOUDINARY_CLOUD_NAME;
    const targetKey = uploadOptions.api_key || process.env.CLOUDINARY_API_KEY;

    if (!targetCloud || !targetKey) {
      console.warn('⚠ Cloudinary credentials not configured — using dev screenshot placeholder');
      return resolve({
        secure_url: `https://res.cloudinary.com/qllarlul/image/upload/v1788273328/event-card.webp`,
        public_id: `artimas26/dev_placeholder_${Date.now()}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Standard upload to Cloudinary (used by non-payment assets like CTF proof, general media).
 * Uses the primary Cloudinary account.
 *
 * @param {Buffer} fileBuffer  The file buffer from Multer memory storage
 * @param {Object} options     Cloudinary upload options
 * @returns {Promise<Object>}  Cloudinary upload result (secure_url, public_id, etc.)
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  const uploadOptions = {
    folder: 'artimas26/payment-screenshots',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    ...options,
  };

  return uploadStreamPromise(fileBuffer, uploadOptions);
};

/**
 * Dedicated upload function ONLY for payment screenshots with automatic fallback.
 *
 * 1. Attempts upload to Primary Cloudinary account first.
 * 2. If primary succeeds, NEVER uploads to fallback.
 * 3. If primary fails with a genuine service/network/quota error, automatically
 *    attempts upload to the Fallback Cloudinary account without mutating global config.
 * 4. Validation/corrupt file/client errors do NOT trigger fallback.
 * 5. Logs clear server-side message without exposing credentials or secrets.
 *
 * @param {Buffer} fileBuffer  The payment screenshot file buffer
 * @param {Object} options     Upload options (folder, etc.)
 * @returns {Promise<Object>}  Upload result including secure_url and public_id
 */
const uploadPaymentScreenshotWithFallback = async (fileBuffer, options = {}) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Valid file buffer is required for payment screenshot upload.');
  }

  const primaryOptions = {
    folder: 'artimas26/payments',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    ...options,
  };

  // 1. Attempt Primary Cloudinary upload first
  try {
    const result = await uploadStreamPromise(fileBuffer, primaryOptions);
    return {
      ...result,
      provider: 'primary',
    };
  } catch (primaryError) {
    // 2. Check if primary error qualifies for fallback
    if (!isCloudinaryServiceFailure(primaryError)) {
      throw primaryError;
    }

    // 3. Verify fallback account credentials
    const hasFallbackConfig = Boolean(
      process.env.CLOUDINARY_FALLBACK_CLOUD_NAME &&
      process.env.CLOUDINARY_FALLBACK_API_KEY &&
      process.env.CLOUDINARY_FALLBACK_API_SECRET
    );

    if (!hasFallbackConfig) {
      console.warn('Primary Cloudinary upload failed and fallback credentials are not configured.');
      throw primaryError;
    }

    // 4. Safe server-side log (Strictly no credentials, secrets, or sensitive request data)
    console.warn('Primary Cloudinary upload failed; attempting fallback.');

    // 5. Build isolated per-call options for fallback without mutating global config
    const fallbackOptions = {
      ...primaryOptions,
      cloud_name: process.env.CLOUDINARY_FALLBACK_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_FALLBACK_API_KEY,
      api_secret: process.env.CLOUDINARY_FALLBACK_API_SECRET,
    };

    // 6. Attempt Fallback Cloudinary upload
    try {
      const fallbackResult = await uploadStreamPromise(fileBuffer, fallbackOptions);
      console.log('Payment screenshot uploaded successfully via fallback Cloudinary account.');
      return {
        ...fallbackResult,
        provider: 'fallback',
      };
    } catch (fallbackError) {
      console.error('Fallback Cloudinary upload also failed.');
      throw fallbackError;
    }
  }
};

/**
 * Delete a file from Cloudinary by public_id.
 *
 * @param {string} publicId  Cloudinary public_id of the file
 * @param {Object} options   Optional config override (e.g. for fallback account deletions)
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId, options = {}) => {
  return cloudinary.uploader.destroy(publicId, options);
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadPaymentScreenshotWithFallback,
  deleteFromCloudinary,
  isCloudinaryServiceFailure,
};
