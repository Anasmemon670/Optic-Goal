/**
 * Highlightly Match Model
 * Stores match data from Highlightly API
 */

const mongoose = require('mongoose');

const highlightlyMatchSchema = new mongoose.Schema({
  // Match identification
  matchId: {
    type: String,
    required: true,
    index: true,
  },
  sport: {
    type: String,
    enum: ['football', 'basketball'],
    required: true,
    index: true,
  },
  
  // Match status
  status: {
    type: String,
    enum: ['live', 'scheduled', 'finished', 'postponed', 'cancelled'],
    required: true,
    index: true,
  },
  
  // Match date/time
  matchDate: {
    type: Date,
    required: true,
    index: true,
  },
  
  // Teams
  homeTeam: {
    id: String,
    name: String,
    logo: String,
  },
  awayTeam: {
    id: String,
    name: String,
    logo: String,
  },
  
  // Score
  score: {
    home: Number,
    away: Number,
    fullTime: {
      home: Number,
      away: Number,
    },
    halfTime: {
      home: Number,
      away: Number,
    },
  },
  
  // League information
  league: {
    id: String,
    name: String,
    country: String,
    logo: String,
  },
  
  // Match details
  venue: String,
  referee: String,
  
  // VIP flag
  isVIP: {
    type: Boolean,
    default: false,
    index: true,
  },
  
  // Raw API data (for reference)
  rawData: {
    type: mongoose.Schema.Types.Mixed,
  },
  
  // Cache metadata
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    index: true,
    expires: 0, // TTL index
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
highlightlyMatchSchema.index({ sport: 1, status: 1, matchDate: 1 });
highlightlyMatchSchema.index({ sport: 1, matchDate: 1 });
highlightlyMatchSchema.index({ 'league.id': 1, matchDate: 1 });

const HighlightlyMatch = mongoose.model('HighlightlyMatch', highlightlyMatchSchema);

module.exports = HighlightlyMatch;
