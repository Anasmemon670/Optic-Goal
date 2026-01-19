/**
 * Authentication Utility Functions
 * Handles all authentication-related API calls and token management
 */

import { API_BASE_URL, API_ENDPOINTS, apiPost, apiGet } from '../config/api';

/**
 * Get stored token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Get stored user from localStorage
 * Returns full user object including role
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    // Ensure role is included
    return user;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Save authentication data to localStorage
 * Ensures role and isVIP are properly stored
 */
export const saveAuth = (token, user) => {
  localStorage.setItem('token', token);
  // Ensure role and isVIP are included when saving
  const userData = {
    ...user,
    role: user.role || 'user', // Default to 'user' if role is missing
    isVIP: user.isVIP || false, // Ensure isVIP is boolean
  };
  localStorage.setItem('user', JSON.stringify(userData));
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Check if user is admin
 */
export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'admin';
};

/**
 * Check if user is VIP
 */
export const isVIP = () => {
  const user = getUser();
  if (!user?.isVIP) return false;

  // Check if VIP is still active (not expired)
  if (user.vipExpiryDate) {
    const expiryDate = new Date(user.vipExpiryDate);
    return expiryDate > new Date();
  }

  return user.isVIP || false;
};

/**
 * Register a new user
 * Accepts: name, email, password
 */
export const register = async (name, email, password) => {
  try {
    const result = await apiPost(API_ENDPOINTS.AUTH.REGISTER, {
      name,
      email,
      password
    });

    if (!result.success) {
      throw new Error(result.message || 'Registration failed. Please try again.');
    }

    // Backend returns data in data.data structure
    const data = result.data || {};
    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    // Handle network errors
    if (error.message === 'Failed to fetch' || error.message.includes('fetch') || error.message.includes('Network error')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
};

/**
 * Login user
 * Accepts: email, password
 */
export const login = async (email, password) => {
  try {
    const result = await apiPost(API_ENDPOINTS.AUTH.LOGIN, { email, password });

    if (!result.success) {
      const errorMsg = result.message || 'Invalid email or password';
      if (result.error && result.error.includes('401')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw new Error(errorMsg);
    }

    // Backend returns data in data.data structure
    const data = result.data || {};
    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    // Handle network errors
    if (error.message === 'Failed to fetch' || error.message.includes('fetch') || error.message.includes('Network error')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
};

/**
 * Verify current session with backend
 */
export const verifySession = async () => {
  try {
    const token = getToken();
    if (!token) {
      return { authenticated: false, user: null };
    }

    const result = await apiGet(API_ENDPOINTS.AUTH.ME, token);

    if (!result.success) {
      // Token might be invalid, but don't clear it immediately
      // Let the App.jsx fallback to localStorage handle it
      console.warn('Session verification failed, using cached credentials');
      return { authenticated: false, user: null };
    }

    // Update stored user data
    const user = result.data?.user || result.data;
    if (user) {
      saveAuth(token, user);
    }

    return {
      authenticated: true,
      user: user || null,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    // Don't clear auth on network errors - preserve session
    console.warn('Network error during verification, using cached credentials');
    return { authenticated: false, user: null };
  }
};

/**
 * Admin Login
 * Authenticates admin using separate admin endpoint
 * POST /api/admin/login
 */
export const adminLogin = async (email, password) => {
  try {
    const result = await apiPost(API_ENDPOINTS.ADMIN.LOGIN, { email, password });

    if (!result.success) {
      const errorMsg = result.message || 'Invalid admin credentials';
      if (result.error && result.error.includes('401')) {
        throw new Error('Invalid admin credentials');
      }
      throw new Error(errorMsg);
    }

    // Backend returns { success: true, token, ... }
    // Create user object with admin role
    const user = {
      email: email,
      role: 'admin',
    };

    // Handle both response formats: { token } or { data: { token } }
    const data = result.data || {};
    const token = data.token || result.token;

    if (!token) {
      throw new Error('Token not received from server');
    }

    return {
      success: true,
      token: token,
      user: user,
    };
  } catch (error) {
    // Handle network errors
    if (error.message === 'Failed to fetch' || error.message.includes('fetch') || error.message.includes('Network error')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
};

/**
 * Make authenticated API request
 * @deprecated Use apiRequest from config/api.js instead
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();
  const { apiRequest } = await import('../config/api');
  return apiRequest(url, { ...options, token });
};

