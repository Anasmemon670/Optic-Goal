const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  referredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  referralCode: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rewarded'],
    default: 'pending',
  },
  // Track if referrer was rewarded
  referrerRewarded: {
    type: Boolean,
    default: false,
  },
  // Track when referral was completed (user verified email/phone)
  completedAt: {
    type: Date,
    default: null,
  },
  rewardedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
referralSchema.index({ referrerId: 1, status: 1 });
referralSchema.index({ referralCode: 1 });

module.exports = mongoose.model('Referral', referralSchema);
