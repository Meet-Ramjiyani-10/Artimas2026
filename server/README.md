# ARTIMAS 26 — Backend API Server

Production-ready REST API backend for the ARTIMAS 2026 technical and cultural festival website. Handles event management, dynamic registration forms, payment screenshot verification, and admin dashboard operations.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Folder Structure](#folder-structure)
5. [MongoDB Models](#mongodb-models)
6. [API Endpoints](#api-endpoints)
7. [Authentication](#authentication)
8. [Registration Flow](#registration-flow)
9. [Payment Screenshot Flow](#payment-screenshot-flow)
10. [Manual Verification Flow](#manual-verification-flow)
11. [Email Flow](#email-flow)
12. [Environment Variables](#environment-variables)
13. [Local Setup](#local-setup)
14. [Running Development Server](#running-development-server)
15. [Production Deployment](#production-deployment)
16. [Frontend Integration](#frontend-integration)
17. [Example API Requests](#example-api-requests)

---

## Project Overview

ARTIMAS 26 is a festival featuring 8 events across 4 cosmic epochs (Yugas). The backend provides:

- **Event data API** — replaces hardcoded frontend data
- **Dynamic registration forms** — each event defines its own form fields
- **Payment screenshot upload** — via Cloudinary
- **Admin verification dashboard** — approve/reject with email notifications
- **Role-based access control** — JWT authentication

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Next.js 16 │────▶│  Express.js API   │────▶│   MongoDB    │
│  Frontend   │     │  (Port 5000)      │     │              │
└─────────────┘     └───────┬───────────┘     └──────────────┘
                            │
                    ┌───────┴───────┐
                    │  Cloudinary   │
                    │  (Screenshots)│
                    └───────────────┘
```

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT + bcryptjs | Authentication & password hashing |
| Cloudinary | Payment screenshot storage |
| Multer | Multipart file upload handling |
| Nodemailer | Email notifications |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| express-validator | Input validation |
| CORS | Cross-origin resource sharing |

## Folder Structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── cloudinary.js      # Cloudinary SDK + upload helpers
│   │   └── mail.js            # Nodemailer transporter
│   ├── controllers/
│   │   ├── authController.js  # Login, profile
│   │   ├── eventController.js # Event CRUD + form
│   │   ├── registrationController.js  # Registration + upload
│   │   └── adminController.js # Verify, reject, stats
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT protect + role authorize
│   │   ├── errorMiddleware.js # Centralized error handler
│   │   ├── uploadMiddleware.js # Multer config
│   │   └── validationMiddleware.js # express-validator chains
│   ├── models/
│   │   ├── Event.js           # Event with dynamic fields
│   │   ├── Registration.js    # Registration + payment
│   │   └── Admin.js           # Admin with bcrypt
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── registrationRoutes.js
│   │   └── adminRoutes.js
│   ├── seed/
│   │   ├── seedEvents.js      # Populate events collection
│   │   └── seedAdmin.js       # Create initial admin
│   ├── utils/
│   │   ├── generateRegistrationId.js
│   │   └── sendVerificationEmail.js
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   ├── AUTH.md
│   └── REGISTRATION_FLOW.md
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## MongoDB Models

### Event
- Dynamic `fields[]` array for per-event registration forms
- `teamConfig` for min/max members
- All frontend properties (name, slug, category, yuga, fee, etc.)

### Registration
- Human-readable `registrationId` (e.g., `ART26-8F3K21`)
- `participantData` (Mixed) — flexible member data
- `payment` (amount, screenshotUrl, status)
- `verification` (verifiedBy, verifiedAt, remarks)

### Admin
- bcrypt-hashed passwords (pre-save hook)
- Roles: `TECH_TEAM`, `ADMIN`

## API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check |
| `GET` | `/api/events` | Public | List active events |
| `GET` | `/api/events/:slug` | Public | Get event by slug |
| `GET` | `/api/events/:slug/form` | Public | Get event form fields |
| `POST` | `/api/registrations` | Public | Create registration (multipart) |
| `GET` | `/api/registrations/:id` | Public | Lookup by registration ID |
| `POST` | `/api/auth/login` | Public | Admin login |
| `GET` | `/api/auth/me` | Protected | Current admin profile |
| `GET` | `/api/admin/stats` | Protected | Registration statistics |
| `GET` | `/api/admin/registrations` | Protected | List registrations (filtered) |
| `GET` | `/api/admin/registrations/:id` | Protected | Registration detail |
| `PATCH` | `/api/admin/registrations/:id/verify` | Protected | Approve registration |
| `PATCH` | `/api/admin/registrations/:id/reject` | Protected | Reject registration |

## Authentication

1. Admin logs in via `POST /api/auth/login` with email/password
2. Server returns a JWT (valid for 7 days by default)
3. Client includes token: `Authorization: Bearer <token>`
4. All `/api/admin/*` routes require valid JWT + appropriate role

## Registration Flow

1. Frontend fetches event form: `GET /api/events/:slug/form`
2. User fills team name, member details, payment info
3. Frontend submits: `POST /api/registrations` (multipart/form-data)
4. Server validates all fields, uploads screenshot to Cloudinary
5. Server creates registration with `PENDING` status
6. Returns registration ID to user (e.g., `ART26-8F3K21`)

## Payment Screenshot Flow

1. User uploads screenshot via the registration form
2. Multer validates: JPEG/PNG/WebP only, max 5MB
3. Screenshot is streamed to Cloudinary (memory storage → upload stream)
4. Cloudinary URL and public_id stored in MongoDB
5. Admin can view the screenshot URL in the registration detail

## Manual Verification Flow

1. Admin logs in → gets JWT
2. Views pending registrations: `GET /api/admin/registrations?status=PENDING`
3. Reviews screenshot in registration detail
4. Approves: `PATCH /api/admin/registrations/:id/verify`
5. Or rejects: `PATCH /api/admin/registrations/:id/reject`

## Email Flow

On approval, the system sends an HTML email containing:
- ARTIMAS 26 branding
- Participant name
- Event name
- Registration ID (Pass ID)
- Payment status: ✓ APPROVED
- Next steps (venue info, ID requirements)

No email is sent on rejection (by design).

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/artimas26
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=ARTIMAS 26 <noreply@artimas.in>
CLIENT_URL=http://localhost:3000
```

## Local Setup

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Create .env from template
cp .env.example .env

# 4. Fill in your .env values (MongoDB URI, Cloudinary, etc.)

# 5. Seed the database
npm run seed:events
npm run seed:admin
```

## Running Development Server

```bash
# Start with nodemon (auto-restart)
npm run dev

# Or start without nodemon
npm start
```

The server runs at `http://localhost:5000` by default.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a process manager (PM2) or Docker
3. Set secure JWT_SECRET
4. Configure real SMTP credentials
5. Set CLIENT_URL to production frontend URL
6. Run `npm start`

## Frontend Integration

The Next.js frontend sends registration data to:

```
POST http://localhost:5000/api/registrations
Content-Type: multipart/form-data
```

Set the API base URL via `NEXT_PUBLIC_API_URL` environment variable in the frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Example API Requests

### List Events
```bash
curl http://localhost:5000/api/events
```

### Get Event Form
```bash
curl http://localhost:5000/api/events/datathon/form
```

### Create Registration
```bash
curl -X POST http://localhost:5000/api/registrations \
  -F "eventSlug=datathon" \
  -F "teamName=Team Alpha" \
  -F 'members=[{"name":"John Doe","email":"john@example.com","phone":"9876543210","college":"PCCOE","year":"TE","branch":"CSE","prn":"12345"}]' \
  -F "transactionId=UPI123456789" \
  -F "paymentScreenshot=@screenshot.png"
```

### Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@artimas.in","password":"admin123456"}'
```

### Approve Registration
```bash
curl -X PATCH http://localhost:5000/api/admin/registrations/ART26-8F3K21/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"remarks":"Payment verified successfully"}'
```
