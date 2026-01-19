const BasketballLiveMatch = require('../models/BasketballLiveMatch');
const BasketballUpcomingMatch = require('../models/BasketballUpcomingMatch');
const BasketballLeague = require('../models/BasketballLeague');
const BasketballTeam = require('../models/BasketballTeam');
const BasketballStanding = require('../models/BasketballStanding');
const SportsDBTeam = require('../models/SportsDBTeam');
const SportsDBLeague = require('../models/SportsDBLeague');
const cacheService = require('../services/cacheService');
// Import new Sports API service for fallback
const { getBasketballLiveMatches, getBasketballFixtures } = require('../services/apiFootball');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
} = require('../utils/responseHandler');

/**
 * Helper: Get today's date in UTC (YYYY-MM-DD format)
 */
const getTodayUTC = () => {
  const now = new Date();
  const utcDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  return utcDate.toISOString().split('T')[0];
};

// Get live basketball matches
const getLive = async (req, res) => {
  try {
    let matches = await BasketballLiveMatch.find()
      .sort({ 'fixture.date': -1 })
      .limit(100);

    // Ensure matches is always an array
    let safeMatches = Array.isArray(matches) ? matches : [];
    let dataSource = 'database';
    let reason = '';

    // Fallback: If no data in DB, fetch from live API
    if (safeMatches.length === 0) {
      console.log('[BasketballController] No cached data in DB, fetching from live API...');
      try {
        const apiResult = await getBasketballLiveMatches();
        if (apiResult.success && Array.isArray(apiResult.data) && apiResult.data.length > 0) {
          // Transform API response to match expected format
          safeMatches = apiResult.data.map(match => ({
            match_id: match.id,
            fixture: {
              id: match.id,
              date: match.date,
              timezone: match.timezone,
              timestamp: match.timestamp,
              periods: match.periods,
              venue: match.venue,
              status: match.status,
            },
            league: match.league,
            teams: match.teams,
            scores: match.scores,
            events: match.events || [],
            statistics: match.statistics || [],
          }));
          dataSource = 'api';
          console.log(`[BasketballController] ✅ Fetched ${safeMatches.length} matches from live API`);
        } else {
          reason = apiResult.message || 'No live games available from API';
          console.log(`[BasketballController] ⚠️  ${reason}`);
        }
      } catch (apiError) {
        reason = `API fallback failed: ${apiError.message}`;
        console.error('[BasketballController] Live API fallback failed:', apiError.message);
      }
    } else {
      console.log(`[BasketballController] ✅ Found ${safeMatches.length} matches in database`);
    }

    // Always return safe response
    return sendSuccess(
      res,
      { matches: safeMatches, count: safeMatches.length },
      safeMatches.length > 0 
        ? `Live basketball matches retrieved successfully (source: ${dataSource})`
        : reason || 'No live matches available at the moment.'
    );
  } catch (error) {
    console.error('[BasketballController] Error fetching live matches:', error);
    // Return empty array on error instead of error response
    return sendSuccess(
      res,
      { matches: [], count: 0 },
      'No live matches available at the moment. Please check back later.'
    );
  }
};

// Helper function to save basketball match
const saveBasketballMatch = async (matchData) => {
  try {
    const matchId = matchData.id;
    if (!matchId) return;

    const events = Array.isArray(matchData.events) 
      ? matchData.events
          .filter(e => e && typeof e === 'object' && !Array.isArray(e))
          .map(e => ({
            time: {
              elapsed: e.time?.elapsed || 0,
              extra: e.time?.extra || null,
            },
            team: {
              id: e.team?.id || null,
              name: e.team?.name || '',
              logo: e.team?.logo || '',
            },
            player: {
              id: e.player?.id || null,
              name: e.player?.name || '',
            },
            assist: {
              id: e.assist?.id || null,
              name: e.assist?.name || '',
            },
            type: e.type || '',
            detail: e.detail || '',
            comments: e.comments || '',
          }))
      : [];
    
    const transformedData = {
      match_id: matchId,
      fixture: {
        id: matchData.id,
        date: matchData.date,
        timezone: matchData.timezone,
        timestamp: matchData.timestamp,
        periods: matchData.periods,
        venue: matchData.venue,
        status: matchData.status,
      },
      league: matchData.league,
      teams: matchData.teams,
      scores: matchData.scores,
      events: events,
      statistics: Array.isArray(matchData.statistics) ? matchData.statistics : [],
      lastUpdated: new Date(),
    };

    await BasketballUpcomingMatch.findOneAndUpdate(
      { match_id: matchId },
      transformedData,
      { upsert: true, new: true }
    );
  } catch (error) {
    // Silent fail for individual match saves
  }
};

// Get upcoming basketball matches
const getUpcoming = async (req, res) => {
  try {
    const { date, leagueId } = req.query;
    const query = {};
    
    // Use UTC date helper to ensure timezone safety
    const requestedDate = date || getTodayUTC();
    let dataSource = 'database';
    let reason = '';

    // Build MongoDB query with UTC-aware date handling
    if (date) {
      // Parse date as UTC (YYYY-MM-DD format)
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        const startDate = new Date(Date.UTC(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2]),
          0, 0, 0, 0
        ));
        const endDate = new Date(Date.UTC(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2]),
          23, 59, 59, 999
        ));
        query['fixture.date'] = { $gte: startDate, $lte: endDate };
        console.log(`[BasketballController] Querying for date: ${date} (UTC range: ${startDate.toISOString()} to ${endDate.toISOString()})`);
      } else {
        // Invalid date format, default to today
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        query['fixture.date'] = { $gte: today };
        reason = `Invalid date format '${date}', using today (UTC)`;
      }
    } else {
      // Default to today and future (UTC)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      query['fixture.date'] = { $gte: today };
      console.log(`[BasketballController] Querying for today and future (UTC: ${getTodayUTC()})`);
    }

    if (leagueId) {
      query['league.id'] = parseInt(leagueId);
      console.log(`[BasketballController] Filtering by league: ${leagueId}`);
    }

    let matches = await BasketballUpcomingMatch.find(query)
      .sort({ 'fixture.date': 1 })
      .limit(200);

    // Ensure matches is always an array
    let safeMatches = Array.isArray(matches) ? matches : [];

    // Fallback: If no data in DB, fetch from live API with smart fallback
    if (safeMatches.length === 0) {
      console.log(`[BasketballController] No cached upcoming matches in DB (date: ${requestedDate}, league: ${leagueId || 'N/A'}), fetching from API...`);
      try {
        const apiResult = await getBasketballFixtures(requestedDate, leagueId ? parseInt(leagueId) : null);
        if (apiResult.success && Array.isArray(apiResult.data) && apiResult.data.length > 0) {
          // Transform API response to match expected format
          safeMatches = apiResult.data.map(match => ({
            match_id: match.id,
            fixture: {
              id: match.id,
              date: match.date,
              timezone: match.timezone,
              timestamp: match.timestamp,
              periods: match.periods,
              venue: match.venue,
              status: match.status,
            },
            league: match.league,
            teams: match.teams,
            scores: match.scores,
            events: match.events || [],
            statistics: match.statistics || [],
          }));
          dataSource = 'api';
          console.log(`[BasketballController] ✅ Fetched ${safeMatches.length} upcoming matches from API`);
        } else {
          reason = apiResult.message || `No matches found for date=${requestedDate}, league=${leagueId || 'N/A'}`;
          console.log(`[BasketballController] ⚠️  ${reason}`);
        }
      } catch (apiError) {
        reason = `API fallback failed: ${apiError.message}`;
        console.error('[BasketballController] API fallback failed:', apiError.message);
      }
    } else {
      console.log(`[BasketballController] ✅ Found ${safeMatches.length} matches in database`);
    }

    // Always return safe JSON response
    return res.json({
      success: true,
      data: { matches: safeMatches },
      count: safeMatches.length,
      message: safeMatches.length > 0 
        ? `Upcoming basketball matches retrieved successfully (source: ${dataSource})`
        : reason || 'No upcoming matches available at the moment.',
    });
  } catch (error) {
    console.error('[BasketballController] Error fetching upcoming matches:', error);
    // Return empty array on error instead of error response
    return res.json({
      success: true,
      data: { matches: [], count: 0 },
      message: 'No upcoming matches available at the moment. Please check back later.',
    });
  }
};

// Get basketball leagues
const getLeagues = async (req, res) => {
  try {
    const { country } = req.query;
    const query = {};

    if (country) {
      query['country.name'] = new RegExp(country, 'i');
    }

    const leagues = await BasketballLeague.find(query)
      .sort({ 'league.name': 1 });

    res.json({
      success: true,
      data: { leagues },
      count: leagues.length,
    });
  } catch (error) {
    console.error('Error fetching basketball leagues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch basketball leagues',
      error: error.message,
    });
  }
};

// Get basketball teams
const getTeams = async (req, res) => {
  try {
    const { leagueId, search } = req.query;
    const query = {};

    if (search) {
      query['team.name'] = new RegExp(search, 'i');
    }

    const teams = await BasketballTeam.find(query)
      .sort({ 'team.name': 1 })
      .limit(500);

    res.json({
      success: true,
      data: { teams },
      count: teams.length,
    });
  } catch (error) {
    console.error('Error fetching basketball teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch basketball teams',
      error: error.message,
    });
  }
};

// Get basketball standings
const getStandings = async (req, res) => {
  try {
    const { leagueId, season } = req.query;

    if (!leagueId) {
      return sendValidationError(res, 'League ID is required');
    }

    const query = {
      league_id: parseInt(leagueId),
    };

    if (season) {
      query.season = parseInt(season);
    } else {
      // Default to current season
      const currentYear = new Date().getFullYear();
      query.season = currentYear;
    }

    const standings = await BasketballStanding.find(query);

    if (standings.length === 0) {
      return sendNotFound(res, 'Standings not found for this league and season');
    }

    return sendSuccess(res, standings[0], 'Basketball standings retrieved successfully');
  } catch (error) {
    console.error('[BasketballController] Error fetching standings:', error);
    return sendError(res, 'Failed to fetch basketball standings', 500);
  }
};

// Get basketball match details with full data (scores, stats, events, timeline)
const getMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);

    if (!id || isNaN(matchId)) {
      return sendValidationError(res, 'Valid Match ID is required');
    }

    // Determine cache TTL based on match status
    const getCacheTTL = (status) => {
      if (status === 'LIVE' || status === 'HT' || status === 'Q1' || status === 'Q2' || status === 'Q3' || status === 'Q4') {
        return 1 * 60 * 1000; // 1 minute for live matches
      }
      return 5 * 60 * 1000; // 5 minutes for finished/upcoming matches
    };

    // Try to get from cache first
    const cachedData = await cacheService.getMatchDetails('basketball', matchId, async () => {
      // Check database first
      let match = await BasketballLiveMatch.findOne({ match_id: matchId });
      if (!match) {
        match = await BasketballUpcomingMatch.findOne({ match_id: matchId });
      }

      // If in database, return it
      if (match) {
        const status = match.status?.short || match.fixture?.status?.short || 'NS';
        const ttl = getCacheTTL(status);
        
        // Live matches are updated by Highlightly cron every 60 seconds
        // Return cached data - no direct API calls

        return {
          game: match,
          fixture: match.fixture,
          teams: match.teams,
          scores: match.scores,
          events: match.events || [],
          statistics: match.statistics || [],
          cached: true,
          ttl: getCacheTTL(status),
        };
      }

      // Not in database - return null (data will be populated by Highlightly cron)
      return null;
    }, getCacheTTL('NS'));

    if (!cachedData) {
      return sendNotFound(res, 'Match not found');
    }

    // Process events for basketball (points, fouls, timeouts, etc.)
    const points = (cachedData.events || []).filter(e => 
      e.type === 'Point' || e.type === '2pt' || e.type === '3pt' || e.type === 'Free Throw'
    );
    const fouls = (cachedData.events || []).filter(e => 
      e.type === 'Foul' || e.type === 'Personal Foul' || e.type === 'Technical Foul'
    );
    const timeouts = (cachedData.events || []).filter(e => 
      e.type === 'Timeout'
    );

    // Sort events by time for timeline
    const timeline = (cachedData.events || [])
      .map(event => ({
        time: event.time?.elapsed || 0,
        quarter: event.period || event.quarter || 1,
        player: event.player?.name || 'Unknown',
        type: event.type || 'unknown',
        detail: event.detail || '',
        team: event.team?.id === cachedData.teams?.home?.id ? 'home' : 'away',
        comments: event.comments || null,
      }))
      .sort((a, b) => {
        // Sort by quarter first, then time
        if (a.quarter !== b.quarter) return a.quarter - b.quarter;
        return a.time - b.time;
      });

    // Extract quarter scores if available
    const quarterScores = cachedData.scores?.quarters || [];

    return sendSuccess(
      res,
      {
        game: cachedData.game || cachedData.fixture,
        teams: cachedData.teams,
        scores: cachedData.scores,
        events: cachedData.events || [],
        statistics: cachedData.statistics || [],
        // Processed data
        pointsList: points,
        foulsList: fouls,
        timeoutsList: timeouts,
        timeline: timeline,
        quarterScores: quarterScores,
        // Metadata
        source: cachedData.cached ? 'cache' : 'api',
        cached: cachedData.cached || false,
      },
      'Basketball match details retrieved successfully'
    );
  } catch (error) {
    console.error('[BasketballController] Error fetching match details:', error);
    return sendError(res, 'Failed to fetch basketball match details', 500);
  }
};

// Get SportsDB teams (static data from TheSportsDB)
const getSportsDBTeams = async (req, res) => {
  try {
    const { search, leagueId } = req.query;
    const query = { sport: 'basketball' };

    if (search) {
      query['team.strTeam'] = new RegExp(search, 'i');
    }

    if (leagueId) {
      query['team.idLeague'] = leagueId;
    }

    const teams = await SportsDBTeam.find(query)
      .sort({ 'team.strTeam': 1 })
      .limit(500);

    res.json({
      success: true,
      data: { teams },
      count: teams.length,
      source: 'thesportsdb',
    });
  } catch (error) {
    console.error('Error fetching SportsDB teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SportsDB teams',
      error: error.message,
    });
  }
};

// Get SportsDB leagues (static data from TheSportsDB)
const getSportsDBLeagues = async (req, res) => {
  try {
    const { country, search } = req.query;
    const query = { sport: 'basketball' };

    if (country) {
      query['league.strCountry'] = new RegExp(country, 'i');
    }

    if (search) {
      query['league.strLeague'] = new RegExp(search, 'i');
    }

    const leagues = await SportsDBLeague.find(query)
      .sort({ 'league.strLeague': 1 })
      .limit(200);

    res.json({
      success: true,
      data: { leagues },
      count: leagues.length,
      source: 'thesportsdb',
    });
  } catch (error) {
    console.error('Error fetching SportsDB leagues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SportsDB leagues',
      error: error.message,
    });
  }
};

module.exports = {
  getLive,
  getUpcoming,
  getLeagues,
  getTeams,
  getStandings,
  getMatch,
  getSportsDBTeams,
  getSportsDBLeagues,
};


