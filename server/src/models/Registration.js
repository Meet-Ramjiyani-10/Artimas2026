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
      required: [true, 'Event ID is required'],
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
    },

    // Flexible participant data — array of member objects
    participantData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Participant data is required'],
    },

    // Secure submission token for authenticated operations (e.g. CTF screenshot upload)
    submissionToken: {
      type: String,
      required: true,
      index: true,
    },

    // Status is immediately CONFIRMED upon registration
    status: {
      type: String,
      enum: ['CONFIRMED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'CONFIRMED',
      index: true,
    },

    // Preserved for future payment verification workflow (flexible/backward compatible)
    payment: {
      amount: {
        type: Number,
        default: 0,
      },
      screenshotUrl: {
        type: String,
      },
      screenshotPublicId: {
        type: String,
      },
      transactionId: {
        type: String,
        trim: true,
      },
      status: {
        type: String,
        enum: ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'],
        default: 'NOT_REQUIRED',
      },
    },

    verification: {
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
      },
      verifiedAt: {
        type: Date,
      },
      remarks: {
        type: String,
        trim: true,
      },
    },

    emailStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'SENT', 'FAILED'],
      default: 'NOT_REQUIRED',
    },
    emailSentAt: {
      type: Date,
    },
    emailError: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for scaling up to thousands of registrations and preventing duplicates
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ eventSlug: 1, status: 1 });
registrationSchema.index({ eventId: 1, 'participantData.email': 1 });
registrationSchema.index({ eventId: 1, teamName: 1 });
registrationSchema.index({ createdAt: -1 });
registrationSchema.index({ 'payment.transactionId': 1 }, { sparse: true });

module.exports = mongoose.model('Registration', registrationSchema);
