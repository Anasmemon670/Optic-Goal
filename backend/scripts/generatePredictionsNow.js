/**
 * Manual Prediction Generation Script
 * Run this to generate predictions immediately
 * Usage: node scripts/generatePredictionsNow.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const { generatePredictions } = require('../src/services/predictionEngine');

async function generatePredictionsNow() {
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

    console.log('✅ Database connected');
    console.log('🚀 Starting prediction generation...\n');

    // Generate predictions for today
    const result = await generatePredictions();

    if (result.success) {
      console.log('\n✅ Prediction generation completed!');
      console.log(`📊 Generated: ${result.generated} predictions`);
      console.log(`⏭️  Skipped: ${result.skipped} matches`);
      console.log(`❌ Errors: ${result.errors}`);
      console.log(`📅 Date: ${result.date || 'today'}`);
      
      if (result.generated === 0) {
        console.log('\n⚠️  No predictions were generated. Possible reasons:');
        console.log('   1. No matches found in database for today');
        console.log('   2. All matches are already finished');
        console.log('   3. Matches are not in "scheduled" or "NS" status');
        console.log('\n💡 Check the HighlightlyMatch collection for today\'s matches');
      }
    } else {
      console.error('\n❌ Prediction generation failed!');
      console.error(`Error: ${result.error}`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
generatePredictionsNow();
