/**
 * AI Usage Model
 * Tracks AI assistant usage for quota management
 */

const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  lastReset: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
aiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

// Method to check if user can make AI request
aiUsageSchema.methods.canMakeRequest = function(isVIP) {
  if (isVIP) {
    return true; // VIP users have unlimited requests
  }
  return this.count < 5; // Non-VIP: 5 requests per day
};

// Method to increment usage
aiUsageSchema.methods.increment = function() {
  this.count += 1;
  return this.save();
};

// Static method to get or create today's usage
aiUsageSchema.statics.getTodayUsage = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let usage = await this.findOne({ userId, date: today });
  
  if (!usage) {
    // Reset if it's a new day
    usage = await this.create({ userId, date: today, count: 0 });
  }
  
  return usage;
};

const AIUsage = mongoose.model('AIUsage', aiUsageSchema);

module.exports = AIUsage;
