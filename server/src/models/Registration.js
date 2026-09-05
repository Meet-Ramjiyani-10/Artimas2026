const mongoose = require('mongoose');

/**
 * Registration model.
 *
 * Stores participant data as Mixed (flexible schema) so that different
 * events with different form fields all use the same registration collection.
 *
 * Registration status is immediately CONFIRMED upon successful submission.
 * Payment fields are preserved for future payment workflow integration.
 */
const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      index: true,
    },

    eventSlug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      index: true,
    },

    // Present only for team events (omitted for solo registrations)
    teamName: {
      type: String,
      trim: true,
    },

    // ── Primary Contact ──
    leadName: {
      type: String,
      trim: true,
      required: true,
    },
    leadEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      index: true,
    },
    leadPhone: {
      type: String,
      trim: true,
      required: true,
    },
    leadCollege: {
      type: String,
      trim: true,
      default: '',
    },

    // ── PCCOE Flag (true for free PCCOE registrations) ──
    isPccoe: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ── All Team Members at a glance (omitted for solo events) ──
    teamSummary: {
      type: String,
      trim: true,
    },

    // ── Payment & Verification ──
    amount: {
      type: Number,
      default: 0,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    screenshotUrl: {
      type: String,
      trim: true,
    },

    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },

    verification: {
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
      },
      verifiedAt: Date,
      remarks: String,
    },

    // Status is immediately CONFIRMED upon registration
    status: {
      type: String,
      enum: ['CONFIRMED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'CONFIRMED',
      index: true,
    },

    // Clean member details array (omitted for solo events)
    members: [
      {
        _id: false,
        name: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        college: { type: String, trim: true },
        year: { type: String, trim: true },
        branch: { type: String, trim: true },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High-performance indexes
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ eventSlug: 1, status: 1 });
registrationSchema.index({ eventId: 1, verified: 1 });
registrationSchema.index({ eventSlug: 1, verified: 1 });
registrationSchema.index({ eventName: 1, status: 1 });
registrationSchema.index({ eventName: 1, leadEmail: 1 });
registrationSchema.index({ eventName: 1, 'members.email': 1 });
registrationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Registration', registrationSchema);
