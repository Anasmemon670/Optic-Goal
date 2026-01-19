const express = require('express');
const router = express.Router();
const {
  watchAd,
  getAdWatchStatus,
} = require('../controllers/adWatchController');
const { authenticate } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Authenticated routes
router.post('/watch', apiLimiter, authenticate, watchAd);
router.get('/status', apiLimiter, authenticate, getAdWatchStatus);

module.exports = router;
