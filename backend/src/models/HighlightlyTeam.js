/**
 * Highlightly Team Model
 * Stores team data from Highlightly API
 */

const mongoose = require('mongoose');

const highlightlyTeamSchema = new mongoose.Schema({
  // Team identification
  teamId: {
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
  
  // Team information
  name: {
    type: String,
    required: true,
  },
  code: String,
  country: String,
  founded: Number,
  logo: String,
  venue: {
    name: String,
    address: String,
    city: String,
    capacity: Number,
    surface: String,
  },
  
  // League associations
  leagues: [{
    id: String,
    name: String,
    country: String,
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
}, {
  timestamps: true,
});

// Compound index
highlightlyTeamSchema.index({ sport: 1, name: 1 });

const HighlightlyTeam = mongoose.model('HighlightlyTeam', highlightlyTeamSchema);

module.exports = HighlightlyTeam;
