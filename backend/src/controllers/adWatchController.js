const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require('../utils/responseHandler');
const User = require('../models/User');
const AdWatch = require('../models/AdWatch');
const Membership = require('../models/Membership');
const { calculateVIPExpiry } = require('../utils/helpers');

/**
 * Ad Watch Controller
 * Handles rewarded ad watching for VIP activation
 * 3 ads = 1 day VIP
 */

// Watch an ad (rewarded ad)
const watchAd = async (req, res) => {
  try {
    const { adId } = req.body;
    const userId = req.user._id;

    if (!adId) {
      return sendValidationError(res, 'Ad ID is required');
    }

    // Check if user already watched this ad
    const existingWatch = await AdWatch.findOne({ userId, adId });
    if (existingWatch) {
      return sendError(res, 'You have already watched this ad', 400);
    }

    // Record ad watch
    await AdWatch.create({
      userId,
      adId,
      watchedAt: new Date(),
    });

    // Get user's ad watch count (unique ads watched today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWatches = await AdWatch.countDocuments({
      userId,
      watchedAt: { $gte: today },
    });

    // Update user's ad watch count
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Reset count if it's a new day
    const lastReset = user.lastAdWatchReset || new Date(0);
    const lastResetDate = new Date(lastReset);
    lastResetDate.setHours(0, 0, 0, 0);
    
    if (today > lastResetDate) {
      user.adWatchCount = 0;
      user.lastAdWatchReset = today;
    }

    user.adWatchCount = todayWatches;
    await user.save();

    // Check if user has watched 3 ads
    let vipActivated = false;
    if (todayWatches >= 3) {
      // Activate 1-day VIP
      const expiryDate = calculateVIPExpiry('daily');
      
      // Update or create membership
      let membership = await Membership.findOne({ userId });
      if (membership) {
        // Extend VIP if already active, or set new expiry
        const currentExpiry = membership.vipExpiry ? new Date(membership.vipExpiry) : new Date(0);
        const newExpiry = new Date();
        newExpiry.setTime(new Date().getTime() + 24 * 60 * 60 * 1000);
        
        // If current VIP is still active, extend it
        if (currentExpiry > new Date()) {
          newExpiry.setTime(currentExpiry.getTime() + 24 * 60 * 60 * 1000);
        }
        
        membership.vipStatus = true;
        membership.vipExpiry = newExpiry;
        membership.vipPlan = 'daily';
        membership.acquisitionSource = 'ads';
        await membership.save();
      } else {
        membership = await Membership.create({
          userId,
          vipStatus: true,
          vipExpiry: expiryDate,
          vipPlan: 'daily',
          acquisitionSource: 'ads',
        });
      }

      // Sync with User model
      await User.findByIdAndUpdate(userId, {
        isVIP: true,
        vipExpiryDate: membership.vipExpiry,
        vipExpiresAt: membership.vipExpiry,
        vipExpiry: membership.vipExpiry,
        vipPlan: 'daily',
      });

      // Mark ad watches as contributed to VIP
      await AdWatch.updateMany(
        { userId, watchedAt: { $gte: today }, contributedToVIP: false },
        { contributedToVIP: true }
      );

      vipActivated = true;
      user.adWatchCount = 0; // Reset after VIP activation
      await user.save();
      
      console.log(`[AdWatchController] ✅ VIP ACTIVATED via ADS for user ${userId}`);
      console.log(`[AdWatchController]   - Plan: daily (24 hours)`);
      console.log(`[AdWatchController]   - Expiry: ${membership.vipExpiry}`);
      console.log(`[AdWatchController]   - Source: ads`);
      console.log(`[AdWatchController]   - Ad watches: 3/3 (reset to 0)`);
      console.log(`[AdWatchController]   - Membership ID: ${membership._id}`);
    }

    return sendSuccess(
      res,
      {
        adWatched: true,
        adsWatchedToday: todayWatches,
        adsRemaining: Math.max(0, 3 - todayWatches),
        vipActivated,
        vipExpiry: vipActivated ? membership.vipExpiry : null,
      },
      vipActivated 
        ? 'Congratulations! You have activated 1-day VIP membership by watching 3 ads!'
        : `Ad watched successfully. ${3 - todayWatches} more ads to unlock VIP.`
    );
  } catch (error) {
    console.error('[AdWatchController] Error:', error);
    return sendError(res, 'Failed to process ad watch', 500);
  }
};

// Get ad watch status
const getAdWatchStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWatches = await AdWatch.countDocuments({
      userId,
      watchedAt: { $gte: today },
    });

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check VIP status
    const membership = await Membership.findOne({ userId });
    const isVIP = membership && membership.isActive();

    return sendSuccess(
      res,
      {
        adsWatchedToday: todayWatches,
        adsRemaining: Math.max(0, 3 - todayWatches),
        isVIP,
        vipExpiry: membership && membership.isActive() ? membership.vipExpiry : null,
      },
      'Ad watch status retrieved successfully'
    );
  } catch (error) {
    console.error('[AdWatchController] Error:', error);
    return sendError(res, 'Failed to get ad watch status', 500);
  }
};

module.exports = {
  watchAd,
  getAdWatchStatus,
};
