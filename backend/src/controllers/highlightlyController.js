/**
 * Highlightly API Controller
 * 
 * Handles all Highlightly API endpoints
 * All data is served from cache/DB, never directly from API
 */

const highlightlyService = require('../services/highlightlyService');
const HighlightlyMatch = require('../models/HighlightlyMatch');
const HighlightlyStanding = require('../models/HighlightlyStanding');
const HighlightlyTeam = require('../models/HighlightlyTeam');
const HighlightlyLeague = require('../models/HighlightlyLeague');
const cacheService = require('../services/cacheService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Get live matches
 * GET /api/matches/live
 * Serves data from cache/DB only
 * VIP users see all matches, normal users see public matches only
 */
const getLiveMatches = async (req, res) => {
  try {
    const { sport = 'football' } = req.query;
    
    // Check VIP status (optional - doesn't block)
    let isVIP = false;
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        const { verifyToken } = require('../config/jwt');
        const User = require('../models/User');
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('isVIP vipExpiry');
        if (user) {
          isVIP = user.isVIP && user.vipExpiry && new Date(user.vipExpiry) > new Date();
        }
      }
    } catch (error) {
      // Not authenticated or error - treat as non-VIP
    }
    
    // Try cache first
    const cacheKey = `matches:live:${sport}:${isVIP ? 'vip' : 'public'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, 'Live matches retrieved from cache');
    }
    
    // Get from database - filter by VIP status
    const query = {
      sport,
      status: 'live',
    };
    
    // Non-VIP users only see non-VIP matches
    if (!isVIP) {
      query.isVIP = { $ne: true };
    }
    
    const matches = await HighlightlyMatch.find(query).sort({ matchDate: 1 }).limit(100);
    
    if (matches.length > 0) {
      // Cache for 60 seconds (live data)
      cacheService.set(cacheKey, matches, 60 * 1000);
      
      return sendSuccess(res, matches, 'Live matches retrieved from database');
    }
    
    // No data available - return empty with warning
    return sendSuccess(res, [], 'No live matches available. Data will be updated by cron job.', true);
    
  } catch (error) {
    console.error('[HighlightlyController] getLiveMatches error:', error);
    return sendError(res, 'Failed to retrieve live matches', 500);
  }
};

/**
 * Get today's matches
 * GET /api/matches/today
 * Serves data from cache/DB only
 */
const getTodayMatches = async (req, res) => {
  try {
    const { sport = 'football', date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Try cache first
    const cacheKey = `matches:today:${sport}:${targetDate.toISOString().split('T')[0]}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, 'Today matches retrieved from cache');
    }
    
    // Get from database
    const matches = await HighlightlyMatch.find({
      sport,
      matchDate: {
        $gte: targetDate,
        $lt: nextDay,
      },
    }).sort({ matchDate: 1 });
    
    if (matches.length > 0) {
      // Cache for 10 minutes
      cacheService.set(cacheKey, matches, 10 * 60 * 1000);
      
      return sendSuccess(res, matches, 'Today matches retrieved from database');
    }
    
    // No data available
    return sendSuccess(res, [], 'No matches found for today. Data will be updated by cron job.', true);
    
  } catch (error) {
    console.error('[HighlightlyController] getTodayMatches error:', error);
    return sendError(res, 'Failed to retrieve today matches', 500);
  }
};

/**
 * Get standings
 * GET /api/standings
 * Serves data from cache/DB only
 */
const getStandings = async (req, res) => {
  try {
    const { sport = 'football', leagueId } = req.query;
    
    // Try cache first
    const cacheKey = `standings:${sport}:${leagueId || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, 'Standings retrieved from cache');
    }
    
    // Get from database
    const query = { sport };
    if (leagueId) {
      query.leagueId = leagueId;
    }
    
    const standings = await HighlightlyStanding.find(query).sort({ 'league.name': 1 });
    
    if (standings.length > 0) {
      // Cache for 1 hour
      cacheService.set(cacheKey, standings, 60 * 60 * 1000);
      
      return sendSuccess(res, standings, 'Standings retrieved from database');
    }
    
    // No data available
    return sendSuccess(res, [], 'No standings available. Data will be updated by cron job.', true);
    
  } catch (error) {
    console.error('[HighlightlyController] getStandings error:', error);
    return sendError(res, 'Failed to retrieve standings', 500);
  }
};

/**
 * Get teams
 * GET /api/teams
 * Serves data from cache/DB only
 */
const getTeams = async (req, res) => {
  try {
    const { sport = 'football', leagueId } = req.query;
    
    // Try cache first
    const cacheKey = `teams:${sport}:${leagueId || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, 'Teams retrieved from cache');
    }
    
    // Get from database
    const query = { sport };
    if (leagueId) {
      query['leagues.id'] = leagueId;
    }
    
    const teams = await HighlightlyTeam.find(query).sort({ name: 1 });
    
    if (teams.length > 0) {
      // Cache for 1 hour
      cacheService.set(cacheKey, teams, 60 * 60 * 1000);
      
      return sendSuccess(res, teams, 'Teams retrieved from database');
    }
    
    // No data available
    return sendSuccess(res, [], 'No teams available. Data will be updated by cron job.', true);
    
  } catch (error) {
    console.error('[HighlightlyController] getTeams error:', error);
    return sendError(res, 'Failed to retrieve teams', 500);
  }
};

/**
 * Get leagues
 * GET /api/leagues
 * Serves data from cache/DB only
 */
const getLeagues = async (req, res) => {
  try {
    const { sport = 'football', country } = req.query;
    
    // Try cache first
    const cacheKey = `leagues:${sport}:${country || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, 'Leagues retrieved from cache');
    }
    
    // Get from database
    const query = { sport };
    if (country) {
      query.country = country;
    }
    
    const leagues = await HighlightlyLeague.find(query).sort({ country: 1, name: 1 });
    
    if (leagues.length > 0) {
      // Cache for 6 hours
      cacheService.set(cacheKey, leagues, 6 * 60 * 60 * 1000);
      
      return sendSuccess(res, leagues, 'Leagues retrieved from database');
    }
    
    // No data available
    return sendSuccess(res, [], 'No leagues available. Data will be updated by cron job.', true);
    
  } catch (error) {
    console.error('[HighlightlyController] getLeagues error:', error);
    return sendError(res, 'Failed to retrieve leagues', 500);
  }
};

/**
 * Get match details
 * GET /api/matches/:id
 * Serves data from cache/DB only
 */
const getMatchDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { sport = 'football' } = req.query;
    
    if (!id) {
      return sendError(res, 'Match ID is required', 400);
    }
    
    // Try cache first
    const cacheKey = `match:${sport}:${id}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, 'Match details retrieved from cache');
    }
    
    // Get from database
    const match = await HighlightlyMatch.findOne({
      matchId: id.toString(),
      sport,
    });
    
    if (match) {
      // Cache for 5 minutes
      cacheService.set(cacheKey, match, 5 * 60 * 1000);
      
      return sendSuccess(res, match, 'Match details retrieved from database');
    }
    
    // No data available
    return sendError(res, 'Match not found', 404);
    
  } catch (error) {
    console.error('[HighlightlyController] getMatchDetails error:', error);
    return sendError(res, 'Failed to retrieve match details', 500);
  }
};

module.exports = {
  getLiveMatches,
  getTodayMatches,
  getStandings,
  getTeams,
  getLeagues,
  getMatchDetails,
};
