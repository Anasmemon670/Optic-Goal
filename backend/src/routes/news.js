const express = require('express');
const router = express.Router();
const { getNews, getBulletin, getSingleNews, refreshNews } = require('../controllers/newsController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.get('/', apiLimiter, getNews);
router.get('/bulletin', apiLimiter, getBulletin);
router.get('/:id', apiLimiter, getSingleNews);
router.post('/refresh', apiLimiter, authenticate, requireAdmin, refreshNews);
// Manual refresh endpoint (no auth required for testing)
router.post('/force-refresh', apiLimiter, refreshNews);

module.exports = router;

