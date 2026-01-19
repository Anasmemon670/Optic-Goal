/**
 * Admin API Utility Functions
 * Handles all admin-related API calls with authentication
 */

import { Users, Crown, Target, MessageSquare, FileText, Activity } from 'lucide-react';
import { API_ENDPOINTS, apiGet, apiPost, apiPut, apiDelete } from '../config/api';

/**
 * Get admin token from localStorage
 */
const getAdminToken = () => {
  return localStorage.getItem('token');
};

/**
 * Make authenticated admin API request
 */
const adminFetch = async (endpoint, options = {}) => {
  const token = getAdminToken();
  
  if (!token) {
    throw new Error('Admin authentication required');
  }

  const { method = 'GET', body } = options;
  // If endpoint already starts with /api/admin, use it as-is, otherwise prepend /api/admin
  const fullEndpoint = endpoint.startsWith('/api/admin') ? endpoint : `/api/admin${endpoint}`;
  
  let result;
  switch (method) {
    case 'POST':
      result = await apiPost(fullEndpoint, body, token);
      break;
    case 'PUT':
      result = await apiPut(fullEndpoint, body, token);
      break;
    case 'DELETE':
      result = await apiDelete(fullEndpoint, token);
      break;
    default:
      result = await apiGet(fullEndpoint, token);
  }

  if (!result.success) {
    throw new Error(result.message || 'Request failed');
  }

  return result;
};

/**
 * Dashboard Stats
 */
export const getDashboardStats = async () => {
  const data = await adminFetch('/stats');
  // Transform to UI format
  const stats = [
    {
      id: 'totalUsers',
      label: 'Total Users',
      value: data.data?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      positive: true,
    },
    {
      id: 'vipUsers',
      label: 'VIP Users',
      value: data.data?.vipUsers || 0,
      icon: Crown,
      color: 'from-amber-500 to-amber-600',
      change: '+5%',
      positive: true,
    },
    {
      id: 'totalPredictions',
      label: 'Total Predictions',
      value: data.data?.totalPredictions || 0,
      icon: Target,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      positive: true,
    },
    {
      id: 'totalComments',
      label: 'Total Comments',
      value: data.data?.totalComments || 0,
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      change: '+15%',
      positive: true,
    },
    {
      id: 'totalReports',
      label: 'Total Reports',
      value: data.data?.totalReports || 0,
      icon: FileText,
      color: 'from-red-500 to-red-600',
      change: '-3%',
      positive: false,
    },
  ];
  return stats;
};

/**
 * Recent Activity
 * Returns: { recentUsers: [...], recentPredictions: [...] }
 */
export const getRecentActivity = async () => {
  const data = await adminFetch('/activity');
  
  // Transform recentUsers to UI format
  const recentUsers = (data.data?.recentUsers || []).map(user => ({
    id: user.id,
    user: user.username || user.email || 'Unknown',
    action: 'registered',
    time: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Just now',
    icon: Users,
  }));
  
  // Transform recentPredictions to UI format
  const recentPredictions = (data.data?.recentPredictions || []).map(prediction => ({
    id: prediction.id,
    user: prediction.createdBy?.username || prediction.createdBy?.email || 'Admin',
    action: `created prediction: ${prediction.homeTeam} vs ${prediction.awayTeam}`,
    time: prediction.createdAt ? new Date(prediction.createdAt).toLocaleString() : 'Just now',
    icon: Target,
  }));
  
  // Combine and sort by time (newest first)
  const activities = [...recentUsers, ...recentPredictions].sort((a, b) => {
    const timeA = new Date(a.time).getTime();
    const timeB = new Date(b.time).getTime();
    return timeB - timeA;
  });
  
  return activities;
};

/**
 * Users Management
 */
export const getUsers = async (search = '', status = 'all', page = 1) => {
  const params = new URLSearchParams({ page, limit: 20 });
  if (search) params.append('search', search);
  if (status !== 'all') params.append('status', status);
  
  const data = await adminFetch(`/users?${params}`);
  // Transform to UI format
  // Filter out admin users (they should not appear in user management)
  const users = (data.data?.users || [])
    .filter(user => user.role !== 'admin') // Double-check: exclude any admins that might slip through
    .map(user => ({
      id: user._id || user.id,
      name: user.name || user.username || 'Unknown',
      email: user.email || '',
      status: user.isVIP ? 'VIP' : 'Regular', // No admin status in user management
      joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
      lastActive: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A',
      avatar: (user.name || user.username || user.email || 'U').charAt(0).toUpperCase(),
      role: user.role || 'user',
      isVIP: user.isVIP || false,
      ...user,
    }));
  return { users, pagination: data.data?.pagination };
};

export const getUserById = async (id) => {
  const data = await adminFetch(`/users/${id}`);
  return data.data?.user;
};

export const createUser = async (userData) => {
  const data = await adminFetch('/users', {
    method: 'POST',
    body: userData,
  });
  return data.data?.user;
};

export const updateUser = async (id, userData) => {
  const data = await adminFetch(`/users/${id}`, {
    method: 'PUT',
    body: userData,
  });
  return data.data?.user;
};

export const deleteUser = async (id) => {
  await adminFetch(`/users/${id}`, {
    method: 'DELETE',
  });
};

/**
 * VIP Management
 */
export const assignVIP = async (userId, duration = 'daily') => {
  const data = await adminFetch(`/users/${userId}/vip`, {
    method: 'POST',
    body: { duration },
  });
  return data.data;
};

export const getUserVIPStatus = async (userId) => {
  const data = await adminFetch(`/users/${userId}/vip`);
  return data.data?.vipInfo;
};

/**
 * Predictions Management
 */
export const getPredictions = async (page = 1, filters = {}) => {
  const params = new URLSearchParams({ page, limit: 20 });
  if (filters.status) params.append('status', filters.status);
  if (filters.sport) params.append('sport', filters.sport);
  if (filters.type) params.append('type', filters.type);
  
  const data = await adminFetch(`/predictions?${params}`);
  return { predictions: data.data?.predictions || [], pagination: data.data?.pagination };
};

export const createPrediction = async (predictionData) => {
  const data = await adminFetch('/predictions', {
    method: 'POST',
    body: predictionData,
  });
  return data.data?.prediction;
};

export const updatePrediction = async (id, predictionData) => {
  const data = await adminFetch(`/predictions/${id}`, {
    method: 'PUT',
    body: predictionData,
  });
  return data.data?.prediction;
};

export const deletePrediction = async (id) => {
  await adminFetch(`/predictions/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Comments Management
 */
export const getComments = async (page = 1, filters = {}) => {
  const params = new URLSearchParams({ page, limit: 20 });
  if (filters.approved !== undefined) params.append('approved', filters.approved);
  if (filters.type) params.append('type', filters.type);
  
  const data = await adminFetch(`/comments?${params}`);
  return { comments: data.data?.comments || [], pagination: data.data?.pagination };
};

export const deleteComment = async (id) => {
  await adminFetch(`/comments/${id}`, {
    method: 'DELETE',
  });
};

export const toggleCommentApproval = async (id, approved) => {
  const data = await adminFetch(`/comments/${id}/approve`, {
    method: 'PUT',
    body: { approved },
  });
  return data.data?.comment;
};

/**
 * Reports & Analytics
 */
export const getReports = async () => {
  const data = await adminFetch('/reports');
  return data.data;
};

/**
 * Settings
 */
export const getSettings = async () => {
  const data = await adminFetch('/settings');
  return data.data?.settings;
};

export const updateSettings = async (settingsData) => {
  const data = await adminFetch('/settings', {
    method: 'POST',
    body: settingsData,
  });
  return data.data?.settings;
};

