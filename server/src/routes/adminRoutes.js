const express = require('express');
const router = express.Router();
const {
  getRegistrations,
  getRegistrationDetail,
  verifyRegistration,
  unverifyRegistration,
  rejectRegistration,
  exportVerifiedCsv,
  getStats,
  getAdminEvents,
  toggleEventRegistration,
} = require('../controllers/adminController');
const { getAdminCtfScreenshots } = require('../controllers/ctfController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateVerification } = require('../middleware/validationMiddleware');

// All admin routes are protected and require one of the admin roles
router.use(protect);
router.use(authorize('MASTER_ADMIN', 'ADMIN', 'TECH_TEAM', 'EVENT_ADMIN'));

// Cache-busting middleware: prevent browser and intermediate proxy caching
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// GET /api/admin/events
router.get('/events', getAdminEvents);

// PATCH /api/admin/events/:id/registration
router.patch('/events/:id/registration', toggleEventRegistration);

// GET /api/admin/stats
router.get('/stats', getStats);

// GET /api/admin/export/verified-csv (must be before /registrations/:id)
router.get('/export/verified-csv', exportVerifiedCsv);

// GET /api/admin/registrations
router.get('/registrations', getRegistrations);

// GET /api/admin/registrations/:id
router.get('/registrations/:id', getRegistrationDetail);

// GET /api/admin/registrations/:id/ctf/screenshots
router.get('/registrations/:id/ctf/screenshots', getAdminCtfScreenshots);

// PATCH /api/admin/registrations/:id/verify
router.patch('/registrations/:id/verify', validateVerification, verifyRegistration);

// PATCH /api/admin/registrations/:id/unverify
router.patch('/registrations/:id/unverify', validateVerification, unverifyRegistration);

// PATCH /api/admin/registrations/:id/reject
router.patch('/registrations/:id/reject', validateVerification, rejectRegistration);

module.exports = router;
