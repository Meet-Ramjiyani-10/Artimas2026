const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ── Trust Proxy Configuration ──
// Safely configure Express to trust the production reverse proxy (Render, Railway, Nginx, ALB).
// Default to 1 trusted hop to prevent client IP spoofing via crafted X-Forwarded-For headers
// while ensuring express-rate-limit isolates buckets per real client IP.
const parseTrustProxy = () => {
  const envVal = process.env.TRUST_PROXY;
  if (envVal === undefined || envVal === '') return 1;
  if (envVal.toLowerCase() === 'true') return true;
  if (envVal.toLowerCase() === 'false') return false;
  const num = Number(envVal);
  if (!Number.isNaN(num)) return num;
  return envVal;
};
app.set('trust proxy', parseTrustProxy());

// ── Security ──
app.use(helmet());

// ── CORS Configuration ──
// Strictly allow explicitly configured production frontend origins and development localhost.
// Arbitrary wildcards (*), arbitrary *.vercel.app / *.netlify.app, and arbitrary origins are rejected.
const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, '');

  // 1. Check ALLOWED_ORIGINS (comma-separated list of origins)
  if (process.env.ALLOWED_ORIGINS) {
    const configuredOrigins = process.env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    for (const o of configuredOrigins) {
      if (cleanOrigin === o || cleanOrigin === `https://${o}`) return true;
    }
  }

  // 2. Check CLIENT_URL (standard single frontend environment variable)
  if (process.env.CLIENT_URL) {
    const clientUrl = process.env.CLIENT_URL.trim().replace(/\/+$/, '');
    if (clientUrl && (cleanOrigin === clientUrl || cleanOrigin === `https://${clientUrl}`)) {
      return true;
    }
  }

  // 3. In development / non-production environments, allow local development servers
  if (process.env.NODE_ENV !== 'production') {
    if (cleanOrigin === 'http://localhost:3000' || cleanOrigin === 'http://127.0.0.1:3000') {
      return true;
    }
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, mobile native requests)
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      // Reject all unauthorized origins by omitting Access-Control-Allow-Origin
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// ── Root route ──
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ARTIMAS 26 API Server is active',
    health: '/api/health',
    events: '/api/events',
  });
});

// ── Body parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiting on auth routes ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── General API rate limiter ──
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ARTIMAS 26 API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── Mount routes ──
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);

// ── Error handling ──
app.use(notFound);
app.use(errorHandler);

module.exports = app;
