/**
 * Setup Script for Sports API Key
 * 
 * This script helps add the SPORTS_API_KEY to your .env file
 * Run with: node SETUP_SPORTS_API_KEY.js
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
const NEW_API_KEY = 'f117f866a660f75cd73dc503302a9a29';

console.log('🔧 Setting up Sports API Key...\n');

// Check if .env file exists
if (!fs.existsSync(ENV_FILE)) {
  console.error('❌ .env file not found!');
  console.error('   Please create a .env file in the backend directory first.');
  process.exit(1);
}

// Read .env file
let envContent = fs.readFileSync(ENV_FILE, 'utf8');

// Check if SPORTS_API_KEY already exists
if (envContent.includes('SPORTS_API_KEY=')) {
  console.log('⚠️  SPORTS_API_KEY already exists in .env file');
  console.log('   Updating to new key...\n');
  
  // Replace existing key
  envContent = envContent.replace(
    /SPORTS_API_KEY=.*/g,
    `SPORTS_API_KEY=${NEW_API_KEY}`
  );
} else {
  console.log('✅ Adding SPORTS_API_KEY to .env file...\n');
  
  // Add new key at the end
  if (!envContent.endsWith('\n')) {
    envContent += '\n';
  }
  envContent += `# Sports API Key (API-Sports.io Direct API)\n`;
  envContent += `SPORTS_API_KEY=${NEW_API_KEY}\n`;
}

// Write back to .env file
fs.writeFileSync(ENV_FILE, envContent, 'utf8');

console.log('✅ SPORTS_API_KEY has been set successfully!');
console.log(`   Key: ${NEW_API_KEY.substring(0, 8)}...`);
console.log('\n📝 Next steps:');
console.log('   1. Restart your backend server');
console.log('   2. Check server logs for: "[SportsAPI] ✅ API key loaded"');
console.log('   3. Test endpoints to verify API is working\n');
