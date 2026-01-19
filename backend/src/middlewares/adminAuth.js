const { verifyToken } = require('../config/jwt');
const User = require('../models/User');
const { sendForbidden } = require('../utils/responseHandler');

/**
 * Verify Admin Authentication Middleware
 * Checks JWT token and ensures role === "admin"
 * Returns 403 (Forbidden) if not admin
 * 
 * For admin tokens with userId='admin', we create a virtual user object.
 * For regular user tokens with admin role, we load the user from DB.
 */
const verifyAdminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Check if token has admin role - MUST be exactly "admin"
    if (decoded.role !== 'admin') {
      return sendForbidden(res, 'Forbidden: Admin access required');
    }

    // If userId is 'admin', create virtual admin user (for admin login via env vars)
    if (decoded.userId === 'admin') {
      req.user = {
        _id: 'admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        name: 'Admin',
        isAdmin: () => true,
      };
      req.admin = {
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
      };
      return next();
    }

    // Otherwise, try to load user from database (for users with admin role)
    try {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Double-check user has admin role in database
      if (user.role !== 'admin') {
        return sendForbidden(res, 'Forbidden: Admin access required');
      }

      req.user = user;
      req.admin = {
        email: user.email,
        role: user.role,
      };
      next();
    } catch (error) {
      console.error('Error loading admin user from database:', error);
      return res.status(500).json({
        success: false,
        message: 'Error accessing database',
      });
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Token verification failed',
    });
  }
};

module.exports = {
  verifyAdminAuth,
};

