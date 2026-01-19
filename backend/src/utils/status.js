/**
 * Shared Status Enums
 * 
 * This file defines status enums that are used across both backend and frontend
 * to ensure consistency in state management and API responses.
 * 
 * @module utils/status
 */

/**
 * API Response Status
 * Used for all API responses
 */
const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  FAILED: 'failed',
  PENDING: 'pending',
};

/**
 * Operation Status
 * Used for async operations (payments, actions, etc.)
 */
const OPERATION_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * Prediction Status
 * Used for prediction results
 */
const PREDICTION_STATUS = {
  PENDING: 'pending',
  WON: 'won',
  LOST: 'lost',
  VOID: 'void',
};

/**
 * Referral Status
 * Used for referral tracking
 */
const REFERRAL_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  REWARDED: 'rewarded',
};

/**
 * Match Status
 * Used for match/bulletin status
 */
const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
  POSTPONED: 'postponed',
};

/**
 * Payment Status
 * Used for payment operations
 */
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

module.exports = {
  API_STATUS,
  OPERATION_STATUS,
  PREDICTION_STATUS,
  REFERRAL_STATUS,
  MATCH_STATUS,
  PAYMENT_STATUS,
};
