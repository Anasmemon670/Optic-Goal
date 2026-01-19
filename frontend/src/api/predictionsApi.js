/**
 * Predictions API Client
 * Handles all API calls related to predictions
 */

import { API_ENDPOINTS, apiGet, apiPost } from '../config/api';

/**
 * Get all predictions (non-VIP)
 */
export const getAllPredictions = async (page = 1, limit = 50) => {
  try {
    const endpoint = `${API_ENDPOINTS.PREDICTIONS.ALL}?page=${page}&limit=${limit}`;
    const result = await apiGet(endpoint);
    
    // 🔍 DEBUG: Log raw API response from apiGet
    console.log('[DEBUG predictionsApi.js] Raw result from apiGet:', JSON.stringify(result, null, 2));
    console.log('[DEBUG predictionsApi.js] result.data:', result.data);
    console.log('[DEBUG predictionsApi.js] result.data?.predictions:', result.data?.predictions);
    
    if (!result.success) {
      console.log('[DEBUG predictionsApi.js] API call failed, returning empty');
      return {
        success: false,
        data: { predictions: [] },
        count: 0,
      };
    }
    
    const finalResult = {
      success: true,
      data: result.data || { predictions: [] },
      count: result.data?.count || result.data?.predictions?.length || 0,
    };
    
    // 🔍 DEBUG: Log final result being returned
    console.log('[DEBUG predictionsApi.js] Final result being returned:', JSON.stringify({
      ...finalResult,
      data: {
        ...finalResult.data,
        predictions: finalResult.data.predictions ? `[Array of ${finalResult.data.predictions.length} items]` : 'undefined'
      }
    }, null, 2));
    
    return finalResult;
  } catch (error) {
    console.error('Error fetching all predictions:', error);
    return {
      success: false,
      data: { predictions: [] },
      count: 0,
    };
  }
};

/**
 * Get banker predictions
 */
export const getBankerPredictions = async (page = 1, limit = 50) => {
  try {
    const endpoint = `${API_ENDPOINTS.PREDICTIONS.BANKER}?page=${page}&limit=${limit}`;
    const result = await apiGet(endpoint);
    
    if (!result.success) {
      return {
        success: false,
        data: { predictions: [] },
        count: 0,
      };
    }
    
    return {
      success: true,
      data: result.data || { predictions: [] },
      count: result.data?.count || result.data?.predictions?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching banker predictions:', error);
    return {
      success: false,
      data: { predictions: [] },
      count: 0,
    };
  }
};

/**
 * Get surprise predictions
 */
export const getSurprisePredictions = async (page = 1, limit = 50) => {
  try {
    const endpoint = `${API_ENDPOINTS.PREDICTIONS.SURPRISE}?page=${page}&limit=${limit}`;
    const result = await apiGet(endpoint);
    
    if (!result.success) {
      return {
        success: false,
        data: { predictions: [] },
        count: 0,
      };
    }
    
    return {
      success: true,
      data: result.data || { predictions: [] },
      count: result.data?.count || result.data?.predictions?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching surprise predictions:', error);
    return {
      success: false,
      data: { predictions: [] },
      count: 0,
    };
  }
};

/**
 * Get VIP predictions (requires authentication)
 */
export const getVIPPredictions = async (token, page = 1, limit = 50) => {
  try {
    const endpoint = `${API_ENDPOINTS.PREDICTIONS.VIP}?page=${page}&limit=${limit}`;
    const result = await apiGet(endpoint, token);
    
    if (!result.success) {
      if (result.error && result.error.includes('403')) {
        return {
          success: false,
          data: { predictions: [] },
          count: 0,
          error: 'VIP membership required',
        };
      }
      return {
        success: false,
        data: { predictions: [] },
        count: 0,
        error: result.message || 'Failed to fetch VIP predictions',
      };
    }
    
    return {
      success: true,
      data: result.data || { predictions: [] },
      count: result.data?.count || result.data?.predictions?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching VIP predictions:', error);
    return {
      success: false,
      data: { predictions: [] },
      count: 0,
      error: error.message,
    };
  }
};

/**
 * Get single prediction by ID
 */
export const getPredictionById = async (id, token = null) => {
  try {
    const result = await apiGet(API_ENDPOINTS.PREDICTIONS.BY_ID(id), token);
    
    if (!result.success) {
      return {
        success: false,
        error: result.message || 'Failed to fetch prediction',
      };
    }
    
    return {
      success: true,
      data: result.data || { prediction: null },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate predictions (Admin only)
 */
export const generatePredictions = async (token, date = null) => {
  try {
    const body = date ? { date } : {};
    const result = await apiPost(API_ENDPOINTS.PREDICTIONS.GENERATE, body, token);
    
    if (!result.success) {
      return {
        success: false,
        error: result.message || 'Failed to generate predictions',
      };
    }
    
    return {
      success: true,
      data: result.data,
      error: null,
    };
  } catch (error) {
    console.error('Error generating predictions:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

