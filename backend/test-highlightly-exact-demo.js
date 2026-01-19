/**
 * Highlightly API Exact Demo Replication Test
 * 
 * This script EXACTLY replicates the demo tool's request to identify differences.
 * 
 * Demo Tool: https://highlightly.net/demo
 * Endpoint: /football/bookmakers
 * Expected Response: { "data": [...], "plan": { "message": "All data available with current plan." } }
 * 
 * CRITICAL: If response does NOT include "plan.message", the API is being accessed incorrectly.
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');

const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY;

console.log('\n========================================');
console.log('HIGHLIGHTLY API EXACT DEMO REPLICATION');
console.log('========================================\n');

if (!HIGHLIGHTLY_API_KEY) {
  console.error('❌ ERROR: HIGHLIGHTLY_API_KEY not found in environment variables');
  console.error('   Please add HIGHLIGHTLY_API_KEY to .env file');
  process.exit(1);
}

console.log('✅ API Key loaded:', HIGHLIGHTLY_API_KEY.substring(0, 8) + '...');
console.log('✅ API Key length:', HIGHLIGHTLY_API_KEY.length);
console.log('');

// Test configurations based on demo tool analysis
const testConfigs = [
  // Configuration 1: highlightly.net base URL (most likely based on demo URL)
  {
    name: 'Demo Base URL (highlightly.net) - x-api-key lowercase',
    baseURL: 'https://highlightly.net',
    endpoint: '/football/bookmakers',
    method: 'GET',
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'Accept': 'application/json',
    },
  },
  {
    name: 'Demo Base URL (highlightly.net) - X-API-Key capitalized',
    baseURL: 'https://highlightly.net',
    endpoint: '/football/bookmakers',
    method: 'GET',
    headers: {
      'X-API-Key': HIGHLIGHTLY_API_KEY,
      'Accept': 'application/json',
    },
  },
  // Configuration 2: api.highlightly.net (common API subdomain pattern)
  {
    name: 'API Subdomain (api.highlightly.net) - x-api-key',
    baseURL: 'https://api.highlightly.net',
    endpoint: '/football/bookmakers',
    method: 'GET',
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'Accept': 'application/json',
    },
  },
  // Configuration 3: Current backend implementation
  {
    name: 'Current Backend (sports.highlightly.net) - x-api-key',
    baseURL: 'https://sports.highlightly.net',
    endpoint: '/football/bookmakers',
    method: 'GET',
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  // Configuration 4: With version prefix (if needed)
  {
    name: 'With /api prefix (highlightly.net/api)',
    baseURL: 'https://highlightly.net',
    endpoint: '/api/football/bookmakers',
    method: 'GET',
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'Accept': 'application/json',
    },
  },
  // Configuration 5: Browser-like headers (demo tool might send these)
  {
    name: 'Browser-like Headers (highlightly.net)',
    baseURL: 'https://highlightly.net',
    endpoint: '/football/bookmakers',
    method: 'GET',
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://highlightly.net',
      'Referer': 'https://highlightly.net/demo',
    },
  },
];

/**
 * Test a specific configuration
 */
async function testConfiguration(config) {
  const fullURL = `${config.baseURL}${config.endpoint}`;
  
  console.log(`\n🧪 Testing: ${config.name}`);
  console.log(`   Full URL: ${fullURL}`);
  console.log(`   Method: ${config.method}`);
  console.log(`   Headers:`, JSON.stringify(config.headers, null, 2).replace(HIGHLIGHTLY_API_KEY, '***HIDDEN***'));
  
  try {
    const response = await axios({
      method: config.method,
      url: fullURL,
      headers: config.headers,
      timeout: 15000,
      validateStatus: () => true, // Don't throw on any status
      httpsAgent: new https.Agent({
        rejectUnauthorized: true,
      }),
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    // Check response structure
    const hasData = response.data && typeof response.data === 'object';
    const hasPlanMessage = hasData && response.data.plan && response.data.plan.message;
    const planMessage = hasPlanMessage ? response.data.plan.message : null;
    
    if (response.status === 200) {
      console.log(`   ✅ HTTP 200 OK`);
      
      if (hasPlanMessage) {
        console.log(`   ✅ Plan Message Found: "${planMessage}"`);
        
        if (planMessage.includes('All data available')) {
          console.log(`   ✅✅✅ SUCCESS! This configuration works correctly!`);
          console.log(`   ✅ Response structure matches demo tool`);
          return {
            success: true,
            correct: true,
            config,
            response: response.data,
            planMessage,
          };
        } else {
          console.log(`   ⚠️  Plan message indicates restrictions: "${planMessage}"`);
          return {
            success: true,
            correct: false,
            config,
            response: response.data,
            planMessage,
          };
        }
      } else {
        console.log(`   ⚠️  Response missing 'plan.message' - API accessed incorrectly!`);
        console.log(`   📊 Response structure:`, JSON.stringify(response.data, null, 2).substring(0, 500));
        return {
          success: true,
          correct: false,
          config,
          response: response.data,
          planMessage: null,
          issue: 'Missing plan.message in response',
        };
      }
    } else if (response.status === 403) {
      console.log(`   ❌ 403 Forbidden`);
      console.log(`   📊 Response:`, JSON.stringify(response.data, null, 2).substring(0, 300));
      return {
        success: false,
        status: 403,
        config,
        error: response.data,
      };
    } else if (response.status === 401) {
      console.log(`   ❌ 401 Unauthorized - Invalid API key`);
      return {
        success: false,
        status: 401,
        config,
        error: response.data,
      };
    } else if (response.status === 404) {
      console.log(`   ❌ 404 Not Found - Endpoint does not exist`);
      return {
        success: false,
        status: 404,
        config,
        error: response.data,
      };
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
      console.log(`   📊 Response:`, JSON.stringify(response.data, null, 2).substring(0, 300));
      return {
        success: false,
        status: response.status,
        config,
        error: response.data,
      };
    }
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ Error ${error.response.status}:`, error.response.data);
      return {
        success: false,
        status: error.response.status,
        config,
        error: error.response.data,
      };
    } else if (error.request) {
      console.log(`   ❌ No response received:`, error.message);
      return {
        success: false,
        error: 'NO_RESPONSE',
        config,
        message: error.message,
      };
    } else {
      console.log(`   ❌ Request error:`, error.message);
      return {
        success: false,
        error: error.message,
        config,
      };
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  const results = [];
  
  console.log('📋 Testing /football/bookmakers endpoint (exact demo tool endpoint)');
  console.log('='.repeat(70));
  
  for (const config of testConfigs) {
    const result = await testConfiguration(config);
    results.push(result);
    
    // Delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Analysis
  console.log('\n\n========================================');
  console.log('ANALYSIS & RECOMMENDATIONS');
  console.log('========================================\n');
  
  const correctConfigs = results.filter(r => r.success && r.correct);
  const incorrectConfigs = results.filter(r => r.success && !r.correct);
  const failedConfigs = results.filter(r => !r.success);
  
  if (correctConfigs.length > 0) {
    console.log('✅ CORRECT CONFIGURATIONS FOUND:');
    correctConfigs.forEach(r => {
      console.log(`\n   Configuration: ${r.config.name}`);
      console.log(`   Base URL: ${r.config.baseURL}`);
      console.log(`   Endpoint: ${r.config.endpoint}`);
      console.log(`   Headers:`, JSON.stringify(r.config.headers, null, 2).replace(HIGHLIGHTLY_API_KEY, '***HIDDEN***'));
      console.log(`   Plan Message: "${r.planMessage}"`);
      console.log(`   ✅ This matches the demo tool exactly!`);
    });
    
    console.log('\n💡 RECOMMENDATION:');
    const bestConfig = correctConfigs[0];
    console.log(`   Use this configuration in backend:`);
    console.log(`   Base URL: ${bestConfig.config.baseURL}`);
    console.log(`   Header Format: ${Object.keys(bestConfig.config.headers).find(k => k.toLowerCase().includes('api'))}`);
    console.log(`   Endpoint Pattern: ${bestConfig.config.endpoint.replace('/football/bookmakers', '/{sport}/{endpoint}')}`);
  } else {
    console.log('❌ NO CORRECT CONFIGURATIONS FOUND');
    
    if (incorrectConfigs.length > 0) {
      console.log('\n⚠️  Configurations that returned 200 but missing plan.message:');
      incorrectConfigs.forEach(r => {
        console.log(`   • ${r.config.name} - ${r.issue || 'Missing plan.message'}`);
      });
    }
    
    if (failedConfigs.length > 0) {
      console.log('\n❌ Failed configurations:');
      failedConfigs.forEach(r => {
        const status = r.status ? ` (Status: ${r.status})` : '';
        console.log(`   • ${r.config.name}${status}`);
      });
    }
    
    console.log('\n🔍 TROUBLESHOOTING:');
    console.log('   1. Verify API key is correct and active');
    console.log('   2. Check API plan includes /football/bookmakers endpoint');
    console.log('   3. Verify IP address is not blocked');
    console.log('   4. Check rate limits');
    console.log('   5. Contact API provider to confirm base URL and header format');
  }
  
  console.log('\n========================================\n');
  
  return results;
}

// Run tests
runTests()
  .then(results => {
    const correct = results.find(r => r.success && r.correct);
    if (correct) {
      console.log('✅ Test complete. Correct configuration identified.');
      process.exit(0);
    } else {
      console.log('⚠️  Test complete. No correct configuration found.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
