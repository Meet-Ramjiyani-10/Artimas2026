const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Protect routes — verify JWT and attach admin to request.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach admin to request (without password hash)
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — admin not found',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — token expired',
      });
    }
    next(error);
  }
};

/**
 * Check if an admin is a master admin.
 * Treats legacy 'ADMIN' and 'TECH_TEAM' as MASTER_ADMIN.
 */
const isMasterAdmin = (admin) => {
  if (!admin || !admin.role) return false;
  return ['MASTER_ADMIN', 'ADMIN', 'TECH_TEAM'].includes(admin.role);
};

/**
 * Authorize by role — restrict access to specific roles.
 * Must be used after `protect`.
 *
 * @param  {...string} roles  Allowed roles (e.g., 'MASTER_ADMIN', 'EVENT_ADMIN')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const adminRole = req.admin.role;

    // Check if role is directly in allowed roles
    if (roles.includes(adminRole)) {
      return next();
    }

    // Backwards compatibility: If MASTER_ADMIN is allowed, allow legacy ADMIN and TECH_TEAM
    if (roles.includes('MASTER_ADMIN') && (adminRole === 'ADMIN' || adminRole === 'TECH_TEAM')) {
      return next();
    }

    // If legacy ADMIN is allowed, allow MASTER_ADMIN
    if ((roles.includes('ADMIN') || roles.includes('TECH_TEAM')) && adminRole === 'MASTER_ADMIN') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Role '${adminRole}' is not authorized to access this resource`,
    });
  };
};

/**
 * Middleware to verify that an event admin can only access their assigned event.
 * Master admin is always permitted.
 */
const verifyEventAccess = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (isMasterAdmin(req.admin)) {
    return next();
  }

  if (req.admin.role === 'EVENT_ADMIN') {
    const requestedSlug = req.params.eventSlug || req.query.eventSlug;
    const requestedId = req.params.eventId || req.query.eventId;

    if (requestedSlug && requestedSlug.toLowerCase() !== req.admin.eventSlug?.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You are only authorized to access ${req.admin.eventName || req.admin.eventSlug}`,
      });
    }

    if (requestedId && String(requestedId) !== String(req.admin.eventId)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You are only authorized to access ${req.admin.eventName || req.admin.eventSlug}`,
      });
    }

    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden: Insufficient permissions',
  });
};

module.exports = {
  protect,
  authorize,
  isMasterAdmin,
  verifyEventAccess,
};
