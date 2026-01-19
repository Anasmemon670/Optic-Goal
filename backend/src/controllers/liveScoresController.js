// API-Football removed - using Highlightly/cached data only
const HighlightlyMatch = require('../models/HighlightlyMatch');
const HighlightlyLeague = require('../models/HighlightlyLeague');
const cacheService = require('../services/cacheService');
const { translate } = require('../utils/translations');

// Get today's matches (from Highlightly/cached data)
const getToday = async (req, res) => {
  try {
    const { sport = 'football', leagueId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      sport,
      matchDate: { $gte: today, $lt: tomorrow },
    };

    if (leagueId) {
      query['league.id'] = leagueId;
    }

    const matches = await HighlightlyMatch.find(query)
      .sort({ matchDate: 1 })
      .limit(200);

    res.json({
      success: true,
      data: { matches },
      count: matches.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get live matches (from Highlightly/cached data)
const getLive = async (req, res) => {
  try {
    const { sport = 'football' } = req.query;

    const matches = await HighlightlyMatch.find({
      sport,
      status: 'live',
    })
      .sort({ matchDate: 1 })
      .limit(100);

    res.json({
      success: true,
      data: { matches },
      count: matches.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get match details (from Highlightly/cached data)
const getMatch = async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const { sport = 'football' } = req.query;

    const match = await HighlightlyMatch.findOne({
      matchId: fixtureId,
      sport,
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    res.json({
      success: true,
      data: match,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Get leagues (from Highlightly/cached data)
const getLeaguesList = async (req, res) => {
  try {
    const { sport = 'football', country } = req.query;

    const query = { sport };
    if (country) {
      query.country = new RegExp(country, 'i');
    }

    const leagues = await HighlightlyLeague.find(query)
      .sort({ country: 1, name: 1 })
      .limit(200);

    res.json({
      success: true,
      data: { leagues },
      count: leagues.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

module.exports = {
  getToday,
  getLive,
  getMatch,
  getLeaguesList,
};

