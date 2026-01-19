const express = require('express');
const router = express.Router();
const {
  getReferralCode,
  getReferralStats,
} = require('../controllers/referralController');
const { authenticate } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Authenticated routes
router.get('/code', apiLimiter, authenticate, getReferralCode);
router.get('/stats', apiLimiter, authenticate, getReferralStats);

module.exports = router;
