/**
 * Comprehensive API Test
 * Tests multiple header formats and endpoints
 */

require('dotenv').config();
const axios = require('axios');

const API_KEY = '9f52fbf1-02ae-4b67-96c7-eb164bb292fa';

console.log('\n========================================');
console.log('COMPREHENSIVE API TEST');
console.log('========================================\n');
console.log('API Key:', API_KEY);
console.log('');

async function testEndpoint(url, headers, name) {
  try {
    console.log(`Testing: ${name}`);
    console.log(`URL: ${url}`);
    console.log(`Headers: ${JSON.stringify(Object.keys(headers))}`);
    
    const response = await axios.get(url, { headers, timeout: 10000 });
    console.log(`✅ SUCCESS! Status: ${response.status}`);
    console.log(`Response keys: ${Object.keys(response.data).join(', ')}`);
    if (response.data.data) {
      console.log(`Data type: ${Array.isArray(response.data.data) ? 'Array' : typeof response.data.data}`);
      if (Array.isArray(response.data.data)) {
        console.log(`Items: ${response.data.data.length}`);
      }
    }
    console.log('');
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      console.log(`❌ FAILED! Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`❌ FAILED! ${error.message}`);
    }
    console.log('');
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTests() {
  const results = [];
  
  // Test 1: Direct Highlightly with x-api-key
  results.push(await testEndpoint(
    'https://sports.highlightly.net/v1/football/matches/live',
    { 'x-api-key': API_KEY },
    'Direct Highlightly (x-api-key)'
  ));
  
  // Test 2: Direct Highlightly with X-API-Key (uppercase)
  results.push(await testEndpoint(
    'https://sports.highlightly.net/v1/football/matches/live',
    { 'X-API-Key': API_KEY },
    'Direct Highlightly (X-API-Key uppercase)'
  ));
  
  // Test 3: RapidAPI format
  results.push(await testEndpoint(
    'https://sport-highlights-api.p.rapidapi.com/v1/football/matches/live',
    { 
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'sport-highlights-api.p.rapidapi.com'
    },
    'RapidAPI Format'
  ));
  
  // Test 4: Try /api/v1 path
  results.push(await testEndpoint(
    'https://sports.highlightly.net/api/v1/football/matches/live',
    { 'x-api-key': API_KEY },
    'Direct Highlightly (/api/v1 path)'
  ));
  
  // Test 5: Try /v1/sports path
  results.push(await testEndpoint(
    'https://sports.highlightly.net/v1/sports/football/matches/live',
    { 'x-api-key': API_KEY },
    'Direct Highlightly (/v1/sports path)'
  ));
  
  // Summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Working Configuration:');
    successful.forEach((r, i) => {
      console.log(`   ${i + 1}. Check test ${i + 1} above`);
    });
  }
  
  if (failed.length === results.length) {
    console.log('\n⚠️  All tests failed. Possible issues:');
    console.log('   1. API key might be invalid or expired');
    console.log('   2. API key might need subscription activation');
    console.log('   3. Endpoint paths might be different');
    console.log('   4. API key might be for a different service');
  }
  
  console.log('');
}

runTests().catch(console.error);
