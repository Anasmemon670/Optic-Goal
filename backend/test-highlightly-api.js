/**
 * Highlightly API Test Script
 * Tests if the API key is working and fetching data
 */

require('dotenv').config();
const highlightlyService = require('./src/services/highlightlyService');

console.log('\n========================================');
console.log('HIGHLIGHTLY API TEST');
console.log('========================================\n');
console.log('API Key:', process.env.HIGHLIGHTLY_API_KEY ? '✅ Found' : '❌ Missing');
console.log('Base URL: https://sports.highlightly.net');
console.log('');

async function testHighlightlyAPI() {
  try {
    console.log('1️⃣  TESTING LIVE MATCHES (Football)');
    console.log('─────────────────────────────────────');
    const liveResult = await highlightlyService.getLiveMatches('football');
    console.log('   ✅ Success:', liveResult.success);
    console.log('   📊 Message:', liveResult.message);
    if (liveResult.success && liveResult.data) {
      const matches = Array.isArray(liveResult.data) ? liveResult.data : liveResult.data.response || [];
      console.log('   📊 Matches Found:', matches.length);
      if (matches.length > 0) {
        const match = matches[0];
        console.log('   🏆 Sample Match:');
        console.log('      Home:', match.teams?.home?.name || match.homeTeam?.name || 'N/A');
        console.log('      Away:', match.teams?.away?.name || match.awayTeam?.name || 'N/A');
        console.log('      League:', match.league?.name || 'N/A');
        console.log('      Score:', match.goals?.home || match.score?.home || 0, '-', match.goals?.away || match.score?.away || 0);
        console.log('      Status:', match.fixture?.status?.long || match.status || 'N/A');
      }
    } else {
      console.log('   ⚠️  Error:', liveResult.message || 'No data');
      if (liveResult.error) {
        console.log('   ❌ Error Type:', liveResult.error);
      }
    }
    console.log('');

    console.log('2️⃣  TESTING TODAY MATCHES (Football)');
    console.log('─────────────────────────────────────');
    const todayResult = await highlightlyService.getTodayMatches('football');
    console.log('   ✅ Success:', todayResult.success);
    console.log('   📊 Message:', todayResult.message);
    if (todayResult.success && todayResult.data) {
      const matches = Array.isArray(todayResult.data) ? todayResult.data : todayResult.data.response || [];
      console.log('   📊 Matches Found:', matches.length);
    } else {
      console.log('   ⚠️  Error:', todayResult.message || 'No data');
      if (todayResult.error) {
        console.log('   ❌ Error Type:', todayResult.error);
      }
    }
    console.log('');

    console.log('3️⃣  TESTING LEAGUES (Football)');
    console.log('─────────────────────────────────────');
    const leaguesResult = await highlightlyService.getLeagues('football');
    console.log('   ✅ Success:', leaguesResult.success);
    console.log('   📊 Message:', leaguesResult.message);
    if (leaguesResult.success && leaguesResult.data) {
      const leagues = Array.isArray(leaguesResult.data) ? leaguesResult.data : leaguesResult.data.response || [];
      console.log('   📊 Leagues Found:', leagues.length);
      if (leagues.length > 0) {
        console.log('   🏆 Sample Leagues:');
        leagues.slice(0, 3).forEach(league => {
          const leagueName = league.league?.name || league.name || 'N/A';
          const country = league.country?.name || league.country || 'N/A';
          console.log('      -', leagueName, '(' + country + ')');
        });
      }
    } else {
      console.log('   ⚠️  Error:', leaguesResult.message || 'No data');
      if (leaguesResult.error) {
        console.log('   ❌ Error Type:', leaguesResult.error);
      }
    }
    console.log('');

    console.log('4️⃣  TESTING STANDINGS (Football)');
    console.log('─────────────────────────────────────');
    const standingsResult = await highlightlyService.getStandings('football');
    console.log('   ✅ Success:', standingsResult.success);
    console.log('   📊 Message:', standingsResult.message);
    if (standingsResult.success && standingsResult.data) {
      const standings = Array.isArray(standingsResult.data) ? standingsResult.data : standingsResult.data.response || [];
      console.log('   📊 Standings Found:', standings.length);
    } else {
      console.log('   ⚠️  Error:', standingsResult.message || 'No data');
      if (standingsResult.error) {
        console.log('   ❌ Error Type:', standingsResult.error);
      }
    }
    console.log('');

    console.log('5️⃣  TESTING TEAMS (Football)');
    console.log('─────────────────────────────────────');
    const teamsResult = await highlightlyService.getTeams('football');
    console.log('   ✅ Success:', teamsResult.success);
    console.log('   📊 Message:', teamsResult.message);
    if (teamsResult.success && teamsResult.data) {
      const teams = Array.isArray(teamsResult.data) ? teamsResult.data : teamsResult.data.response || [];
      console.log('   📊 Teams Found:', teams.length);
    } else {
      console.log('   ⚠️  Error:', teamsResult.message || 'No data');
      if (teamsResult.error) {
        console.log('   ❌ Error Type:', teamsResult.error);
      }
    }
    console.log('');

    console.log('========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log('API Key: 9f52fbf1-02ae-4b67-96c7-eb164bb292fa');
    console.log('');
    console.log('✅ Working Endpoints:');
    if (liveResult.success) console.log('   • Live Matches');
    if (todayResult.success) console.log('   • Today Matches');
    if (leaguesResult.success) console.log('   • Leagues');
    if (standingsResult.success) console.log('   • Standings');
    if (teamsResult.success) console.log('   • Teams');
    console.log('');
    console.log('❌ Failed Endpoints:');
    if (!liveResult.success) console.log('   • Live Matches:', liveResult.error || liveResult.message);
    if (!todayResult.success) console.log('   • Today Matches:', todayResult.error || todayResult.message);
    if (!leaguesResult.success) console.log('   • Leagues:', leaguesResult.error || leaguesResult.message);
    if (!standingsResult.success) console.log('   • Standings:', standingsResult.error || standingsResult.message);
    if (!teamsResult.success) console.log('   • Teams:', teamsResult.error || teamsResult.message);
    console.log('');
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error(error.stack);
  }
}

testHighlightlyAPI().catch(console.error);
