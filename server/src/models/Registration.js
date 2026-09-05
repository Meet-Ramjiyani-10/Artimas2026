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

    eventSlug: {
      type: String,
      required: [true, 'Event slug is required'],
      lowercase: true,
      trim: true,
      index: true,
    },

    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },

    teamName: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Primary Lead / Member 1 Details ──
    leadName: {
      type: String,
      trim: true,
      required: true,
      index: true,
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
    leadYear: {
      type: String,
      trim: true,
      default: '',
    },
    leadBranch: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Member 2 Details (for team events) ──
    member2Name: { type: String, trim: true, default: '' },
    member2Email: { type: String, trim: true, lowercase: true, default: '' },
    member2Phone: { type: String, trim: true, default: '' },
    member2College: { type: String, trim: true, default: '' },
    member2Year: { type: String, trim: true, default: '' },
    member2Branch: { type: String, trim: true, default: '' },

    // ── Member 3 Details (for team events) ──
    member3Name: { type: String, trim: true, default: '' },
    member3Email: { type: String, trim: true, lowercase: true, default: '' },
    member3Phone: { type: String, trim: true, default: '' },
    member3College: { type: String, trim: true, default: '' },
    member3Year: { type: String, trim: true, default: '' },
    member3Branch: { type: String, trim: true, default: '' },

    // ── Member 4 Details (for team events) ──
    member4Name: { type: String, trim: true, default: '' },
    member4Email: { type: String, trim: true, lowercase: true, default: '' },
    member4Phone: { type: String, trim: true, default: '' },
    member4College: { type: String, trim: true, default: '' },
    member4Year: { type: String, trim: true, default: '' },
    member4Branch: { type: String, trim: true, default: '' },

    // One-line readable summary of all participants
    teamMembersSummary: { type: String, trim: true, default: '' },

    // ── Team & Participant Details ──
    memberCount: {
      type: Number,
      default: 1,
    },
    isPccoe: {
      type: Boolean,
      default: false,
    },
    members: [
      {
        _id: false,
        name: { type: String, trim: true, required: true },
        email: { type: String, trim: true, lowercase: true, required: true },
        phone: { type: String, trim: true },
        college: { type: String, trim: true },
        year: { type: String, trim: true },
        branch: { type: String, trim: true },
        isPccoe: { type: Boolean, default: false },
      },
    ],

    // Backward-compatibility mirror for legacy queries
    participantData: {
      type: mongoose.Schema.Types.Mixed,
    },

    // ── Payment Details ──
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
    payment: {
      amount: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ['FREE_PCCOE', 'PENDING', 'CONFIRMED', 'APPROVED', 'REJECTED', 'NOT_REQUIRED'],
        default: 'NOT_REQUIRED',
      },
      transactionId: {
        type: String,
        trim: true,
      },
      screenshotUrl: {
        type: String,
        trim: true,
      },
    },

    // Status is immediately CONFIRMED upon registration
    status: {
      type: String,
      enum: ['CONFIRMED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'CONFIRMED',
      index: true,
    },

    // Only present if CTF event requires submission token
    submissionToken: {
      type: String,
      sparse: true,
      index: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false, // Disables __v field in MongoDB
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High-performance compound indexes for search, deduplication and reporting
registrationSchema.index({ eventSlug: 1, status: 1 });
registrationSchema.index({ eventSlug: 1, leadEmail: 1 });
registrationSchema.index({ eventSlug: 1, 'members.email': 1 });
registrationSchema.index({ eventSlug: 1, teamName: 1 });
registrationSchema.index({ createdAt: -1 });
registrationSchema.index({ transactionId: 1 }, { sparse: true });

module.exports = mongoose.model('Registration', registrationSchema);
