# ARTIMAS 26 — Master Backend Documentation

A complete architectural, API, database, and operational specification for the ARTIMAS 26 backend service.

---

## 1. System Overview

The ARTIMAS 26 backend is an enterprise-grade Express.js application backed by MongoDB Atlas (Cloud) that handles event registrations, dynamic form validation, administrative registration controls (open/close toggling), CTF challenge proof management via Cloudinary, and automated email confirmation dispatch.

### Tech Stack
| Component | Technology | Version / Details |
|---|---|---|
| **Runtime** | Node.js | v18+ |
| **Framework** | Express.js | 4.19+ |
| **Database** | MongoDB Atlas (Cloud) | Driver: Mongoose 8.4+ |
| **Authentication** | JWT + bcryptjs | HMAC-SHA256, 7-day expiration |
| **File Storage** | Cloudinary CDN | Secure object storage for CTF screenshots |
| **File Handling** | Multer | Memory storage, strict 5MB limit, JPG/PNG/WebP only |
| **Email Delivery**| Nodemailer | SMTP transport with asynchronous retry handling |
| **Security** | Helmet, CORS, Express-Rate-Limit | Strict Origin isolation |

---

## 2. Directory Structure

```
d:\artimas2026\server/
├── .env                     # Private environment configuration (git-ignored)
├── .env.example             # Environment template
├── package.json             # Dependencies and operational scripts
├── BACKEND_DOCUMENTATION.md # This complete specification
├── docs/                    # Focused sub-specifications
│   ├── API.md               # Detailed API endpoint schemas
│   ├── AUTH.md              # Auth tokens & roles
│   ├── DATABASE.md          # Mongoose schema details
│   └── REGISTRATION_FLOW.md # Multi-step registration flow diagrams
└── src/
    ├── config/              # Infrastructure clients
    │   ├── db.js            # MongoDB Atlas connection with auto-retry
    │   └── cloudinary.js    # Cloudinary SDK client & upload helpers
    ├── controllers/         # Request handling & business logic
    │   ├── adminController.js        # Admin event & registration operations
    │   ├── authController.js         # JWT login & me endpoints
    │   ├── ctfScreenshotController.js# CTF proof submission & retrieval
    │   ├── eventController.js        # Public event & form retrieval
    │   └── registrationController.js # Registration creation & verification
    ├── middleware/          # Security & processing middleware
    │   ├── authMiddleware.js         # JWT verify & RBAC role checks
    │   ├── errorMiddleware.js        # Centralized error formatter
    │   ├── uploadMiddleware.js       # Multer memory storage & MIME guard
    │   └── validationMiddleware.js   # Express-validator schemas
    ├── models/              # Mongoose Data Models
    │   ├── CtfScreenshot.js # CTF challenge proof submissions
    │   ├── Event.js         # Event definitions, forms, & open/close state
    │   ├── Registration.js  # Participant registrations & pass tokens
    │   └── User.js          # Admin & tech-team user accounts
    ├── routes/              # Express API Routes
    │   ├── adminRoutes.js   # /api/admin/*
    │   ├── authRoutes.js    # /api/auth/*
    │   ├── eventRoutes.js   # /api/events/*
    │   └── registrationRoutes.js # /api/registrations/*
    ├── seed/                # Database seed scripts
    │   ├── seedAdmin.js     # Creates/updates primary admin account
    │   └── seedEvents.js    # Seeds all 8 festival events into Atlas
    ├── utils/               # Utilities & helpers
    │   ├── emailService.js  # Nodemailer HTML email dispatcher
    │   ├── idGenerator.js   # Pass ID (ART26-XXXXXX) & token generator
    │   └── responseHandler.js# Standardized JSON response formatting
    └── index.js             # Express application entrypoint
```

---

## 3. Environment Variables Reference

Stored securely in `server/.env` (never checked into source control):

| Variable | Required | Default / Format | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` / `production` | Server execution environment |
| `PORT` | Yes | `5000` | Port Express binds to |
| `CLIENT_URL` | Yes | `http://localhost:3000` | Allowed CORS origin for Next.js frontend |
| `MONGODB_URI` | **Yes** | `mongodb+srv://...` | MongoDB Atlas cluster connection string |
| `JWT_SECRET` | **Yes** | `64+ char random string` | Secret key used to sign and verify JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Lifetime of admin session tokens |
| `ADMIN_EMAIL` | **Yes** | `admin@artimas.in` | Root administrative email address |
| `ADMIN_PASSWORD` | **Yes** | `QWERTYUIOP1234567890` | Administrative password (hashed on save) |
| `CLOUDINARY_CLOUD_NAME` | Optional | `qllarlul` | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Optional | String | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Optional | String | Cloudinary API Secret |
| `SMTP_HOST` | Optional | `smtp.gmail.com` | Outgoing SMTP mail server |
| `SMTP_PORT` | Optional | `587` | Outgoing SMTP port (TLS) |
| `SMTP_USER` | Optional | Email address | SMTP authentication username |
| `SMTP_PASS` | Optional | App password | SMTP authentication password |
| `EMAIL_FROM` | Optional | `"ARTIMAS 26" <...>` | Sender display name and address |

---

## 4. Database Collections & Schemas

The database name is `artimas26`. All collections reside in MongoDB Atlas.

### 4.1. Event Collection (`events`)
Stores definitions, rules, team configurations, form schemas, and real-time open/closed states.

```javascript
{
  name: String,                   // e.g. "Datathon"
  slug: { type: String, unique: true, index: true }, // e.g. "datathon"
  category: String,               // e.g. "Data Science & AI"
  yuga: String,                   // "Satya Yuga" | "Treta Yuga" | "Dwapara Yuga" | "Kali Yuga"
  description: String,
  shortDescription: String,
  tagline: String,
  registrationFee: Number,        // Master fee fetched from DB; never trusted from client
  registrationOpen: Boolean,      // Live Open/Closed toggle (controlled from /admin)
  active: Boolean,                // Kept in 100% sync with registrationOpen via pre-save hook
  teamConfig: {
    minMembers: Number,           // Minimum team size (e.g. 2 for Datathon, 2 for CTF)
    maxMembers: Number,           // Maximum team size (e.g. 4 for CTF)
    isCompulsoryFixed: Boolean,
    allowedTeamSizes: [Number],   // e.g. [2, 4] for Capture the Flag
    memberLabelPrefix: String     // "Member", "Agent", "Participant", "Hacker"
  },
  fields: [                       // Dynamic form schema
    {
      name: String,               // e.g. "name", "email", "phone", "college", "year", "branch"
      label: String,
      type: String,               // "text" | "email" | "tel" | "number" | "select"
      required: Boolean,
      options: [String]           // For select/radio fields
    }
  ]
}
```

### 4.2. Registration Collection (`registrations`)
Stores all participant submissions, status, unique pass IDs, and submission tokens.

```javascript
{
  registrationId: {               // Official Festival Pass ID
    type: String,
    unique: true,
    index: true                   // Format: ART26-XXXXXX (e.g. ART26-NCU2LZ)
  },
  submissionToken: {              // Secure token for CTF proof uploads
    type: String,
    index: true                   // Format: sub_<randomBytes>
  },
  eventId: { type: ObjectId, ref: 'Event', required: true },
  eventSlug: String,
  teamName: String,
  status: {                       // Defaults to "CONFIRMED" upon submission
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'WAITLISTED'],
    default: 'CONFIRMED',
    index: true
  },
  members: [                      // Array of registered participants
    {
      name: String,
      email: String,
      phone: String,
      college: String,
      year: String,               // "FE", "SE", "TE", "BE"
      batch: String,              // Admission Year / Batch (e.g. "2024")
      branch: String
    }
  ],
  eligibility: {
    allPccoeEligible: Boolean,    // True if all members meet PCCOE criteria
    pccoeMemberCount: Number,     // Count of verified PCCOE members
    totalMemberCount: Number      // Total team members
  },
  payment: {
    amount: Number,               // Calculated fee: 0 for all-PCCOE, event fee for external/mixed
    required: Boolean,            // false for all-PCCOE, true if any member is non-eligible
    reason: String,               // Eligibility explanation
    status: String,               // "NOT_REQUIRED" | "PENDING"
    transactionId: String,
    screenshotUrl: String
  },
  emailStatus: {                  // Independent email delivery state
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING'
  },
  emailSentAt: Date,
  emailError: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4.3. CTF Screenshot Collection (`ctfscreenshots`)
Stores challenge proof uploads submitted by CTF teams during competition.

```javascript
{
  registrationId: { type: String, index: true },
  teamName: String,
  challengeId: String,
  challengeName: String,
  screenshotUrl: String,          // Secure Cloudinary URL
  publicId: String,               // Cloudinary Asset ID
  notes: String,
  submittedAt: { type: Date, default: Date.now }
}
```

### 4.4. User Collection (`users`)
Stores administrative and tech-team operator credentials.

```javascript
{
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false }, // Bcrypt hash (salt rounds: 12)
  role: { type: String, enum: ['ADMIN', 'TECH_TEAM', 'VOLUNTEER'], default: 'ADMIN' },
  active: Boolean,
  lastLogin: Date
}
```

---

## 5. Complete API Reference

All routes are prefixed with `/api`.

### 5.1. Health Check
#### `GET /api/health`
- **Access**: Public
- **Description**: Verifies the API is online and responding.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "ARTIMAS 26 API is running",
    "timestamp": "2026-09-02T20:33:09.805Z",
    "environment": "development"
  }
  ```

---

### 5.2. Public Event APIs

#### `GET /api/events`
- **Access**: Public
- **Description**: Returns all 8 festival events with live `registrationOpen` and `active` flags.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 8,
    "data": [
      {
        "id": "6a988133c41d898716b073b4",
        "name": "Datathon",
        "slug": "datathon",
        "category": "Data Science & AI",
        "yuga": "Satya Yuga",
        "registrationFee": 150,
        "registrationOpen": true,
        "active": true
      }
    ]
  }
  ```

#### `GET /api/events/:slug`
- **Access**: Public
- **Description**: Returns full details and guidelines for an event by its slug.

#### `GET /api/events/:slug/form`
- **Access**: Public
- **Description**: Returns the dynamic form schema, team size constraints, and rules for registration.
- **Error Response `403 Forbidden`** (if event registration is closed):
  ```json
  {
    "success": false,
    "message": "Registration for this event is currently closed."
  }
  ```

---

### 5.3. Registration APIs

#### `POST /api/registrations`
- **Access**: Public
- **Description**: Validates participant data, creates registration, marks it `CONFIRMED`, generates Pass ID, and dispatches confirmation email.
- **Request Body**:
  ```json
  {
    "eventSlug": "datathon",
    "teamName": "Neural Knights",
    "members": [
      {
        "name": "Aarav Sharma",
        "email": "aarav@pccoe.edu",
        "phone": "9822112233",
        "college": "PCCOE",
        "year": "TE",
        "branch": "AI & DS"
      },
      {
        "name": "Diya Patel",
        "email": "diya@pccoe.edu",
        "phone": "9822112234",
        "college": "PCCOE",
        "year": "TE",
        "branch": "AI & DS"
      }
    ]
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Registration confirmed successfully",
    "data": {
      "registrationId": "ART26-NCU2LZ",
      "submissionToken": "sub_a9f7e8b2c4d1...",
      "status": "CONFIRMED",
      "event": "Datathon",
      "teamName": "Neural Knights",
      "memberCount": 2
    }
  }
  ```
- **Error Response `403 Forbidden`** (if closed):
  ```json
  {
    "success": false,
    "message": "Registration for this event is currently closed."
  }
  ```
- **Error Response `400 Bad Request`** (validation failure):
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": [
      "Team Leader: Phone Number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9"
    ]
  }
  ```

#### `GET /api/registrations/:registrationId`
- **Access**: Public (Privacy-Protected)
- **Description**: Returns non-sensitive status information for ticket lookup.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "registrationId": "ART26-NCU2LZ",
      "event": "Datathon",
      "teamName": "Neural Knights",
      "memberCount": 2,
      "status": "CONFIRMED",
      "paymentStatus": "COMPLETED",
      "registeredAt": "2026-09-02T20:00:00.000Z"
    }
  }
  ```
  *(All sensitive participant PII like email, phone, and college are strictly hidden on this public endpoint).*

---

### 5.4. CTF Challenge Screenshot APIs

#### `POST /api/registrations/:registrationId/ctf/screenshots`
- **Access**: Submission Token Guarded (`x-submission-token: sub_...`)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `screenshot`: Binary image file (Max 5MB; JPG, PNG, or WebP).
  - `challengeId`: e.g. `"crypto-01"`.
  - `challengeName`: e.g. `"RSA Cipher Breakdown"`.
  - `notes`: Optional submission notes.
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Proof screenshot submitted successfully",
    "data": {
      "screenshotUrl": "https://res.cloudinary.com/qllarlul/image/upload/v.../artimas26/ctf/ART26-.../screenshot.png"
    }
  }
  ```

#### `GET /api/registrations/:registrationId/ctf/screenshots`
- **Access**: Protected (Token Guarded or Admin JWT)
- **Description**: Returns all submitted challenge screenshots for a team.

---

### 5.5. Admin Authentication APIs

#### `POST /api/auth/login`
- **Access**: Public
- **Description**: Authenticates admin using password (or email + password) and issues signed JWT.
- **Request Body**:
  ```json
  {
    "password": "QWERTYUIOP1234567890"
  }
  ```
  *(Also accepts `{ "email": "admin@artimas.in", "password": "..." }`)*.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "name": "Tech Admin",
        "email": "admin@artimas.in",
        "role": "ADMIN"
      }
    }
  }
  ```

#### `GET /api/auth/me`
- **Access**: Protected (`Authorization: Bearer <token>`)
- **Description**: Returns profile and role of authenticated user.

---

### 5.6. Admin Management APIs

All `/api/admin/*` endpoints require header:
`Authorization: Bearer <JWT_TOKEN>`

#### `GET /api/admin/events`
- **Access**: Admin / Tech Team
- **Description**: Returns all events with their live `registrationOpen` status and current registration counts.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 8,
    "data": [
      {
        "id": "6a988133c41d898716b073b4",
        "name": "Datathon",
        "slug": "datathon",
        "category": "Data Science & AI",
        "yuga": "Satya Yuga",
        "registrationOpen": true,
        "active": true,
        "registrationCount": 42
      }
    ]
  }
  ```

#### `PATCH /api/admin/events/:id/registration`
- **Access**: Admin / Tech Team
- **Description**: Toggles registration open or closed for a specific event. Resolves `:id` by either MongoDB ObjectId or event slug (e.g. `datathon`).
- **Request Body**:
  ```json
  {
    "registrationOpen": false
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Registration for Datathon is now CLOSED",
    "data": {
      "id": "6a988133c41d898716b073b4",
      "name": "Datathon",
      "slug": "datathon",
      "registrationOpen": false,
      "active": false
    }
  }
  ```

#### `GET /api/admin/registrations`
- **Access**: Admin / Tech Team
- **Query Params**: `page`, `limit`, `event`, `status`, `search`
- **Description**: Paginated list of all registrations with full member details.

#### `GET /api/admin/registrations/:id`
- **Access**: Admin / Tech Team
- **Description**: Full profile of an individual registration by `registrationId` or MongoDB ObjectId.

#### `GET /api/admin/stats`
- **Access**: Admin / Tech Team
- **Description**: Aggregated event statistics, total revenue, participant counts, and category breakdown.

#### `GET /api/admin/export/csv`
- **Access**: Admin / Tech Team
- **Description**: Streams a complete CSV file export of all participant records for offline desk verification.

---

## 6. Business Logic & Validation Rules

### 6.1. Immediate Confirmation Model
1. Registrations no longer require upfront payment screenshot verification.
2. Status defaults directly to `CONFIRMED`.
3. Unique Pass ID (`ART26-XXXXXX`) is generated via collision-resistant cryptographic random bytes.
4. Pass confirmation email is queued for immediate dispatch.

### 6.2. Capture the Flag (CTF) Team Size Rule
- Capture the Flag strictly requires **either 2 OR 4 members**.
- Teams of 1, 3, or 5+ members are rejected on both frontend and backend:
  ```json
  {
    "success": false,
    "message": "Capture the Flag requires exactly 2 or 4 team members."
  }
  ```

### 6.3. Indian Mobile Number Validation
- Phone numbers must be valid 10-digit Indian numbers starting with digits `6, 7, 8, or 9`:
  ```javascript
  const isValidIndianPhone = (phone) => {
    const clean = String(phone).replace(/[\s\-()]/g, '');
    return /^(?:(?:\+91|91|0))?[6-9]\d{9}$/.test(clean);
  };
  ```

### 6.4. Email & Duplicate Checks
- Validated against standard RFC 5322 regex.
- Backend prevents duplicate registrations where the same participant email or phone is entered twice for the same event.
- Prevents duplicate entries within the same team.

### 6.5. Email-Based PCCOE Eligibility & Batch Inference
- PCCOE batch is inferred **directly from the student's email** without requiring an explicit batch input:
  - Format: `<identifier><2-digit-batch>@pccoepune.org` (e.g. `meet.ramjiyani24@pccoepune.org`).
  - Eligible batches: `23, 24, 25, 26`.
  - Ineligible batches (e.g. `22` or non-pccoe domains) are automatically categorized as non-PCCOE.
- **Email Casing Preservation**:
  - User's exact casing (e.g. `Meet.Ramjiyani24@pccoepune.org`) is preserved for display and stored verbatim in `participantData[].email`.
  - Duplication and internal comparisons are strictly case-insensitive.
- **Payment Calculation**:
  - If **all** members are eligible PCCOE students: `payableAmount = 0`, `payment.required = false`, `payment.status = "NOT_REQUIRED"`. No transaction ID or screenshot is required.
  - If **any** member is outside the eligibility criteria: `payableAmount = event.registrationFee`, `payment.required = true`, `payment.status = "PENDING"`. Valid `transactionId` and screenshot (uploaded to Cloudinary) are enforced.

### 6.6. Complete PRN & Batch Input Removal
- Neither `prn` nor `batch` are asked on the frontend form.
- Unknown fields submitted in request payloads are stripped before database persistence.

### 6.7. Fault-Tolerant Email Delivery
- Email delivery status is tracked independently via `emailStatus` (`PENDING`, `SENT`, `FAILED`).
- If SMTP credentials are not configured or temporarily fail, the registration **remains successfully confirmed** in MongoDB, ensuring zero lost registrations.

---

## 7. Operational Scripts

From the `d:\artimas2026\server` directory:

| Command | Action |
|---|---|
| `npm run dev` | Starts Express server under `nodemon` with hot reloading on port 5000 |
| `npm start` | Starts production Express process |
| `npm run seed:admin` | Upserts admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` |
| `npm run seed:events` | Seeds all 8 festival events with pricing, QR URLs, rules, and form schemas into MongoDB Atlas |

---

## 8. Verification & Test Suite

The backend includes comprehensive test suites verified against the live MongoDB Atlas cluster:
- **Email-Based PCCOE Eligibility & Cloudinary Payment Suite**: `scratch/test-email-pccoe-payment.js` (12/12 passed).
- **Admin & Registration Open/Close Suite**: `scratch/test-admin-and-openclose.js` (9/9 passed).
- All temporary records generated during tests are automatically purged from MongoDB Atlas upon completion.
