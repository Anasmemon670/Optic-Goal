/**
 * AI Request Log Model
 * Logs all AI requests to prevent abuse and track usage
 */

const mongoose = require('mongoose');

const aiRequestLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for anonymous users
    index: true,
  },
  userIP: {
    type: String,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  responseLength: {
    type: Number,
    default: 0,
  },
  matchId: {
    type: String,
    default: null,
    index: true,
  },
  sport: {
    type: String,
    // Allow non-sports / platform-guide requests to be logged without failing validation
    enum: ['football', 'basketball', 'general'],
    default: 'general',
  },
  isVIP: {
    type: Boolean,
    default: false,
  },
  success: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  processingTime: {
    type: Number, // milliseconds
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for querying recent requests by user/IP
aiRequestLogSchema.index({ userId: 1, createdAt: -1 });
aiRequestLogSchema.index({ userIP: 1, createdAt: -1 });
aiRequestLogSchema.index({ createdAt: -1 });

const AIRequestLog = mongoose.model('AIRequestLog', aiRequestLogSchema);

module.exports = AIRequestLog;
