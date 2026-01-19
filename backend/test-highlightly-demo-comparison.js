/**
 * Highlightly API Demo Comparison Test
 * 
 * This script tests the exact endpoint from the demo tool:
 * https://highlightly.net/demo
 * Endpoint: /football/bookmakers
 * 
 * Compares our implementation with the demo tool to identify differences
 */

require('dotenv').config();
const axios = require('axios');

const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY;

console.log('\n========================================');
console.log('HIGHLIGHTLY API DEMO COMPARISON TEST');
console.log('========================================\n');

if (!HIGHLIGHTLY_API_KEY) {
  console.error('❌ ERROR: HIGHLIGHTLY_API_KEY not found in environment variables');
  console.error('   Please add HIGHLIGHTLY_API_KEY to .env file');
  process.exit(1);
}

console.log('✅ API Key found:', HIGHLIGHTLY_API_KEY.substring(0, 8) + '...');
console.log('');

// Test different configurations to match demo tool
const testConfigs = [
  {
    name: 'Current Implementation (x-api-key lowercase)',
    baseURL: 'https://sports.highlightly.net',
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  {
    name: 'X-API-Key (capitalized)',
    baseURL: 'https://sports.highlightly.net',
    headers: {
      'X-API-Key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  {
    name: 'X-Api-Key (mixed case)',
    baseURL: 'https://sports.highlightly.net',
    headers: {
      'X-Api-Key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  {
    name: 'Authorization Bearer',
    baseURL: 'https://sports.highlightly.net',
    headers: {
      'Authorization': `Bearer ${HIGHLIGHTLY_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  {
    name: 'Alternative Base URL (api.highlightly.net)',
    baseURL: 'https://api.highlightly.net',
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  {
    name: 'Alternative Base URL (highlightly.net)',
    baseURL: 'https://highlightly.net',
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  {
    name: 'With User-Agent (browser-like)',
    baseURL: 'https://sports.highlightly.net',
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Origin': 'https://highlightly.net',
      'Referer': 'https://highlightly.net/demo',
    },
  },
];

async function testEndpoint(config, endpoint = '/football/bookmakers') {
  try {
    console.log(`\n🧪 Testing: ${config.name}`);
    console.log(`   Base URL: ${config.baseURL}`);
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Headers:`, JSON.stringify(config.headers, null, 2).replace(HIGHLIGHTLY_API_KEY, '***HIDDEN***'));
    
    const response = await axios.get(`${config.baseURL}${endpoint}`, {
      headers: config.headers,
      timeout: 10000,
      validateStatus: (status) => status < 500, // Don't throw on 4xx
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Response:`, JSON.stringify(response.data, null, 2).substring(0, 500));
    
    if (response.status === 200) {
      console.log(`   ✅ SUCCESS! This configuration works!`);
      return { success: true, config, response: response.data };
    } else if (response.status === 403) {
      console.log(`   ❌ 403 Forbidden - Check API key permissions or plan restrictions`);
      return { success: false, status: 403, config };
    } else if (response.status === 401) {
      console.log(`   ❌ 401 Unauthorized - Invalid API key`);
      return { success: false, status: 401, config };
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
      return { success: false, status: response.status, config };
    }
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ Error ${error.response.status}:`, error.response.data);
      return { success: false, status: error.response.status, error: error.response.data, config };
    } else if (error.request) {
      console.log(`   ❌ No response received:`, error.message);
      return { success: false, error: 'NO_RESPONSE', config };
    } else {
      console.log(`   ❌ Request error:`, error.message);
      return { success: false, error: error.message, config };
    }
  }
}

async function runAllTests() {
  const results = [];
  
  // Test the exact demo endpoint
  console.log('\n📋 Testing /football/bookmakers endpoint (from demo tool)');
  console.log('='.repeat(50));
  
  for (const config of testConfigs) {
    const result = await testEndpoint(config, '/football/bookmakers');
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test other common endpoints
  console.log('\n\n📋 Testing other endpoints for comparison');
  console.log('='.repeat(50));
  
  const otherEndpoints = [
    '/api/v1/football/leagues',
    '/v1/football/leagues',
    '/football/leagues',
  ];
  
  // Use the first working config if found
  const workingConfig = results.find(r => r.success);
  if (workingConfig) {
    console.log(`\n✅ Using working configuration: ${workingConfig.config.name}`);
    for (const endpoint of otherEndpoints) {
      await testEndpoint(workingConfig.config, endpoint);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } else {
    // Use first config
    console.log(`\n⚠️  No working config found, using first config`);
    for (const endpoint of otherEndpoints) {
      await testEndpoint(testConfigs[0], endpoint);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('\n\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful configurations: ${successful.length}`);
  successful.forEach(r => {
    console.log(`   • ${r.config.name}`);
  });
  
  console.log(`\n❌ Failed configurations: ${failed.length}`);
  failed.forEach(r => {
    const status = r.status ? ` (Status: ${r.status})` : '';
    console.log(`   • ${r.config.name}${status}`);
  });
  
  if (successful.length > 0) {
    console.log('\n💡 RECOMMENDATION:');
    console.log(`   Use the configuration: "${successful[0].config.name}"`);
    console.log(`   Base URL: ${successful[0].config.baseURL}`);
    console.log(`   Headers: ${JSON.stringify(successful[0].config.headers, null, 2).replace(HIGHLIGHTLY_API_KEY, '***HIDDEN***')}`);
  } else {
    console.log('\n⚠️  WARNING: No working configuration found!');
    console.log('   Possible issues:');
    console.log('   1. API key is invalid or expired');
    console.log('   2. API plan does not include /football/bookmakers endpoint');
    console.log('   3. IP address is blocked');
    console.log('   4. Rate limit exceeded');
    console.log('   5. Base URL is incorrect');
  }
  
  console.log('\n========================================\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
