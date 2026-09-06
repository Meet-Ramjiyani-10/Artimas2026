const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { uploadToCloudinary } = require('../config/cloudinary');
const generateRegistrationId = require('../utils/generateRegistrationId');
const { syncToEventCollection } = require('../utils/eventCollectionHelper');

/**
 * Validate RFC 5322 compatible email format.
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate Indian mobile numbers:
 * - Exactly 10 digits
 * - Valid starting range: 6, 7, 8, or 9
 * - Supports optional +91, 91, or 0 prefix
 */
const isValidIndianMobile = (phone) => {
  if (!phone || (typeof phone !== 'string' && typeof phone !== 'number')) return false;
  const cleaned = String(phone).replace(/[\s\-()]/g, '');
  const indianPhoneRegex = /^(?:(?:\+91|91|0))?[6-9]\d{9}$/;
  return indianPhoneRegex.test(cleaned);
};

/**
 * Validate international phone numbers (used for Surprise Event / Pixel Perfect and other international events):
 * - Optional leading +
 * - 7 to 16 digits
 */
const isValidInternationalPhone = (phone) => {
  if (!phone || (typeof phone !== 'string' && typeof phone !== 'number')) return false;
  const cleaned = String(phone).replace(/[\s\-()]/g, '');
  return /^\+?\d{7,16}$/.test(cleaned);
};

/**
 * Helper to check if event slug is Surprise Event (Pixel Perfect) or any of its aliases
 */
const isPixelPerfectEvent = (slug) => {
  const s = (slug || '').toLowerCase().trim();
  return ['pixel-perfect', 'surprise-event', 'surprise', 'pixelperfect', 'photography', 'secret-event'].includes(s);
};

/**
 * Normalize Indian mobile number to 10 standard digits.
 */
const normalizeIndianMobile = (phone) => {
  const cleaned = String(phone).replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) return cleaned.slice(3);
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned.slice(2);
  if (cleaned.startsWith('0') && cleaned.length === 11) return cleaned.slice(1);
  return cleaned;
};

/**
 * Extract numbers (max 4 digits) from official PCCOE email.
 * Rule: 'name' . 'surname' <numbers max 4> @pccoepune.org
 * E.g., "meet.ramjiyani24@pccoepune.org" -> "24"
 * E.g., "john.doe2024@pccoepune.org" -> "2024"
 */
const extractPccoeBatch = (email) => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const match = trimmed.match(/^[a-z]+(?:[-.][a-z]+)*\.([a-z-]+)(\d{1,4})@pccoepune\.org$/i);
  return match ? match[2] : null;
};

/**
 * Determine if an individual participant qualifies as an eligible PCCOE student:
 * Matches format: 'name' . 'surname' <numbers max 4> @pccoepune.org
 * This format gets free registration.
 */
const isMemberPccoeEligible = (member) => {
  if (!member || !member.email) return false;
  return extractPccoeBatch(member.email) !== null;
};

/**
 * Validate a single member's data against the event's defined fields.
 *
 * @param {Object} member       The member data object
 * @param {Array}  eventFields  The event's fields[] array
 * @param {string} prefix       Label prefix for error messages (e.g. "Team Leader", "Member 2")
 * @param {string} eventSlug    The event's slug
 * @returns {string[]}          Array of validation error messages
 */
const validateMemberAgainstFields = (member, eventFields, prefix, eventSlug) => {
  const errors = [];
  const isPixel = isPixelPerfectEvent(eventSlug);

  if (!member || typeof member !== 'object') {
    errors.push(`${prefix}: Member data must be a valid object`);
    return errors;
  }

  // Iterate through fields defined by this event
  for (const field of eventFields) {
    const value = member[field.name];
    const isPresent = value !== undefined && value !== null && String(value).trim() !== '';

    // Enforce required fields
    if (field.required && !isPresent) {
      errors.push(`${prefix}: ${field.label || field.name} is required`);
      continue;
    }

    if (!isPresent) continue;

    const strValue = String(value).trim();

    // Type-specific and semantic validation
    switch (field.type) {
      case 'email':
        if (!isValidEmail(strValue)) {
          errors.push(`${prefix}: ${field.label || 'Email'} must be a valid email address (e.g. user@example.com)`);
        }
        break;

      case 'phone':
        if (isPixel) {
          if (!isValidInternationalPhone(strValue)) {
            errors.push(
              `${prefix}: ${field.label || 'Phone number'} must be a valid phone number (7-16 digits, international format accepted)`
            );
          }
        } else {
          if (!isValidIndianMobile(strValue)) {
            errors.push(
              `${prefix}: ${field.label || 'Phone number'} must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9`
            );
          }
        }
        break;

      case 'select':
      case 'radio':
        if (field.options && field.options.length > 0 && !field.options.includes(strValue)) {
          errors.push(`${prefix}: ${field.label} must be one of: ${field.options.join(', ')}`);
        }
        break;

      case 'number':
        if (isNaN(Number(strValue))) {
          errors.push(`${prefix}: ${field.label} must be a valid number`);
        }
        break;

      case 'text':
      default:
        if (field.name === 'name' && strValue.length < 2) {
          errors.push(`${prefix}: Full name must be at least 2 characters long`);
        }
        break;
    }
  }

  // Fallback checks for critical identity fields if not explicitly enumerated in event.fields
  if (!member.name || String(member.name).trim().length < 2) {
    if (!errors.some((e) => e.includes('name') || e.includes('Name'))) {
      errors.push(`${prefix}: Full name is required`);
    }
  }
  if (!member.email || !isValidEmail(member.email)) {
    if (!errors.some((e) => e.includes('email') || e.includes('Email'))) {
      errors.push(`${prefix}: Valid email address is required`);
    }
  }
  if (isPixel) {
    if (!member.phone || !isValidInternationalPhone(member.phone)) {
      if (!errors.some((e) => e.includes('phone') || e.includes('Phone'))) {
        errors.push(`${prefix}: Valid phone number (7-16 digits) is required`);
      }
    }
  } else {
    if (!member.phone || !isValidIndianMobile(member.phone)) {
      if (!errors.some((e) => e.includes('phone') || e.includes('Phone'))) {
        errors.push(`${prefix}: Valid 10-digit Indian mobile number starting with 6-9 is required`);
      }
    }
  }
  if (!member.college || String(member.college).trim().length === 0) {
    if (!errors.some((e) => e.includes('college') || e.includes('College'))) {
      errors.push(`${prefix}: College name is required`);
    }
  }

  return errors;
};

/**
 * Sanitize member data — only retain defined event fields and normalize values.
 */
const sanitizeMemberData = (member, eventFields, eventSlug) => {
  const isPixel = isPixelPerfectEvent(eventSlug);
  const sanitized = {};
  for (const field of eventFields) {
    if (member[field.name] !== undefined && member[field.name] !== null) {
      let val = String(member[field.name]).trim();
      if (field.type === 'phone') {
        val = isPixel ? val.replace(/[\s\-()]/g, '') : normalizeIndianMobile(val);
      } else if (field.type === 'email') {
        val = val.toLowerCase();
      }
      sanitized[field.name] = val;
    }
  }
  // Ensure primary fields are included — PRESERVE user's entered email casing
  if (member.name) sanitized.name = String(member.name).trim();
  if (member.email) sanitized.email = String(member.email).trim();
  if (member.phone) {
    sanitized.phone = isPixel
      ? String(member.phone).trim().replace(/[\s\-()]/g, '')
      : normalizeIndianMobile(member.phone);
  }
  if (member.college) sanitized.college = String(member.college).trim();
  if (member.year) sanitized.year = String(member.year).trim();
  if (member.branch) sanitized.branch = String(member.branch).trim();

  const pccoeBatch = extractPccoeBatch(member.email);
  if (pccoeBatch) {
    sanitized.batch = `20${pccoeBatch}`;
  }

  return sanitized;
};

/**
 * @desc    Create a new validated, confirmed registration
 * @route   POST /api/registrations
 * @access  Public
 */
const createRegistration = async (req, res, next) => {
  try {
    const { eventSlug, teamName } = req.body;

    // ── 1. Validate event exists and is active ──
    let event = await Event.findOne({ slug: eventSlug?.toLowerCase() });
    if (!event) {
      event = await Event.findOne({ aliases: eventSlug?.toLowerCase() });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.registrationOpen === false || event.active === false) {
      return res.status(403).json({
        success: false,
        message: 'Registration for this event is currently closed.',
      });
    }

    // ── 2. Parse participant data ──
    let members = req.body.members;
    if (typeof members === 'string') {
      try {
        members = JSON.parse(members);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid members data — expected valid JSON array',
        });
      }
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one member is required',
      });
    }

    // ── 3. Team size validation (CTF requires exactly 2 or 4 members) ──
    const { minMembers, maxMembers, allowedTeamSizes } = event.teamConfig;

    if (event.slug === 'capture-the-flag' || (allowedTeamSizes && allowedTeamSizes.length > 0)) {
      const allowed = (allowedTeamSizes && allowedTeamSizes.length > 0) ? allowedTeamSizes : [2, 4];
      if (!allowed.includes(members.length)) {
        return res.status(400).json({
          success: false,
          message: `Capture the Flag requires exactly 2 or 4 team members (${members.length} provided). Teams of 1, 3, or 5+ are not permitted.`,
        });
      }
    } else {
      if (members.length < minMembers) {
        return res.status(400).json({
          success: false,
          message: `This event requires at least ${minMembers} member(s) (${members.length} provided)`,
        });
      }
      if (members.length > maxMembers) {
        return res.status(400).json({
          success: false,
          message: `This event allows at most ${maxMembers} member(s) (${members.length} provided)`,
        });
      }
    }

    // ── 4. Validate every individual member against event schema ──
    const validationErrors = [];
    members.forEach((member, index) => {
      const isSolo = maxMembers === 1 && (!allowedTeamSizes || Math.max(...allowedTeamSizes) === 1);
      let prefix = isSolo ? 'Participant' : `Member ${index + 1}`;
      if (index === 0 && !isSolo) prefix = 'Team Leader';

      const fieldErrors = validateMemberAgainstFields(member, event.fields, prefix, event.slug);
      validationErrors.push(...fieldErrors);
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Sanitize all members data
    const sanitizedMembers = members.map((member) =>
      sanitizeMemberData(member, event.fields, event.slug)
    );

    // Validate team name for team events
    const isTeamEvent = maxMembers > 1 || (allowedTeamSizes && Math.max(...allowedTeamSizes) > 1);
    if (isTeamEvent && (!teamName || !teamName.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required for team events',
      });
    }

    // ── 5. Duplicate Prevention ──

    // A. Check for duplicate emails/phones within the submitted team itself
    const emailsInSubmission = new Set();
    const phonesInSubmission = new Set();

    for (let i = 0; i < sanitizedMembers.length; i++) {
      const m = sanitizedMembers[i];
      if (emailsInSubmission.has(m.email)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate email "${m.email}" found across team members. Every member must have a distinct email address.`,
        });
      }
      emailsInSubmission.add(m.email);

      if (m.phone) {
        if (phonesInSubmission.has(m.phone)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate phone number "${m.phone}" found across team members. Every member must have a distinct phone number.`,
          });
        }
        phonesInSubmission.add(m.phone);
      }
    }

    // B. Check that EVERY participant email in this submission is unique for this event
    // (Every participant - whether team leader or member - can only be registered once per event)
    const allParticipantEmails = sanitizedMembers
      .map((m) => (m.email || '').trim().toLowerCase())
      .filter(Boolean);

    // Find if ANY submitted email already exists in ANY existing registration for this specific event
    // (checking leadEmail, members.email, participantData.email)
    const existingRegistration = await Registration.findOne({
      status: { $ne: 'REJECTED' },
      $and: [
        {
          $or: [
            { eventId: event._id },
            { eventSlug: event.slug },
            { eventName: { $regex: new RegExp(`^${event.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            ...(event.slug === 'capture-the-flag' ? [{ eventName: /capture/i }] : []),
          ],
        },
        {
          $or: [
            { leadEmail: { $in: allParticipantEmails } },
            { 'members.email': { $in: allParticipantEmails } },
            { 'participantData.email': { $in: allParticipantEmails } },
            { 'participantData.0.email': { $in: allParticipantEmails } },
          ],
        },
      ],
    });

    if (existingRegistration) {
      // Pinpoint exactly which participant/email caused the conflict
      const clashingEmail = allParticipantEmails.find((email) => {
        if (existingRegistration.leadEmail?.toLowerCase() === email) return true;
        if (
          Array.isArray(existingRegistration.members) &&
          existingRegistration.members.some((m) => m.email?.toLowerCase() === email)
        ) {
          return true;
        }
        if (
          Array.isArray(existingRegistration.participantData) &&
          existingRegistration.participantData.some((p) => p.email?.toLowerCase() === email)
        ) {
          return true;
        }
        return false;
      }) || allParticipantEmails[0];

      const clashingMember = sanitizedMembers.find(
        (m) => (m.email || '').trim().toLowerCase() === clashingEmail
      );
      const participantLabel = clashingMember?.name
        ? `Participant "${clashingMember.name}" (${clashingEmail})`
        : `Email "${clashingEmail}"`;

      return res.status(409).json({
        success: false,
        clashingEmail,
        message: `${participantLabel} is already registered for ${event.name} (Registration ID: ${existingRegistration.registrationId}). Every participant must have a unique email address and can only participate once in this event.`,
      });
    }

    // Also check dedicated collection as safety fallback
    try {
      const cleanSlug = event.slug.replace(/-/g, '_');
      const dedicatedCol = mongoose.connection.db.collection(`registrations_${cleanSlug}`);
      const existingInDedicated = await dedicatedCol.findOne({
        status: { $ne: 'REJECTED' },
        $or: [
          { leadEmail: { $in: allParticipantEmails } },
          { 'members.email': { $in: allParticipantEmails } },
        ],
      });

      if (existingInDedicated) {
        const clashingEmail = allParticipantEmails.find((email) => {
          if (existingInDedicated.leadEmail?.toLowerCase() === email) return true;
          if (
            Array.isArray(existingInDedicated.members) &&
            existingInDedicated.members.some((m) => m.email?.toLowerCase() === email)
          ) {
            return true;
          }
          return false;
        }) || allParticipantEmails[0];

        const clashingMember = sanitizedMembers.find(
          (m) => (m.email || '').trim().toLowerCase() === clashingEmail
        );
        const participantLabel = clashingMember?.name
          ? `Participant "${clashingMember.name}" (${clashingEmail})`
          : `Email "${clashingEmail}"`;

        return res.status(409).json({
          success: false,
          clashingEmail,
          message: `${participantLabel} is already registered for ${event.name} (Registration ID: ${existingInDedicated.registrationId}). Every participant must have a unique email address and can only participate once in this event.`,
        });
      }
    } catch (e) { }

    // D. Check duplicate team name for the same event
    if (teamName && teamName.trim() && isTeamEvent) {
      const existingTeam = await Registration.findOne({
        eventId: event._id,
        teamName: { $regex: new RegExp(`^${teamName.trim()}$`, 'i') },
        status: { $ne: 'REJECTED' },
      });
      if (existingTeam) {
        return res.status(409).json({
          success: false,
          message: `Team name "${teamName.trim()}" is already registered for ${event.name}. Please choose a distinct team name.`,
        });
      }
    }

    // ── 6. Calculate PCCOE Eligibility & Payment (Independently on Backend) ──
    const pccoeMemberCount = sanitizedMembers.filter((m) => isMemberPccoeEligible(m)).length;
    const allPccoeEligible = pccoeMemberCount === sanitizedMembers.length;

    let payableAmount = 0;
    let paymentRequired = false;
    let paymentReason = '';
    let paymentStatus = 'NOT_REQUIRED';
    let transactionId = (req.body.transactionId || '').trim();
    let screenshotUrl = (req.body.screenshotUrl || '').trim();
    let screenshotPublicId = '';

    if (allPccoeEligible) {
      payableAmount = 0;
      paymentRequired = false;
      paymentReason = isTeamEvent
        ? 'All team members are eligible PCCOE students'
        : 'Participant is an eligible PCCOE student';
      paymentStatus = 'NOT_REQUIRED';
      // For PCCOE registrations where amount = 0: Do NOT require transaction ID or payment screenshot
      transactionId = '';
      screenshotUrl = '';
    } else {
      // Official registrationFee retrieved directly from the Event document in MongoDB
      payableAmount = Number(event.registrationFee) || 0;
      paymentRequired = payableAmount > 0;
      paymentReason = isTeamEvent
        ? 'Team contains a non-eligible PCCOE participant'
        : 'Participant is outside the PCCOE eligibility criteria';
      paymentStatus = paymentRequired ? 'PENDING' : 'NOT_REQUIRED';

      if (paymentRequired) {
        // Enforce Transaction ID
        if (!transactionId) {
          return res.status(400).json({
            success: false,
            message: 'Transaction ID is required for paid registrations.',
          });
        }

        // Check for duplicate Transaction ID across the DB (case-insensitive)
        const escapedTx = transactionId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingTx = await Registration.findOne({
          transactionId: { $regex: new RegExp(`^${escapedTx}$`, 'i') },
        }).lean();

        if (existingTx) {
          return res.status(409).json({
            success: false,
            clashingTransactionId: transactionId,
            message: `Transaction ID "${transactionId}" has already been used for another registration (${existingTx.registrationId} - ${existingTx.eventName || 'Event'}). Each transaction ID must be unique across all registrations.`,
          });
        }

        // Check for uploaded file in req.files or req.file
        let uploadedFile = null;
        if (req.file) {
          uploadedFile = req.file;
        } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
          uploadedFile =
            req.files.find(
              (f) =>
                f.fieldname === 'paymentScreenshot' ||
                f.fieldname === 'screenshot' ||
                f.fieldname === 'file'
            ) || req.files[0];
        }

        if (uploadedFile) {
          const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
          const fileExt = path.extname(uploadedFile.originalname).toLowerCase();
          if (!allowedExts.includes(fileExt)) {
            return res.status(400).json({
              success: false,
              message: `Invalid payment screenshot format (${fileExt}). Allowed formats: JPG, JPEG, PNG, WebP.`,
            });
          }

          if (uploadedFile.size > 1 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              message: 'Payment screenshot file size exceeds 1MB limit (must be 1MB or below).',
            });
          }

          try {
            const uploadResult = await uploadToCloudinary(uploadedFile.buffer, {
              folder: `artimas26/payments`,
            });
            screenshotUrl = uploadResult.secure_url;
            screenshotPublicId = uploadResult.public_id;
          } catch (uploadErr) {
            console.error('Cloudinary payment upload error:', uploadErr.message);
            return res.status(500).json({
              success: false,
              message: 'Failed to upload payment screenshot. Please try again.',
            });
          }
        } else if (!screenshotUrl) {
          return res.status(400).json({
            success: false,
            message: 'Payment screenshot is required for paid registrations.',
          });
        }
      }
    }

    // ── 7. Generate IDs and Submission Token ──
    const registrationId = await generateRegistrationId();
    // Only generate submissionToken for Capture The Flag (CTF proof uploads)
    const isCtfEvent = event.slug === 'capture-the-flag';
    const submissionToken = isCtfEvent ? `st_${crypto.randomBytes(18).toString('hex')}` : undefined;

    const isSoloEvent = (!event.teamConfig || event.teamConfig.maxMembers === 1) || sanitizedMembers.length === 1;
    const lead = sanitizedMembers[0] || {};

    const teamSummary = !isSoloEvent && sanitizedMembers.length > 1
      ? sanitizedMembers.map((m, i) => `${i + 1}. ${m.name} (${m.phone || 'No phone'})`).join(' | ')
      : undefined;

    // ── 8. Save Registration in MongoDB (status: CONFIRMED) ──
    const leadCollegeValue = allPccoeEligible ? 'PCCOE' : (lead.college || '');

    const registrationData = {
      registrationId,
      eventId: event._id,
      eventSlug: event.slug,
      eventName: event.name,

      // Essential Contact Details
      leadName: lead.name || '',
      leadEmail: lead.email ? lead.email.toLowerCase() : '',
      leadPhone: lead.phone || '',
      leadCollege: leadCollegeValue,

      amount: payableAmount,
      isPccoe: allPccoeEligible,
      transactionId: transactionId || undefined,
      screenshotUrl: screenshotUrl || undefined,

      status: 'CONFIRMED',
    };

    // Always preserve team name if typed by user; fallback to participant's name
    const typedTeamName = (teamName && teamName.trim()) ? teamName.trim() : (lead.name && lead.name.trim() ? lead.name.trim() : '');
    if (typedTeamName) {
      registrationData.teamName = typedTeamName;
    }

    if (!isSoloEvent) {
      if (teamSummary) registrationData.teamSummary = teamSummary;
      registrationData.members = sanitizedMembers.map((m) => ({
        name: m.name,
        email: m.email?.toLowerCase(),
        phone: m.phone,
        college: isMemberPccoeEligible(m) ? 'PCCOE' : (m.college || ''),
        year: m.year,
        branch: m.branch,
      }));
    } else {
      registrationData.members = sanitizedMembers.map((m) => ({
        name: m.name,
        email: m.email?.toLowerCase(),
        phone: m.phone,
        college: isMemberPccoeEligible(m) ? 'PCCOE' : (m.college || ''),
        year: m.year,
        branch: m.branch,
      }));
    }

    // Explicitly compute all participant emails for atomic concurrency-safe uniqueness per event
    const uniqueParticipantEmails = Array.from(new Set(
      [registrationData.leadEmail, ...(sanitizedMembers || []).map((m) => m.email)]
        .filter(Boolean)
        .map((e) => String(e).trim().toLowerCase())
    ));
    registrationData.participantEmails = uniqueParticipantEmails;

    if (isTeamEvent && typedTeamName && typedTeamName.trim()) {
      registrationData.normalizedTeamName = typedTeamName.trim().toLowerCase();
    }

    const registration = await Registration.create(registrationData);

    // ── 9. Sync into Dedicated Event Collection (e.g. registrations_datathon) ──
    await syncToEventCollection(registration, event.slug);

    // ── 10. Return Confirmed Registration Details to Frontend ──
    res.status(201).json({
      success: true,
      message: 'Registration confirmed successfully',
      data: {
        registrationId: registration.registrationId,
        eventSlug: event.slug,
        eventName: event.name,
        passId: registration.registrationId,
        teamName: registration.teamName,
        paymentRequired,
        payableAmount,
        isPccoe: allPccoeEligible,
        payment: {
          required: paymentRequired,
          amount: payableAmount,
          status: paymentStatus,
          transactionId: registration.transactionId || registration.payment?.transactionId,
          screenshotUrl: registration.screenshotUrl || registration.payment?.screenshotUrl,
        },
        eligibility: {
          allPccoeEligible,
          pccoeMemberCount,
          totalMemberCount: sanitizedMembers.length,
        },
        status: registration.status,
        submissionToken: registration.submissionToken,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyValue && error.keyValue.participantEmails) {
        const email = error.keyValue.participantEmails;
        return res.status(409).json({
          success: false,
          clashingEmail: typeof email === 'string' ? email : undefined,
          message: `Participant "${email}" is already registered for this event. Every participant can only participate once per event.`,
        });
      }
      if (error.keyValue && error.keyValue.normalizedTeamName) {
        return res.status(409).json({
          success: false,
          message: 'A team with this name is already registered for this event. Please choose a distinct team name.',
        });
      }
    }
    next(error);
  }
};

/**
 * @desc    Get a registration by human-readable registration ID (Public status lookup)
 * @route   GET /api/registrations/:registrationId
 * @access  Public
 */
const getRegistration = async (req, res, next) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findOne({
      registrationId: registrationId.toUpperCase(),
    }).populate('eventId', 'name slug category yuga registrationFee');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Public view — non-sensitive info only
    res.status(200).json({
      success: true,
      data: {
        registrationId: registration.registrationId,
        event: registration.eventId
          ? {
            name: registration.eventId.name,
            slug: registration.eventId.slug,
            category: registration.eventId.category,
            yuga: registration.eventId.yuga,
          }
          : {
            name: registration.eventName,
            slug: registration.eventSlug,
          },
        teamName: registration.teamName,
        memberCount: Array.isArray(registration.participantData)
          ? registration.participantData.length
          : 1,
        status: registration.status,
        paymentRequired: (registration.amount > 0) || Boolean(registration.payment?.required),
        payableAmount: registration.amount !== undefined ? registration.amount : (registration.payment?.amount || 0),
        paymentStatus: registration.amount > 0 ? (registration.transactionId ? 'PENDING' : 'REQUIRED') : 'NOT_REQUIRED',
        eligibility: registration.eligibility,
        createdAt: registration.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload payment screenshot directly to Cloudinary
 * @route   POST /api/registrations/upload-payment-screenshot
 * @access  Public
 */
const uploadPaymentScreenshot = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot file is required',
      });
    }

    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file format (${fileExt}). Allowed formats: JPG, JPEG, PNG, WebP.`,
      });
    }

    const MAX_PAYMENT_SCREENSHOT_SIZE = 1 * 1024 * 1024; // Strict 1MB limit
    if (file.size > MAX_PAYMENT_SCREENSHOT_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot file size exceeds 1MB limit (must be 1MB or below).',
      });
    }

    const uploadResult = await uploadToCloudinary(file.buffer, {
      folder: 'artimas26/payments',
    });

    res.status(200).json({
      success: true,
      message: 'Payment screenshot uploaded successfully',
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if a participant's email is already registered for an event
 * @route   POST /api/registrations/check-email (and GET with query params)
 * @access  Public
 */
const checkEmailAvailability = async (req, res, next) => {
  try {
    const eventSlug = (req.body?.eventSlug || req.query?.eventSlug || '').trim().toLowerCase();
    const rawEmail = (req.body?.email || req.query?.email || '').trim().toLowerCase();

    if (!eventSlug || !rawEmail) {
      return res.status(400).json({
        success: false,
        message: 'Both eventSlug and email are required',
      });
    }

    // Find event
    let event = await Event.findOne({ slug: eventSlug });
    if (!event) {
      event = await Event.findOne({ aliases: eventSlug });
    }
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const emailRegex = new RegExp(`^${rawEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // Check main registrations collection
    const existingRegistration = await Registration.findOne({
      status: { $ne: 'REJECTED' },
      $and: [
        {
          $or: [
            { eventId: event._id },
            { eventSlug: event.slug },
            { eventName: { $regex: new RegExp(`^${event.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            ...(event.slug === 'capture-the-flag' ? [{ eventName: /capture/i }] : []),
          ],
        },
        {
          $or: [
            { leadEmail: rawEmail },
            { leadEmail: emailRegex },
            { 'members.email': rawEmail },
            { 'members.email': emailRegex },
            { 'participantData.email': rawEmail },
            { 'participantData.email': emailRegex },
            { 'participantData.0.email': rawEmail },
            { 'participantData.0.email': emailRegex },
          ],
        },
      ],
    }).lean();

    if (existingRegistration) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `This email is already registered for ${event.name} (${existingRegistration.registrationId}).`,
      });
    }

    // Check dedicated event collection as fallback
    try {
      const cleanSlug = event.slug.replace(/-/g, '_');
      const dedicatedCol = mongoose.connection.db.collection(`registrations_${cleanSlug}`);
      const existingInDedicated = await dedicatedCol.findOne({
        status: { $ne: 'REJECTED' },
        $or: [
          { leadEmail: rawEmail },
          { 'members.email': rawEmail },
        ],
      });
      if (existingInDedicated) {
        return res.status(200).json({
          success: true,
          available: false,
          message: `This email is already registered for ${event.name} (${existingInDedicated.registrationId}).`,
        });
      }
    } catch (e) {}

    return res.status(200).json({
      success: true,
      available: true,
      message: 'Email is available for registration',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRegistration,
  getRegistration,
  uploadPaymentScreenshot,
  checkEmailAvailability,
};
