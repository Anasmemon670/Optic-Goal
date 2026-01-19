/**
 * Sports API Configuration
 * 
 * Centralized configuration for API-Sports.io integration
 * Uses direct API (not RapidAPI) with x-apisports-key header
 */

// API Key - MUST be set in environment variables
// Using ONLY the new Sports API (API-Sports.io) - no legacy API fallback
const SPORTS_API_KEY = process.env.SPORTS_API_KEY;

// Validate API key on module load
if (!SPORTS_API_KEY) {
  console.warn('[SportsAPI] ⚠️  WARNING: SPORTS_API_KEY not found in environment variables');
  console.warn('[SportsAPI] ⚠️  API calls will fail. Please add SPORTS_API_KEY to .env file');
} else if (SPORTS_API_KEY === 'undefined' || SPORTS_API_KEY.trim() === '') {
  console.error('[SportsAPI] ❌ ERROR: SPORTS_API_KEY is invalid (undefined string or empty)');
  console.error('[SportsAPI]    Check .env file and ensure variable is set correctly');
} else {
  // Log API key status (first 8 chars only for security)
  console.log(`[SportsAPI] ✅ API key loaded: ${SPORTS_API_KEY.substring(0, 8)}...`);
  console.log(`[SportsAPI] ✅ API key length: ${SPORTS_API_KEY.length} characters`);
}

// Base URLs
const FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const BASKETBALL_BASE_URL = 'https://v1.basketball.api-sports.io';

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Rate limit handling
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests to avoid rate limits

module.exports = {
  SPORTS_API_KEY,
  FOOTBALL_BASE_URL,
  BASKETBALL_BASE_URL,
  REQUEST_TIMEOUT,
  MAX_RETRIES,
  RETRY_DELAY,
  RATE_LIMIT_DELAY,
};
