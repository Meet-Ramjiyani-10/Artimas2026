# ARTIMAS 26 — API Reference

## Base URL

```
http://localhost:5000/api
```

## Response Format

All responses follow this structure:

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]  // Optional validation errors
}
```

---

## Health Check

### `GET /api/health`

**Access**: Public

**Response**:
```json
{
  "success": true,
  "message": "ARTIMAS 26 API is running",
  "timestamp": "2026-10-18T10:00:00.000Z",
  "environment": "development"
}
```

---

## Events

### `GET /api/events`

**Access**: Public

**Query Parameters**:
| Parameter | Type | Description |
|---|---|---|
| `category` | string | Filter by category (partial match) |
| `yuga` | string | Filter by epoch |
| `active` | boolean | Filter by active status (default: true) |

**Response**:
```json
{
  "success": true,
  "count": 7,
  "data": [
    {
      "id": "...",
      "name": "Datathon",
      "slug": "datathon",
      "category": "Data Science & AI",
      "yuga": "Satya Yuga",
      "registrationFee": 150,
      "teamConfig": { "minMembers": 1, "maxMembers": 2 },
      "active": true,
      ...
    }
  ]
}
```

---

### `GET /api/events/:slug`

**Access**: Public

**Response**: Full event object including form fields.

---

### `GET /api/events/:slug/form`

**Access**: Public

**Response**:
```json
{
  "success": true,
  "data": {
    "eventId": "...",
    "eventName": "Datathon",
    "slug": "datathon",
    "registrationFee": 150,
    "teamConfig": {
      "minMembers": 1,
      "maxMembers": 2
    },
    "fields": [
      {
        "name": "name",
        "label": "Full Name",
        "type": "text",
        "required": true,
        "placeholder": "FULL NAME"
      },
      {
        "name": "email",
        "label": "Email ID",
        "type": "email",
        "required": true
      },
      ...
    ]
  }
}
```

---

## Registration

### `POST /api/registrations`

**Access**: Public  
**Content-Type**: `application/json` or `multipart/form-data`

**Body / Form Fields**:
| Field | Type | Required | Description |
|---|---|---|---|
| `eventSlug` | string | Yes | Event slug (e.g. `datathon`, `capture-the-flag`) |
| `teamName` | string | Yes (team events) | Team name (required for team events) |
| `members` | Array or JSON string | Yes | Array of participant objects matching event form fields |

**CTF Special Rule**:
Capture the Flag teams must consist of **exactly 2 or 4 members**. Submissions with 1, 3, or 5+ members are rejected (400 Bad Request).

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Registration confirmed successfully",
  "data": {
    "registrationId": "ART26-8F3K21",
    "submissionToken": "st_4a91b2c3d4e5f6789...",
    "eventName": "Capture the Flag (CTF)",
    "eventSlug": "capture-the-flag",
    "teamName": "Cyber Knights",
    "status": "CONFIRMED",
    "memberCount": 2,
    "createdAt": "2026-10-18T10:30:00.000Z"
  }
}
```

---

### `GET /api/registrations/:registrationId`

**Access**: Public

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "registrationId": "ART26-8F3K21",
    "event": {
      "name": "Capture the Flag (CTF)",
      "slug": "capture-the-flag",
      "category": "Cybersecurity & War Games"
    },
    "teamName": "Cyber Knights",
    "memberCount": 2,
    "status": "CONFIRMED",
    "createdAt": "2026-10-18T10:30:00.000Z"
  }
}
```
*(Sensitive participant personal details and submission tokens are strictly excluded from public lookup).*

---

## Capture the Flag (CTF) Submissions

### `POST /api/registrations/:registrationId/ctf/screenshots`

**Access**: Protected by `x-submission-token` header OR Admin JWT  
**Content-Type**: `multipart/form-data`

**Headers**:
| Header | Description |
|---|---|
| `x-submission-token` | Team's secure submission token received during registration |

**Form Fields**:
| Field | Type | Required | Description |
|---|---|---|---|
| `screenshot` | File | Yes | Image file (JPG, JPEG, PNG, WebP only, max 5MB). SVG rejected. |
| `challenge` | String | No | Challenge title or category (e.g. `Web Exploit #01`) |
| `description` | String | No | Solution or flag submission notes |

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Screenshot proof uploaded successfully",
  "data": {
    "id": "6a987...",
    "registrationId": "ART26-8F3K21",
    "teamName": "Cyber Knights",
    "challenge": "Web Exploit #01",
    "imageUrl": "https://res.cloudinary.com/.../artimas26/ctf/ART26-8F3K21/web-exploit-01/sample.png",
    "description": "SQL Injection Flag Proof",
    "uploadedAt": "2026-10-20T14:30:00.000Z"
  }
}
```

---

### `GET /api/registrations/:registrationId/ctf/screenshots`

**Access**: Protected by `x-submission-token` header OR Admin JWT

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "6a987...",
      "challenge": "Web Exploit #01",
      "imageUrl": "https://res.cloudinary.com/...",
      "description": "SQL Injection Flag Proof",
      "uploadedAt": "2026-10-20T14:30:00.000Z"
    }
  ]
}
```

---

### `GET /api/admin/registrations/:id/ctf/screenshots`

**Access**: Protected (TECH_TEAM, ADMIN)  
**Headers**: `Authorization: Bearer <adminToken>`

Returns all submissions with full file metadata and Cloudinary public IDs for review and scoring.

---

## Authentication

### `POST /api/auth/login`

**Access**: Public (rate-limited: 20 requests / 15 min)

**Body**:
```json
{
  "email": "admin@artimas.in",
  "password": "admin123456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "admin": {
      "id": "...",
      "name": "ARTIMAS Tech Team",
      "email": "admin@artimas.in",
      "role": "ADMIN"
    }
  }
}
```

---

### `GET /api/auth/me`

**Access**: Protected  
**Headers**: `Authorization: Bearer <token>`

---

## Admin APIs

All admin endpoints require: `Authorization: Bearer <token>`

### `GET /api/admin/stats`

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 42,
    "pending": 15,
    "approved": 25,
    "rejected": 2,
    "byEvent": [
      {
        "eventName": "Datathon",
        "eventSlug": "datathon",
        "count": 12,
        "pending": 5,
        "approved": 7,
        "rejected": 0
      }
    ]
  }
}
```

---

### `GET /api/admin/registrations`

**Query Parameters**:
| Parameter | Type | Description |
|---|---|---|
| `status` | string | `PENDING`, `APPROVED`, or `REJECTED` |
| `eventSlug` | string | Filter by event slug |
| `eventId` | string | Filter by event MongoDB ID |
| `dateFrom` | string | Start date (YYYY-MM-DD) |
| `dateTo` | string | End date (YYYY-MM-DD) |
| `search` | string | Search by registration ID or team name |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 25, max: 100) |

---

### `GET /api/admin/registrations/:id`

Returns full registration detail including participant data and payment screenshot URL.

---

### `PATCH /api/admin/registrations/:id/verify`

**Body**:
```json
{
  "remarks": "Payment verified successfully"
}
```

**Actions**:
1. Sets `status` → `APPROVED`
2. Sets `payment.status` → `APPROVED`
3. Records verifier (`verifiedBy`), timestamp (`verifiedAt`), and `remarks`
4. Saves approval to database before attempting email
5. Attempts sending verification email to the team leader/first participant
6. Records `emailStatus` (`SENT` or `FAILED`), `emailSentAt`, and any `emailError`
7. Prevents duplicate approval emails if already approved

**Response** (200):
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "data": {
    "registrationId": "ART26-8F3K21",
    "status": "APPROVED",
    "paymentStatus": "APPROVED",
    "emailStatus": "SENT",
    "emailSentAt": "2026-10-18T10:45:00.000Z",
    "verification": {
      "verifiedBy": {
        "id": "...",
        "name": "ARTIMAS Tech Team",
        "email": "admin@artimas.in"
      },
      "verifiedAt": "2026-10-18T10:45:00.000Z",
      "remarks": "Payment verified successfully"
    }
  }
}
```

---

### `PATCH /api/admin/registrations/:id/reject`

**Body**:
```json
{
  "remarks": "Payment screenshot is unclear"
}
```

**Actions**:
1. Sets `status` → `REJECTED`
2. Sets `payment.status` → `REJECTED`
3. Records verifier, timestamp, remarks
4. No email sent on rejection

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / Validation error |
| `401` | Unauthorized (no/invalid token) |
| `403` | Forbidden (insufficient role) |
| `404` | Not found |
| `409` | Conflict (duplicate) |
| `413` | File too large |
| `429` | Rate limited |
| `500` | Server error |
