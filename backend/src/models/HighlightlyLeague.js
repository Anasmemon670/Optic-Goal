/**
 * Highlightly League Model
 * Stores league data from Highlightly API
 */

const mongoose = require('mongoose');

const highlightlyLeagueSchema = new mongoose.Schema({
  // League identification
  leagueId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sport: {
    type: String,
    enum: ['football', 'basketball'],
    required: true,
    index: true,
  },
  
  // League information
  name: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
    index: true,
  },
  logo: String,
  flag: String,
  
  // League details
  type: {
    type: String,
    enum: ['league', 'cup'],
  },
  season: String,
  
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
}, {
  timestamps: true,
});

// Compound index
highlightlyLeagueSchema.index({ sport: 1, country: 1 });

const HighlightlyLeague = mongoose.model('HighlightlyLeague', highlightlyLeagueSchema);

module.exports = HighlightlyLeague;
