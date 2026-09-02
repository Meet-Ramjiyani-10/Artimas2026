const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary.
 *
 * @param {Buffer} fileBuffer  The file buffer from Multer memory storage
 * @param {Object} options     Cloudinary upload options
 * @returns {Promise<Object>}  Cloudinary upload result (secure_url, public_id, etc.)
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // If Cloudinary is not configured yet in development, provide safe fallback
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('⚠ Cloudinary credentials not configured — using dev screenshot placeholder');
      return resolve({
        secure_url: `https://res.cloudinary.com/qllarlul/image/upload/v1788273328/event-card.webp`,
        public_id: `artimas26/dev_placeholder_${Date.now()}`,
      });
    }

    const uploadOptions = {
      folder: 'artimas26/payment-screenshots',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      ...options,
    };

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
 * Delete a file from Cloudinary by public_id.
 *
 * @param {string} publicId  Cloudinary public_id of the file
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
