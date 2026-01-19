const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./src/config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize services and cron jobs after DB connection (single initialization point)
const mongoose = require('mongoose');
let cronInitialized = false;

mongoose.connection.once('open', async () => {
  // Prevent duplicate initialization
  if (cronInitialized) {
    console.warn('[Server] Cron jobs already initialized, skipping duplicate initialization');
    return;
  }
  cronInitialized = true;

  // Initialize news service cache
  try {
    const { initializeCache } = require('./src/services/newsService');
    await initializeCache();
    console.log('[Server] News cache initialized');
  } catch (error) {
    console.error('⚠️  News cache initialization error (non-fatal):', error.message);
  }

  // Start news cron after DB is ready
  try {
    const { startNewsCron } = require('./src/cron/newsCron');
    startNewsCron();
    console.log('[Server] News cron initialized');
  } catch (error) {
    console.error('⚠️  News cron initialization error (non-fatal):', error.message);
  }

  // Initialize predictions cron job
  try {
    const { startPredictionsCron } = require('./src/cron/predictionsCron');
    startPredictionsCron();
    console.log('[Server] Predictions cron initialized');
  } catch (error) {
    console.error('⚠️  Predictions cron initialization error (non-fatal):', error.message);
  }

  // Initialize sports data cron jobs (using new Sports API only)
  try {
    const { startSportsCron } = require('./src/services/sportsCron');
    startSportsCron();
    console.log('[Server] Sports cron initialized (using new Sports API)');
  } catch (error) {
    console.error('⚠️  Sports cron initialization error (non-fatal):', error.message);
    if (error.stack) {
      console.error('[Server] Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }
});

const app = express();

// Middleware - CORS Configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) {
  console.warn('[CORS] CORS_ORIGIN is not set. Browser requests may fail in production.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Production: allow ONLY the configured frontend origin
    if (process.env.NODE_ENV === 'production') {
      if (CORS_ORIGIN && origin === CORS_ORIGIN) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }

    // Development: allow all origins (no wildcard in production)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/vip', require('./src/routes/vip'));
app.use('/api/predictions', require('./src/routes/predictions'));
app.use('/api/live-scores', require('./src/routes/liveScores'));
app.use('/api/bulletin', require('./src/routes/bulletin'));
app.use('/api/comments', require('./src/routes/comments'));
app.use('/api/admin/comments', require('./src/routes/adminComments'));
app.use('/api/news', require('./src/routes/news'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/ads', require('./src/routes/ads'));
app.use('/api/settings', require('./src/routes/settings'));

// Sports API routes
app.use('/api/football', require('./src/routes/football'));
app.use('/api/basketball', require('./src/routes/basketball'));

// AI Assistant routes (accessible to all, quota enforced)
app.use('/api/ai', require('./src/routes/aiAssistant'));

// Ad Watch routes (for rewarded ads)
app.use('/api/ads/watch', require('./src/routes/adWatch'));

// Referral routes
app.use('/api/referral', require('./src/routes/referral'));

// ⚠️  TEMPORARY SETUP ROUTES - DELETE AFTER USE!
// These routes are for development/testing only
// Remove this line after creating admin and fixing vipPlan:
app.use('/api/setup', require('./src/routes/setup'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'OptikGoal API is running' });
});

// Database connection test route
app.get('/test/db', (req, res) => {
  const mongoose = require('mongoose');
  const isConnected = mongoose.connection.readyState === 1;

  res.json({
    status: isConnected ? 'ok' : 'error',
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
    message: isConnected
      ? 'MongoDB connection is active'
      : 'MongoDB connection is not active'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  // Ensure JSON response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Export Express app for Vercel (no manual port binding in serverless runtime)
module.exports = app;
module.exports.default = app;