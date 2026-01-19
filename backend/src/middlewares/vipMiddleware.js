/**
 * VIP Middleware
 * 
 * Enforces VIP-only access to certain endpoints
 * VIP users: No ads (except fixed bottom), VIP matches, unlimited AI
 * Normal users: Ads enabled, limited data, AI quota
 * 
 * IMPORTANT: Automatically checks and disables expired VIP on every request
 */

const { sendError } = require('../utils/responseHandler');
const User = require('../models/User');
const Membership = require('../models/Membership');

/**
 * Check and disable expired VIP memberships (called automatically)
 * This ensures expired VIPs are disabled immediately, not just at midnight
 */
const checkAndDisableExpiredVIP = async (userId) => {
  try {
    const now = new Date();
    
    // Check Membership model
    const membership = await Membership.findOne({ userId });
    if (membership && membership.vipStatus && membership.vipExpiry) {
      if (new Date(membership.vipExpiry) <= now) {
        // VIP expired - disable it immediately
        membership.vipStatus = false;
        membership.vipPlan = 'none';
        await membership.save();
        
        // Sync with User model
        await User.findByIdAndUpdate(userId, {
          isVIP: false,
          vipPlan: 'none',
        });
        
        console.log(`[VIPMiddleware] Auto-disabled expired VIP for user ${userId} (expired at ${membership.vipExpiry})`);
        return false; // VIP was expired and disabled
      }
    }
    
    // Check User model (backward compatibility)
    const user = await User.findById(userId);
    if (user && user.isVIP && user.vipExpiryDate) {
      if (new Date(user.vipExpiryDate) <= now) {
        // VIP expired - disable it
        user.isVIP = false;
        user.vipPlan = 'none';
        await user.save();
        
        console.log(`[VIPMiddleware] Auto-disabled expired VIP for user ${userId} (User model, expired at ${user.vipExpiryDate})`);
        return false; // VIP was expired and disabled
      }
    }
    
    return true; // No expired VIP found or VIP is still active
  } catch (error) {
    console.error('[VIPMiddleware] Error checking expired VIP:', error);
    return true; // On error, allow through (fail open)
  }
};

/**
 * Check if user has active VIP membership
 * Automatically disables expired VIP on every check
 */
const checkVIP = async (req, res, next) => {
  try {
    // Get user from request (set by authenticate middleware)
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const userId = req.user._id;

    // First, check and disable any expired VIP
    await checkAndDisableExpiredVIP(userId);

    // Check Membership model first (new system)
    const membership = await Membership.findOne({ userId });
    if (membership && membership.isActive()) {
      req.isVIP = true;
      req.membership = membership;
      console.log(`[VIPMiddleware] VIP access granted to user ${userId} (Membership model, expires: ${membership.vipExpiry})`);
      return next();
    }

    // Fallback to User model (backward compatibility)
    const user = await User.findById(userId);
    if (user && user.isVIP && user.vipExpiry && new Date(user.vipExpiry) > new Date()) {
      req.isVIP = true;
      console.log(`[VIPMiddleware] VIP access granted to user ${userId} (User model, expires: ${user.vipExpiry})`);
      return next();
    }

    // Not VIP
    req.isVIP = false;
    console.log(`[VIPMiddleware] VIP access denied to user ${userId} - not VIP or expired`);
    return sendError(res, 'VIP membership required for this feature', 403);
  } catch (error) {
    console.error('[VIPMiddleware] Error:', error);
    return sendError(res, 'Error checking VIP status', 500);
  }
};

/**
 * Optional VIP check - sets req.isVIP but doesn't block access
 * Useful for endpoints that show different data for VIP vs normal users
 * Automatically disables expired VIP on every check
 */
const optionalVIP = async (req, res, next) => {
  try {
    if (!req.user) {
      req.isVIP = false;
      return next();
    }

    const userId = req.user._id;

    // First, check and disable any expired VIP
    await checkAndDisableExpiredVIP(userId);

    // Check Membership model
    const membership = await Membership.findOne({ userId });
    if (membership && membership.isActive()) {
      req.isVIP = true;
      req.membership = membership;
      return next();
    }

    // Check User model
    const user = await User.findById(userId);
    if (user && user.isVIP && user.vipExpiry && new Date(user.vipExpiry) > new Date()) {
      req.isVIP = true;
      return next();
    }

    req.isVIP = false;
    next();
  } catch (error) {
    console.error('[VIPMiddleware] Error:', error);
    req.isVIP = false;
    next();
  }
};

module.exports = {
  checkVIP,
  optionalVIP,
  checkAndDisableExpiredVIP,
};
