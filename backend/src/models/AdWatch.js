const mongoose = require('mongoose');

const adWatchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  adId: {
    type: String,
    required: true,
  },
  watchedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  // Track if this ad watch contributed to VIP activation
  contributedToVIP: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate ad watches per user
adWatchSchema.index({ userId: 1, adId: 1 }, { unique: true });

// Index for efficient queries
adWatchSchema.index({ userId: 1, watchedAt: -1 });

module.exports = mongoose.model('AdWatch', adWatchSchema);
