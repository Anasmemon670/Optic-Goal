/**
 * Highlightly Standings Model
 * Stores league standings from Highlightly API
 */

const mongoose = require('mongoose');

const highlightlyStandingSchema = new mongoose.Schema({
  // League identification
  leagueId: {
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
  
  // League information
  league: {
    id: String,
    name: String,
    country: String,
    logo: String,
    season: String,
  },
  
  // Standings data
  standings: [{
    rank: Number,
    team: {
      id: String,
      name: String,
      logo: String,
    },
    points: Number,
    played: Number,
    won: Number,
    drawn: Number,
    lost: Number,
    goalsFor: Number,
    goalsAgainst: Number,
    goalDifference: Number,
    form: String, // Last 5 matches form (e.g., "WWDLW")
  }],
  
  // Raw API data
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

// Compound index
highlightlyStandingSchema.index({ sport: 1, leagueId: 1 }, { unique: true });

const HighlightlyStanding = mongoose.model('HighlightlyStanding', highlightlyStandingSchema);

module.exports = HighlightlyStanding;
