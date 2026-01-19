/**
 * Environment Variable Verification Script
 * 
 * Verifies that HIGHLIGHTLY_API_KEY is correctly loaded at runtime
 * Run this to check if environment variables are properly configured
 */

require('dotenv').config();

console.log('\n========================================');
console.log('ENVIRONMENT VARIABLE VERIFICATION');
console.log('========================================\n');

// Check if dotenv loaded
console.log('1. Dotenv Status:');
console.log('   ✅ dotenv.config() executed');

// Check API key
const API_KEY = process.env.HIGHLIGHTLY_API_KEY;

console.log('\n2. HIGHLIGHTLY_API_KEY Status:');
if (!API_KEY) {
  console.log('   ❌ NOT FOUND');
  console.log('   ⚠️  API key is undefined or not set');
} else if (API_KEY === 'undefined') {
  console.log('   ❌ INVALID (string "undefined")');
  console.log('   ⚠️  API key is the string "undefined", not actual value');
} else if (API_KEY.trim() === '') {
  console.log('   ❌ EMPTY');
  console.log('   ⚠️  API key is empty string');
} else {
  console.log('   ✅ FOUND');
  console.log('   ✅ Length:', API_KEY.length, 'characters');
  console.log('   ✅ First 8 chars:', API_KEY.substring(0, 8) + '...');
  console.log('   ✅ Last 4 chars:', '...' + API_KEY.substring(API_KEY.length - 4));
  console.log('   ✅ Format:', /^[a-f0-9-]+$/i.test(API_KEY) ? 'UUID-like format' : 'Other format');
}

// Check base URL
const BASE_URL = process.env.HIGHLIGHTLY_BASE_URL || 'https://sports.highlightly.net';
console.log('\n3. HIGHLIGHTLY_BASE_URL Status:');
console.log('   Value:', BASE_URL);
console.log('   Source:', process.env.HIGHLIGHTLY_BASE_URL ? 'Environment variable' : 'Default');

// Check header format
const HEADER_FORMAT = process.env.HIGHLIGHTLY_HEADER_FORMAT || 'x-api-key';
console.log('\n4. HIGHLIGHTLY_HEADER_FORMAT Status:');
console.log('   Value:', HEADER_FORMAT);
console.log('   Source:', process.env.HIGHLIGHTLY_HEADER_FORMAT ? 'Environment variable' : 'Default');

// Check all env vars
console.log('\n5. All Highlightly-related Environment Variables:');
const highlightlyVars = Object.keys(process.env)
  .filter(key => key.includes('HIGHLIGHTLY'))
  .sort();
if (highlightlyVars.length > 0) {
  highlightlyVars.forEach(key => {
    const value = process.env[key];
    const displayValue = key.includes('KEY') 
      ? value.substring(0, 8) + '...' 
      : value;
    console.log(`   ${key}: ${displayValue}`);
  });
} else {
  console.log('   ⚠️  No HIGHLIGHTLY_* environment variables found');
}

// Test actual service loading
console.log('\n6. Service Module Loading Test:');
try {
  const service = require('./src/services/highlightlyService');
  console.log('   ✅ Service module loaded successfully');
  console.log('   ✅ Service exports:', Object.keys(service).join(', '));
} catch (error) {
  console.log('   ❌ Failed to load service module:', error.message);
}

console.log('\n========================================\n');

if (!API_KEY || API_KEY === 'undefined' || API_KEY.trim() === '') {
  console.log('❌ VERIFICATION FAILED: API key is not properly configured');
  console.log('\n💡 FIX:');
  console.log('   1. Create or edit backend/.env file');
  console.log('   2. Add: HIGHLIGHTLY_API_KEY=your-actual-api-key');
  console.log('   3. Restart the server');
  process.exit(1);
} else {
  console.log('✅ VERIFICATION PASSED: API key is properly configured');
  process.exit(0);
}
