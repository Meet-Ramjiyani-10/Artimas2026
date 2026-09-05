const Registration = require('../models/Registration');
const Event = require('../models/Event');
const sendVerificationEmail = require('../utils/sendVerificationEmail');
const { syncToEventCollection } = require('../utils/eventCollectionHelper');

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
 * @access  Protected (TECH_TEAM, ADMIN)
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
    } = req.query;

    const filter = {};

    // Filter by status (case-insensitive)
    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    // Filter by event (support slug, name, or MongoDB eventId)
    if (eventSlug && eventSlug !== 'ALL') {
      const event = await Event.findOne({ slug: eventSlug.toLowerCase() }).lean();
      if (event) {
        filter.eventName = { $regex: new RegExp(`^${event.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
      } else {
        filter.eventName = { $regex: new RegExp(eventSlug.replace(/-/g, ' '), 'i') };
      }
    } else if (eventName && eventName !== 'ALL') {
      filter.eventName = { $regex: new RegExp(`^${eventName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    } else if (eventId && eventId !== 'ALL') {
      const event = await Event.findById(eventId).lean();
      if (event) {
        filter.eventName = { $regex: new RegExp(`^${event.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
      }
    }

    // Filter by PCCOE free registration flag
    if (isPccoe !== undefined && isPccoe !== '') {
      filter.isPccoe = isPccoe === 'true' || isPccoe === true;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    // Comprehensive search across all key participant fields
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { registrationId: { $regex: q, $options: 'i' } },
        { teamName: { $regex: q, $options: 'i' } },
        { leadName: { $regex: q, $options: 'i' } },
        { leadEmail: { $regex: q, $options: 'i' } },
        { leadPhone: { $regex: q, $options: 'i' } },
        { leadCollege: { $regex: q, $options: 'i' } },
        { transactionId: { $regex: q, $options: 'i' } },
        { eventName: { $regex: q, $options: 'i' } },
      ];
    }

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

    // Attach event slug to each registration for UI ease
    const { nameToSlug } = await getEventMap();
    const enriched = registrations.map((r) => ({
      ...r,
      eventSlug: nameToSlug[(r.eventName || '').toLowerCase()] || '',
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
 * @access  Protected (TECH_TEAM, ADMIN)
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

    const event = await Event.findOne({
      name: { $regex: new RegExp(`^${(registration.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        ...registration,
        event: event || null,
        eventSlug: event?.slug || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve/verify a registration payment
 * @route   PATCH /api/admin/registrations/:id/verify
 * @access  Protected (TECH_TEAM, ADMIN)
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

    if (registration.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Registration is already approved',
      });
    }

    registration.status = 'APPROVED';
    await registration.save();

    // Sync to dedicated event collection
    const event = await Event.findOne({
      name: { $regex: new RegExp(`^${(registration.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).lean();
    await syncToEventCollection(registration, event?.slug);

    // Attempt verification email non-blocking
    if (registration.leadEmail) {
      try {
        await sendVerificationEmail({
          to: registration.leadEmail,
          participantName: registration.leadName || registration.teamName,
          eventName: registration.eventName,
          registrationId: registration.registrationId,
          teamName: registration.teamName,
          amount: registration.amount || 0,
          remarks: remarks || 'Registration confirmed & verified successfully',
        });
      } catch (emailErr) {
        console.warn(`✖ Verification email could not be sent to ${registration.leadEmail}:`, emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Registration verified and approved',
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

    registration.status = 'REJECTED';
    await registration.save();

    const event = await Event.findOne({
      name: { $regex: new RegExp(`^${(registration.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).lean();
    await syncToEventCollection(registration, event?.slug);

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
 * @desc    Get registration stats summary
 * @route   GET /api/admin/stats
 * @access  Protected (TECH_TEAM, ADMIN)
 */
const getStats = async (req, res, next) => {
  try {
    const [total, pending, confirmed, approved, rejected, pccoeFree, totalRevenueAgg, byEventAgg] = await Promise.all([
      Registration.countDocuments(),
      Registration.countDocuments({ status: 'PENDING' }),
      Registration.countDocuments({ status: 'CONFIRMED' }),
      Registration.countDocuments({ status: 'APPROVED' }),
      Registration.countDocuments({ status: 'REJECTED' }),
      Registration.countDocuments({ isPccoe: true }),
      Registration.aggregate([
        { $match: { status: { $ne: 'REJECTED' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      Registration.aggregate([
        {
          $group: {
            _id: '$eventName',
            count: { $sum: 1 },
            confirmed: { $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
            pccoeCount: { $sum: { $cond: [{ $eq: ['$isPccoe', true] }, 1, 0] } },
            revenue: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const { nameToSlug } = await getEventMap();

    const byEvent = byEventAgg.map((item) => ({
      eventName: item._id,
      eventSlug: nameToSlug[(item._id || '').toLowerCase()] || '',
      count: item.count,
      confirmed: item.confirmed,
      pending: item.pending,
      approved: item.approved,
      rejected: item.rejected,
      pccoeCount: item.pccoeCount,
      revenue: item.revenue,
    }));

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        approved,
        rejected,
        pccoeFree,
        totalRevenue: totalRevenueAgg[0]?.totalRevenue || 0,
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

    // Aggregate registrations count per event by eventName (excluding rejected)
    const regCounts = await Registration.aggregate([
      { $match: { status: { $ne: 'REJECTED' } } },
      { $group: { _id: '$eventName', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    regCounts.forEach((rc) => {
      if (rc._id) {
        countMap[rc._id.trim().toLowerCase()] = rc.count;
      }
    });

    const eventList = events.map((ev) => {
      const eventNameKey = (ev.name || '').trim().toLowerCase();
      const count = countMap[eventNameKey] || 0;

      return {
        id: ev._id,
        name: ev.name,
        slug: ev.slug,
        category: ev.category,
        yuga: ev.yuga,
        registrationFee: ev.registrationFee,
        registrationOpen: ev.registrationOpen !== false && ev.active !== false,
        active: ev.active !== false,
        registrationCount: count,
        minMembers: ev.teamConfig?.minMembers || 1,
        maxMembers: ev.teamConfig?.maxMembers || 1,
      };
    });

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
