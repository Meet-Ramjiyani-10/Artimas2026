const mongoose = require('mongoose');
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

    const andConditions = [];

    // Filter by status (case-insensitive)
    if (status && status !== 'ALL') {
      andConditions.push({ status: status.toUpperCase() });
    }

    // Filter by event (support slug, name, or MongoDB eventId)
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

    // Attach event slug to each registration for UI ease
    const { nameToSlug } = await getEventMap();
    const enriched = registrations.map((r) => ({
      ...r,
      eventSlug: r.eventSlug || nameToSlug[(r.eventName || '').toLowerCase()] || '',
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
        event: event || null,
        eventSlug: event?.slug || registration.eventSlug || '',
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
    if (!registration.verification) registration.verification = {};
    registration.verification.verifiedBy = req.user?._id;
    registration.verification.verifiedAt = new Date();
    if (remarks) registration.verification.remarks = remarks;

    await registration.save();

    // Sync to dedicated event collection
    const event = await Event.findOne({
      $or: [
        { _id: registration.eventId },
        { slug: registration.eventSlug },
        { name: { $regex: new RegExp(`^${(registration.eventName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    }).lean();
    await syncToEventCollection(registration, event?.slug || registration.eventSlug);

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
    if (!registration.verification) registration.verification = {};
    registration.verification.verifiedBy = req.user?._id;
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
 * @desc    Get registration stats summary
 * @route   GET /api/admin/stats
 * @access  Protected (TECH_TEAM, ADMIN)
 */
const getStats = async (req, res, next) => {
  try {
    const [events, registrations] = await Promise.all([
      Event.find().sort({ createdAt: 1 }).lean(),
      Registration.find().lean(),
    ]);

    const total = registrations.length;
    const pending = registrations.filter((r) => r.status === 'PENDING').length;
    const confirmed = registrations.filter((r) => r.status === 'CONFIRMED').length;
    const approved = registrations.filter((r) => r.status === 'APPROVED').length;
    const rejected = registrations.filter((r) => r.status === 'REJECTED').length;
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

      return {
        eventName: ev.name,
        eventSlug: ev.slug,
        count: eventRegs.length,
        confirmed: eventRegs.filter((r) => r.status === 'CONFIRMED').length,
        pending: eventRegs.filter((r) => r.status === 'PENDING').length,
        approved: eventRegs.filter((r) => r.status === 'APPROVED').length,
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
        pending,
        confirmed,
        approved,
        rejected,
        pccoeFree,
        totalRevenue,
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
