const mongoose = require('mongoose');

/**
 * Capture the Flag (CTF) Submission Model.
 *
 * Dedicated collection for CTF team screenshot proof and submission evidence.
 * Scalable architecture allowing multiple screenshot uploads per team without
 * bloating the core Registration document.
 */
const ctfSubmissionSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: [true, 'Registration ID is required'],
      index: true,
      trim: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },

    eventSlug: {
      type: String,
      required: true,
      default: 'capture-the-flag',
      trim: true,
      index: true,
    },

    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },

    challenge: {
      type: String,
      trim: true,
      default: 'General',
    },

    imageUrl: {
      type: String,
      required: [true, 'Screenshot URL is required'],
      trim: true,
    },

    publicId: {
      type: String,
      required: [true, 'Cloudinary public_id is required'],
      trim: true,
    },

    originalFilename: {
      type: String,
      trim: true,
    },

    fileSize: {
      type: Number,
    },

    description: {
      type: String,
      trim: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

// Compound indexes for fast querying by team registration and challenge
ctfSubmissionSchema.index({ registrationId: 1, uploadedAt: -1 });
ctfSubmissionSchema.index({ eventId: 1, uploadedAt: -1 });

module.exports = mongoose.model('CtfSubmission', ctfSubmissionSchema);
