/**
 * API-Sports.io Service
 * 
 * Direct API integration (not RapidAPI)
 * Uses x-apisports-key header format
 */

const axios = require('axios');
const {
  SPORTS_API_KEY,
  FOOTBALL_BASE_URL,
  BASKETBALL_BASE_URL,
  REQUEST_TIMEOUT,
  MAX_RETRIES,
  RETRY_DELAY,
  RATE_LIMIT_DELAY,
} = require('../config/sportsApi');

// Create axios instances with proper headers
// API-Sports.io uses direct API format (x-apisports-key header)
const footballClient = axios.create({
  baseURL: FOOTBALL_BASE_URL,
  headers: {
    'x-apisports-key': SPORTS_API_KEY,
  },
  timeout: REQUEST_TIMEOUT,
});

const basketballClient = axios.create({
  baseURL: BASKETBALL_BASE_URL,
  headers: {
    'x-apisports-key': SPORTS_API_KEY,
  },
  timeout: REQUEST_TIMEOUT,
});

/**
 * Enhanced error handler with safe defaults
 */
const handleError = (error, context) => {
  console.error(`[SportsAPI] ${context} error:`, error.message);
  
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    console.error(`[SportsAPI] Response status: ${status}`);
    console.error(`[SportsAPI] Response data:`, JSON.stringify(data).substring(0, 200));
    
    // Handle specific error codes
    if (status === 401) {
      return {
        success: false,
        message: 'Invalid API key. Please check SPORTS_API_KEY in .env',
        data: [],
        error: 'AUTH_ERROR',
      };
    }
    
    if (status === 403) {
      return {
        success: false,
        message: 'API request forbidden. Check API key permissions.',
        data: [],
        error: 'FORBIDDEN',
      };
    }
    
    if (status === 429) {
      return {
        success: false,
        message: 'API rate limit exceeded. Please try again later.',
        data: [],
        error: 'RATE_LIMIT',
      };
    }
    
    return {
      success: false,
      message: data?.message || error.message || 'API request failed',
      data: [],
      error: 'API_ERROR',
    };
  }
  
  if (error.request) {
    return {
      success: false,
      message: 'No response received from API. Network error or timeout.',
      data: [],
      error: 'NETWORK_ERROR',
    };
  }
  
  return {
    success: false,
    message: error.message || 'Unknown error occurred',
    data: [],
    error: 'UNKNOWN_ERROR',
  };
};

/**
 * Retry wrapper for API calls
 */
const retryRequest = async (requestFn, context, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      // Don't retry on auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        return handleError(error, context);
      }
      
      // Retry on rate limits with delay
      if (error.response?.status === 429) {
        if (i < retries - 1) {
          console.warn(`[SportsAPI] Rate limit hit, retrying in ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
          continue;
        }
      }
      
      // Last retry or non-retryable error
      if (i === retries - 1) {
        return handleError(error, context);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
  
  return {
    success: false,
    message: 'Request failed after retries',
    data: [],
    error: 'RETRY_EXHAUSTED',
  };
};

/**
 * Rate limit delay helper
 */
const rateLimitDelay = () => new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));

// ============================================
// FOOTBALL API FUNCTIONS
// ============================================

/**
 * Get live football matches
 * Returns safe default (empty array) on error
 */
const getFootballLiveMatches = async () => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  return retryRequest(async () => {
    const response = await footballClient.get('/fixtures?live=all');
    
    // Ensure we always return an array
    const matches = Array.isArray(response.data?.response) 
      ? response.data.response 
      : [];
    
    return {
      success: true,
      data: matches,
    };
  }, 'getFootballLiveMatches');
};

/**
 * Get football fixtures (upcoming or by date)
 * Returns safe default (empty array) on error
 */
const getFootballFixtures = async (date = null, leagueId = null) => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  return retryRequest(async () => {
    let endpoint = '/fixtures';
    const params = new URLSearchParams();
    
    if (date) {
      params.append('date', date);
    } else {
      // Get today's date if not specified
      const today = new Date().toISOString().split('T')[0];
      params.append('date', today);
    }
    
    if (leagueId) {
      params.append('league', leagueId);
    }

    const response = await footballClient.get(`${endpoint}?${params.toString()}`);
    
    // Ensure we always return an array
    const fixtures = Array.isArray(response.data?.response) 
      ? response.data.response 
      : [];
    
    return {
      success: true,
      data: fixtures,
    };
  }, 'getFootballFixtures');
};

/**
 * Get football match details with events, statistics, lineups
 * Returns safe default object on error
 */
const getFootballMatchDetails = async (fixtureId) => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: {
        fixture: null,
        events: [],
        statistics: [],
        lineups: [],
      },
    };
  }

  if (!fixtureId) {
    return {
      success: false,
      message: 'Fixture ID is required',
      data: {
        fixture: null,
        events: [],
        statistics: [],
        lineups: [],
      },
    };
  }

  return retryRequest(async () => {
    const [fixtureResponse, eventsResponse, statsResponse, lineupsResponse] = await Promise.all([
      footballClient.get(`/fixtures?id=${fixtureId}`).catch(() => ({ data: { response: [] } })),
      footballClient.get(`/fixtures/events?fixture=${fixtureId}`).catch(() => ({ data: { response: [] } })),
      footballClient.get(`/fixtures/statistics?fixture=${fixtureId}`).catch(() => ({ data: { response: [] } })),
      footballClient.get(`/fixtures/lineups?fixture=${fixtureId}`).catch(() => ({ data: { response: [] } })),
    ]);

    // Add delay to avoid rate limits
    await rateLimitDelay();

    return {
      success: true,
      data: {
        fixture: fixtureResponse.data?.response?.[0] || null,
        events: Array.isArray(eventsResponse.data?.response) ? eventsResponse.data.response : [],
        statistics: Array.isArray(statsResponse.data?.response) ? statsResponse.data.response : [],
        lineups: Array.isArray(lineupsResponse.data?.response) ? lineupsResponse.data.response : [],
      },
    };
  }, 'getFootballMatchDetails');
};

/**
 * Get football leagues
 * Returns safe default (empty array) on error
 */
const getFootballLeagues = async () => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  return retryRequest(async () => {
    const response = await footballClient.get('/leagues?current=true');
    
    // Ensure we always return an array
    const leagues = Array.isArray(response.data?.response) 
      ? response.data.response 
      : [];
    
    return {
      success: true,
      data: leagues,
    };
  }, 'getFootballLeagues');
};

/**
 * Get football teams
 * Returns safe default (empty array) on error
 */
const getFootballTeams = async (leagueId = null, season = null) => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  return retryRequest(async () => {
    let endpoint = '/teams';
    const params = new URLSearchParams();
    
    if (leagueId) {
      params.append('league', leagueId);
    }
    
    if (season) {
      params.append('season', season);
    } else {
      // Use current season
      const currentYear = new Date().getFullYear();
      params.append('season', currentYear);
    }

    const response = await footballClient.get(`${endpoint}?${params.toString()}`);
    
    // Ensure we always return an array
    const teams = Array.isArray(response.data?.response) 
      ? response.data.response 
      : [];
    
    return {
      success: true,
      data: teams,
    };
  }, 'getFootballTeams');
};

/**
 * Get football standings
 * Returns safe default (empty array) on error
 */
const getFootballStandings = async (leagueId, season = null) => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  if (!leagueId) {
    return {
      success: false,
      message: 'League ID is required',
      data: [],
    };
  }

  return retryRequest(async () => {
    const params = new URLSearchParams();
    params.append('league', leagueId);
    
    if (season) {
      params.append('season', season);
    } else {
      const currentYear = new Date().getFullYear();
      params.append('season', currentYear);
    }

    const response = await footballClient.get(`/standings?${params.toString()}`);
    
    // Ensure we always return an array
    const standings = Array.isArray(response.data?.response) 
      ? response.data.response 
      : [];
    
    return {
      success: true,
      data: standings,
    };
  }, 'getFootballStandings');
};

// ============================================
// BASKETBALL API FUNCTIONS
// ============================================

/**
 * Helper: Get today's date in UTC (YYYY-MM-DD format)
 */
const getTodayUTC = () => {
  const now = new Date();
  const utcDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  return utcDate.toISOString().split('T')[0];
};

/**
 * Get live basketball matches
 * SMART FALLBACK: If no live games, try today's games (UTC)
 * Returns safe default (empty array) on error
 */
const getBasketballLiveMatches = async () => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  return retryRequest(async () => {
    // Strategy 1: Try live games
    const liveResponse = await basketballClient.get('/games?live=all');
    const liveMatches = Array.isArray(liveResponse.data?.response) 
      ? liveResponse.data.response 
      : [];
    
    if (liveMatches.length > 0) {
      console.log(`[SportsAPI] ✅ Basketball live matches: ${liveMatches.length} games`);
      return {
        success: true,
        data: liveMatches,
      };
    }

    // Strategy 2: Fallback to today's games (UTC) if no live games
    const todayUTC = getTodayUTC();
    console.log(`[SportsAPI] ⚠️  No live basketball games, trying today (UTC: ${todayUTC})...`);
    
    const todayResponse = await basketballClient.get(`/games?date=${todayUTC}`);
    const todayMatches = Array.isArray(todayResponse.data?.response) 
      ? todayResponse.data.response 
      : [];
    
    if (todayMatches.length > 0) {
      console.log(`[SportsAPI] ✅ Basketball today's matches: ${todayMatches.length} games (UTC: ${todayUTC})`);
      return {
        success: true,
        data: todayMatches,
        message: 'No live games, showing today\'s matches',
      };
    }

    // No live or today's games
    console.log(`[SportsAPI] ⚠️  Basketball: No live games and no games for today (UTC: ${todayUTC})`);
    return {
      success: true,
      data: [],
      message: 'No live basketball games available',
    };
  }, 'getBasketballLiveMatches');
};

/**
 * Get basketball fixtures (upcoming or by date)
 * SMART FALLBACK LOGIC:
 * 1. Try with provided date/league
 * 2. If empty and no date provided → try today (UTC)
 * 3. If empty and date provided → try today (UTC) as fallback
 * 4. If empty and no league → try known active leagues
 * Returns safe default (empty array) on error
 */
const getBasketballFixtures = async (date = null, leagueId = null) => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  // Known active basketball leagues (NBA, EuroLeague, etc.)
  const knownLeagues = [12, 132, 133, 134]; // NBA, EuroLeague, ACB, BBL

  // Helper to make API call
  const makeApiCall = async (useDate, useLeagueId) => {
    const params = new URLSearchParams();
    
    if (useDate) {
      params.append('date', useDate);
    }
    
    if (useLeagueId) {
      params.append('league', useLeagueId);
    }

    // API requires at least one parameter (date OR league)
    if (params.toString() === '') {
      const todayUTC = getTodayUTC();
      params.append('date', todayUTC);
    }

    const endpoint = `/games?${params.toString()}`;
    const response = await basketballClient.get(endpoint);
    
    return Array.isArray(response.data?.response) 
      ? response.data.response 
      : [];
  };

  return retryRequest(async () => {
    let fixtures = [];
    let reason = '';

    // Strategy 1: Try with provided parameters
    if (date || leagueId) {
      fixtures = await makeApiCall(date, leagueId);
      if (fixtures.length > 0) {
        console.log(`[SportsAPI] ✅ Basketball fixtures found: ${fixtures.length} matches (date: ${date || 'N/A'}, league: ${leagueId || 'N/A'})`);
        return {
          success: true,
          data: fixtures,
        };
      }
      reason = `No matches for date=${date || 'N/A'}, league=${leagueId || 'N/A'}`;
    }

    // Strategy 2: Try today (UTC) if no date was provided or if provided date returned empty
    const todayUTC = getTodayUTC();
    if (!date || date !== todayUTC) {
      fixtures = await makeApiCall(todayUTC, leagueId);
      if (fixtures.length > 0) {
        console.log(`[SportsAPI] ✅ Basketball fixtures found: ${fixtures.length} matches (fallback: today UTC ${todayUTC}, league: ${leagueId || 'N/A'})`);
        return {
          success: true,
          data: fixtures,
        };
      }
      reason = reason ? `${reason}; No matches for today (UTC: ${todayUTC})` : `No matches for today (UTC: ${todayUTC})`;
    }

    // Strategy 3: If no league specified, try known active leagues
    if (!leagueId) {
      for (const league of knownLeagues) {
        fixtures = await makeApiCall(date || todayUTC, league);
        if (fixtures.length > 0) {
          console.log(`[SportsAPI] ✅ Basketball fixtures found: ${fixtures.length} matches (league: ${league})`);
          return {
            success: true,
            data: fixtures,
          };
        }
        // Small delay to avoid rate limits
        await rateLimitDelay();
      }
      reason = reason ? `${reason}; No matches in known leagues` : 'No matches in known leagues';
    }

    // All strategies exhausted
    console.log(`[SportsAPI] ⚠️  Basketball fixtures: ${reason || 'No matches found'}`);
    return {
      success: true,
      data: [],
      message: reason || 'No basketball fixtures available',
    };
  }, 'getBasketballFixtures');
};

/**
 * Get basketball match details
 * Returns safe default object on error
 */
const getBasketballMatchDetails = async (gameId) => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: {
        game: null,
        events: [],
        statistics: [],
      },
    };
  }

  if (!gameId) {
    return {
      success: false,
      message: 'Game ID is required',
      data: {
        game: null,
        events: [],
        statistics: [],
      },
    };
  }

  return retryRequest(async () => {
    const [gameResponse, eventsResponse, statsResponse] = await Promise.all([
      basketballClient.get(`/games?id=${gameId}`).catch(() => ({ data: { response: [] } })),
      basketballClient.get(`/games/events?game=${gameId}`).catch(() => ({ data: { response: [] } })),
      basketballClient.get(`/games/statistics?game=${gameId}`).catch(() => ({ data: { response: [] } })),
    ]);

    // Add delay to avoid rate limits
    await rateLimitDelay();

    return {
      success: true,
      data: {
        game: gameResponse.data?.response?.[0] || null,
        events: Array.isArray(eventsResponse.data?.response) ? eventsResponse.data.response : [],
        statistics: Array.isArray(statsResponse.data?.response) ? statsResponse.data.response : [],
      },
    };
  }, 'getBasketballMatchDetails');
};

/**
 * Get basketball leagues
 * Returns safe default (empty array) on error
 */
const getBasketballLeagues = async () => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  return retryRequest(async () => {
    const response = await basketballClient.get('/leagues?current=true');
    
    // Ensure we always return an array
    const leagues = Array.isArray(response.data?.response) 
      ? response.data.response 
      : [];
    
    return {
      success: true,
      data: leagues,
    };
  }, 'getBasketballLeagues');
};

/**
 * Get basketball teams
 * Returns safe default (empty array) on error
 */
const getBasketballTeams = async (leagueId = null, season = null) => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  return retryRequest(async () => {
    let endpoint = '/teams';
    const params = new URLSearchParams();
    
    if (leagueId) {
      params.append('league', leagueId);
    }
    
    if (season) {
      params.append('season', season);
    } else {
      const currentYear = new Date().getFullYear();
      params.append('season', currentYear);
    }

    const response = await basketballClient.get(`${endpoint}?${params.toString()}`);
    
    // Ensure we always return an array
    const teams = Array.isArray(response.data?.response) 
      ? response.data.response 
      : [];
    
    return {
      success: true,
      data: teams,
    };
  }, 'getBasketballTeams');
};

/**
 * Get basketball standings
 * Returns safe default (empty array) on error
 */
const getBasketballStandings = async (leagueId, season = null) => {
  if (!SPORTS_API_KEY) {
    console.error('[SportsAPI] SPORTS_API_KEY not configured');
    return {
      success: false,
      message: 'API key not configured',
      data: [],
    };
  }

  if (!leagueId) {
    return {
      success: false,
      message: 'League ID is required',
      data: [],
    };
  }

  return retryRequest(async () => {
    const params = new URLSearchParams();
    params.append('league', leagueId);
    
    if (season) {
      params.append('season', season);
    } else {
      const currentYear = new Date().getFullYear();
      params.append('season', currentYear);
    }

    const response = await basketballClient.get(`/standings?${params.toString()}`);
    
    // Ensure we always return an array
    const standings = Array.isArray(response.data?.response) 
      ? response.data.response 
      : [];
    
    return {
      success: true,
      data: standings,
    };
  }, 'getBasketballStandings');
};

// ============================================
// LEGACY FUNCTIONS (for backward compatibility)
// ============================================

const getTodayMatches = async (leagueId = null) => {
  const today = new Date().toISOString().split('T')[0];
  return await getFootballFixtures(today, leagueId);
};

const getLiveMatches = async () => {
  return await getFootballLiveMatches();
};

const getMatchDetails = async (fixtureId) => {
  return await getFootballMatchDetails(fixtureId);
};

const getLeagues = async () => {
  return await getFootballLeagues();
};

module.exports = {
  // Football
  getFootballLiveMatches,
  getFootballFixtures,
  getFootballMatchDetails,
  getFootballLeagues,
  getFootballTeams,
  getFootballStandings,
  
  // Basketball
  getBasketballLiveMatches,
  getBasketballFixtures,
  getBasketballMatchDetails,
  getBasketballLeagues,
  getBasketballTeams,
  getBasketballStandings,
  
  // Legacy (for backward compatibility)
  getTodayMatches,
  getLiveMatches,
  getMatchDetails,
  getLeagues,
};
