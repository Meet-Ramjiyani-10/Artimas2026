const nodemailer = require('nodemailer');

/**
 * Create and return a configured Nodemailer transporter.
 * Uses SMTP env vars. Returns null if SMTP is not configured (allows dev without email).
 */
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠ SMTP not configured — email sending is disabled');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
};

module.exports = { createTransporter };
