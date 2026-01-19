/**
 * End-to-End Authentication & Admin System Test Script
 * 
 * This script performs automated verification of:
 * - User registration and login
 * - Admin login
 * - Token-based authentication
 * - Role-based access control
 * - VIP user management
 * 
 * How to run:
 *   ADMIN_EMAIL=sameer123@gmail.com ADMIN_PASSWORD='3219090@' TEST_BASE=http://localhost:5000 node test_auth.js
 * 
 * Or with default values:
 *   node test_auth.js
 * 
 * Note: This script is for local testing only.
 * Make sure your backend server is running before executing this script.
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const BASE = process.env.TEST_BASE || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sameer123@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '3219090@';

// Test data
const TEST_USER = {
  name: 'Test User',
  email: `test.user+auth@test.com`,
  password: 'TestPass123!'
};

// Storage for tokens and IDs
let userToken = null;
let adminToken = null;
let userId = null;

// Helper function to decode JWT token
function decodeToken(token) {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');
    // Decode without verification (we just want to read the payload)
    return jwt.decode(cleanToken);
  } catch (error) {
    return null;
  }
}

// Helper function to print step results
function printStep(stepNum, action, status, message, details = '') {
  const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
  const passFail = status >= 200 && status < 300 ? 'PASS' : 'FAIL';
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`STEP ${stepNum}: ${action}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Status: ${statusIcon} HTTP ${status}`);
  console.log(`Result: ${passFail}`);
  console.log(`Message: ${message}`);
  if (details) {
    console.log(`Details: ${details}`);
  }
}

// Helper function to handle errors
function handleError(stepNum, action, error) {
  if (error.response) {
    // Server responded with error
    printStep(
      stepNum,
      action,
      error.response.status,
      error.response.data?.message || 'Request failed',
      JSON.stringify(error.response.data, null, 2)
    );
  } else if (error.request) {
    // Request made but no response
    printStep(stepNum, action, 0, 'No response from server', error.message);
  } else {
    // Error setting up request
    printStep(stepNum, action, 0, 'Request setup error', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('\n🚀 Starting Authentication & Admin System Tests');
  console.log(`📍 Base URL: ${BASE}`);
  console.log(`👤 Admin Email: ${ADMIN_EMAIL}`);
  console.log(`\n${'='.repeat(60)}\n`);

  // STEP 1: Register a new user
  try {
    console.log('STEP 1: Registering new user...');
    const registerResponse = await axios.post(`${BASE}/api/auth/register`, {
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (registerResponse.status === 201 || registerResponse.status === 200) {
      const data = registerResponse.data;
      if (data.success && data.token && data.user) {
        userToken = data.token;
        userId = data.user.id;
        printStep(
          1,
          'Register User',
          registerResponse.status,
          'User registered successfully',
          `User ID: ${userId}, Name: ${data.user.name}, Email: ${data.user.email}, Role: ${data.user.role}`
        );
      } else {
        printStep(1, 'Register User', registerResponse.status, 'Unexpected response format', JSON.stringify(data, null, 2));
      }
    } else {
      printStep(1, 'Register User', registerResponse.status, 'Registration failed', JSON.stringify(registerResponse.data, null, 2));
    }
  } catch (error) {
    handleError(1, 'Register User', error);
  }

  // STEP 2: Login the same user
  try {
    console.log('\nSTEP 2: Logging in user...');
    const loginResponse = await axios.post(`${BASE}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (loginResponse.status === 200) {
      const data = loginResponse.data;
      if (data.success && data.token && data.user) {
        userToken = data.token;
        
        // Decode token to verify role and isVIP
        const decoded = decodeToken(userToken);
        const hasUserRole = decoded && decoded.role === 'user';
        const hasIsVIP = decoded && typeof decoded.isVIP === 'boolean';
        
        let tokenDetails = '';
        if (decoded) {
          tokenDetails = `Token payload: { userId: ${decoded.userId}, role: ${decoded.role}, isVIP: ${decoded.isVIP} }`;
        }
        
        if (hasUserRole && hasIsVIP) {
          printStep(
            2,
            'Login User',
            loginResponse.status,
            'User logged in successfully, token verified',
            tokenDetails
          );
        } else {
          printStep(
            2,
            'Login User',
            loginResponse.status,
            'Login successful but token verification failed',
            `Expected role: "user", isVIP: boolean. Got: ${JSON.stringify(decoded)}`
          );
        }
      } else {
        printStep(2, 'Login User', loginResponse.status, 'Unexpected response format', JSON.stringify(data, null, 2));
      }
    } else {
      printStep(2, 'Login User', loginResponse.status, 'Login failed', JSON.stringify(loginResponse.data, null, 2));
    }
  } catch (error) {
    handleError(2, 'Login User', error);
  }

  // STEP 3: Admin login
  try {
    console.log('\nSTEP 3: Logging in as admin...');
    const adminLoginResponse = await axios.post(`${BASE}/api/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (adminLoginResponse.status === 200) {
      const data = adminLoginResponse.data;
      if (data.success && data.token) {
        adminToken = data.token;
        
        // Decode token to verify role
        const decoded = decodeToken(adminToken);
        const hasAdminRole = decoded && decoded.role === 'admin';
        
        let tokenDetails = '';
        if (decoded) {
          tokenDetails = `Token payload: { userId: ${decoded.userId}, role: ${decoded.role} }`;
        }
        
        if (hasAdminRole) {
          printStep(
            3,
            'Admin Login',
            adminLoginResponse.status,
            'Admin logged in successfully, token verified',
            tokenDetails
          );
        } else {
          printStep(
            3,
            'Admin Login',
            adminLoginResponse.status,
            'Login successful but token verification failed',
            `Expected role: "admin". Got: ${JSON.stringify(decoded)}`
          );
        }
      } else {
        printStep(3, 'Admin Login', adminLoginResponse.status, 'Unexpected response format', JSON.stringify(data, null, 2));
      }
    } else {
      printStep(3, 'Admin Login', adminLoginResponse.status, 'Admin login failed', JSON.stringify(adminLoginResponse.data, null, 2));
    }
  } catch (error) {
    handleError(3, 'Admin Login', error);
  }

  // STEP 4: Call protected admin endpoint with admin token
  try {
    console.log('\nSTEP 4: Calling protected admin endpoint with admin token...');
    if (!adminToken) {
      printStep(4, 'Admin Endpoint (Admin Token)', 0, 'SKIPPED - No admin token available', '');
    } else {
      const statsResponse = await axios.get(`${BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (statsResponse.status === 200) {
        const data = statsResponse.data;
        if (data.success && data.data) {
          const stats = data.data;
          printStep(
            4,
            'Admin Endpoint (Admin Token)',
            statsResponse.status,
            'Admin endpoint accessible with admin token',
            `Stats: { totalUsers: ${stats.totalUsers}, vipUsers: ${stats.vipUsers}, totalPredictions: ${stats.totalPredictions}, totalComments: ${stats.totalComments}, totalReports: ${stats.totalReports} }`
          );
        } else {
          printStep(4, 'Admin Endpoint (Admin Token)', statsResponse.status, 'Unexpected response format', JSON.stringify(data, null, 2));
        }
      } else {
        printStep(4, 'Admin Endpoint (Admin Token)', statsResponse.status, 'Request failed', JSON.stringify(statsResponse.data, null, 2));
      }
    }
  } catch (error) {
    handleError(4, 'Admin Endpoint (Admin Token)', error);
  }

  // STEP 5: Try admin endpoint with user token (should be forbidden)
  try {
    console.log('\nSTEP 5: Attempting admin endpoint with user token (should fail)...');
    if (!userToken) {
      printStep(5, 'Admin Endpoint (User Token)', 0, 'SKIPPED - No user token available', '');
    } else {
      try {
        const statsResponse = await axios.get(`${BASE}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        // If we get here, the request succeeded (which is bad)
        printStep(
          5,
          'Admin Endpoint (User Token)',
          statsResponse.status,
          'FAIL - User token was accepted (should be rejected)',
          'Expected 403 or 401, but got successful response'
        );
      } catch (error) {
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
          printStep(
            5,
            'Admin Endpoint (User Token)',
            error.response.status,
            'PASS - User token correctly rejected',
            `Response: ${error.response.data?.message || 'Forbidden/Unauthorized'}`
          );
        } else {
          handleError(5, 'Admin Endpoint (User Token)', error);
        }
      }
    }
  } catch (error) {
    handleError(5, 'Admin Endpoint (User Token)', error);
  }

  // STEP 6: Call user-protected route with user token
  try {
    console.log('\nSTEP 6: Calling user-protected route with user token...');
    if (!userToken) {
      printStep(6, 'User Endpoint (User Token)', 0, 'SKIPPED - No user token available', '');
    } else {
      const meResponse = await axios.get(`${BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (meResponse.status === 200) {
        const data = meResponse.data;
        if (data.success && data.data && data.data.user) {
          const user = data.data.user;
          printStep(
            6,
            'User Endpoint (User Token)',
            meResponse.status,
            'User endpoint accessible with user token',
            `User: { id: ${user.id}, name: ${user.name}, email: ${user.email}, role: ${user.role}, isVIP: ${user.isVIP} }`
          );
        } else {
          printStep(6, 'User Endpoint (User Token)', meResponse.status, 'Unexpected response format', JSON.stringify(data, null, 2));
        }
      } else {
        printStep(6, 'User Endpoint (User Token)', meResponse.status, 'Request failed', JSON.stringify(meResponse.data, null, 2));
      }
    }
  } catch (error) {
    handleError(6, 'User Endpoint (User Token)', error);
  }

  // STEP 7: Set user as VIP via admin
  try {
    console.log('\nSTEP 7: Setting user as VIP via admin...');
    if (!adminToken || !userId) {
      printStep(7, 'Set User VIP', 0, 'SKIPPED - Missing admin token or user ID', '');
    } else {
      // Calculate VIP expiry date (30 days from now)
      const vipExpiry = new Date();
      vipExpiry.setDate(vipExpiry.getDate() + 30);
      const vipExpiryISO = vipExpiry.toISOString();

      const updateResponse = await axios.put(
        `${BASE}/api/admin/users/${userId}`,
        {
          isVIP: true,
          vipExpiry: vipExpiryISO
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (updateResponse.status === 200) {
        const data = updateResponse.data;
        if (data.success && data.data && data.data.user) {
          const user = data.data.user;
          printStep(
            7,
            'Set User VIP',
            updateResponse.status,
            'User VIP status updated successfully',
            `User: { id: ${user._id || user.id}, isVIP: ${user.isVIP}, vipExpiry: ${user.vipExpiry || user.vipExpiryDate} }`
          );

          // Verify VIP status by getting user profile
          try {
            console.log('\nSTEP 7b: Verifying VIP status...');
            const verifyResponse = await axios.get(`${BASE}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${userToken}`
              }
            });

            if (verifyResponse.status === 200) {
              const verifyData = verifyResponse.data;
              if (verifyData.success && verifyData.data && verifyData.data.user) {
                const verifiedUser = verifyData.data.user;
                if (verifiedUser.isVIP === true) {
                  printStep(
                    '7b',
                    'Verify VIP Status',
                    verifyResponse.status,
                    'VIP status verified successfully',
                    `User isVIP: ${verifiedUser.isVIP}, vipExpiry: ${verifiedUser.vipExpiry}`
                  );
                } else {
                  printStep(
                    '7b',
                    'Verify VIP Status',
                    verifyResponse.status,
                    'VIP status not reflected in user profile',
                    `Expected isVIP: true, got: ${verifiedUser.isVIP}`
                  );
                }
              }
            }
          } catch (error) {
            console.log('\n⚠️  Could not verify VIP status:', error.message);
          }
        } else {
          printStep(7, 'Set User VIP', updateResponse.status, 'Unexpected response format', JSON.stringify(data, null, 2));
        }
      } else {
        printStep(7, 'Set User VIP', updateResponse.status, 'Update failed', JSON.stringify(updateResponse.data, null, 2));
      }
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      printStep(7, 'Set User VIP', 404, 'SKIPPED - User update endpoint not found', 'This is optional functionality');
    } else {
      handleError(7, 'Set User VIP', error);
    }
  }

  // STEP 8: Cleanup (optional - delete test user)
  try {
    console.log('\nSTEP 8: Cleaning up test user (optional)...');
    if (!adminToken || !userId) {
      printStep(8, 'Cleanup', 0, 'SKIPPED - Missing admin token or user ID', '');
    } else {
      const deleteResponse = await axios.delete(
        `${BASE}/api/admin/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      if (deleteResponse.status === 200) {
        printStep(8, 'Cleanup', deleteResponse.status, 'Test user deleted successfully', '');
      } else {
        printStep(8, 'Cleanup', deleteResponse.status, 'Delete failed (non-critical)', JSON.stringify(deleteResponse.data, null, 2));
      }
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      printStep(8, 'Cleanup', 404, 'SKIPPED - User delete endpoint not found', 'This is optional functionality');
    } else {
      // Cleanup failures are non-critical, just log
      console.log('\n⚠️  Cleanup failed (non-critical):', error.message);
    }
  }

  // Final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Tests completed`);
  console.log(`📍 Base URL: ${BASE}`);
  console.log(`👤 Test User: ${TEST_USER.email}`);
  console.log(`🔑 User Token: ${userToken ? '✓ Available' : '✗ Missing'}`);
  console.log(`🔑 Admin Token: ${adminToken ? '✓ Available' : '✗ Missing'}`);
  console.log(`\n${'='.repeat(60)}\n`);
}

// Run tests
runTests()
  .then(() => {
    console.log('✨ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });

