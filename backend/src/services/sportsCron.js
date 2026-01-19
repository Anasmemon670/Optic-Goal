/**
 * Sports Data Cron Job Service
 * 
 * Fetches sports data from the new Sports API (API-Sports.io) and stores in MongoDB
 * This is the SINGLE SOURCE OF TRUTH for all sports data updates
 * 
 * Schedules:
 * - Live matches: Every 1 minute (football & basketball)
 * - Fixtures, Leagues, Teams, Standings: Every 12 hours
 */

const cron = require('node-cron');
const mongoose = require('mongoose');

// Import new Sports API service (ONLY source for sports data)
const {
  getFootballLiveMatches,
  getFootballFixtures,
  getFootballLeagues,
  getFootballTeams,
  getFootballStandings,
  getBasketballLiveMatches,
  getBasketballFixtures,
  getBasketballLeagues,
  getBasketballTeams,
  getBasketballStandings,
} = require('./apiFootball');

// Import models
const FootballLiveMatch = require('../models/FootballLiveMatch');
const FootballUpcomingMatch = require('../models/FootballUpcomingMatch');
const FootballLeague = require('../models/FootballLeague');
const FootballTeam = require('../models/FootballTeam');
const FootballStanding = require('../models/FootballStanding');

const BasketballLiveMatch = require('../models/BasketballLiveMatch');
const BasketballUpcomingMatch = require('../models/BasketballUpcomingMatch');
const BasketballLeague = require('../models/BasketballLeague');
const BasketballTeam = require('../models/BasketballTeam');
const BasketballStanding = require('../models/BasketballStanding');

// Flags to prevent concurrent runs
let isLiveMatchesRunning = false;
let isFixturesRunning = false;
let isLeaguesRunning = false;

/**
 * Save football live match to database
 */
const saveFootballLiveMatch = async (matchData) => {
  try {
    if (!matchData || !matchData.fixture?.id) {
      return;
    }

    const matchId = matchData.fixture.id;
    const transformedData = {
      match_id: matchId,
      fixture: matchData.fixture,
      league: matchData.league,
      teams: matchData.teams,
      goals: matchData.goals,
      score: matchData.score,
      events: Array.isArray(matchData.events) ? matchData.events : [],
      statistics: Array.isArray(matchData.statistics) ? matchData.statistics : [],
      lineups: Array.isArray(matchData.lineups) ? matchData.lineups : [],
      lastUpdated: new Date(),
    };

    await FootballLiveMatch.findOneAndUpdate(
      { match_id: matchId },
      transformedData,
      { upsert: true, new: true }
    );
  } catch (error) {
    // Silent fail for individual match saves
    console.error(`[SportsCron] Error saving football live match ${matchData?.fixture?.id}:`, error.message);
  }
};

/**
 * Save football upcoming match to database
 */
const saveFootballUpcomingMatch = async (matchData) => {
  try {
    if (!matchData || !matchData.fixture?.id) {
      return;
    }

    const matchId = matchData.fixture.id;
    const transformedData = {
      match_id: matchId,
      fixture: matchData.fixture,
      league: matchData.league,
      teams: matchData.teams,
      goals: matchData.goals,
      score: matchData.score,
      events: Array.isArray(matchData.events) ? matchData.events : [],
      statistics: Array.isArray(matchData.statistics) ? matchData.statistics : [],
      lastUpdated: new Date(),
    };

    await FootballUpcomingMatch.findOneAndUpdate(
      { match_id: matchId },
      transformedData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`[SportsCron] Error saving football upcoming match ${matchData?.fixture?.id}:`, error.message);
  }
};

/**
 * Save basketball live match to database
 */
const saveBasketballLiveMatch = async (matchData) => {
  try {
    if (!matchData || !matchData.id) {
      return;
    }

    const matchId = matchData.id;
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
      events: Array.isArray(matchData.events) ? matchData.events : [],
      statistics: Array.isArray(matchData.statistics) ? matchData.statistics : [],
      lastUpdated: new Date(),
    };

    await BasketballLiveMatch.findOneAndUpdate(
      { match_id: matchId },
      transformedData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`[SportsCron] Error saving basketball live match ${matchData?.id}:`, error.message);
  }
};

/**
 * Save basketball upcoming match to database
 */
const saveBasketballUpcomingMatch = async (matchData) => {
  try {
    if (!matchData || !matchData.id) {
      return;
    }

    const matchId = matchData.id;
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
      events: Array.isArray(matchData.events) ? matchData.events : [],
      statistics: Array.isArray(matchData.statistics) ? matchData.statistics : [],
      lastUpdated: new Date(),
    };

    await BasketballUpcomingMatch.findOneAndUpdate(
      { match_id: matchId },
      transformedData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`[SportsCron] Error saving basketball upcoming match ${matchData?.id}:`, error.message);
  }
};

/**
 * Fetch and save live matches (football & basketball)
 * Runs every 1 minute
 */
const fetchLiveMatches = async () => {
  if (isLiveMatchesRunning) {
    console.log('[SportsCron] Live matches job already running, skipping...');
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    console.warn('[SportsCron] DB not connected, skipping live matches fetch');
    return;
  }

  isLiveMatchesRunning = true;
  const startTime = new Date();

  try {
    console.log('[SportsCron] 🏃 Starting live matches fetch from new Sports API...');

    // Fetch football live matches
    const footballResult = await getFootballLiveMatches();
    if (footballResult.success && Array.isArray(footballResult.data)) {
      let saved = 0;
      for (const match of footballResult.data) {
        await saveFootballLiveMatch(match);
        saved++;
      }
      console.log(`[SportsCron] ✅ Football live matches: ${saved} saved`);
    } else {
      console.warn(`[SportsCron] ⚠️  Football live matches: ${footballResult.message || 'No data'}`);
    }

    // Fetch basketball live matches
    const basketballResult = await getBasketballLiveMatches();
    if (basketballResult.success && Array.isArray(basketballResult.data)) {
      let saved = 0;
      for (const match of basketballResult.data) {
        await saveBasketballLiveMatch(match);
        saved++;
      }
      console.log(`[SportsCron] ✅ Basketball live matches: ${saved} saved`);
    } else {
      console.warn(`[SportsCron] ⚠️  Basketball live matches: ${basketballResult.message || 'No data'}`);
    }

    // Clean up old live matches (older than 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const deletedFootball = await FootballLiveMatch.deleteMany({
      'fixture.status.short': { $in: ['FT', 'AET', 'PEN'] },
      lastUpdated: { $lt: twoHoursAgo },
    });
    const deletedBasketball = await BasketballLiveMatch.deleteMany({
      'fixture.status.short': { $in: ['FT', 'AET'] },
      lastUpdated: { $lt: twoHoursAgo },
    });

    if (deletedFootball.deletedCount > 0 || deletedBasketball.deletedCount > 0) {
      console.log(`[SportsCron] 🗑️  Cleaned up old live matches: ${deletedFootball.deletedCount} football, ${deletedBasketball.deletedCount} basketball`);
    }

    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    console.log(`[SportsCron] ✅ Live matches fetch completed in ${duration}s`);
  } catch (error) {
    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    console.error(`[SportsCron] ❌ Live matches fetch failed after ${duration}s:`, error.message);
    if (error.stack) {
      console.error('[SportsCron] Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  } finally {
    isLiveMatchesRunning = false;
  }
};

/**
 * Fetch and save upcoming fixtures (next 7 days)
 * Runs every 12 hours
 */
const fetchUpcomingFixtures = async () => {
  if (isFixturesRunning) {
    console.log('[SportsCron] Fixtures job already running, skipping...');
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    console.warn('[SportsCron] DB not connected, skipping fixtures fetch');
    return;
  }

  isFixturesRunning = true;
  const startTime = new Date();

  try {
    console.log('[SportsCron] 🏃 Starting upcoming fixtures fetch from new Sports API...');

    // Fetch fixtures for next 7 days
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Football fixtures
    let footballSaved = 0;
    for (const date of dates) {
      const result = await getFootballFixtures(date);
      if (result.success && Array.isArray(result.data)) {
        for (const match of result.data) {
          await saveFootballUpcomingMatch(match);
          footballSaved++;
        }
      }
    }
    console.log(`[SportsCron] ✅ Football fixtures: ${footballSaved} saved`);

    // Basketball fixtures
    let basketballSaved = 0;
    for (const date of dates) {
      const result = await getBasketballFixtures(date);
      if (result.success && Array.isArray(result.data)) {
        for (const match of result.data) {
          await saveBasketballUpcomingMatch(match);
          basketballSaved++;
        }
      }
    }
    console.log(`[SportsCron] ✅ Basketball fixtures: ${basketballSaved} saved`);

    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    console.log(`[SportsCron] ✅ Fixtures fetch completed in ${duration}s`);
  } catch (error) {
    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    console.error(`[SportsCron] ❌ Fixtures fetch failed after ${duration}s:`, error.message);
    if (error.stack) {
      console.error('[SportsCron] Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  } finally {
    isFixturesRunning = false;
  }
};

/**
 * Fetch and save leagues, teams, and standings
 * Runs every 12 hours
 */
const fetchLeaguesAndStandings = async () => {
  if (isLeaguesRunning) {
    console.log('[SportsCron] Leagues job already running, skipping...');
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    console.warn('[SportsCron] DB not connected, skipping leagues fetch');
    return;
  }

  isLeaguesRunning = true;
  const startTime = new Date();

  try {
    console.log('[SportsCron] 🏃 Starting leagues/teams/standings fetch from new Sports API...');

    // Football leagues
    const footballLeaguesResult = await getFootballLeagues();
    if (footballLeaguesResult.success && Array.isArray(footballLeaguesResult.data)) {
      let saved = 0;
      for (const league of footballLeaguesResult.data) {
        try {
          await FootballLeague.findOneAndUpdate(
            { 'league.id': league.league?.id },
            { league: league.league, country: league.country, seasons: league.seasons },
            { upsert: true, new: true }
          );
          saved++;
        } catch (error) {
          console.error(`[SportsCron] Error saving football league ${league.league?.id}:`, error.message);
        }
      }
      console.log(`[SportsCron] ✅ Football leagues: ${saved} saved`);
    }

    // Basketball leagues
    const basketballLeaguesResult = await getBasketballLeagues();
    if (basketballLeaguesResult.success && Array.isArray(basketballLeaguesResult.data)) {
      let saved = 0;
      for (const league of basketballLeaguesResult.data) {
        try {
          await BasketballLeague.findOneAndUpdate(
            { 'league.id': league.id },
            { league: league, country: league.country },
            { upsert: true, new: true }
          );
          saved++;
        } catch (error) {
          console.error(`[SportsCron] Error saving basketball league ${league.id}:`, error.message);
        }
      }
      console.log(`[SportsCron] ✅ Basketball leagues: ${saved} saved`);
    }

    // Major football leagues for teams and standings
    const majorFootballLeagues = [39, 140, 135, 61, 78]; // Premier League, La Liga, Serie A, Ligue 1, Bundesliga
    const currentYear = new Date().getFullYear();

    for (const leagueId of majorFootballLeagues) {
      // Fetch teams
      const teamsResult = await getFootballTeams(leagueId, currentYear);
      if (teamsResult.success && Array.isArray(teamsResult.data)) {
        let saved = 0;
        for (const team of teamsResult.data) {
          try {
            await FootballTeam.findOneAndUpdate(
              { 'team.id': team.team?.id },
              { team: team.team, venue: team.venue },
              { upsert: true, new: true }
            );
            saved++;
          } catch (error) {
            console.error(`[SportsCron] Error saving football team ${team.team?.id}:`, error.message);
          }
        }
        if (saved > 0) {
          console.log(`[SportsCron] ✅ Football teams for league ${leagueId}: ${saved} saved`);
        }
      }

      // Fetch standings
      const standingsResult = await getFootballStandings(leagueId, currentYear);
      if (standingsResult.success && Array.isArray(standingsResult.data) && standingsResult.data.length > 0) {
        try {
          const standing = standingsResult.data[0];
          await FootballStanding.findOneAndUpdate(
            { league_id: leagueId, season: currentYear },
            {
              league_id: leagueId,
              season: currentYear,
              league: standing.league,
              standings: standing.standings,
            },
            { upsert: true, new: true }
          );
          console.log(`[SportsCron] ✅ Football standings for league ${leagueId} saved`);
        } catch (error) {
          console.error(`[SportsCron] Error saving football standings ${leagueId}:`, error.message);
        }
      }
    }

    // Major basketball leagues
    const majorBasketballLeagues = [12, 13]; // NBA, Euroleague

    for (const leagueId of majorBasketballLeagues) {
      // Fetch teams
      const teamsResult = await getBasketballTeams(leagueId, currentYear);
      if (teamsResult.success && Array.isArray(teamsResult.data)) {
        let saved = 0;
        for (const team of teamsResult.data) {
          try {
            await BasketballTeam.findOneAndUpdate(
              { 'team.id': team.id },
              { team: team, venue: team.venue },
              { upsert: true, new: true }
            );
            saved++;
          } catch (error) {
            console.error(`[SportsCron] Error saving basketball team ${team.id}:`, error.message);
          }
        }
        if (saved > 0) {
          console.log(`[SportsCron] ✅ Basketball teams for league ${leagueId}: ${saved} saved`);
        }
      }

      // Fetch standings
      const standingsResult = await getBasketballStandings(leagueId, currentYear);
      if (standingsResult.success && Array.isArray(standingsResult.data) && standingsResult.data.length > 0) {
        try {
          const standing = standingsResult.data[0];
          await BasketballStanding.findOneAndUpdate(
            { league_id: leagueId, season: currentYear },
            {
              league_id: leagueId,
              season: currentYear,
              league: standing.league,
              standings: standing.standings,
            },
            { upsert: true, new: true }
          );
          console.log(`[SportsCron] ✅ Basketball standings for league ${leagueId} saved`);
        } catch (error) {
          console.error(`[SportsCron] Error saving basketball standings ${leagueId}:`, error.message);
        }
      }
    }

    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    console.log(`[SportsCron] ✅ Leagues/teams/standings fetch completed in ${duration}s`);
  } catch (error) {
    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    console.error(`[SportsCron] ❌ Leagues fetch failed after ${duration}s:`, error.message);
    if (error.stack) {
      console.error('[SportsCron] Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  } finally {
    isLeaguesRunning = false;
  }
};

// ============================================
// CRON JOB SCHEDULES
// ============================================

// Live matches: Every 1 minute
const liveMatchesCron = cron.schedule('*/1 * * * *', fetchLiveMatches, {
  scheduled: false,
  timezone: 'UTC',
});

// Upcoming fixtures: Every 12 hours (at 00:00 and 12:00 UTC)
const fixturesCron = cron.schedule('0 */12 * * *', fetchUpcomingFixtures, {
  scheduled: false,
  timezone: 'UTC',
});

// Leagues/teams/standings: Every 12 hours (at 00:00 and 12:00 UTC)
const leaguesCron = cron.schedule('0 */12 * * *', fetchLeaguesAndStandings, {
  scheduled: false,
  timezone: 'UTC',
});

/**
 * Start all sports cron jobs
 * Called after database connection is established
 */
function startSportsCron() {
  try {
    // Start live matches cron
    liveMatchesCron.start();
    console.log('[SportsCron] ✅ Live matches cron started (every 1 minute)');

    // Start fixtures cron
    fixturesCron.start();
    console.log('[SportsCron] ✅ Fixtures cron started (every 12 hours)');

    // Start leagues cron
    leaguesCron.start();
    console.log('[SportsCron] ✅ Leagues/teams/standings cron started (every 12 hours)');

    // Run initial fetch immediately
    console.log('[SportsCron] 🏃 Running initial data fetch...');
    fetchLiveMatches();
    fetchUpcomingFixtures();
    fetchLeaguesAndStandings();
  } catch (error) {
    console.error('[SportsCron] ❌ Error starting cron jobs:', error.message);
    if (error.stack) {
      console.error('[SportsCron] Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }
}

/**
 * Stop all sports cron jobs
 */
function stopSportsCron() {
  try {
    liveMatchesCron.stop();
    fixturesCron.stop();
    leaguesCron.stop();
    console.log('[SportsCron] ✅ All cron jobs stopped');
  } catch (error) {
    console.error('[SportsCron] Error stopping cron jobs:', error.message);
  }
}

module.exports = {
  startSportsCron,
  stopSportsCron,
  fetchLiveMatches, // Export for manual triggering
  fetchUpcomingFixtures, // Export for manual triggering
  fetchLeaguesAndStandings, // Export for manual triggering
};
