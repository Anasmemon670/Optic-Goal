/**
 * Highlightly Sport API Service
 * 
 * SECURITY: API key is server-side only, never exposed to frontend
 * Base URL: https://sports.highlightly.net
 * 
 * This service handles all Highlightly API calls and should be the ONLY
 * place where external API requests are made.
 */

const axios = require('axios');

// Highlightly API Configuration
// Check if using RapidAPI format or direct Highlightly
const USE_RAPIDAPI = process.env.HIGHLIGHTLY_USE_RAPIDAPI === 'true';
// Base URL configuration
// NOTE: Demo tool (https://highlightly.net/demo) suggests base URL might be https://highlightly.net
// Current default: https://sports.highlightly.net (can be overridden via HIGHLIGHTLY_BASE_URL env var)
// Run test-highlightly-exact-demo.js to identify correct base URL
const HIGHLIGHTLY_BASE_URL = USE_RAPIDAPI 
  ? 'https://sport-highlights-api.p.rapidapi.com'
  : (process.env.HIGHLIGHTLY_BASE_URL || 'https://sports.highlightly.net');

// API Key - must be loaded from environment
// Runtime check: Ensure it's not undefined or empty string
const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY;

// Validate API key on startup and at runtime
if (!HIGHLIGHTLY_API_KEY) {
  console.warn('[Highlightly] ⚠️  WARNING: HIGHLIGHTLY_API_KEY not found in environment variables');
  console.warn('[Highlightly] ⚠️  API calls will fail. Please add HIGHLIGHTLY_API_KEY to .env file');
} else if (HIGHLIGHTLY_API_KEY === 'undefined' || HIGHLIGHTLY_API_KEY.trim() === '') {
  console.error('[Highlightly] ❌ ERROR: HIGHLIGHTLY_API_KEY is invalid (undefined string or empty)');
  console.error('[Highlightly]    Check .env file and ensure variable is set correctly');
} else {
  // Log API key status (first 8 chars only for security)
  console.log(`[Highlightly] ✅ API key loaded: ${HIGHLIGHTLY_API_KEY.substring(0, 8)}...`);
  console.log(`[Highlightly] ✅ API key length: ${HIGHLIGHTLY_API_KEY.length} characters`);
  console.log(`[Highlightly] 📡 Base URL: ${HIGHLIGHTLY_BASE_URL}`);
  console.log(`[Highlightly] 📡 Header format: ${process.env.HIGHLIGHTLY_HEADER_FORMAT || 'x-api-key (default)'}`);
}

// Create axios instance with Highlightly headers
// Try both formats: RapidAPI and direct Highlightly
const getHeaders = () => {
  if (USE_RAPIDAPI) {
    return {
      'X-RapidAPI-Key': HIGHLIGHTLY_API_KEY,
      'X-RapidAPI-Host': 'sport-highlights-api.p.rapidapi.com',
      'Content-Type': 'application/json',
    };
  } else {
    // Try different header formats based on environment variable
    // Default: x-api-key (lowercase) - most common
    // Can override with HIGHLIGHTLY_HEADER_FORMAT env var
    const headerFormat = process.env.HIGHLIGHTLY_HEADER_FORMAT || 'x-api-key';
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Set API key header based on format
    switch (headerFormat.toLowerCase()) {
      case 'x-api-key':
        headers['x-api-key'] = HIGHLIGHTLY_API_KEY;
        break;
      case 'x-api-key-capital':
        headers['X-API-Key'] = HIGHLIGHTLY_API_KEY;
        break;
      case 'authorization':
        headers['Authorization'] = `Bearer ${HIGHLIGHTLY_API_KEY}`;
        break;
      default:
        headers['x-api-key'] = HIGHLIGHTLY_API_KEY;
    }
    
    return headers;
  }
};

const highlightlyClient = axios.create({
  baseURL: HIGHLIGHTLY_BASE_URL,
  headers: getHeaders(),
  timeout: 30000,
});

// Request interceptor for logging and debugging
highlightlyClient.interceptors.request.use(
  (config) => {
    console.log(`[Highlightly] ${config.method.toUpperCase()} ${config.url}`);
    // Log headers (hide API key)
    const safeHeaders = { ...config.headers };
    if (safeHeaders['x-api-key']) {
      safeHeaders['x-api-key'] = '***HIDDEN***';
    }
    if (safeHeaders['X-API-Key']) {
      safeHeaders['X-API-Key'] = '***HIDDEN***';
    }
    if (safeHeaders['Authorization']) {
      safeHeaders['Authorization'] = 'Bearer ***HIDDEN***';
    }
    console.log(`[Highlightly] Headers:`, JSON.stringify(safeHeaders, null, 2));
    return config;
  },
  (error) => {
    console.error('[Highlightly] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and validation
highlightlyClient.interceptors.response.use(
  (response) => {
    // CRITICAL: Validate response structure matches demo tool
    // Demo tool returns: { "data": [...], "plan": { "message": "..." } }
    // If plan.message is missing, API is being accessed incorrectly
    if (response.data && typeof response.data === 'object') {
      if (response.data.plan && response.data.plan.message) {
        const planMessage = response.data.plan.message;
        if (planMessage.includes('All data available')) {
          console.log(`[Highlightly] ✅ Valid response: ${planMessage}`);
        } else {
          console.warn(`[Highlightly] ⚠️  Plan message indicates restrictions: ${planMessage}`);
        }
      } else {
        console.warn(`[Highlightly] ⚠️  Response missing 'plan.message' - API may be accessed incorrectly`);
        console.warn(`[Highlightly] Response structure:`, JSON.stringify(response.data, null, 2).substring(0, 200));
      }
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[Highlightly] API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('[Highlightly] No response received:', error.message);
    } else {
      console.error('[Highlightly] Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Error handler for Highlightly API
 */
const handleError = (error, context) => {
  console.error(`[Highlightly] ${context} error:`, error.message);
  
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    // Handle specific error codes
    if (status === 401) {
      return {
        success: false,
        message: 'Invalid API key. Please check HIGHLIGHTLY_API_KEY in .env',
        data: null,
        error: 'AUTH_ERROR',
      };
    }
    
    if (status === 403) {
      return {
        success: false,
        message: 'API request forbidden. Check API key permissions and plan restrictions.',
        data: null,
        error: 'FORBIDDEN',
        statusCode: status,
        details: data,
        troubleshooting: [
          '1. Verify API key is valid and not expired',
          '2. Check if your API plan includes this endpoint',
          '3. Verify IP address is not blocked',
          '4. Check rate limits have not been exceeded',
          '5. Ensure correct header format (x-api-key vs X-API-Key)',
          '6. Verify base URL matches API documentation',
        ],
      };
    }
    
    if (status === 429) {
      return {
        success: false,
        message: 'API quota exceeded. Using cached data.',
        data: null,
        error: 'QUOTA_EXCEEDED',
      };
    }
    
    return {
      success: false,
      message: data?.message || error.message || 'API request failed',
      data: null,
      error: 'API_ERROR',
      statusCode: status,
    };
  }
  
  return {
    success: false,
    message: error.message || 'Network error',
    data: null,
    error: 'NETWORK_ERROR',
  };
};

/**
 * Get live matches
 * @param {string} sport - 'football' or 'basketball'
 * @returns {Promise<Object>}
 */
const getLiveMatches = async (sport = 'football') => {
  try {
    // Try different endpoint formats
    let response;
    try {
      // Format 1: /v1/sports/{sport}/matches/live
      response = await highlightlyClient.get(`/v1/sports/${sport}/matches/live`);
    } catch (err) {
      try {
        // Format 2: /v1/{sport}/matches/live
        response = await highlightlyClient.get(`/v1/${sport}/matches/live`);
      } catch (err2) {
        // Format 3: /api/v1/{sport}/matches/live
        response = await highlightlyClient.get(`/api/v1/${sport}/matches/live`);
      }
    }
    return {
      success: true,
      data: response.data,
      message: 'Live matches retrieved successfully',
    };
  } catch (error) {
    return handleError(error, 'getLiveMatches');
  }
};

/**
 * Get today's matches
 * @param {string} sport - 'football' or 'basketball'
 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @returns {Promise<Object>}
 */
const getTodayMatches = async (sport = 'football', date = null) => {
  try {
    const endpoint = date 
      ? `/api/v1/${sport}/matches?date=${date}`
      : `/api/v1/${sport}/matches/today`;
    
    const response = await highlightlyClient.get(endpoint);
    return {
      success: true,
      data: response.data,
      message: 'Today matches retrieved successfully',
    };
  } catch (error) {
    return handleError(error, 'getTodayMatches');
  }
};

/**
 * Get standings
 * @param {string} sport - 'football' or 'basketball'
 * @param {string} leagueId - League ID (optional)
 * @returns {Promise<Object>}
 */
const getStandings = async (sport = 'football', leagueId = null) => {
  try {
    const endpoint = leagueId
      ? `/api/v1/${sport}/standings/${leagueId}`
      : `/api/v1/${sport}/standings`;
    
    const response = await highlightlyClient.get(endpoint);
    return {
      success: true,
      data: response.data,
      message: 'Standings retrieved successfully',
    };
  } catch (error) {
    return handleError(error, 'getStandings');
  }
};

/**
 * Get teams
 * @param {string} sport - 'football' or 'basketball'
 * @param {string} leagueId - League ID (optional)
 * @returns {Promise<Object>}
 */
const getTeams = async (sport = 'football', leagueId = null) => {
  try {
    const endpoint = leagueId
      ? `/api/v1/${sport}/teams?league=${leagueId}`
      : `/api/v1/${sport}/teams`;
    
    const response = await highlightlyClient.get(endpoint);
    return {
      success: true,
      data: response.data,
      message: 'Teams retrieved successfully',
    };
  } catch (error) {
    return handleError(error, 'getTeams');
  }
};

/**
 * Get leagues
 * @param {string} sport - 'football' or 'basketball'
 * @returns {Promise<Object>}
 */
const getLeagues = async (sport = 'football') => {
  try {
    const response = await highlightlyClient.get(`/api/v1/${sport}/leagues`);
    return {
      success: true,
      data: response.data,
      message: 'Leagues retrieved successfully',
    };
  } catch (error) {
    return handleError(error, 'getLeagues');
  }
};

/**
 * Get match details
 * @param {string} sport - 'football' or 'basketball'
 * @param {string} matchId - Match ID
 * @returns {Promise<Object>}
 */
const getMatchDetails = async (sport = 'football', matchId) => {
  try {
    const response = await highlightlyClient.get(`/api/v1/${sport}/matches/${matchId}`);
    return {
      success: true,
      data: response.data,
      message: 'Match details retrieved successfully',
    };
  } catch (error) {
    return handleError(error, 'getMatchDetails');
  }
};

/**
 * Get bookmakers (exact demo tool endpoint)
 * This endpoint is used to verify API access is correct
 * Expected response: { "data": [...], "plan": { "message": "All data available with current plan." } }
 * @param {string} sport - 'football' or 'basketball'
 * @returns {Promise<Object>}
 */
const getBookmakers = async (sport = 'football') => {
  try {
    // Try different endpoint formats to match demo tool
    let response;
    let endpoint;
    
    // Format 1: Simple path (like demo tool) - /football/bookmakers
    try {
      endpoint = `/${sport}/bookmakers`;
      response = await highlightlyClient.get(endpoint);
    } catch (err) {
      // Format 2: With /api prefix - /api/football/bookmakers
      try {
        endpoint = `/api/${sport}/bookmakers`;
        response = await highlightlyClient.get(endpoint);
      } catch (err2) {
        // Format 3: Versioned - /api/v1/football/bookmakers
        endpoint = `/api/v1/${sport}/bookmakers`;
        response = await highlightlyClient.get(endpoint);
      }
    }
    
    // Validate response structure (critical check)
    const hasPlanMessage = response.data && 
                          response.data.plan && 
                          response.data.plan.message;
    
    if (!hasPlanMessage) {
      console.warn(`[Highlightly] ⚠️  getBookmakers: Response missing 'plan.message' - API accessed incorrectly`);
      return {
        success: false,
        message: 'API response missing plan.message - API may be accessed incorrectly',
        data: response.data,
        error: 'INVALID_RESPONSE_STRUCTURE',
        troubleshooting: [
          '1. Verify base URL matches demo tool (highlightly.net vs sports.highlightly.net)',
          '2. Check header format (x-api-key vs X-API-Key)',
          '3. Verify endpoint path structure matches demo tool',
          '4. Check API plan includes this endpoint',
        ],
      };
    }
    
    const planMessage = response.data.plan.message;
    if (!planMessage.includes('All data available')) {
      console.warn(`[Highlightly] ⚠️  getBookmakers: Plan message indicates restrictions: ${planMessage}`);
    } else {
      console.log(`[Highlightly] ✅ getBookmakers: Valid response - ${planMessage}`);
    }
    
    return {
      success: true,
      data: response.data,
      planMessage: planMessage,
      message: 'Bookmakers retrieved successfully',
    };
  } catch (error) {
    return handleError(error, 'getBookmakers');
  }
};

/**
 * Verify API access is correct by testing bookmakers endpoint
 * This function validates that the API is being accessed correctly
 * @returns {Promise<Object>}
 */
const verifyAPIAccess = async () => {
  try {
    const result = await getBookmakers('football');
    
    if (result.success && result.planMessage && result.planMessage.includes('All data available')) {
      return {
        verified: true,
        message: 'API access verified - configuration is correct',
        planMessage: result.planMessage,
      };
    } else {
      return {
        verified: false,
        message: 'API access may be incorrect - response missing or invalid plan.message',
        details: result,
      };
    }
  } catch (error) {
    return {
      verified: false,
      message: 'Failed to verify API access',
      error: error.message,
    };
  }
};

module.exports = {
  getLiveMatches,
  getTodayMatches,
  getStandings,
  getTeams,
  getLeagues,
  getMatchDetails,
  getBookmakers,
  verifyAPIAccess,
};
