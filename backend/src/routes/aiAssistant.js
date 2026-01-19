const express = require('express');
const router = express.Router();
const {
  getWebAnalytics,
  chat,
  predictMatch,
} = require('../controllers/aiAssistantController');
const { authenticate } = require('../middlewares/auth');

// Get web analytics and insights (requires authentication)
router.get('/analytics', authenticate, getWebAnalytics);

// AI Chat endpoint - accessible to all (quota enforced in controller)
// No authentication required for basic access
router.post('/chat', chat);

// AI Match Prediction endpoint - accessible to all (quota enforced in controller)
// No authentication required for basic access
router.post('/predict', predictMatch);

module.exports = router;
