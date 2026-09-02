const mongoose = require('mongoose');

/**
 * Dynamic form field sub-schema.
 * Each event can define its own registration form fields.
 */
const formFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['text', 'email', 'number', 'phone', 'select', 'radio', 'textarea', 'checkbox'],
      default: 'text',
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
    },
    placeholder: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Team configuration sub-schema.
 */
const teamConfigSchema = new mongoose.Schema(
  {
    minMembers: {
      type: Number,
      required: true,
      default: 1,
    },
    maxMembers: {
      type: Number,
      required: true,
      default: 1,
    },
    isCompulsoryFixed: {
      type: Boolean,
      default: false,
    },
    memberLabelPrefix: {
      type: String,
      default: 'Member',
    },
    addMemberPrompt: {
      type: String,
    },
    allowedTeamSizes: {
      type: [Number],
      default: [],
    },
  },
  { _id: false }
);

/**
 * Event model.
 *
 * Supports dynamic registration forms through the `fields` array.
 * Each event defines its own set of form fields, so a single
 * registration API handles all events.
 */
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
    },
    yuga: {
      type: String,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    trialSubtitle: {
      type: String,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dateLocation: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    registrationFee: {
      type: Number,
      default: 0,
    },
    prizePool: {
      type: String,
      trim: true,
    },
    poster: {
      type: String,
      trim: true,
    },
    ruleSubtitle: {
      type: String,
      trim: true,
    },
    sanskritMantra: {
      type: String,
      trim: true,
    },
    mythicCrest: {
      type: String,
      enum: ['lotus', 'solar', 'chakra', 'blade', null],
    },
    dharmaLevel: {
      type: String,
      trim: true,
    },
    registerUrl: {
      type: String,
      trim: true,
    },
    rulebookUrl: {
      type: String,
      trim: true,
    },
    aliases: {
      type: [String],
      default: [],
    },

    // Team configuration
    teamConfig: {
      type: teamConfigSchema,
      default: () => ({ minMembers: 1, maxMembers: 1 }),
    },

    // Dynamic registration form fields (per-member fields)
    fields: {
      type: [formFieldSchema],
      default: [],
    },

    registrationOpen: {
      type: Boolean,
      default: true,
      index: true,
    },

    active: {
      type: Boolean,
      default: true,
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

// Keep registrationOpen and active synchronized
eventSchema.pre('save', function (next) {
  if (this.isModified('registrationOpen')) {
    this.active = this.registrationOpen;
  } else if (this.isModified('active')) {
    this.registrationOpen = this.active;
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
