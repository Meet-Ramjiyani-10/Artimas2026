const crypto = require('crypto');
const Registration = require('../models/Registration');

/**
 * Generate a unique, human-readable registration ID.
 *
 * Format: ART26-XXXXXX
 * Where XXXXXX is a 6-character alphanumeric string (uppercase).
 *
 * Checks for uniqueness against the database before returning.
 *
 * @returns {Promise<string>} A unique registration ID
 */
const generateRegistrationId = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 for readability
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let code = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }

    const registrationId = `ART26-${code}`;

    // Check uniqueness
    const existing = await Registration.findOne({ registrationId });
    if (!existing) {
      return registrationId;
    }
  }

  // Fallback: timestamp-based ID (extremely unlikely to reach here)
  return `ART26-${Date.now().toString(36).toUpperCase().slice(-6)}`;
};

module.exports = generateRegistrationId;
