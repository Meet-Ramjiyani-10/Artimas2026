# ARTIMAS 26 — Database Schema Documentation

## Overview

The backend uses MongoDB with Mongoose ODM. Three collections are used:

| Collection | Model | Purpose |
|---|---|---|
| `events` | Event | Event catalog with dynamic registration fields |
| `registrations` | Registration | Participant registrations with payment data |
| `admins` | Admin | Tech team / admin users |

---

## Event Schema

```javascript
{
  name:             String (required),        // "Datathon"
  slug:             String (required, unique), // "datathon"
  category:         String,                   // "Data Science & AI"
  yuga:             String,                   // "Satya Yuga"
  tagline:          String,
  trialSubtitle:    String,
  shortDescription: String,
  description:      String,
  dateLocation:     String,                   // "18 OCTOBER 2026  ·  ONLINE"
  venue:            String,
  date:             Date,
  startTime:        String,
  endTime:          String,
  registrationFee:  Number,                   // 150
  prizePool:        String,                   // "₹30,000 PRIZE POOL"
  poster:           String,
  ruleSubtitle:     String,
  sanskritMantra:    String,
  mythicCrest:      String (enum: lotus|solar|chakra|blade),
  dharmaLevel:      String,
  registerUrl:      String,
  rulebookUrl:      String,
  aliases:          [String],                 // ["data-thon"]

  teamConfig: {
    minMembers:       Number,                 // 1
    maxMembers:       Number,                 // 2
    isCompulsoryFixed: Boolean,
    memberLabelPrefix: String,                // "Member"
    addMemberPrompt:   String,
  },

  fields: [                                  // Dynamic registration form
    {
      name:        String (required),         // "email"
      label:       String (required),         // "Email ID"
      type:        String (enum),             // "email"
      required:    Boolean,
      options:     [String],                  // For select/radio fields
      placeholder: String,
    }
  ],

  active: Boolean (default: true),
  createdAt: Date (auto),
  updatedAt: Date (auto),
}
```

### Indexes
- `slug` — unique index
- `active` — index for filtered queries

### Key Design: Dynamic Fields
The `fields[]` array allows each event to define its own registration form without creating separate models. The same `POST /api/registrations` endpoint handles all events.

---

## Registration Schema

```javascript
{
  registrationId:  String (required, unique),  // "ART26-8F3K21"

  eventId:         ObjectId → Event (required),

  teamName:        String,                     // "Team Alpha"

  participantData: Mixed,                      // Array of member objects
  // Example:
  // [
  //   { name: "John", email: "john@...", phone: "98...", ... },
  //   { name: "Jane", email: "jane@...", phone: "98...", ... }
  // ]

  payment: {
    amount:            Number,                 // 150
    screenshotUrl:     String,                 // Cloudinary URL
    screenshotPublicId: String,                // Cloudinary public_id
    transactionId:     String,                 // UPI/bank ref
    status:            String (enum: PENDING|APPROVED|REJECTED),
  },

  verification: {
    verifiedBy:  ObjectId → Admin,
    verifiedAt:  Date,
    remarks:     String,                       // "Payment verified successfully"
  },

  // Email delivery state (tracked independently from approval)
  emailStatus:   String (enum: PENDING|SENT|FAILED),
  emailSentAt:   Date,
  emailError:    String,

  status: String (enum: PENDING|APPROVED|REJECTED),
  createdAt: Date (auto),
  updatedAt: Date (auto),
}
```

### Indexes
- `registrationId` — unique index (primary lookup key)
- `eventId` — index for event-filtered queries
- `status` — index for status-filtered queries

### Registration ID Format
`ART26-XXXXXX` where X is from the charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes I, O, 0, 1 for readability). Generated with crypto randomBytes and verified unique against the DB.

### Why `participantData` is Mixed
Different events may have different fields. Using `Mixed` allows the same collection to store varying participant data shapes while the Event's `fields[]` defines the expected structure.

---

## Admin Schema

```javascript
{
  name:         String (required),
  email:        String (required, unique),
  passwordHash: String (required, select: false),
  role:         String (enum: TECH_TEAM|ADMIN, default: TECH_TEAM),
  createdAt:    Date (auto),
  updatedAt:    Date (auto),
}
```

### Security
- `passwordHash` is excluded from queries by default (`select: false`)
- Passwords are hashed with bcrypt (12 rounds) via a pre-save hook
- `comparePassword()` instance method for login verification
- JSON serialization strips `passwordHash` and `__v`

---

## Relationships

```
Event  ←──── Registration.eventId
Admin  ←──── Registration.verification.verifiedBy
```

Both relationships use MongoDB ObjectId references with Mongoose `populate()`.
