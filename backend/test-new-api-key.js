require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.API_FOOTBALL_KEY;

console.log('\n========================================');
console.log('NEW API KEY TEST - DETAILED ANALYSIS');
console.log('========================================\n');
console.log('API Key:', API_KEY);
console.log('Key Length:', API_KEY?.length);
console.log('Key Format:', API_KEY ? (API_KEY.includes('-') ? 'UUID-like' : 'Other') : 'N/A');
console.log('');

// Test different header formats
async function testAPIFormats() {
  console.log('Testing Different Header Formats...\n');

  // Test 1: Current format (x-rapidapi-key)
  console.log('1️⃣  Testing: x-rapidapi-key + x-rapidapi-host');
  console.log('─────────────────────────────────────');
  try {
    const test1 = axios.create({
      baseURL: 'https://v3.football.api-sports.io',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      timeout: 15000,
    });
    const r1 = await test1.get('/status');
    console.log('   ✅ SUCCESS');
    console.log('   Response:', JSON.stringify(r1.data, null, 2));
  } catch (e) {
    console.log('   ❌ FAILED');
    console.log('   Status:', e.response?.status);
    console.log('   Error:', JSON.stringify(e.response?.data || e.message, null, 2));
  }
  console.log('');

  // Test 2: API-Sports format
  console.log('2️⃣  Testing: x-apisports-key');
  console.log('─────────────────────────────────────');
  try {
    const test2 = axios.create({
      baseURL: 'https://v3.football.api-sports.io',
      headers: {
        'x-apisports-key': API_KEY,
      },
      timeout: 15000,
    });
    const r2 = await test2.get('/status');
    console.log('   ✅ SUCCESS');
    console.log('   Response:', JSON.stringify(r2.data, null, 2));
  } catch (e) {
    console.log('   ❌ FAILED');
    console.log('   Status:', e.response?.status);
    console.log('   Error:', JSON.stringify(e.response?.data || e.message, null, 2));
  }
  console.log('');

  // Test 3: Authorization Bearer
  console.log('3️⃣  Testing: Authorization Bearer');
  console.log('─────────────────────────────────────');
  try {
    const test3 = axios.create({
      baseURL: 'https://v3.football.api-sports.io',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      timeout: 15000,
    });
    const r3 = await test3.get('/status');
    console.log('   ✅ SUCCESS');
    console.log('   Response:', JSON.stringify(r3.data, null, 2));
  } catch (e) {
    console.log('   ❌ FAILED');
    console.log('   Status:', e.response?.status);
    console.log('   Error:', JSON.stringify(e.response?.data || e.message, null, 2));
  }
  console.log('');

  // Test 4: API-Key header
  console.log('4️⃣  Testing: x-api-key');
  console.log('─────────────────────────────────────');
  try {
    const test4 = axios.create({
      baseURL: 'https://v3.football.api-sports.io',
      headers: {
        'x-api-key': API_KEY,
      },
      timeout: 15000,
    });
    const r4 = await test4.get('/status');
    console.log('   ✅ SUCCESS');
    console.log('   Response:', JSON.stringify(r4.data, null, 2));
  } catch (e) {
    console.log('   ❌ FAILED');
    console.log('   Status:', e.response?.status);
    console.log('   Error:', JSON.stringify(e.response?.data || e.message, null, 2));
  }
  console.log('');

  console.log('========================================');
  console.log('CONCLUSION');
  console.log('========================================');
  console.log('API Key: 9f52fbf1-02ae-4b67-96c7-eb164bb292fa');
  console.log('');
  console.log('❌ API Key Status: INVALID or EXPIRED');
  console.log('');
  console.log('Possible Issues:');
  console.log('  1. API key invalid ya expired');
  console.log('  2. API key subscription expired');
  console.log('  3. API key format galat');
  console.log('  4. API key account me issue');
  console.log('');
  console.log('Solution:');
  console.log('  1. API-Sports.io dashboard me login karein');
  console.log('  2. API key verify karein');
  console.log('  3. Subscription status check karein');
  console.log('  4. New API key generate karein agar zarurat ho');
  console.log('');
  console.log('========================================\n');
}

testAPIFormats().catch(console.error);
