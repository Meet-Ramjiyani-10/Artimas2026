const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  getEventForm,
  createEvent,
  updateEvent,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getEvents);
router.get('/:slug', getEvent);
router.get('/:slug/form', getEventForm);

// Protected routes (admin only)
router.post('/', protect, authorize('ADMIN'), createEvent);
router.put('/:slug', protect, authorize('ADMIN'), updateEvent);

module.exports = router;
