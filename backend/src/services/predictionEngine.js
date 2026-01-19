// API-Football removed - using Highlightly/cached data only
const Prediction = require('../models/Prediction');
const HighlightlyMatch = require('../models/HighlightlyMatch');
const HighlightlyStanding = require('../models/HighlightlyStanding');

/**
 * Prediction Engine Service
 * Generates predictions based on Highlightly/cached data and statistical analysis
 * Reads ONLY from MongoDB - no external API calls
 */

// Helper: Calculate average goals for a team
const calculateAverageGoals = (matches) => {
  if (!matches || matches.length === 0) return { home: 1.0, away: 1.0, total: 2.0 };
  
  let homeGoals = 0;
  let awayGoals = 0;
  let totalGoals = 0;
  let count = 0;

  matches.forEach(match => {
    if (match.goals && typeof match.goals.home === 'number' && typeof match.goals.away === 'number') {
      homeGoals += match.goals.home;
      awayGoals += match.goals.away;
      totalGoals += match.goals.home + match.goals.away;
      count++;
    }
  });

  if (count === 0) return { home: 1.0, away: 1.0, total: 2.0 };

  return {
    home: homeGoals / count,
    away: awayGoals / count,
    total: totalGoals / count,
  };
};

// Helper: Get team form (last 5 matches)
const getTeamForm = async (teamId, leagueId, season) => {
  try {
    // For free plan, we'll use simplified logic
    // In a paid plan, we could fetch actual last 5 matches
    return {
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      matches: [],
    };
  } catch (error) {
    console.error(`[PredictionEngine] Error getting team form for ${teamId}:`, error.message);
    return { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matches: [] };
  }
};

// Helper: Get H2H history (simplified for free plan)
const getH2HHistory = async (homeTeamId, awayTeamId) => {
  try {
    // For free plan, we'll use simplified logic
    // In a paid plan, we could fetch actual H2H matches
    return {
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      totalGoals: 0,
      matches: [],
    };
  } catch (error) {
    console.error(`[PredictionEngine] Error getting H2H history:`, error.message);
    return { homeWins: 0, draws: 0, awayWins: 0, totalGoals: 0, matches: [] };
  }
};

// Helper: Calculate win probability based on standings
const calculateWinProbability = (homeStanding, awayStanding) => {
  if (!homeStanding || !awayStanding) return { home: 0.33, draw: 0.33, away: 0.34 };

  // Simple probability based on position (lower position = better)
  const homePosition = homeStanding.rank || 10;
  const awayPosition = awayStanding.rank || 10;

  // Calculate points if available
  const homePoints = homeStanding.points || 0;
  const awayPoints = awayStanding.points || 0;

  // Weighted probability
  const totalPoints = homePoints + awayPoints || 1;
  const homeProb = homePoints / totalPoints;
  const awayProb = awayPoints / totalPoints;
  const drawProb = 0.25; // Base draw probability

  // Normalize
  const sum = homeProb + awayProb + drawProb;
  return {
    home: homeProb / sum,
    draw: drawProb / sum,
    away: awayProb / sum,
  };
};

/**
 * Generate prediction for a single fixture
 * Works with both DB format (HighlightlyMatch) and live API format (apiFootball)
 */
const generatePredictionForFixture = async (fixture) => {
  try {
    // Handle both API format and DB format
    const matchId = fixture.fixture?.id || fixture.id || fixture.matchId;
    if (!matchId) {
      console.warn('[PredictionEngine] Fixture missing ID, skipping');
      return null;
    }

    // Extract team names (handle both API and DB formats)
    const homeTeam = fixture.teams?.home?.name || 
                     fixture.homeTeam?.name || 
                     fixture.homeTeam || 
                     'TBD';
    const awayTeam = fixture.teams?.away?.name || 
                     fixture.awayTeam?.name || 
                     fixture.awayTeam || 
                     'TBD';
    
    // Extract league info (handle both API and DB formats)
    const league = fixture.league?.name || 
                   fixture.league || 
                   'Unknown League';
    const leagueId = fixture.league?.id || 
                      fixture.leagueId;
    
    // Extract match time (handle both API and DB formats)
    const matchTime = fixture.fixture?.date ? 
                      new Date(fixture.fixture.date) : 
                      (fixture.matchDate ? new Date(fixture.matchDate) : new Date());
    
    const season = fixture.league?.season || new Date().getFullYear();

    // Get match details from MongoDB (populated by Highlightly cron) - optional
    // If fixture already has data from API, use it directly
    let matchDetails = null;
    let statistics = [];
    let events = [];
    let lineups = [];
    
    // If fixture has statistics/events from API, use them
    if (fixture.statistics && Array.isArray(fixture.statistics)) {
      statistics = fixture.statistics;
    }
    if (fixture.events && Array.isArray(fixture.events)) {
      events = fixture.events;
    }
    if (fixture.lineups && Array.isArray(fixture.lineups)) {
      lineups = fixture.lineups;
    }
    
    // Otherwise, try to get from DB (optional - not required for real-time predictions)
    if (statistics.length === 0 && events.length === 0) {
      try {
        matchDetails = await HighlightlyMatch.findOne({
          matchId: matchId.toString(),
          sport: 'football',
        });
        if (matchDetails) {
          statistics = matchDetails.rawData?.statistics || [];
          events = matchDetails.rawData?.events || [];
          lineups = matchDetails.rawData?.lineups || [];
        }
      } catch (error) {
        // Silent fail - we can generate predictions without DB data
      }
    }

    // Calculate averages from available data
    // Handle both API format (goals.home/goals.away) and DB format
    const avgGoals = calculateAverageGoals([fixture]);
    
    // Get standings from MongoDB (populated by Highlightly cron) - optional
    // Standings enhance predictions but are not required for basic predictions
    let standings = null;
    if (leagueId) {
      try {
        const standingsDoc = await HighlightlyStanding.findOne({
          leagueId: leagueId.toString(),
          sport: 'football',
        });
        if (standingsDoc) {
          standings = standingsDoc.rawData || standingsDoc;
        }
      } catch (error) {
        // Silent fail - we can generate predictions without standings
      }
    }

    // Generate predictions based on rules
    const predictions = [];

    // Rule 1: Over/Under 2.5 Goals
    if (avgGoals.total >= 1.5) {
      const confidence = Math.min(85, Math.max(55, Math.round(avgGoals.total * 20)));
      predictions.push({
        matchId: matchId.toString(),
        league,
        homeTeam,
        awayTeam,
        predictionType: avgGoals.total >= 2.5 ? 'banker' : 'all',
        tip: avgGoals.total >= 2.5 ? 'Over 2.5' : 'Under 2.5',
        confidence,
        matchTime,
        source: fixture.source || 'live-api',
        notes: `Average goals: ${avgGoals.total.toFixed(1)}`,
      });
    }

    // Rule 2: Banker - Home Win (if favorite wins >70%)
    if (standings && standings.standings && standings.standings.length > 0) {
      // Handle both API format (teams.home.id) and DB format
      const homeTeamId = fixture.teams?.home?.id || fixture.homeTeam?.id;
      const awayTeamId = fixture.teams?.away?.id || fixture.awayTeam?.id;
      
      const homeStanding = standings.standings[0]?.find(s => 
        s.team?.id === homeTeamId || 
        s.team?.name === homeTeam
      );
      const awayStanding = standings.standings[0]?.find(s => 
        s.team?.id === awayTeamId || 
        s.team?.name === awayTeam
      );

      if (homeStanding && awayStanding) {
        const winProb = calculateWinProbability(homeStanding, awayStanding);
        if (winProb.home > 0.70) {
          predictions.push({
            matchId: matchId.toString(),
            league,
            homeTeam,
            awayTeam,
            predictionType: 'banker',
            tip: 'Home Win',
            confidence: Math.min(90, Math.round(winProb.home * 100)),
            matchTime,
            source: fixture.source || 'live-api',
            notes: `Home team win probability: ${(winProb.home * 100).toFixed(1)}%`,
          });
        } else if (winProb.away > 0.70) {
          predictions.push({
            matchId: matchId.toString(),
            league,
            homeTeam,
            awayTeam,
            predictionType: 'banker',
            tip: 'Away Win',
            confidence: Math.min(90, Math.round(winProb.away * 100)),
            matchTime,
            source: fixture.source || 'live-api',
            notes: `Away team win probability: ${(winProb.away * 100).toFixed(1)}%`,
          });
        }
      }
    }

    // Rule 3: BTTS (Both Teams To Score)
    if (avgGoals.home >= 1.0 && avgGoals.away >= 1.0) {
      const bttsConfidence = Math.min(80, Math.max(60, Math.round((avgGoals.home + avgGoals.away) * 15)));
      predictions.push({
        matchId: matchId.toString(),
        league,
        homeTeam,
        awayTeam,
        predictionType: bttsConfidence >= 70 ? 'banker' : 'all',
        tip: 'BTTS',
        confidence: bttsConfidence,
        matchTime,
        source: fixture.source || 'live-api',
        notes: `Both teams average ${avgGoals.home.toFixed(1)} and ${avgGoals.away.toFixed(1)} goals`,
      });
    }

    // Rule 4: Surprise pick (underdog with improving form)
    if (standings && standings.standings && standings.standings.length > 0) {
      // Handle both API format (teams.home.id) and DB format
      const homeTeamId = fixture.teams?.home?.id || fixture.homeTeam?.id;
      const awayTeamId = fixture.teams?.away?.id || fixture.awayTeam?.id;
      
      const homeStanding = standings.standings[0]?.find(s => 
        s.team?.id === homeTeamId || 
        s.team?.name === homeTeam
      );
      const awayStanding = standings.standings[0]?.find(s => 
        s.team?.id === awayTeamId || 
        s.team?.name === awayTeam
      );

      if (homeStanding && awayStanding) {
        const homeRank = homeStanding.rank || 10;
        const awayRank = awayStanding.rank || 10;
        
        // If away team is lower ranked but close, it's a surprise pick
        if (awayRank > homeRank && awayRank - homeRank <= 3) {
          predictions.push({
            matchId: matchId.toString(),
            league,
            homeTeam,
            awayTeam,
            predictionType: 'surprise',
            tip: 'Away Win or Draw',
            confidence: Math.min(75, Math.max(55, 60 + (awayRank - homeRank) * 2)),
            matchTime,
            source: fixture.source || 'live-api',
            notes: `Underdog pick: Away team ranked ${awayRank} vs Home ${homeRank}`,
          });
        }
      }
    }

    // Rule 5: VIP picks (highest statistical confidence)
    // Select predictions with confidence >= 80 as VIP
    const vipPredictions = predictions
      .filter(p => p.confidence >= 80)
      .map(p => ({
        ...p,
        predictionType: 'vip',
        isVIP: true,
      }));

    // Combine all predictions
    const allPredictions = [...predictions, ...vipPredictions];

    // If no predictions generated, create a default one
    if (allPredictions.length === 0) {
      allPredictions.push({
        matchId: matchId.toString(),
        league,
        homeTeam,
        awayTeam,
        predictionType: 'all',
        tip: 'Over 1.5',
        confidence: 60,
        matchTime,
        source: fixture.source || 'live-api',
        notes: 'Default prediction based on available data',
      });
    }

    return allPredictions;
  } catch (error) {
    console.error('[PredictionEngine] Error generating prediction for fixture:', error.message);
    return null;
  }
};

/**
 * Generate predictions from live API fixtures (real-time)
 * This is the PRIMARY method for generating predictions on-the-fly
 */
const generatePredictionsFromLiveFixtures = async (fixtures) => {
  try {
    if (!fixtures || fixtures.length === 0) {
      return [];
    }

    console.log(`[PredictionEngine] Generating predictions from ${fixtures.length} live fixtures`);
    
    const allPredictions = [];
    
    // Process each fixture
    for (const fixture of fixtures) {
      try {
        // Only process upcoming matches (not live or finished)
        const status = fixture.fixture?.status?.short || fixture.fixture?.status?.long;
        if (status && !['NS', 'TBD', 'SCHEDULED', 'NOT_STARTED'].includes(status)) {
          continue;
        }

        // Check if match is in the future
        const matchDate = fixture.fixture?.date ? new Date(fixture.fixture.date) : null;
        if (matchDate && matchDate < new Date()) {
          continue;
        }

        const predictions = await generatePredictionForFixture(fixture);
        
        if (predictions && predictions.length > 0) {
          allPredictions.push(...predictions);
        }
      } catch (error) {
        console.error(`[PredictionEngine] Error processing live fixture:`, error.message);
      }
    }

    console.log(`[PredictionEngine] Generated ${allPredictions.length} predictions from live fixtures`);
    return allPredictions;
  } catch (error) {
    console.error('[PredictionEngine] Fatal error generating predictions from live fixtures:', error.message);
    return [];
  }
};

/**
 * Generate predictions for today's fixtures
 * This is the BATCH method (used by cron jobs - optional optimization)
 */
const generatePredictions = async (date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`[PredictionEngine] Generating predictions for ${targetDate}`);

    // Fetch fixtures from MongoDB (populated by Highlightly cron)
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const fixtures = await HighlightlyMatch.find({
      sport: 'football',
      matchDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['scheduled', 'NS', 'TBD'] },
    }).limit(100);

    if (!fixtures || fixtures.length === 0) {
      console.log(`[PredictionEngine] No fixtures found for ${targetDate} in database`);
      return {
        success: true,
        total: 0,
        generated: 0,
        skipped: 0,
        errors: 0,
      };
    }

    // Transform Highlightly match format to prediction engine format
    const transformedFixtures = fixtures.map(match => ({
      fixture: {
        id: match.matchId,
        date: match.matchDate,
        status: { short: match.status },
      },
      league: match.league,
      teams: {
        home: match.homeTeam,
        away: match.awayTeam,
      },
      goals: match.score,
    }));
    console.log(`[PredictionEngine] Found ${fixtures.length} fixtures for ${targetDate}`);

    let generated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each fixture
    for (const fixture of transformedFixtures) {
      try {
        // Only process upcoming matches (not live or finished)
        const status = fixture.fixture?.status?.short;
        if (status && status !== 'NS' && status !== 'TBD') {
          skipped++;
          continue;
        }

        const predictions = await generatePredictionForFixture(fixture);
        
        if (!predictions || predictions.length === 0) {
          skipped++;
          continue;
        }

        // Save each prediction to database (overwrite existing for same matchId)
        for (const pred of predictions) {
          try {
            await Prediction.findOneAndUpdate(
              { matchId: pred.matchId, tip: pred.tip },
              {
                ...pred,
                matchStart: pred.matchTime,
                prediction: pred.tip, // Set prediction field for backward compatibility
                isPublic: true, // Ensure predictions are public by default
                sport: 'football', // Default sport
                updatedAt: new Date(),
              },
              { upsert: true, new: true }
            );
            generated++;
          } catch (saveError) {
            console.error(`[PredictionEngine] Error saving prediction for match ${pred.matchId}:`, saveError.message);
            errors++;
          }
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[PredictionEngine] Error processing fixture:`, error.message);
        errors++;
      }
    }

    console.log(`[PredictionEngine] Completed: Generated ${generated}, Skipped ${skipped}, Errors ${errors}`);

    return {
      success: true,
      total: fixtures.length,
      generated,
      skipped,
      errors,
      date: targetDate,
    };
  } catch (error) {
    console.error('[PredictionEngine] Fatal error generating predictions:', error.message);
    return {
      success: false,
      error: error.message,
      total: 0,
      generated: 0,
      skipped: 0,
      errors: 1,
    };
  }
};

module.exports = {
  generatePredictions,
  generatePredictionForFixture,
  generatePredictionsFromLiveFixtures,
};

