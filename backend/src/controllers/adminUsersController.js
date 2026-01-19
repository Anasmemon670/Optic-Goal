const User = require('../models/User');
const Membership = require('../models/Membership');
const bcrypt = require('bcryptjs');
const { calculateVIPExpiry } = require('../utils/helpers');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
} = require('../utils/responseHandler');

/**
 * Get All Users
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    // Always exclude admin users from user management (admins should be managed separately)
    const filter = {
      role: { $ne: 'admin' } // Exclude admin users by default
    };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'VIP') {
      filter.isVIP = true;
      // Keep role filter to exclude admins
    } else if (status === 'Regular') {
      filter.isVIP = false;
      // role filter already excludes admins
    } else if (status === 'Banned') {
      // If you have a banned field, use it
      filter.role = 'banned';
    }
    // For 'all' status, we still exclude admins (role filter is already set)

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(filter);

    console.log(`[AdminUsersController] Fetched ${users.length} users (page ${page})`);
    return sendSuccess(
      res,
      {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Users retrieved successfully'
    );
  } catch (error) {
    console.error('[AdminUsersController] Error fetching users:', error);
    return sendError(res, error.message || 'Failed to fetch users', 500);
  }
};

/**
 * Get User By ID
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return sendSuccess(res, { user }, 'User retrieved successfully');
  } catch (error) {
    console.error('[AdminUsersController] Error fetching user:', error);
    return sendError(res, error.message || 'Failed to fetch user', 500);
  }
};

/**
 * Create User
 * POST /api/admin/users
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, isVIP, vipPlan } = req.body;

    // Validate required fields
    const errors = [];
    if (!name || !name.trim()) {
      errors.push('Name is required');
    }
    if (!email || !email.trim()) {
      errors.push('Email is required');
    }
    if (!password) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return sendValidationError(res, 'Invalid email format');
    }

    // Validate password length
    if (password.length < 6) {
      return sendValidationError(res, 'Password must be at least 6 characters');
    }

    // Ensure we don't create admin users through this endpoint
    if (role === 'admin') {
      return sendForbidden(res, 'Cannot create admin users through this endpoint');
    }

    // Check if user exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return sendConflict(res, 'User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (only regular users, not admins)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user', // Always create as regular user
      isVIP: isVIP || false,
      vipPlan: vipPlan || 'none',
    });

    const userObj = user.toObject();
    delete userObj.password;

    console.log(`[AdminUsersController] User created: ${userObj.email}`);
    return sendSuccess(res, { user: userObj }, 'User created successfully', 201);
  } catch (error) {
    console.error('[AdminUsersController] Error creating user:', error);
    return sendError(res, error.message || 'Failed to create user', 500);
  }
};

/**
 * Update User
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, isVIP, vipPlan, vipExpiryDate } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't allow changing admin users through this endpoint
    if (user.role === 'admin') {
      return sendForbidden(res, 'Cannot modify admin users through user management');
    }

    // Update fields
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.toLowerCase().trim();
    // Prevent changing role to admin through this endpoint
    if (role !== undefined && role !== 'admin') {
      user.role = role;
    }
    if (isVIP !== undefined) user.isVIP = isVIP;
    if (vipPlan !== undefined) user.vipPlan = vipPlan;
    if (vipExpiryDate !== undefined) user.vipExpiryDate = vipExpiryDate;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    console.log(`[AdminUsersController] User updated: ${userObj.email}`);
    return sendSuccess(res, { user: userObj }, 'User updated successfully');
  } catch (error) {
    console.error('[AdminUsersController] Error updating user:', error);
    return sendError(res, error.message || 'Failed to update user', 500);
  }
};

/**
 * Delete User
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return sendForbidden(res, 'Cannot delete admin users');
    }

    await User.findByIdAndDelete(id);
    console.log(`[AdminUsersController] User deleted: ${id}`);

    return sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('[AdminUsersController] Error deleting user:', error);
    return sendError(res, error.message || 'Failed to delete user', 500);
  }
};

/**
 * Manually assign VIP to a user (Admin only)
 * POST /api/admin/users/:id/vip
 */
const assignVIP = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration = 'daily' } = req.body; // daily, monthly, 3months, yearly

    const user = await User.findById(id);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Calculate expiry date
    const expiryDate = calculateVIPExpiry(duration);
    if (!expiryDate) {
      return sendValidationError(res, 'Invalid VIP duration. Must be: daily, monthly, 3months, or yearly');
    }

    // Update or create membership
    let membership = await Membership.findOne({ userId: id });
    if (membership) {
      // Extend VIP if already active, or set new expiry
      const currentExpiry = membership.vipExpiry ? new Date(membership.vipExpiry) : new Date(0);
      let newExpiry = expiryDate;
      
      // If current VIP is still active, extend it
      if (currentExpiry > new Date()) {
        if (duration === 'daily') {
          newExpiry = new Date(currentExpiry.getTime() + 24 * 60 * 60 * 1000);
        } else {
          const monthsToAdd = duration === 'monthly' ? 1 : duration === '3months' ? 3 : 12;
          newExpiry = new Date(currentExpiry);
          newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);
        }
      }
      
      membership.vipStatus = true;
      membership.vipExpiry = newExpiry;
      membership.vipPlan = duration;
      membership.acquisitionSource = 'admin';
      await membership.save();
    } else {
      membership = await Membership.create({
        userId: id,
        vipStatus: true,
        vipExpiry: expiryDate,
        vipPlan: duration,
        acquisitionSource: 'admin',
      });
    }

    // Sync with User model
    await User.findByIdAndUpdate(id, {
      isVIP: true,
      vipExpiryDate: membership.vipExpiry,
      vipExpiresAt: membership.vipExpiry,
      vipExpiry: membership.vipExpiry,
      vipPlan: duration,
    });

    console.log(`[AdminUsersController] ✅ VIP ASSIGNED by ADMIN for user ${id}`);
    console.log(`[AdminUsersController]   - Admin ID: ${req.user?._id || req.admin?._id || 'unknown'}`);
    console.log(`[AdminUsersController]   - Plan: ${duration}`);
    console.log(`[AdminUsersController]   - Expiry: ${membership.vipExpiry}`);
    console.log(`[AdminUsersController]   - Source: admin`);
    console.log(`[AdminUsersController]   - Membership ID: ${membership._id}`);

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          isVIP: true,
          vipExpiry: membership.vipExpiry,
          vipPlan: duration,
          acquisitionSource: 'admin',
        },
      },
      `VIP membership assigned successfully. Expires: ${new Date(membership.vipExpiry).toLocaleString()}`
    );
  } catch (error) {
    console.error('[AdminUsersController] Error assigning VIP:', error);
    return sendError(res, error.message || 'Failed to assign VIP', 500);
  }
};

/**
 * Get user VIP status with details
 * GET /api/admin/users/:id/vip
 */
const getUserVIPStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('isVIP vipExpiry vipExpiryDate vipPlan');
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Check Membership model
    const membership = await Membership.findOne({ userId: id });
    
    const vipInfo = {
      isVIP: false,
      isActive: false,
      vipExpiry: null,
      vipPlan: 'none',
      acquisitionSource: null,
      daysRemaining: 0,
    };

    if (membership) {
      vipInfo.isVIP = membership.vipStatus;
      vipInfo.isActive = membership.isActive();
      vipInfo.vipExpiry = membership.vipExpiry;
      vipInfo.vipPlan = membership.vipPlan;
      vipInfo.acquisitionSource = membership.acquisitionSource;
      vipInfo.daysRemaining = membership.getDaysRemaining();
    } else if (user.isVIP) {
      // Fallback to User model
      const expiry = user.vipExpiry || user.vipExpiryDate;
      vipInfo.isVIP = true;
      vipInfo.isActive = expiry && new Date(expiry) > new Date();
      vipInfo.vipExpiry = expiry;
      vipInfo.vipPlan = user.vipPlan || 'none';
      if (vipInfo.isActive) {
        const now = new Date();
        const expiryDate = new Date(expiry);
        const diffTime = expiryDate - now;
        vipInfo.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    return sendSuccess(res, { vipInfo }, 'VIP status retrieved successfully');
  } catch (error) {
    console.error('[AdminUsersController] Error getting VIP status:', error);
    return sendError(res, error.message || 'Failed to get VIP status', 500);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignVIP,
  getUserVIPStatus,
};

