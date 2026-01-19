const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require('../utils/responseHandler');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Membership = require('../models/Membership');
const { calculateVIPExpiry, generateReferralCode } = require('../utils/helpers');

/**
 * Referral Controller
 * Handles referral system for VIP activation
 * Invite a friend = 1 day VIP
 */

// Get or generate referral code for user
const getReferralCode = async (req, res) => {
  try {
    const userId = req.user._id;

    let user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Generate referral code if doesn't exist
    if (!user.referralCode) {
      let code = generateReferralCode();
      // Ensure uniqueness
      while (await User.findOne({ referralCode: code })) {
        code = generateReferralCode();
      }
      user.referralCode = code;
      await user.save();
    }

    const frontendUrl = process.env.CORS_ORIGIN;
    if (!frontendUrl) {
      return sendError(res, 'Frontend URL is not configured (set CORS_ORIGIN)', 500);
    }
    const referralLink = `${frontendUrl}/register?ref=${user.referralCode}`;

    // Get referral stats
    const totalReferrals = await Referral.countDocuments({ referrerId: userId });
    const completedReferrals = await Referral.countDocuments({ 
      referrerId: userId, 
      status: 'completed' 
    });

    return sendSuccess(
      res,
      {
        referralCode: user.referralCode,
        referralLink,
        totalReferrals,
        completedReferrals,
      },
      'Referral code retrieved successfully'
    );
  } catch (error) {
    console.error('[ReferralController] Error:', error);
    return sendError(res, 'Failed to get referral code', 500);
  }
};

// Process referral when user registers
const processReferral = async (userId, referralCode) => {
  try {
    if (!referralCode) return null;

    // Find referrer
    const referrer = await User.findOne({ referralCode });
    if (!referrer || referrer._id.toString() === userId.toString()) {
      return null; // Invalid referral code or self-referral
    }

    // Check if this user was already referred
    const existingReferral = await Referral.findOne({ referredUserId: userId });
    if (existingReferral) {
      return null; // Already referred
    }

    // Create referral record
    const referral = await Referral.create({
      referrerId: referrer._id,
      referredUserId: userId,
      referralCode,
      status: 'pending',
    });

    // Update user's referredBy field
    await User.findByIdAndUpdate(userId, {
      referredBy: referrer._id,
    });

    return referral;
  } catch (error) {
    console.error('[ReferralController] Error processing referral:', error);
    return null;
  }
};

// Complete referral (when user verifies email/phone)
const completeReferral = async (userId) => {
  try {
    // Find pending referral for this user
    const referral = await Referral.findOne({
      referredUserId: userId,
      status: 'pending',
    });

    if (!referral) {
      return null; // No pending referral
    }

    // Update referral status
    referral.status = 'completed';
    referral.completedAt = new Date();
    await referral.save();

    // Reward referrer with 1-day VIP
    const referrerId = referral.referrerId;
    
    // Check if referrer was already rewarded for this referral
    if (referral.referrerRewarded) {
      return referral; // Already rewarded
    }

    const expiryDate = calculateVIPExpiry('daily');
    
    // Update or create membership for referrer
    let membership = await Membership.findOne({ userId: referrerId });
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
      membership.acquisitionSource = 'referral';
      await membership.save();
    } else {
      membership = await Membership.create({
        userId: referrerId,
        vipStatus: true,
        vipExpiry: expiryDate,
        vipPlan: 'daily',
        acquisitionSource: 'referral',
      });
    }

    // Sync with User model
    await User.findByIdAndUpdate(referrerId, {
      isVIP: true,
      vipExpiryDate: membership.vipExpiry,
      vipExpiresAt: membership.vipExpiry,
      vipExpiry: membership.vipExpiry,
      vipPlan: 'daily',
    });

    // Mark referral as rewarded
    referral.referrerRewarded = true;
    referral.rewardedAt = new Date();
    await referral.save();

    console.log(`[ReferralController] ✅ VIP ACTIVATED via REFERRAL for user ${referrerId}`);
    console.log(`[ReferralController]   - Plan: daily (24 hours)`);
    console.log(`[ReferralController]   - Expiry: ${membership.vipExpiry}`);
    console.log(`[ReferralController]   - Source: referral`);
    console.log(`[ReferralController]   - Referral ID: ${referral._id}`);
    console.log(`[ReferralController]   - Referred user: ${userId}`);
    console.log(`[ReferralController]   - Membership ID: ${membership._id}`);

    return referral;
  } catch (error) {
    console.error('[ReferralController] Error completing referral:', error);
    return null;
  }
};

// Get referral stats
const getReferralStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalReferrals = await Referral.countDocuments({ referrerId: userId });
    const completedReferrals = await Referral.countDocuments({ 
      referrerId: userId, 
      status: 'completed' 
    });
    const pendingReferrals = await Referral.countDocuments({ 
      referrerId: userId, 
      status: 'pending' 
    });

    const referrals = await Referral.find({ referrerId: userId })
      .populate('referredUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    return sendSuccess(
      res,
      {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        recentReferrals: referrals.map(r => ({
          id: r._id,
          referredUser: r.referredUserId,
          status: r.status,
          completedAt: r.completedAt,
          createdAt: r.createdAt,
        })),
      },
      'Referral stats retrieved successfully'
    );
  } catch (error) {
    console.error('[ReferralController] Error:', error);
    return sendError(res, 'Failed to get referral stats', 500);
  }
};

module.exports = {
  getReferralCode,
  processReferral,
  completeReferral,
  getReferralStats,
};
