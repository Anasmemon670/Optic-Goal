/**
 * Highlightly API Routes
 * 
 * All endpoints serve data from cache/DB only
 * No direct API calls from these routes
 */

const express = require('express');
const router = express.Router();
const {
  getLiveMatches,
  getTodayMatches,
  getStandings,
  getTeams,
  getLeagues,
  getMatchDetails,
} = require('../controllers/highlightlyController');

// All routes are public (no auth required)
// VIP enforcement is handled in controllers if needed

/**
 * GET /api/matches/live
 * Get live matches
 * Query params: sport (football|basketball)
 */
router.get('/matches/live', getLiveMatches);

/**
 * GET /api/matches/today
 * Get today's matches
 * Query params: sport, date (YYYY-MM-DD)
 */
router.get('/matches/today', getTodayMatches);

/**
 * GET /api/standings
 * Get league standings
 * Query params: sport, leagueId
 */
router.get('/standings', getStandings);

/**
 * GET /api/teams
 * Get teams
 * Query params: sport, leagueId
 */
router.get('/teams', getTeams);

/**
 * GET /api/leagues
 * Get leagues
 * Query params: sport, country
 */
router.get('/leagues', getLeagues);

/**
 * GET /api/matches/:id
 * Get match details
 * Query params: sport (football|basketball)
 */
router.get('/matches/:id', getMatchDetails);

module.exports = router;
