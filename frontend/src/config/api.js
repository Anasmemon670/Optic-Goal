/**
 * Centralized API Configuration
 * 
 * This file centralizes all API-related configuration including:
 * - Base URL
 * - API endpoints
 * - Response status enums
 * - Common request utilities
 */

// API Base URL - can be overridden via environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// API endpoints - all endpoints should start with /api
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
  },
  
  // Admin endpoints
  ADMIN: {
    LOGIN: '/api/admin/login',
    ME: '/api/admin/me',
    STATS: '/api/admin/stats',
    ACTIVITY: '/api/admin/activity',
    USERS: '/api/admin/users',
    PREDICTIONS: '/api/admin/predictions',
    COMMENTS: '/api/admin/comments',
    REPORTS: '/api/admin/reports',
    SETTINGS: '/api/admin/settings',
  },
  
  // Predictions endpoints
  PREDICTIONS: {
    ALL: '/api/predictions/all',
    BANKER: '/api/predictions/banker',
    SURPRISE: '/api/predictions/surprise',
    VIP: '/api/predictions/vip',
    BY_ID: (id) => `/api/predictions/${id}`,
    GENERATE: '/api/predictions/generate',
  },
  
  // Comments endpoints
  COMMENTS: {
    LIST: '/api/comments/list',
    CREATE: '/api/comments/create',
    LIKE: (id) => `/api/comments/${id}/like`,
    REPORT: (id) => `/api/comments/${id}/report`,
    DELETE: (id) => `/api/comments/${id}`,
  },
  
  // VIP endpoints
  VIP: {
    PLANS: '/api/vip/plans',
    CREATE_SESSION: '/api/vip/create-session',
    PAYMENT: '/api/vip/payment',
    ACTIVATE: '/api/vip/activate',
    STATUS: '/api/vip/status',
    VERIFY: '/api/vip/verify',
  },
  
  // Ad Watch endpoints
  AD_WATCH: {
    WATCH: '/api/ads/watch/watch',
    STATUS: '/api/ads/watch/status',
  },
  
  // Referral endpoints
  REFERRAL: {
    CODE: '/api/referral/code',
  },
  
  // User endpoints
  USER: {
    ME: '/api/user/me',
    UPDATE: '/api/user/update',
    CHANGE_PASSWORD: '/api/user/change-password',
    DELETE: '/api/user/delete',
  },
  
  // News endpoints
  NEWS: {
    LIST: '/api/news',
  },
  
  // Settings endpoints (public)
  SETTINGS: {
    PUBLIC: '/api/settings',
  },
  
  // Sports endpoints
  FOOTBALL: {
    LIVE: '/api/football/live',
    UPCOMING: '/api/football/upcoming',
    MATCH: (id) => `/api/football/match/${id}`,
    SPORTSDB_TEAMS: '/api/football/sportsdb/teams',
  },
  BASKETBALL: {
    LIVE: '/api/basketball/live',
    UPCOMING: '/api/basketball/upcoming',
    MATCH: (id) => `/api/basketball/match/${id}`,
    SPORTSDB_TEAMS: '/api/basketball/sportsdb/teams',
  },
  
  // AI Assistant endpoints
  AI: {
    CHAT: '/api/ai/chat',
    PREDICT: '/api/ai/predict',
    ANALYTICS: '/api/ai/analytics',
  },
};

// Response status enums - Shared with backend
// These must match backend/src/utils/status.js
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  FAILED: 'failed',
  PENDING: 'pending',
};

// Operation status for async operations (payments, actions, etc.)
export const OPERATION_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Standard API response structure
export const createApiResponse = (success, data = null, message = '', error = null) => ({
  success,
  data,
  message,
  error,
  timestamp: new Date().toISOString(),
});

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (will be prefixed with API_BASE_URL)
 * @param {Object} options - Fetch options
 * @param {string} options.token - Authentication token (optional)
 * @returns {Promise<Object>} Parsed JSON response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { token, ...fetchOptions } = options;
  
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });
    
    // Check if response is ok before parsing JSON
    const data = await response.json();
    
    if (!response.ok) {
      // Return error response in consistent format
      return createApiResponse(
        false,
        null,
        data.message || `Request failed with status ${response.status}`,
        data.error || data.message
      );
    }
    
    // Return success response in consistent format
    return {
      success: data.success !== undefined ? data.success : true,
      data: data.data !== undefined ? data.data : data,
      message: data.message || '',
      error: data.error || null,
    };
  } catch (error) {
    // Network error or JSON parse error
    console.error('API request error:', error);
    return createApiResponse(
      false,
      null,
      error.message || 'Network error. Please check your connection.',
      error.message
    );
  }
};

/**
 * Make a GET request
 */
export const apiGet = async (endpoint, token = null) => {
  return apiRequest(endpoint, {
    method: 'GET',
    token,
  });
};

/**
 * Make a POST request
 */
export const apiPost = async (endpoint, body, token = null) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
};

/**
 * Make a PUT request
 */
export const apiPut = async (endpoint, body, token = null) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
};

/**
 * Make a DELETE request
 */
export const apiDelete = async (endpoint, token = null) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    token,
  });
};
