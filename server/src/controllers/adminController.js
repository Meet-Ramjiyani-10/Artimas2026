const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const sendVerificationEmail = require('../utils/sendVerificationEmail');
const sendConfirmationEmail = require('../utils/sendConfirmationEmail');
const { syncToEventCollection } = require('../utils/eventCollectionHelper');
const { isMasterAdmin } = require('../middleware/authMiddleware');

/**
 * Helper to build an event name-to-slug mapping cache.
 */
const getEventMap = async () => {
  const events = await Event.find().lean();
  const slugToName = {};
  const nameToSlug = {};
  events.forEach((ev) => {
    if (ev.slug) slugToName[ev.slug.toLowerCase()] = ev.name;
    if (ev.name) nameToSlug[ev.name.toLowerCase()] = ev.slug;
  });
  return { events, slugToName, nameToSlug };
};

/**
 * @desc    Get all registrations (admin view) with filtering, search, and pagination
 * @route   GET /api/admin/registrations
 * @access  Protected (MASTER_ADMIN, ADMIN, TECH_TEAM, EVENT_ADMIN)
 */
const getRegistrations = async (req, res, next) => {
  try {
    const {
      status,
      eventSlug,
      eventId,
      eventName,
      isPccoe,
      dateFrom,
      dateTo,
      page = 1,
      limit = 25,
      search,
      verificationStatus,
      verified,
    } = req.query;

    const andConditions = [];

    // Role-based scoping: Event admins can ONLY access their assigned event
    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const requestedSlug = eventSlug && eventSlug !== 'ALL' ? eventSlug.toLowerCase() : null;
      const requestedId = eventId && eventId !== 'ALL' ? String(eventId) : null;

      if (requestedSlug && requestedSlug !== req.admin.eventSlug?.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You are only authorized to access ${req.admin.eventName || req.admin.eventSlug}`,
        });
      }
      if (requestedId && requestedId !== String(req.admin.eventId)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You are only authorized to access ${req.admin.eventName || req.admin.eventSlug}`,
        });
      }

      // Enforce query restriction to event admin's assigned event
      const eventNameRegex = new RegExp(`^${(req.admin.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      andConditions.push({
        $or: [
          ...(req.admin.eventId ? [{ eventId: req.admin.eventId }] : []),
          ...(req.admin.eventSlug ? [{ eventSlug: req.admin.eventSlug }] : []),
          ...(req.admin.eventName ? [{ eventName: eventNameRegex }] : []),
          ...(req.admin.eventSlug === 'capture-the-flag' ? [{ eventName: /capture/i }] : []),
        ],
      });
    } else {
      // Master Admin / Tech Team filtering
      if (eventSlug && eventSlug !== 'ALL') {
        const event = await Event.findOne({ slug: eventSlug.toLowerCase() }).lean();
        if (event) {
          const nameRegex = new RegExp(`^${event.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
          andConditions.push({
            $or: [
              { eventId: event._id },
              { eventSlug: event.slug },
              { eventName: nameRegex },
              ...(event.slug === 'capture-the-flag' ? [{ eventName: /capture/i }] : []),
            ],
          });
        } else {
          andConditions.push({ eventName: { $regex: new RegExp(eventSlug.replace(/-/g, ' '), 'i') } });
        }
      } else if (eventName && eventName !== 'ALL') {
        const event = await Event.findOne({
          name: { $regex: new RegExp(`^${eventName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        }).lean();
        if (event) {
          const nameRegex = new RegExp(`^${event.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
          andConditions.push({
            $or: [
              { eventId: event._id },
              { eventSlug: event.slug },
              { eventName: nameRegex },
              ...(event.slug === 'capture-the-flag' ? [{ eventName: /capture/i }] : []),
            ],
          });
        } else {
          andConditions.push({ eventName: { $regex: new RegExp(`^${eventName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        }
      } else if (eventId && eventId !== 'ALL') {
        const isValidObjectId = eventId.match(/^[0-9a-fA-F]{24}$/);
        andConditions.push({
          $or: [
            { eventId: isValidObjectId ? eventId : undefined },
            { _id: isValidObjectId ? eventId : undefined },
          ].filter((c) => Object.values(c)[0] !== undefined),
        });
      }
    }

    // Filter by verification status (All, Verified, Unverified)
    const vStatus = (verificationStatus || verified || '').toString().toUpperCase();
    if (vStatus === 'VERIFIED' || vStatus === 'TRUE') {
      andConditions.push({
        $or: [{ verified: true }, { status: 'APPROVED' }],
      });
    } else if (vStatus === 'UNVERIFIED' || vStatus === 'FALSE') {
      andConditions.push({
        $and: [
          { verified: { $ne: true } },
          { status: { $ne: 'APPROVED' } },
        ],
      });
    }

    // Filter by status (case-insensitive)
    if (status && status !== 'ALL') {
      andConditions.push({ status: status.toUpperCase() });
    }

    // Filter by PCCOE free registration flag
    if (isPccoe !== undefined && isPccoe !== '') {
      andConditions.push({ isPccoe: isPccoe === 'true' || isPccoe === true });
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo + 'T23:59:59.999Z');
      andConditions.push({ createdAt: dateFilter });
    }

    // Comprehensive search across all key participant fields
    if (search && search.trim()) {
      const q = search.trim();
      andConditions.push({
        $or: [
          { registrationId: { $regex: q, $options: 'i' } },
          { teamName: { $regex: q, $options: 'i' } },
          { leadName: { $regex: q, $options: 'i' } },
          { leadEmail: { $regex: q, $options: 'i' } },
          { leadPhone: { $regex: q, $options: 'i' } },
          { leadCollege: { $regex: q, $options: 'i' } },
          { transactionId: { $regex: q, $options: 'i' } },
          { eventName: { $regex: q, $options: 'i' } },
          { 'members.name': { $regex: q, $options: 'i' } },
          { 'members.email': { $regex: q, $options: 'i' } },
          { 'members.phone': { $regex: q, $options: 'i' } },
          { 'members.college': { $regex: q, $options: 'i' } },
        ],
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 1000);
    const skip = (pageNum - 1) * limitNum;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Registration.countDocuments(filter),
    ]);

    // Attach event slug and normalized verified boolean to each registration
    const { nameToSlug } = await getEventMap();
    const enriched = registrations.map((r) => ({
      ...r,
      verified: r.verified === true || r.status === 'APPROVED',
      eventSlug: r.eventSlug || nameToSlug[(r.eventName || '').toLowerCase()] || '',
      emailStatus: r.emailStatus || (r.verificationEmailSentAt ? 'sent' : r.verificationEmailLastError ? 'failed' : null),
      emailSentAt: r.emailSentAt || r.verificationEmailSentAt || null,
      emailLastError: r.emailLastError || r.verificationEmailLastError || null,
    }));

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single registration detail (admin view)
 * @route   GET /api/admin/registrations/:id
 * @access  Protected (MASTER_ADMIN, ADMIN, TECH_TEAM, EVENT_ADMIN)
 */
const getRegistrationDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find by human-readable registrationId or MongoDB _id
    let registration = await Registration.findOne({ registrationId: id.toUpperCase() }).lean();

    if (!registration && id.match(/^[0-9a-fA-F]{24}$/)) {
      registration = await Registration.findById(id).lean();
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Role-based check: Event admin can only view their assigned event's registrations
    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const matchesEvent =
        (registration.eventId && String(registration.eventId) === String(req.admin.eventId)) ||
        (registration.eventSlug && registration.eventSlug.toLowerCase() === req.admin.eventSlug?.toLowerCase()) ||
        (registration.eventName && registration.eventName.toLowerCase() === req.admin.eventName?.toLowerCase());

      if (!matchesEvent) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot access registrations from other events',
        });
      }
    }

    const event = await Event.findOne({
      $or: [
        { _id: registration.eventId },
        { slug: registration.eventSlug },
        { name: { $regex: new RegExp(`^${(registration.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        ...registration,
        verified: registration.verified === true || registration.status === 'APPROVED',
        event: event || null,
        eventSlug: event?.slug || registration.eventSlug || '',
        emailStatus: registration.emailStatus || (registration.verificationEmailSentAt ? 'sent' : registration.verificationEmailLastError ? 'failed' : null),
        emailSentAt: registration.emailSentAt || registration.verificationEmailSentAt || null,
        emailLastError: registration.emailLastError || registration.verificationEmailLastError || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve/verify a registration payment
 * @route   PATCH /api/admin/registrations/:id/verify
 * @access  Protected (MASTER_ADMIN, ADMIN, TECH_TEAM, EVENT_ADMIN)
 */
const verifyRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

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

    // Role-based authorization: Event admin can verify ONLY their assigned event
    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const matchesEvent =
        (registration.eventId && String(registration.eventId) === String(req.admin.eventId)) ||
        (registration.eventSlug && registration.eventSlug.toLowerCase() === req.admin.eventSlug?.toLowerCase()) ||
        (registration.eventName && registration.eventName.toLowerCase() === req.admin.eventName?.toLowerCase());

      if (!matchesEvent) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only verify participants for your assigned event',
        });
      }
    }

    if (registration.verified && registration.status === 'APPROVED') {
      if (remarks && registration.verification) {
        registration.verification.remarks = remarks;
        await registration.save();
      }
      return res.status(200).json({
        success: true,
        message: 'Registration is already verified',
        data: {
          registrationId: registration.registrationId,
          status: registration.status,
          verified: true,
          verifiedAt: registration.verifiedAt,
          verifiedBy: registration.verifiedBy,
          verificationEmailSentAt: registration.verificationEmailSentAt || null,
          verificationEmailLastError: registration.verificationEmailLastError || null,
        },
      });
    }

    const adminId = req.admin?._id;
    const now = new Date();

    const updateFields = {
      status: 'APPROVED',
      verified: true,
      verifiedAt: now,
      verifiedBy: adminId,
      'verification.verifiedBy': adminId,
      'verification.verifiedAt': now,
    };
    if (remarks) {
      updateFields['verification.remarks'] = remarks;
    }

    // Atomic update to eliminate race conditions between simultaneous VERIFY requests
    const updatedRegistration = await Registration.findOneAndUpdate(
      {
        _id: registration._id,
        $or: [
          { verified: { $ne: true } },
          { status: { $ne: 'APPROVED' } },
        ],
      },
      { $set: updateFields },
      { new: true }
    );

    // If null, another concurrent request just won the transition
    if (!updatedRegistration) {
      const currentDoc = await Registration.findById(registration._id).lean();
      return res.status(200).json({
        success: true,
        message: 'Registration is already verified',
        data: {
          registrationId: currentDoc?.registrationId || registration.registrationId,
          status: currentDoc?.status || 'APPROVED',
          verified: true,
          verifiedAt: currentDoc?.verifiedAt || now,
          verifiedBy: currentDoc?.verifiedBy || adminId,
          emailStatus: currentDoc?.emailStatus || (currentDoc?.verificationEmailSentAt ? 'sent' : null),
          emailSentAt: currentDoc?.emailSentAt || currentDoc?.verificationEmailSentAt || null,
          emailLastError: currentDoc?.emailLastError || currentDoc?.verificationEmailLastError || null,
        },
      });
    }

    // Sync to dedicated event collection
    const event = await Event.findOne({
      $or: [
        { _id: updatedRegistration.eventId },
        { slug: updatedRegistration.eventSlug },
        { name: { $regex: new RegExp(`^${(updatedRegistration.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    }).lean();
    await syncToEventCollection(updatedRegistration, event?.slug || updatedRegistration.eventSlug);

    // Return 200 OK — verification is separate from email sending (email not sent automatically)
    res.status(200).json({
      success: true,
      message: 'Registration verified and approved',
      data: {
        registrationId: updatedRegistration.registrationId,
        status: updatedRegistration.status,
        verified: updatedRegistration.verified,
        verifiedAt: updatedRegistration.verifiedAt,
        verifiedBy: updatedRegistration.verifiedBy,
        emailStatus: updatedRegistration.emailStatus || (updatedRegistration.verificationEmailSentAt ? 'sent' : null),
        emailSentAt: updatedRegistration.emailSentAt || updatedRegistration.verificationEmailSentAt || null,
        emailLastError: updatedRegistration.emailLastError || updatedRegistration.verificationEmailLastError || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unverify a registration (undo verification)
 * @route   PATCH /api/admin/registrations/:id/unverify
 * @access  Protected (MASTER_ADMIN, ADMIN, TECH_TEAM, EVENT_ADMIN)
 */
const unverifyRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

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

    // Role-based authorization: Event admin can unverify ONLY their assigned event
    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const matchesEvent =
        (registration.eventId && String(registration.eventId) === String(req.admin.eventId)) ||
        (registration.eventSlug && registration.eventSlug.toLowerCase() === req.admin.eventSlug?.toLowerCase()) ||
        (registration.eventName && registration.eventName.toLowerCase() === req.admin.eventName?.toLowerCase());

      if (!matchesEvent) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only unverify participants for your assigned event',
        });
      }
    }

    registration.status = 'CONFIRMED';
    registration.verified = false;
    registration.verifiedAt = null;
    registration.verifiedBy = null;

    if (registration.verification) {
      registration.verification.verifiedBy = null;
      registration.verification.verifiedAt = null;
      if (remarks) registration.verification.remarks = remarks;
    }

    await registration.save();

    const event = await Event.findOne({
      $or: [
        { _id: registration.eventId },
        { slug: registration.eventSlug },
        { name: { $regex: new RegExp(`^${(registration.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    }).lean();
    await syncToEventCollection(registration, event?.slug || registration.eventSlug);

    res.status(200).json({
      success: true,
      message: 'Registration unverified successfully',
      data: {
        registrationId: registration.registrationId,
        status: registration.status,
        verified: registration.verified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a registration payment
 * @route   PATCH /api/admin/registrations/:id/reject
 * @access  Protected (TECH_TEAM, ADMIN)
 */
const rejectRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

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

    // Role-based authorization: Event admin can reject ONLY their assigned event
    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const matchesEvent =
        (registration.eventId && String(registration.eventId) === String(req.admin.eventId)) ||
        (registration.eventSlug && registration.eventSlug.toLowerCase() === req.admin.eventSlug?.toLowerCase()) ||
        (registration.eventName && registration.eventName.toLowerCase() === req.admin.eventName?.toLowerCase()) ||
        (req.admin.eventSlug === 'capture-the-flag' && /capture/i.test(registration.eventName || ''));

      if (!matchesEvent) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only manage registrations for your assigned event',
        });
      }
    }

    registration.status = 'REJECTED';
    registration.verified = false;
    if (!registration.verification) registration.verification = {};
    registration.verification.verifiedBy = req.admin?._id;
    registration.verification.verifiedAt = new Date();
    if (remarks) registration.verification.remarks = remarks;

    await registration.save();

    const event = await Event.findOne({
      $or: [
        { _id: registration.eventId },
        { slug: registration.eventSlug },
        { name: { $regex: new RegExp(`^${(registration.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    }).lean();
    await syncToEventCollection(registration, event?.slug || registration.eventSlug);

    res.status(200).json({
      success: true,
      message: 'Registration marked as rejected',
      data: {
        registrationId: registration.registrationId,
        status: registration.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export verified participants as CSV (server-generated)
 * @route   GET /api/admin/export/verified-csv
 * @access  Protected (MASTER_ADMIN, ADMIN, TECH_TEAM, EVENT_ADMIN)
 */
const exportVerifiedCsv = async (req, res, next) => {
  try {
    const { eventSlug, eventId } = req.query;
    const andConditions = [];

    // The CSV export must contain ONLY VERIFIED participants
    andConditions.push({
      $or: [{ verified: true }, { status: 'APPROVED' }],
    });

    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const eventNameRegex = new RegExp(`^${(req.admin.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      andConditions.push({
        $or: [
          ...(req.admin.eventId ? [{ eventId: req.admin.eventId }] : []),
          ...(req.admin.eventSlug ? [{ eventSlug: req.admin.eventSlug }] : []),
          ...(req.admin.eventName ? [{ eventName: eventNameRegex }] : []),
          ...(req.admin.eventSlug === 'capture-the-flag' ? [{ eventName: /capture/i }] : []),
        ],
      });
    } else {
      // Master Admin: optional event filter
      if (eventSlug && eventSlug !== 'ALL') {
        const event = await Event.findOne({ slug: eventSlug.toLowerCase() }).lean();
        if (event) {
          const nameRegex = new RegExp(`^${event.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
          andConditions.push({
            $or: [
              { eventId: event._id },
              { eventSlug: event.slug },
              { eventName: nameRegex },
              ...(event.slug === 'capture-the-flag' ? [{ eventName: /capture/i }] : []),
            ],
          });
        }
      } else if (eventId && eventId !== 'ALL' && eventId.match(/^[0-9a-fA-F]{24}$/)) {
        andConditions.push({ eventId });
      }
    }

    const filter = { $and: andConditions };
    const registrations = await Registration.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    // Helper to safely escape CSV values
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).trim();
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Columns: Team Name,Registration ID,Email,Contact,College,Members
    const headerRow = 'Team Name,Registration ID,Email,Contact,College,Members';

    const dataRows = registrations.map((r) => {
      const teamName = r.teamName || r.leadName || 'Solo';
      const regId = r.registrationId || '';
      const email = r.leadEmail || '';
      const contact = r.leadPhone || '';
      const college = r.leadCollege || (r.isPccoe ? 'PCCOE' : '');

      let membersStr = '';
      if (Array.isArray(r.members) && r.members.length > 0) {
        membersStr = r.members
          .map((m) => {
            const memberName = m.name || '';
            const memberEmail = m.email ? ` (${m.email})` : '';
            return `${memberName}${memberEmail}`.trim();
          })
          .filter(Boolean)
          .join(', ');
      } else {
        membersStr = r.leadName || '';
      }

      return [
        escapeCsv(teamName),
        escapeCsv(regId),
        escapeCsv(email),
        escapeCsv(contact),
        escapeCsv(college),
        escapeCsv(membersStr),
      ].join(',');
    });

    const csvContent = [headerRow, ...dataRows].join('\r\n');

    const filePrefix = req.admin?.role === 'EVENT_ADMIN'
      ? (req.admin.eventSlug || 'event')
      : (eventSlug && eventSlug !== 'ALL' ? eventSlug : 'all_events');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="verified_${filePrefix}_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get registration stats summary
 * @route   GET /api/admin/stats
 * @access  Protected (MASTER_ADMIN, ADMIN, TECH_TEAM, EVENT_ADMIN)
 */
const getStats = async (req, res, next) => {
  try {
    const [events, registrations] = await Promise.all([
      Event.find().sort({ createdAt: 1 }).lean(),
      Registration.find().lean(),
    ]);

    // Role-based stats for EVENT_ADMIN
    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const eventNameRegex = new RegExp(`^${(req.admin.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const eventRegs = registrations.filter((r) => {
        if (r.eventId && String(r.eventId) === String(req.admin.eventId)) return true;
        if (r.eventSlug && r.eventSlug.toLowerCase() === req.admin.eventSlug?.toLowerCase()) return true;
        if (r.eventName && eventNameRegex.test(r.eventName)) return true;
        if (req.admin.eventSlug === 'capture-the-flag' && r.eventName && r.eventName.toLowerCase().includes('capture')) return true;
        return false;
      });

      const total = eventRegs.length;
      const verified = eventRegs.filter((r) => r.verified === true || r.status === 'APPROVED').length;
      const unverified = eventRegs.filter((r) => r.verified !== true && r.status !== 'APPROVED' && r.status !== 'REJECTED').length;
      const totalTeams = eventRegs.filter((r) => (r.teamName && r.teamName.trim()) || (r.members && r.members.length > 1)).length;
      const totalRevenue = eventRegs
        .filter((r) => r.status !== 'REJECTED')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      return res.status(200).json({
        success: true,
        data: {
          total,
          totalRegistrations: total,
          verified,
          unverified,
          totalTeams,
          totalRevenue,
          revenue: totalRevenue,
          eventName: req.admin.eventName,
          eventSlug: req.admin.eventSlug,
        },
      });
    }

    // Master Admin full stats
    const total = registrations.length;
    const pending = registrations.filter((r) => r.status === 'PENDING').length;
    const confirmed = registrations.filter((r) => r.status === 'CONFIRMED').length;
    const approved = registrations.filter((r) => r.status === 'APPROVED' || r.verified === true).length;
    const rejected = registrations.filter((r) => r.status === 'REJECTED').length;
    const verified = approved;
    const unverified = registrations.filter((r) => r.status !== 'APPROVED' && r.verified !== true && r.status !== 'REJECTED').length;
    const pccoeFree = registrations.filter((r) => r.isPccoe === true).length;
    const totalRevenue = registrations
      .filter((r) => r.status !== 'REJECTED')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const byEvent = events.map((ev) => {
      const eventNameRegex = new RegExp(`^${ev.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const eventRegs = registrations.filter((r) => {
        if (r.eventId && String(r.eventId) === String(ev._id)) return true;
        if (r.eventSlug && r.eventSlug.toLowerCase() === ev.slug.toLowerCase()) return true;
        if (r.eventName && eventNameRegex.test(r.eventName)) return true;
        if (ev.slug === 'capture-the-flag' && r.eventName && r.eventName.toLowerCase().includes('capture')) return true;
        return false;
      });

      const evApproved = eventRegs.filter((r) => r.status === 'APPROVED' || r.verified === true).length;
      const evUnverified = eventRegs.filter((r) => r.status !== 'APPROVED' && r.verified !== true && r.status !== 'REJECTED').length;

      return {
        eventName: ev.name,
        eventSlug: ev.slug,
        count: eventRegs.length,
        confirmed: eventRegs.filter((r) => r.status === 'CONFIRMED').length,
        pending: eventRegs.filter((r) => r.status === 'PENDING').length,
        approved: evApproved,
        verified: evApproved,
        unverified: evUnverified,
        rejected: eventRegs.filter((r) => r.status === 'REJECTED').length,
        pccoeCount: eventRegs.filter((r) => r.isPccoe === true).length,
        revenue: eventRegs
          .filter((r) => r.status !== 'REJECTED')
          .reduce((sum, r) => sum + (r.amount || 0), 0),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        totalRegistrations: total,
        totalVerified: verified,
        totalUnverified: unverified,
        pending,
        confirmed,
        approved,
        verified,
        unverified,
        rejected,
        pccoeFree,
        totalRevenue,
        totalEvents: events.length,
        byEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all events with live registration status and accurate counts (Admin view)
 * @route   GET /api/admin/events
 * @access  Protected (TECH_TEAM, ADMIN)
 */
const getAdminEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: 1 }).lean();

    // Fetch all non-rejected registrations from main collection
    const registrations = await Registration.find({ status: { $ne: 'REJECTED' } })
      .select('eventId eventSlug eventName status')
      .lean();

    const eventList = await Promise.all(
      events.map(async (ev) => {
        const eventNameRegex = new RegExp(`^${ev.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        // Count matched registrations in main registrations collection
        const countFromMain = registrations.filter((r) => {
          if (r.eventId && String(r.eventId) === String(ev._id)) return true;
          if (r.eventSlug && r.eventSlug.toLowerCase() === ev.slug.toLowerCase()) return true;
          if (r.eventName && eventNameRegex.test(r.eventName)) return true;
          if (ev.slug === 'capture-the-flag' && r.eventName && r.eventName.toLowerCase().includes('capture')) return true;
          return false;
        }).length;

        // Fallback check if dedicated collection registrations_<clean_slug> has count
        let countFromDedicated = 0;
        try {
          const cleanSlug = ev.slug.replace(/-/g, '_');
          const dedicatedCol = mongoose.connection.db.collection(`registrations_${cleanSlug}`);
          countFromDedicated = await dedicatedCol.countDocuments({ status: { $ne: 'REJECTED' } });
        } catch (e) {}

        const finalCount = Math.max(countFromMain, countFromDedicated);

        return {
          id: ev._id,
          name: ev.name,
          slug: ev.slug,
          category: ev.category,
          yuga: ev.yuga,
          registrationFee: ev.registrationFee,
          registrationOpen: ev.registrationOpen !== false && ev.active !== false,
          active: ev.active !== false,
          registrationCount: finalCount,
          minMembers: ev.teamConfig?.minMembers || 1,
          maxMembers: ev.teamConfig?.maxMembers || 1,
        };
      })
    );

    const totalRegistrations = eventList.reduce((acc, ev) => acc + ev.registrationCount, 0);

    res.status(200).json({
      success: true,
      totalRegistrations,
      data: eventList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Open or close registration for an event
 * @route   PATCH /api/admin/events/:id/registration
 * @access  Protected (TECH_TEAM, ADMIN)
 */
const toggleEventRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { registrationOpen } = req.body;

    let event;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(id);
    }
    if (!event) {
      event = await Event.findOne({ slug: id.toLowerCase() });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const allowed =
        String(event._id) === String(req.admin.eventId) ||
        event.slug.toLowerCase() === req.admin.eventSlug?.toLowerCase();
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only toggle registration for your assigned event',
        });
      }
    }

    const newStatus = typeof registrationOpen === 'boolean'
      ? registrationOpen
      : !event.registrationOpen;

    event.registrationOpen = newStatus;
    event.active = newStatus;
    await event.save();

    res.status(200).json({
      success: true,
      message: `Registration for ${event.name} is now ${newStatus ? 'OPEN' : 'CLOSED'}`,
      data: {
        id: event._id,
        name: event.name,
        slug: event.slug,
        registrationOpen: event.registrationOpen,
        active: event.active,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend verification email to a verified registration
 * @route   POST /api/admin/registrations/:id/resend-verification-email
 * @access  Protected (MASTER_ADMIN, ADMIN, TECH_TEAM, EVENT_ADMIN)
 */
const resendVerificationEmail = async (req, res, next) => {
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

    // Role-based authorization: Event admin can only resend for their assigned event
    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const matchesEvent =
        (registration.eventId && String(registration.eventId) === String(req.admin.eventId)) ||
        (registration.eventSlug && registration.eventSlug.toLowerCase() === req.admin.eventSlug?.toLowerCase()) ||
        (registration.eventName && registration.eventName.toLowerCase() === req.admin.eventName?.toLowerCase()) ||
        (req.admin.eventSlug === 'capture-the-flag' && /capture/i.test(registration.eventName || ''));

      if (!matchesEvent) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only manage registrations for your assigned event',
        });
      }
    }

    if (!registration.verified || registration.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend verification email: Registration must be verified first',
      });
    }

    if (!registration.leadEmail) {
      return res.status(400).json({
        success: false,
        message: 'No recipient email address found for this registration',
      });
    }

    const emailResult = await sendVerificationEmail({
      to: registration.leadEmail,
      participantName: registration.leadName || registration.teamName,
      eventName: registration.eventName,
      eventSlug: registration.eventSlug,
      registrationId: registration.registrationId,
      teamName: registration.teamName,
      amount: registration.amount || 0,
      submissionToken: registration.submissionToken,
      remarks: registration.verification?.remarks || 'Registration confirmed & verified successfully',
    });

    if (emailResult && emailResult.success) {
      const now = new Date();
      await Registration.findByIdAndUpdate(registration._id, {
        $set: {
          emailStatus: 'sent',
          emailSentAt: now,
          emailLastError: null,
          verificationEmailSentAt: now,
          verificationEmailLastError: null,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Email Sent Successfully',
        data: {
          registrationId: registration.registrationId,
          emailStatus: 'sent',
          emailSentAt: now,
          emailLastError: null,
          verificationEmailSentAt: now,
          verificationEmailLastError: null,
        },
      });
    } else {
      const errMsg = (emailResult && emailResult.error) ? String(emailResult.error).slice(0, 500) : 'Failed to dispatch verification email';
      await Registration.findByIdAndUpdate(registration._id, {
        $set: {
          emailStatus: 'failed',
          emailLastError: errMsg,
          verificationEmailLastError: errMsg,
        },
      });

      return res.status(502).json({
        success: false,
        message: `Email Not Sent: ${errMsg}`,
        data: {
          registrationId: registration.registrationId,
          emailStatus: 'failed',
          emailSentAt: registration.emailSentAt || registration.verificationEmailSentAt || null,
          emailLastError: errMsg,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend confirmation email to a registration
 * @route   POST /api/admin/registrations/:id/resend-confirmation-email
 * @access  Protected (MASTER_ADMIN, ADMIN, TECH_TEAM, EVENT_ADMIN)
 */
const resendConfirmationEmail = async (req, res, next) => {
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

    if (req.admin && req.admin.role === 'EVENT_ADMIN') {
      const matchesEvent =
        (registration.eventId && String(registration.eventId) === String(req.admin.eventId)) ||
        (registration.eventSlug && registration.eventSlug.toLowerCase() === req.admin.eventSlug?.toLowerCase()) ||
        (registration.eventName && registration.eventName.toLowerCase() === req.admin.eventName?.toLowerCase()) ||
        (req.admin.eventSlug === 'capture-the-flag' && /capture/i.test(registration.eventName || ''));

      if (!matchesEvent) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only manage registrations for your assigned event',
        });
      }
    }

    const recipientEmail = registration.leadEmail || registration.members?.[0]?.email;
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'No recipient email address found for this registration',
      });
    }

    const event = await Event.findOne({
      $or: [
        { _id: registration.eventId },
        { slug: registration.eventSlug },
        { name: { $regex: new RegExp(`^${(registration.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    }).lean();

    const emailResult = await sendConfirmationEmail({
      to: recipientEmail,
      participantName: registration.leadName || registration.teamName,
      eventName: registration.eventName,
      eventSlug: registration.eventSlug || event?.slug,
      registrationId: registration.registrationId,
      teamName: registration.teamName,
      memberCount: registration.members?.length || 1,
      submissionToken: registration.submissionToken,
      payableAmount: registration.amount || 0,
      paymentRequired: (registration.amount || 0) > 0 && !registration.isPccoe,
    });

    if (emailResult && emailResult.success) {
      const now = new Date();
      await Registration.findByIdAndUpdate(registration._id, {
        $set: {
          confirmationEmailSentAt: now,
          confirmationEmailLastError: null,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Confirmation email resent successfully',
        data: {
          registrationId: registration.registrationId,
          confirmationEmailSentAt: now,
          confirmationEmailLastError: null,
        },
      });
    } else {
      const errMsg = (emailResult && emailResult.error) ? String(emailResult.error).slice(0, 500) : 'Failed to dispatch confirmation email';
      await Registration.findByIdAndUpdate(registration._id, {
        $set: {
          confirmationEmailLastError: errMsg,
        },
      });

      return res.status(502).json({
        success: false,
        message: `Failed to resend confirmation email: ${errMsg}`,
        data: {
          registrationId: registration.registrationId,
          confirmationEmailSentAt: registration.confirmationEmailSentAt,
          confirmationEmailLastError: errMsg,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRegistrations,
  getRegistrationDetail,
  verifyRegistration,
  unverifyRegistration,
  rejectRegistration,
  exportVerifiedCsv,
  getStats,
  getAdminEvents,
  toggleEventRegistration,
  sendVerificationEmail: resendVerificationEmail,
  resendVerificationEmail,
  resendConfirmationEmail,
};
