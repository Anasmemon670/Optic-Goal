/**
 * Check Matches Script
 * Shows matches in database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const HighlightlyMatch = require('../src/models/HighlightlyMatch');

async function checkMatches() {
  try {
    await connectDB();
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) resolve();
      else mongoose.connection.once('open', resolve);
    });

    console.log('✅ Database connected\n');

    const totalMatches = await HighlightlyMatch.countDocuments();
    console.log(`📊 Total Matches in DB: ${totalMatches}`);

    // Check today's matches
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMatches = await HighlightlyMatch.countDocuments({
      sport: 'football',
      matchDate: { $gte: today, $lt: tomorrow },
    });
    console.log(`📅 Today's Matches: ${todayMatches}`);

    // Check upcoming matches (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingMatches = await HighlightlyMatch.countDocuments({
      sport: 'football',
      matchDate: { $gte: today, $lt: nextWeek },
      status: { $in: ['scheduled', 'NS', 'TBD'] },
    });
    console.log(`⏭️  Upcoming Matches (next 7 days): ${upcomingMatches}`);

    // Show sample matches
    if (upcomingMatches > 0) {
      console.log('\n📋 Sample Upcoming Matches:');
      const samples = await HighlightlyMatch.find({
        sport: 'football',
        matchDate: { $gte: today, $lt: nextWeek },
        status: { $in: ['scheduled', 'NS', 'TBD'] },
      })
        .limit(5)
        .sort({ matchDate: 1 })
        .select('homeTeam awayTeam league matchDate status');

      samples.forEach((match, idx) => {
        const home = match.homeTeam?.name || match.homeTeam || 'TBD';
        const away = match.awayTeam?.name || match.awayTeam || 'TBD';
        console.log(`\n   ${idx + 1}. ${home} vs ${away}`);
        console.log(`      League: ${match.league?.name || match.league || 'Unknown'}`);
        console.log(`      Date: ${match.matchDate.toLocaleString()}`);
        console.log(`      Status: ${match.status}`);
      });
    } else {
      console.log('\n⚠️  No upcoming matches found!');
      console.log('💡 The sports cron job needs to fetch matches first.');
      console.log('   Check if the sports cron is running in server logs.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMatches();
