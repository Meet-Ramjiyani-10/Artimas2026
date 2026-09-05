const path = require('path');
const Registration = require('../models/Registration');
const CtfSubmission = require('../models/CtfSubmission');
const { uploadToCloudinary } = require('../config/cloudinary');

// Allowed file extensions — defense-in-depth
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Helper to authenticate team ownership via submission token or admin token.
 */
const authenticateTeamOwnership = (req, registration) => {
  // If user is authenticated as an admin/tech_team, allow access
  if (req.admin) return true;

  // Extract submission token from headers, query, or body
  const headerToken = req.headers['x-submission-token'];
  const authHeader = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  const bodyToken = req.body?.submissionToken;
  const queryToken = req.query?.token;

  const providedToken = headerToken || authHeader || bodyToken || queryToken;

  if (!providedToken || !registration.submissionToken) {
    return false;
  }

  return providedToken.trim() === registration.submissionToken.trim();
};

/**
 * @desc    Upload CTF challenge screenshot proof
 * @route   POST /api/registrations/:registrationId/ctf/screenshots
 * @access  Protected by submissionToken OR Admin JWT
 *
 * Expects multipart/form-data:
 *   - screenshot (file, max 5MB, JPG/PNG/WebP)
 *   - challenge (string, optional)
 *   - description (string, optional)
 *   - Header: 'x-submission-token': <submissionToken>
 */
const uploadCtfScreenshot = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const { challenge, description } = req.body;

    // ── 1. Find Registration ──
    const registration = await Registration.findOne({
      registrationId: registrationId.toUpperCase(),
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // ── 2. Verify event is Capture the Flag ──
    const isCtf = registration.eventName?.toLowerCase().includes('capture') || registration.eventSlug === 'capture-the-flag';
    if (!isCtf) {
      return res.status(400).json({
        success: false,
        message: 'Screenshot submissions are only permitted for Capture the Flag events',
      });
    }

    // ── 3. Verify status is CONFIRMED ──
    if (registration.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Cannot upload screenshots for registration with status: ${registration.status}`,
      });
    }

    // ── 4. Security Check (Team Ownership Authentication) ──
    const isAuthorized = authenticateTeamOwnership(req, registration);
    if (!isAuthorized) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: A valid x-submission-token header is required to upload screenshots for this team',
      });
    }

    // ── 5. File Validation ──
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Screenshot file is required (field name: "screenshot")',
      });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file format (${fileExt}). Allowed formats: JPG, JPEG, PNG, WebP. SVG and scripts are strictly rejected.`,
      });
    }

    // ── 6. Cloudinary Dynamic Folder Upload ──
    const sanitizedChallenge = challenge
      ? challenge
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 30)
      : 'general';

    const dynamicFolder = `artimas26/ctf/${registration.registrationId}/${sanitizedChallenge}`;

    let uploadResult;
    try {
      uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: dynamicFolder,
      });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload screenshot to cloud storage. Please try again.',
      });
    }

    // ── 7. Save to CtfSubmission Collection ──
    const submission = await CtfSubmission.create({
      registrationId: registration.registrationId,
      eventId: registration.eventId,
      eventSlug: registration.eventSlug,
      teamName: registration.teamName,
      challenge: challenge?.trim() || 'General',
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      description: description?.trim() || '',
      uploadedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Screenshot proof uploaded successfully',
      data: {
        id: submission._id,
        registrationId: submission.registrationId,
        teamName: submission.teamName,
        challenge: submission.challenge,
        imageUrl: submission.imageUrl,
        description: submission.description,
        uploadedAt: submission.uploadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve CTF screenshots for a registration/team
 * @route   GET /api/registrations/:registrationId/ctf/screenshots
 * @access  Protected by submissionToken OR Admin JWT
 */
const getCtfScreenshots = async (req, res, next) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findOne({
      registrationId: registrationId.toUpperCase(),
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    const isCtf = registration.eventName?.toLowerCase().includes('capture') || registration.eventSlug === 'capture-the-flag';
    if (!isCtf) {
      return res.status(400).json({
        success: false,
        message: 'Screenshots are only applicable to Capture the Flag events',
      });
    }

    // Authenticate ownership (protect competitors from seeing each other's submissions)
    const isAuthorized = authenticateTeamOwnership(req, registration);
    if (!isAuthorized) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: A valid x-submission-token header is required to view team submissions',
      });
    }

    const screenshots = await CtfSubmission.find({
      registrationId: registration.registrationId,
    }).sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      count: screenshots.length,
      data: screenshots.map((s) => ({
        id: s._id,
        challenge: s.challenge,
        imageUrl: s.imageUrl,
        description: s.description,
        uploadedAt: s.uploadedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Get all CTF screenshots for a registration
 * @route   GET /api/admin/registrations/:id/ctf/screenshots
 * @access  Protected (TECH_TEAM, ADMIN)
 */
const getAdminCtfScreenshots = async (req, res, next) => {
  try {
    const { id } = req.params;

    let registration = await Registration.findOne({ registrationId: id.toUpperCase() });
    if (!registration && id.match(/^[0-9a-fA-F]{24}$/)) {
      registration = await Registration.findById(id);
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    const screenshots = await CtfSubmission.find({
      registrationId: registration.registrationId,
    }).sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      registrationId: registration.registrationId,
      teamName: registration.teamName,
      count: screenshots.length,
      data: screenshots,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCtfScreenshot,
  getCtfScreenshots,
  getAdminCtfScreenshots,
};
