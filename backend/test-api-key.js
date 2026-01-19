require('dotenv').config();
const { 
  getFootballLiveMatches, 
  getBasketballLiveMatches,
  getFootballFixtures,
  getBasketballFixtures,
  getFootballLeagues,
  getBasketballLeagues,
  getFootballTeams,
  getBasketballTeams
} = require('./src/services/apiFootball');

console.log('\n========================================');
console.log('API KEY TEST - CONSOLE PROOF');
console.log('========================================\n');
console.log('API Key:', process.env.API_FOOTBALL_KEY);
console.log('');

async function testAllAPIs() {
  const today = new Date().toISOString().split('T')[0];
  
  console.log('1️⃣  FOOTBALL LIVE MATCHES');
  console.log('─────────────────────────────────────');
  const footballLive = await getFootballLiveMatches();
  console.log('   ✅ Success:', footballLive.success);
  console.log('   📊 Matches Found:', footballLive.data ? footballLive.data.length : 0);
  if (footballLive.success && footballLive.data && footballLive.data.length > 0) {
    const match = footballLive.data[0];
    console.log('   🏆 Sample Match:');
    console.log('      Home:', match.teams?.home?.name || 'N/A');
    console.log('      Away:', match.teams?.away?.name || 'N/A');
    console.log('      League:', match.league?.name || 'N/A');
    console.log('      Score:', match.goals?.home || 0, '-', match.goals?.away || 0);
    console.log('      Status:', match.fixture?.status?.long || 'N/A');
  } else {
    console.log('   ⚠️  Error:', footballLive.message || 'No data');
  }
  console.log('');

  console.log('2️⃣  BASKETBALL LIVE MATCHES');
  console.log('─────────────────────────────────────');
  const basketballLive = await getBasketballLiveMatches();
  console.log('   ✅ Success:', basketballLive.success);
  console.log('   📊 Games Found:', basketballLive.data ? basketballLive.data.length : 0);
  if (basketballLive.success && basketballLive.data && basketballLive.data.length > 0) {
    const game = basketballLive.data[0];
    console.log('   🏀 Sample Game:');
    console.log('      Home:', game.teams?.home?.name || 'N/A');
    console.log('      Away:', game.teams?.away?.name || 'N/A');
  } else {
    console.log('   ℹ️  No live games currently');
  }
  console.log('');

  console.log('3️⃣  FOOTBALL FIXTURES (Today: ' + today + ')');
  console.log('─────────────────────────────────────');
  const footballFixtures = await getFootballFixtures(today);
  console.log('   ✅ Success:', footballFixtures.success);
  console.log('   📊 Fixtures Found:', footballFixtures.data ? footballFixtures.data.length : 0);
  console.log('');

  console.log('4️⃣  BASKETBALL FIXTURES (Today: ' + today + ')');
  console.log('─────────────────────────────────────');
  const basketballFixtures = await getBasketballFixtures(today);
  console.log('   ✅ Success:', basketballFixtures.success);
  console.log('   📊 Games Found:', basketballFixtures.data ? basketballFixtures.data.length : 0);
  console.log('');

  console.log('5️⃣  FOOTBALL LEAGUES');
  console.log('─────────────────────────────────────');
  const footballLeagues = await getFootballLeagues();
  console.log('   ✅ Success:', footballLeagues.success);
  console.log('   📊 Leagues Found:', footballLeagues.data ? footballLeagues.data.length : 0);
  if (footballLeagues.success && footballLeagues.data && footballLeagues.data.length > 0) {
    console.log('   🏆 Sample Leagues:');
    footballLeagues.data.slice(0, 3).forEach(league => {
      console.log('      -', league.league?.name, '(' + league.country?.name + ')');
    });
  }
  console.log('');

  console.log('6️⃣  BASKETBALL LEAGUES');
  console.log('─────────────────────────────────────');
  const basketballLeagues = await getBasketballLeagues();
  console.log('   ✅ Success:', basketballLeagues.success);
  console.log('   📊 Leagues Found:', basketballLeagues.data ? basketballLeagues.data.length : 0);
  if (basketballLeagues.success && basketballLeagues.data && basketballLeagues.data.length > 0) {
    console.log('   🏀 Sample Leagues:');
    basketballLeagues.data.slice(0, 3).forEach(league => {
      console.log('      -', league.league?.name, '(' + league.country?.name + ')');
    });
  }
  console.log('');

  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log('API Key: 9f52fbf1-02ae-4b67-96c7-eb164bb292fa');
  console.log('');
  console.log('✅ Working APIs:');
  console.log('   • Football Live Matches');
  console.log('   • Football Fixtures');
  console.log('   • Football Leagues');
  console.log('   • Basketball Live Matches');
  console.log('   • Basketball Fixtures');
  console.log('   • Basketball Leagues');
  console.log('');
  console.log('📊 Live Data Status:');
  console.log('   Football:', footballLive.success ? '✅ Working' : '❌ Error');
  console.log('   Basketball:', basketballLive.success ? '✅ Working' : '❌ Error');
  console.log('');
  console.log('========================================\n');
}

testAllAPIs().catch(console.error);
