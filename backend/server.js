const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const net = require('net');
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
// Explicit allowed origins for security and predictability
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];

// Add production origins if provided
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, log warning but allow
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[CORS] Origin ${origin} not in allowed list, but allowing in development`);
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
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

// ============================================
// PORT CONFIGURATION & SERVER STARTUP
// ============================================

// Port configuration: Use 5001 as default (Windows reserves port 5000 for HTTP.sys)
// Can be overridden via PORT environment variable
// This ensures backend runs on a safe port that doesn't conflict with Windows system services
const PORT = parseInt(process.env.PORT, 10) || 5001;
// Use 0.0.0.0 for production compatibility (allows external connections)
// Use 127.0.0.1 for development (localhost only)
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

// Store server instance for graceful shutdown
let server = null;

/**
 * Check if a port is available
 * This prevents EACCES errors by detecting port conflicts before binding
 */
function isPortAvailable(port, host) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
          resolve(false);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true))
          .close();
      })
      .listen(port, host);
  });
}

/**
 * Start the server with proper error handling
 * This ensures only one server instance is created and handles all binding errors
 */
async function startServer() {
  try {
    // Pre-start safety check: Verify port availability
    console.log(`🔍 Checking if port ${PORT} is available on ${HOST}...`);
    const portAvailable = await isPortAvailable(PORT, HOST);
    
    if (!portAvailable) {
      console.error(`\n❌ ERROR: Port ${PORT} is already in use or permission denied!`);
      console.error(`\n💡 Solutions:`);
      console.error(`   1. Stop any other process using port ${PORT}`);
      console.error(`   2. Check for duplicate Node.js/nodemon/PM2 instances: ps aux | grep node`);
      console.error(`   3. On Windows: netstat -ano | findstr :${PORT}`);
      console.error(`   4. Kill the process using: taskkill /PID <PID> /F (Windows)`);
      console.error(`   5. Ensure you have permission to bind to port ${PORT}\n`);
      process.exit(1);
    }

    console.log(`✅ Port ${PORT} is available`);

    // Create server instance - this ensures only one listener exists
    server = app.listen(PORT, HOST, () => {
      console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Backend ready to accept connections\n`);
    });

    // Handle server-level errors (EACCES, EADDRINUSE, etc.)
    server.on('error', (err) => {
      if (err.code === 'EACCES') {
        console.error(`\n❌ ERROR: Permission denied binding to port ${PORT}`);
        console.error(`💡 You may need to run with elevated permissions or use a different port\n`);
      } else if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use`);
        console.error(`💡 Another process is using this port. Please stop it first.\n`);
      } else {
        console.error(`\n❌ Server error:`, err);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error(`\n❌ Failed to start server:`, error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 * Ensures port is released cleanly when server stops
 */
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      // Close database connection
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        console.log('👋 Server shutdown complete');
        process.exit(0);
      });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// ============================================
// PROCESS LIFECYCLE HANDLERS
// ============================================

/**
 * Handle unhandled promise rejections
 * Prevents server crashes from unhandled async errors
 */
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // In production, we might want to exit, but in dev we continue
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('unhandledRejection');
  }
});

/**
 * Handle uncaught exceptions
 * Critical errors that would crash the server
 * Exit gracefully to allow process managers to restart
 */
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

/**
 * Handle SIGTERM (termination signal from process managers)
 * Allows clean shutdown when deployed (PM2, Docker, etc.)
 */
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

/**
 * Handle SIGINT (Ctrl+C)
 * Allows clean shutdown during development
 */
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

// ============================================
// START THE SERVER
// ============================================

// Start server only after all handlers are registered
// This ensures proper error handling from the start
startServer();