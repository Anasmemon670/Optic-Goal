/**
 * Comments API Client
 * Handles all API calls related to comments
 */

import { API_ENDPOINTS, apiPost, apiGet, apiDelete } from '../config/api';

/**
 * Create a new comment
 * @param {String} message - The comment message
 * @param {String} matchId - Optional match ID
 * @param {String} token - User authentication token
 * @returns {Promise<Object>}
 */
export const createComment = async (message, matchId = null, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }

    const result = await apiPost(API_ENDPOINTS.COMMENTS.CREATE, { message, matchId }, token);

    if (!result.success) {
      return {
        success: false,
        isSpam: result.message?.toLowerCase().includes('spam') || false,
        message: result.message || 'Failed to create comment',
        comment: null,
      };
    }

    return {
      success: true,
      isSpam: false,
      message: result.message || 'Comment created successfully',
      comment: result.data?.comment || result.data,
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    return {
      success: false,
      isSpam: false,
      message: error.message || 'Failed to create comment',
      comment: null,
    };
  }
};

/**
 * Get comments list
 * @param {String} matchId - Optional match ID to filter comments
 * @param {Number} limit - Number of comments to fetch
 * @returns {Promise<Object>}
 */
export const getComments = async (matchId = null, limit = 50) => {
  try {
    const params = new URLSearchParams();
    if (matchId) {
      params.append('matchId', matchId);
    }
    params.append('limit', limit.toString());

    const endpoint = `${API_ENDPOINTS.COMMENTS.LIST}?${params.toString()}`;
    const result = await apiGet(endpoint);

    if (!result.success) {
      return {
        success: false,
        data: { comments: [] },
        count: 0,
      };
    }

    return {
      success: true,
      data: result.data || { comments: [] },
      count: result.data?.count || result.data?.comments?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return {
      success: false,
      data: { comments: [] },
      count: 0,
    };
  }
};

/**
 * Get admin comments (admin only)
 * @param {String} token - Admin authentication token
 * @param {Object} options - Query options (page, limit, search, filter)
 * @returns {Promise<Object>}
 */
export const getAdminComments = async (token, options = {}) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }

    const { page = 1, limit = 50, search = '', filter = '' } = options;

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (filter) params.append('filter', filter);

    const endpoint = `${API_ENDPOINTS.ADMIN.COMMENTS}?${params.toString()}`;
    const result = await apiGet(endpoint, token);

    if (!result.success) {
      return {
        success: false,
        data: { comments: [] },
        count: 0,
      };
    }

    return {
      success: true,
      data: result.data || { comments: [] },
      count: result.data?.count || result.data?.comments?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching admin comments:', error);
    return {
      success: false,
      data: { comments: [] },
      count: 0,
    };
  }
};

/**
 * Delete a comment (admin only)
 * @param {String} id - Comment ID
 * @param {String} token - Admin authentication token
 * @returns {Promise<Object>}
 */
export const deleteComment = async (id, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }

    const result = await apiDelete(API_ENDPOINTS.COMMENTS.DELETE(id), token);

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to delete comment',
      };
    }

    return {
      success: true,
      message: result.message || 'Comment deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete comment',
    };
  }
};

/**
 * Delete a comment from admin panel (admin only)
 * @param {String} id - Comment ID
 * @param {String} token - Admin authentication token
 * @returns {Promise<Object>}
 */
export const adminDeleteComment = async (id, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }

    const result = await apiDelete(`${API_ENDPOINTS.ADMIN.COMMENTS}/${id}`, token);

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to delete comment',
      };
    }

    return {
      success: true,
      message: result.message || 'Comment deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete comment',
    };
  }
};

/**
 * Get admin comments (alias for getAdminComments)
 * @param {String} token - Admin authentication token
 * @param {Object} options - Query options (page, limit, search, filter)
 * @returns {Promise<Object>}
 */
export const adminGetComments = async (token, options = {}) => {
  return getAdminComments(token, options);
};

/**
 * Like or unlike a comment
 * @param {String} id - Comment ID
 * @param {String} token - User authentication token
 * @returns {Promise<Object>}
 */
export const likeComment = async (id, token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    if (!id) {
      return {
        success: false,
        message: 'Comment ID is required',
      };
    }

    const result = await apiPost(API_ENDPOINTS.COMMENTS.LIKE(id), {}, token);

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to like comment',
        error: result.error || result.message,
      };
    }

    return {
      success: true,
      ...result.data,
      message: result.message,
    };
  } catch (error) {
    console.error('Error liking comment:', error);
    return {
      success: false,
      message: error.message || 'Failed to like comment',
      error: error.message,
    };
  }
};

/**
 * Report a comment
 * @param {String} id - Comment ID
 * @param {String} token - User authentication token
 * @returns {Promise<Object>}
 */
export const reportComment = async (id, token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    if (!id) {
      return {
        success: false,
        message: 'Comment ID is required',
      };
    }

    const result = await apiPost(API_ENDPOINTS.COMMENTS.REPORT(id), {}, token);

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to report comment',
        error: result.error || result.message,
      };
    }

    return {
      success: true,
      ...result.data,
      message: result.message,
    };
  } catch (error) {
    console.error('Error reporting comment:', error);
    return {
      success: false,
      message: error.message || 'Failed to report comment',
      error: error.message,
    };
  }
};

