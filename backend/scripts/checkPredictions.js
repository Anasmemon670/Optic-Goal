/**
 * Check Predictions Script
 * Shows current predictions in database
 * Usage: node scripts/checkPredictions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Prediction = require('../src/models/Prediction');
const HighlightlyMatch = require('../src/models/HighlightlyMatch');

async function checkPredictions() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    // Wait for connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('open', resolve);
      }
    });

    console.log('✅ Database connected\n');

    // Check total predictions
    const totalPredictions = await Prediction.countDocuments();
    console.log(`📊 Total Predictions in DB: ${totalPredictions}`);

    // Check public predictions
    const publicPredictions = await Prediction.countDocuments({ isPublic: true });
    console.log(`🌐 Public Predictions: ${publicPredictions}`);

    // Check VIP predictions
    const vipPredictions = await Prediction.countDocuments({ isVIP: true });
    console.log(`👑 VIP Predictions: ${vipPredictions}`);

    // Check upcoming predictions (future matches)
    const now = new Date();
    const upcomingPredictions = await Prediction.countDocuments({
      isPublic: true,
      isVIP: false,
      matchStart: { $gte: now },
    });
    console.log(`⏭️  Upcoming Public Predictions: ${upcomingPredictions}`);

    // Check today's matches
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMatches = await HighlightlyMatch.countDocuments({
      sport: 'football',
      matchDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'NS', 'TBD'] },
    });
    console.log(`\n📅 Today's Scheduled Matches: ${todayMatches}`);

    // Show sample predictions
    if (upcomingPredictions > 0) {
      console.log('\n📋 Sample Upcoming Predictions:');
      const samples = await Prediction.find({
        isPublic: true,
        isVIP: false,
        matchStart: { $gte: now },
      })
        .limit(5)
        .sort({ matchStart: 1 })
        .select('homeTeam awayTeam league tip confidence matchStart');

      samples.forEach((pred, idx) => {
        console.log(`\n   ${idx + 1}. ${pred.homeTeam} vs ${pred.awayTeam}`);
        console.log(`      League: ${pred.league}`);
        console.log(`      Tip: ${pred.tip || pred.prediction}`);
        console.log(`      Confidence: ${pred.confidence}%`);
        console.log(`      Match Time: ${pred.matchStart.toLocaleString()}`);
      });
    } else {
      console.log('\n⚠️  No upcoming predictions found!');
      console.log('\n💡 To generate predictions, run:');
      console.log('   node scripts/generatePredictionsNow.js');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
checkPredictions();
