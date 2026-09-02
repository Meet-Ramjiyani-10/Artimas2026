const Registration = require('../models/Registration');
const Event = require('../models/Event');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

/**
 * @desc    Get all registrations (admin view) with filtering and pagination
 * @route   GET /api/admin/registrations
 * @access  Protected (TECH_TEAM, ADMIN)
 */
const getRegistrations = async (req, res, next) => {
  try {
    const {
      status,
      eventSlug,
      eventId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 25,
      search,
    } = req.query;

    const filter = {};

    // Filter by status
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    // Filter by event (slug or ID)
    if (eventSlug) {
      const event = await Event.findOne({ slug: eventSlug.toLowerCase() });
      if (event) filter.eventId = event._id;
    } else if (eventId) {
      filter.eventId = eventId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    // Search by registration ID or team name
    if (search) {
      filter.$or = [
        { registrationId: { $regex: search, $options: 'i' } },
        { teamName: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 25, 100);
    const skip = (pageNum - 1) * limitNum;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .populate('eventId', 'name slug category yuga registrationFee')
        .populate('verification.verifiedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Registration.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: registrations.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single registration detail (admin view)
 * @route   GET /api/admin/registrations/:id
 * @access  Protected (TECH_TEAM, ADMIN)
 *
 * Full detail including participant data, payment screenshot URL, and
 * verification records. Only accessible with valid JWT + role.
 */
const getRegistrationDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find by registrationId (human-readable) or MongoDB _id
    let registration = await Registration.findOne({ registrationId: id.toUpperCase() })
      .populate('eventId', 'name slug category yuga registrationFee teamConfig')
      .populate('verification.verifiedBy', 'name email');

    if (!registration && id.match(/^[0-9a-fA-F]{24}$/)) {
      registration = await Registration.findById(id)
        .populate('eventId', 'name slug category yuga registrationFee teamConfig')
        .populate('verification.verifiedBy', 'name email');
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve/verify a registration payment
 * @route   PATCH /api/admin/registrations/:id/verify
 * @access  Protected (TECH_TEAM, ADMIN)
 *
 * Updates status, records verification audit trail, then attempts email.
 * Approval is committed BEFORE email is sent — SMTP failure does not
 * roll back the approval. emailStatus tracks delivery state separately.
 */
const verifyRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // Find registration
    let registration = await Registration.findOne({ registrationId: id.toUpperCase() })
      .populate('eventId', 'name slug registrationFee');

    if (!registration && id.match(/^[0-9a-fA-F]{24}$/)) {
      registration = await Registration.findById(id)
        .populate('eventId', 'name slug registrationFee');
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Prevent duplicate approval
    if (registration.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Registration is already approved',
      });
    }

    // ── Step 1: Update and persist approval (before email) ──
    registration.status = 'APPROVED';
    registration.payment.status = 'APPROVED';
    registration.verification = {
      verifiedBy: req.admin._id,
      verifiedAt: new Date(),
      remarks: remarks || 'Payment verified successfully',
    };

    await registration.save();

    // ── Step 2: Attempt email (non-blocking for approval) ──
    const participantData = registration.participantData;
    const leadMember = Array.isArray(participantData) ? participantData[0] : participantData;
    let emailSent = false;

    if (leadMember && leadMember.email) {
      try {
        emailSent = await sendVerificationEmail({
          to: leadMember.email,
          participantName: leadMember.name || registration.teamName,
          eventName: registration.eventId?.name || 'ARTIMAS 26 Event',
          registrationId: registration.registrationId,
          teamName: registration.teamName,
          amount: registration.payment.amount,
          remarks: remarks || 'Payment verified successfully',
        });

        registration.emailStatus = emailSent ? 'SENT' : 'FAILED';
        registration.emailSentAt = emailSent ? new Date() : undefined;
        registration.emailError = emailSent ? undefined : 'SMTP not configured';
      } catch (emailError) {
        registration.emailStatus = 'FAILED';
        registration.emailError = emailError.message || 'Email delivery failed';
        console.error(`✖ Email error for ${registration.registrationId}:`, emailError.message);
      }

      // Persist email status (approval already saved above)
      await registration.save();
    }

    // Re-populate for response
    await registration.populate('verification.verifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Registration approved successfully',
      data: {
        registrationId: registration.registrationId,
        status: registration.status,
        paymentStatus: registration.payment.status,
        emailStatus: registration.emailStatus,
        emailSentAt: registration.emailSentAt,
        verification: registration.verification,
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

    // Find registration
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

    if (registration.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Registration is already rejected',
      });
    }

    // Update registration
    registration.status = 'REJECTED';
    registration.payment.status = 'REJECTED';
    registration.verification = {
      verifiedBy: req.admin._id,
      verifiedAt: new Date(),
      remarks: remarks || 'Payment could not be verified',
    };

    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Registration rejected',
      data: {
        registrationId: registration.registrationId,
        status: registration.status,
        paymentStatus: registration.payment.status,
        verification: registration.verification,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get registration stats summary
 * @route   GET /api/admin/stats
 * @access  Protected (TECH_TEAM, ADMIN)
 */
const getStats = async (req, res, next) => {
  try {
    const [total, pending, approved, rejected, byEvent] = await Promise.all([
      Registration.countDocuments(),
      Registration.countDocuments({ status: 'PENDING' }),
      Registration.countDocuments({ status: 'APPROVED' }),
      Registration.countDocuments({ status: 'REJECTED' }),
      Registration.aggregate([
        {
          $group: {
            _id: '$eventId',
            count: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
          },
        },
        {
          $lookup: {
            from: 'events',
            localField: '_id',
            foreignField: '_id',
            as: 'event',
          },
        },
        { $unwind: '$event' },
        {
          $project: {
            eventName: '$event.name',
            eventSlug: '$event.slug',
            count: 1,
            pending: 1,
            approved: 1,
            rejected: 1,
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        byEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all events with their registration status and counts (Admin view)
 * @route   GET /api/admin/events
 * @access  Protected (TECH_TEAM, ADMIN)
 */
const getAdminEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: 1 });

    // Aggregate registrations count per event
    const regCounts = await Registration.aggregate([
      { $match: { status: { $ne: 'REJECTED' } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    regCounts.forEach((rc) => {
      countMap[String(rc._id)] = rc.count;
    });

    const eventList = events.map((ev) => ({
      id: ev._id,
      name: ev.name,
      slug: ev.slug,
      category: ev.category,
      yuga: ev.yuga,
      registrationFee: ev.registrationFee,
      registrationOpen: ev.registrationOpen !== false && ev.active !== false,
      active: ev.active,
      registrationCount: countMap[String(ev._id)] || 0,
      minMembers: ev.teamConfig?.minMembers || 1,
      maxMembers: ev.teamConfig?.maxMembers || 1,
    }));

    res.status(200).json({
      success: true,
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

    // Determine new status: boolean provided or toggle
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

module.exports = {
  getRegistrations,
  getRegistrationDetail,
  verifyRegistration,
  rejectRegistration,
  getStats,
  getAdminEvents,
  toggleEventRegistration,
};
