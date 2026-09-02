const Event = require('../models/Event');

/**
 * @desc    Get all active events
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res, next) => {
  try {
    const { category, yuga, active } = req.query;

    const filter = {};

    // Filter by active status only if explicitly requested
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    if (category) filter.category = { $regex: category, $options: 'i' };
    if (yuga) filter.yuga = { $regex: yuga, $options: 'i' };

    const events = await Event.find(filter)
      .select('-fields') // Don't include form fields in the listing
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single event by slug or ID
 * @route   GET /api/events/:slug
 * @access  Public
 */
const getEvent = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Try finding by slug first, then by ID, then by alias
    let event = await Event.findOne({ slug: slug.toLowerCase() });

    if (!event) {
      event = await Event.findOne({ aliases: slug.toLowerCase() });
    }

    if (!event) {
      // Try by MongoDB ID
      if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        event = await Event.findById(slug);
      }
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the registration form fields for an event
 * @route   GET /api/events/:slug/form
 * @access  Public
 */
const getEventForm = async (req, res, next) => {
  try {
    const { slug } = req.params;

    let event = await Event.findOne({ slug: slug.toLowerCase() });

    if (!event) {
      event = await Event.findOne({ aliases: slug.toLowerCase() });
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

    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        eventName: event.name,
        slug: event.slug,
        registrationFee: event.registrationFee,
        teamConfig: event.teamConfig,
        fields: event.fields,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new event (admin only)
 * @route   POST /api/events
 * @access  Protected (ADMIN)
 */
const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an event (admin only)
 * @route   PUT /api/events/:slug
 * @access  Protected (ADMIN)
 */
const updateEvent = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const event = await Event.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, getEvent, getEventForm, createEvent, updateEvent };
