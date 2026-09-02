# ARTIMAS 26 — Registration Flow

## End-to-End Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Browse  │───▶│  Fill    │───▶│  Upload  │───▶│  Submit  │───▶│  Await   │
│  Events  │    │  Form    │    │  Payment │    │  Reg.    │    │  Verify  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                                     │
                                                    ┌────────────────┤
                                                    │                │
                                               ┌────▼────┐    ┌─────▼────┐
                                               │ APPROVED │    │ REJECTED │
                                               │ + Email  │    │          │
                                               └──────────┘    └──────────┘
```

## Step-by-Step

### 1. User Browses Events
- Frontend displays events from hardcoded `lib/events.ts` (or optionally fetches from API)
- User clicks "ENTER THE TRIAL" on an event card
- Navigated to `/events/[slug]/register`

### 2. Registration Wizard (Frontend)

**Step 0 — Team/Participant Name**
- Solo events: "Enter Participant Name"
- Team events: "Enter Team Name"

**Step 1 — Member Details** (repeated for each member)
- Full Name (required)
- Email (required)
- Phone (required)
- College (required)
- Year — select: FE/SE/TE/BE (required)
- Branch (required)
- PRN / Roll No (optional)

For team events, the user can add optional members up to `teamConfig.maxMembers`.

**Step 2 — Payment**
- Shows registration fee
- QR code toggle (UPI: `artimas26@okhdfcbank`)
- Payment screenshot upload (required, max 5MB, JPEG/PNG/WebP)
- Transaction ID / UTR input

**Step 3 — Success**
- Shows Pass ID (e.g., `ART26-8F3K21`)
- Pending verification notice

### 3. Backend Processing

When `POST /api/registrations` is received:

```
1. Validate eventSlug → find active event
2. Parse members JSON
3. Validate member count (min ≤ count ≤ max)
4. Validate each member's required fields
5. Validate team name (for team events)
6. Validate file exists and type
7. Upload screenshot to Cloudinary
8. Generate unique registration ID
9. Create Registration document
10. Return registrationId + PENDING status
```

### 4. Admin Verification

```
1. Admin logs in → gets JWT
2. GET /api/admin/registrations?status=PENDING
3. Reviews registration detail (screenshot URL, member data)
4. Clicks Approve or Reject
5. PATCH /api/admin/registrations/:id/verify   (or /reject)
```

### 5. Approval Actions

On `verify`:
1. `registration.status` → `APPROVED`
2. `registration.payment.status` → `APPROVED`
3. `registration.verification.verifiedBy` → admin._id
4. `registration.verification.verifiedAt` → now
5. `registration.verification.remarks` → provided remarks
6. Send HTML email to team leader's email
7. Duplicate check: already-approved registrations return 400

On `reject`:
1. Same as above but status → `REJECTED`
2. No email sent

### 6. Email Notification

HTML email sent to the first member's (team leader's) email containing:
- ARTIMAS 26 header
- "PAYMENT APPROVED" badge
- Registration ID
- Event name
- Team name
- Amount paid
- Status
- Remarks
- Next steps (save Pass ID, bring college ID, arrive early)

---

## Validation Rules

### Member Validation
| Field | Rule |
|---|---|
| `name` | Required, non-empty |
| `email` | Required, valid email format |
| `phone` | Required, 7-15 digits (allows +, spaces, dashes) |
| `college` | Required in frontend, not enforced server-side (flexible) |
| `year` | Select from FE/SE/TE/BE |
| `branch` | Required in frontend |
| `prn` | Optional |

### File Validation
| Rule | Value |
|---|---|
| Required | Yes |
| Max size | 5 MB |
| Allowed types | JPEG, PNG, WebP |
| Max files | 1 |

### Team Validation
| Rule | Source |
|---|---|
| Min members | `event.teamConfig.minMembers` |
| Max members | `event.teamConfig.maxMembers` |
| Team name required | When `maxMembers > 1` |

---

## Registration ID Format

```
ART26-XXXXXX

Example: ART26-8F3K21
```

- Prefix: `ART26-`
- Suffix: 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Characters I, O, 0, 1 excluded for readability
- Uniqueness verified against database
- Up to 10 generation attempts before timestamp fallback

---

## Status Lifecycle

```
PENDING  ──verify──▶  APPROVED  (terminal)
PENDING  ──reject──▶  REJECTED  (terminal)
```

- Registrations start as `PENDING`
- Both `status` and `payment.status` are updated together
- Once approved, re-approval is blocked (no duplicate emails)
- Once rejected, re-rejection is blocked
