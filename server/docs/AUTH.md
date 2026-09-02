# ARTIMAS 26 — Authentication & Authorization

## Overview

The backend uses **JWT (JSON Web Tokens)** for stateless authentication and **role-based access control (RBAC)** for authorization.

## Authentication Flow

```
1. POST /api/auth/login  →  { email, password }
2. Server validates credentials (bcrypt compare)
3. Server returns JWT  →  { token, admin }
4. Client stores token (localStorage/cookie)
5. Client sends: Authorization: Bearer <token>
6. Server middleware verifies JWT on protected routes
```

## JWT Configuration

| Setting | Default | Environment Variable |
|---|---|---|
| Algorithm | HS256 | — |
| Expiry | 7 days | `JWT_EXPIRES_IN` |
| Secret | — | `JWT_SECRET` (required) |

### Token Payload
```json
{
  "id": "MongoDB ObjectId",
  "role": "ADMIN",
  "iat": 1729000000,
  "exp": 1729604800
}
```

## Password Security

- **Algorithm**: bcrypt with 12 salt rounds
- **Storage**: Only the hash is stored (`passwordHash` field)
- **Query protection**: `passwordHash` has `select: false` (never returned by default)
- **Serialization**: JSON transform deletes `passwordHash` from any response

## Roles

| Role | Access |
|---|---|
| `TECH_TEAM` | View registrations, verify/reject payments |
| `ADMIN` | All TECH_TEAM permissions + create/update events |

## Middleware

### `protect`
- Extracts JWT from `Authorization: Bearer <token>`
- Verifies token signature and expiry
- Attaches `req.admin` (admin object without password)
- Returns 401 on invalid/expired/missing token

### `authorize(...roles)`
- Must be used after `protect`
- Checks `req.admin.role` against allowed roles
- Returns 403 if role is not in the allowed list

### Usage in Routes
```javascript
// Protected + any authenticated admin
router.get('/registrations', protect, getRegistrations);

// Protected + ADMIN role only
router.post('/events', protect, authorize('ADMIN'), createEvent);

// Protected + TECH_TEAM or ADMIN
router.use(protect, authorize('TECH_TEAM', 'ADMIN'));
```

## Rate Limiting

Login endpoint is rate-limited:
- **Window**: 15 minutes
- **Max requests**: 20 per window
- **Response on limit**: 429 with message

## Security Checklist

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT with configurable secret and expiry
- [x] Role-based authorization
- [x] Password hash excluded from all queries/responses
- [x] Rate limiting on auth endpoints
- [x] Helmet security headers
- [x] CORS configuration
- [x] No credentials in source code
- [x] Environment variable configuration
