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

// Cache-busting middleware: ensure live event data and registration status are never cached
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Public routes
router.get('/', getEvents);
router.get('/:slug', getEvent);
router.get('/:slug/form', getEventForm);

// Protected routes (admin only)
router.post('/', protect, authorize('ADMIN'), createEvent);
router.put('/:slug', protect, authorize('ADMIN'), updateEvent);

module.exports = router;
