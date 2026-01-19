const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require('../utils/responseHandler');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const FootballLiveMatch = require('../models/FootballLiveMatch');
const BasketballLiveMatch = require('../models/BasketballLiveMatch');
const AIUsage = require('../models/AIUsage');
const AIRequestLog = require('../models/AIRequestLog');
const Membership = require('../models/Membership');
const HighlightlyMatch = require('../models/HighlightlyMatch');
const { getFootballMatchDetails, getBasketballMatchDetails } = require('../services/apiFootball');
const { generateAIResponse, analyzeMatch } = require('../services/aiService');
const { generatePredictionForFixture } = require('../services/predictionEngine');

/**
 * AI Assistant Controller
 * Provides AI-powered analysis and insights about the web platform
 * Available to all users (not just VIP)
 */

// Get web analytics and insights
const getWebAnalytics = async (req, res) => {
  try {
    // Get statistics
    const totalUsers = await User.countDocuments();
    const totalPredictions = await Prediction.countDocuments({ isPublic: true });
    const vipPredictions = await Prediction.countDocuments({ isVIP: true, isPublic: true });
    const liveFootballMatches = await FootballLiveMatch.countDocuments();
    const liveBasketballMatches = await BasketballLiveMatch.countDocuments();

    // Get recent predictions
    const recentPredictions = await Prediction.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('homeTeam awayTeam league predictionType confidence matchStart');

    // Calculate success rate (if we have results)
    const completedPredictions = await Prediction.find({
      isPublic: true,
      matchStart: { $lt: new Date() },
    }).limit(100);

    const analytics = {
      totalUsers,
      totalPredictions,
      vipPredictions,
      regularPredictions: totalPredictions - vipPredictions,
      liveMatches: {
        football: liveFootballMatches,
        basketball: liveBasketballMatches,
        total: liveFootballMatches + liveBasketballMatches,
      },
      recentActivity: {
        predictions: recentPredictions.length,
        samplePredictions: recentPredictions.slice(0, 5).map(p => ({
          match: `${p.homeTeam} vs ${p.awayTeam}`,
          league: p.league,
          type: p.predictionType,
          confidence: p.confidence,
        })),
      },
      platformHealth: {
        status: 'active',
        lastUpdated: new Date(),
      },
    };

    return sendSuccess(res, { analytics }, 'Web analytics retrieved successfully');
  } catch (error) {
    console.error('[AIAssistant] Error getting analytics:', error);
    return sendError(res, 'Failed to retrieve web analytics', 500);
  }
};

// AI Chat - Analyze user query and provide insights using REAL AI
// Accessible to all users, quota enforced for non-VIP
const chat = async (req, res) => {
  const startTime = Date.now();
  let userId = null;
  let isVIP = false;
  let response = '';
  let success = true;
  let errorMessage = null;

  try {
    const { message, matchId, sport = 'football' } = req.body;
    const userIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return sendValidationError(res, 'Message is required');
    }

    const userMessage = message.trim();

    // Check user authentication (optional - AI is open to all)
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        const { verifyToken } = require('../config/jwt');
        const decoded = verifyToken(token);
        userId = decoded.userId;
        
        // Get user VIP status
        const user = await User.findById(userId).select('isVIP vipExpiry');
        if (user) {
          isVIP = user.isVIP && user.vipExpiry && new Date(user.vipExpiry) > new Date();
        }
      }
    } catch (error) {
      // Not authenticated - allow basic access
      console.log('[AIAssistant] Unauthenticated user accessing AI');
    }

    // Check VIP status from Membership model
    if (userId) {
      const membership = await Membership.findOne({ userId });
      
      // Auto-disable expired VIP
      if (membership && membership.vipStatus && membership.vipExpiry) {
        const now = new Date();
        if (new Date(membership.vipExpiry) <= now) {
          membership.vipStatus = false;
          membership.vipPlan = 'none';
          await membership.save();
          
          await User.findByIdAndUpdate(userId, {
            isVIP: false,
            vipPlan: 'none',
          });
          
          console.log(`[AIAssistant] Auto-disabled expired VIP for user ${userId} during AI chat check`);
        }
      }
      
      if (membership && membership.isActive()) {
        isVIP = true;
        console.log(`[AIAssistant] User ${userId} is VIP (unlimited AI access)`);
      } else {
        // Fallback to User model
        const user = await User.findById(userId).select('isVIP vipExpiry vipExpiryDate');
        if (user) {
          const expiry = user.vipExpiry || user.vipExpiryDate;
          if (expiry && new Date(expiry) <= new Date()) {
            user.isVIP = false;
            user.vipPlan = 'none';
            await user.save();
            console.log(`[AIAssistant] Auto-disabled expired VIP for user ${userId} (User model)`);
          } else {
            isVIP = user.isVIP && expiry && new Date(expiry) > new Date();
          }
        }
      }
    }

    // Check AI quota for non-VIP users (authenticated only)
    if (!isVIP && userId) {
      const usage = await AIUsage.getTodayUsage(userId);
      const canMakeRequest = usage.canMakeRequest(false);
      
      console.log(`[AIAssistant] AI quota check for user ${userId}: ${usage.count}/5 used, canMakeRequest: ${canMakeRequest}`);
      
      if (!canMakeRequest) {
        console.log(`[AIAssistant] AI quota exceeded for user ${userId} (${usage.count}/5 requests used)`);
        
        // Log the blocked request
        await AIRequestLog.create({
          userId,
          userIP,
          message: userMessage,
          isVIP: false,
          success: false,
          errorMessage: 'Quota exceeded',
          processingTime: Date.now() - startTime,
        });
        
        return sendError(
          res,
          'Your daily AI search limit has been reached. Upgrade to VIP for unlimited access.',
          429
        );
      }
      
      // Increment usage
      await usage.increment();
      console.log(`[AIAssistant] AI request count incremented for user ${userId}: ${usage.count}/5`);
    } else if (isVIP && userId) {
      console.log(`[AIAssistant] VIP user ${userId} - unlimited AI access (no quota check)`);
    }

    // Prepare context for AI
    const aiContext = {
      totalUsers: await User.countDocuments(),
      totalPredictions: await Prediction.countDocuments({ isPublic: true }),
      liveFootball: await FootballLiveMatch.countDocuments(),
      liveBasketball: await BasketballLiveMatch.countDocuments(),
    };

    // Check if user is asking about a specific match
    let matchData = null;
    let predictions = [];

    // Try to extract match ID from message or use provided matchId
    const matchIdMatch = userMessage.match(/match\s*(?:id|#)?\s*:?\s*(\d+)/i) || 
                        userMessage.match(/id\s*:?\s*(\d+)/i);
    const extractedMatchId = matchId || (matchIdMatch ? matchIdMatch[1] : null);

    if (extractedMatchId) {
      try {
        // Fetch match from database
        matchData = await HighlightlyMatch.findOne({
          matchId: extractedMatchId.toString(),
          sport,
        });

        if (matchData) {
          // Get existing predictions for this match
          predictions = await Prediction.find({
            matchId: extractedMatchId.toString(),
            isPublic: true,
          }).limit(5);

          // If no predictions exist, generate them using prediction engine
          if (predictions.length === 0) {
            const transformedFixture = {
              fixture: {
                id: matchData.matchId,
                date: matchData.matchDate,
                status: { short: matchData.status },
              },
              league: matchData.league,
              teams: {
                home: matchData.homeTeam,
                away: matchData.awayTeam,
              },
              goals: matchData.score,
            };

            const generatedPredictions = await generatePredictionForFixture(transformedFixture);
            if (generatedPredictions && generatedPredictions.length > 0) {
              predictions = generatedPredictions;
            }
          }

          // Use AI to analyze the match
          response = await analyzeMatch(
            {
              ...matchData.toObject(),
              homeTeam: matchData.homeTeam?.name || matchData.homeTeam,
              awayTeam: matchData.awayTeam?.name || matchData.awayTeam,
              league: matchData.league?.name || matchData.league,
              matchDate: matchData.matchDate,
              isLive: matchData.status === 'LIVE' || matchData.status === 'HT' || matchData.status === '2H',
              homeScore: matchData.score?.home || 0,
              awayScore: matchData.score?.away || 0,
              statistics: matchData.rawData?.statistics || [],
            },
            predictions,
            userMessage
          );
        } else {
          // Match not found, but still use AI to respond
          aiContext.matchNotFound = true;
          response = await generateAIResponse(userMessage, aiContext);
        }
      } catch (error) {
        console.error('[AIAssistant] Error fetching match data:', error);
        // Continue with general AI response
        response = await generateAIResponse(userMessage, aiContext);
      }
    } else {
      // General query - use AI service
      response = await generateAIResponse(userMessage, aiContext);
    }

    // CRITICAL: Ensure response is never empty or blank
    if (!response || typeof response !== 'string' || response.trim().length === 0) {
      console.error('[AIAssistant] Empty response from AI service, using fallback');
      response = `I apologize, but I'm having trouble processing your request right now. 

**Confidence Level:** N/A (Service unavailable)

⚠️ **Risk Disclaimer:** The AI analysis service is temporarily unavailable. Please try again in a moment, or contact support if the issue persists.

In the meantime, I can help you with:
- General questions about OptikGoal features
- Match information (if you provide a match ID)
- Platform navigation and tips

Please try your question again or provide more specific details.`;
    }

    const processingTime = Date.now() - startTime;

    // Log the request
    try {
      await AIRequestLog.create({
        userId,
        userIP,
        message: userMessage,
        responseLength: response.length,
        matchId: extractedMatchId,
        sport: extractedMatchId ? sport : null,
        isVIP,
        success: true,
        processingTime,
      });
    } catch (logError) {
      console.error('[AIAssistant] Error logging request:', logError);
      // Don't fail the request if logging fails
    }

    return sendSuccess(
      res,
      {
        response,
        context: {
          totalUsers: aiContext.totalUsers,
          totalPredictions: aiContext.totalPredictions,
          liveMatches: aiContext.liveFootball + aiContext.liveBasketball,
        },
        usage: userId ? {
          remaining: isVIP ? 'unlimited' : Math.max(0, 5 - (await AIUsage.getTodayUsage(userId)).count),
          isVIP,
        } : null,
      },
      'AI response generated successfully'
    );
  } catch (error) {
    success = false;
    errorMessage = error.message;
    console.error('[AIAssistant] Error in chat:', error);
    
    // Log the error
    try {
      await AIRequestLog.create({
        userId,
        userIP: req.ip || req.connection.remoteAddress || 'unknown',
        message: req.body?.message || '',
        isVIP,
        success: false,
        errorMessage: error.message,
        processingTime: Date.now() - startTime,
      });
    } catch (logError) {
      console.error('[AIAssistant] Error logging failed request:', logError);
    }
    
    // CRITICAL: Never return blank - always provide a helpful error response
    const errorResponse = `I apologize, but I encountered an error while processing your request.

**Error Details:** ${error.message || 'Unknown error occurred'}

**Confidence Level:** N/A (Error state)

⚠️ **Risk Disclaimer:** The AI analysis service encountered a technical issue. Please try again in a moment. If the problem persists, please contact support.

**What you can do:**
- Try rephrasing your question
- Provide a specific match ID if asking about a match
- Try again in a few moments

We're working to resolve this issue. Thank you for your patience.`;
    
    // Return error response as success with error message (so frontend can display it)
    return sendSuccess(
      res,
      {
        response: errorResponse,
        context: {
          totalUsers: 0,
          totalPredictions: 0,
          liveMatches: 0,
        },
        usage: userId ? {
          remaining: isVIP ? 'unlimited' : Math.max(0, 5 - (await AIUsage.getTodayUsage(userId).catch(() => ({ count: 0 }))).count),
          isVIP,
        } : null,
        isError: true,
      },
      'AI response generated (with errors)'
    );
  }
};

// AI Match Prediction - Generate predictions on demand using REAL AI
// Accessible to all users, quota enforced for non-VIP
const predictMatch = async (req, res) => {
  const startTime = Date.now();
  let userId = null;
  let isVIP = false;

  try {
    const { matchId, sport = 'football', userQuery } = req.body;
    const userIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!matchId) {
      return sendValidationError(res, 'Match ID is required');
    }

    // Check user authentication (optional - AI is open to all)
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        const { verifyToken } = require('../config/jwt');
        const decoded = verifyToken(token);
        userId = decoded.userId;
        
        // Check VIP status from Membership model
        const membership = await Membership.findOne({ userId });
        
        // Auto-disable expired VIP
        if (membership && membership.vipStatus && membership.vipExpiry) {
          const now = new Date();
          if (new Date(membership.vipExpiry) <= now) {
            membership.vipStatus = false;
            membership.vipPlan = 'none';
            await membership.save();
            
            await User.findByIdAndUpdate(userId, {
              isVIP: false,
              vipPlan: 'none',
            });
            
            console.log(`[AIAssistant] Auto-disabled expired VIP for user ${userId} during AI prediction check`);
          }
        }
        
        if (membership && membership.isActive()) {
          isVIP = true;
          console.log(`[AIAssistant] User ${userId} is VIP (unlimited AI predictions)`);
        } else {
          // Fallback to User model
          const user = await User.findById(userId).select('isVIP vipExpiry vipExpiryDate');
          if (user) {
            const expiry = user.vipExpiry || user.vipExpiryDate;
            if (expiry && new Date(expiry) <= new Date()) {
              user.isVIP = false;
              user.vipPlan = 'none';
              await user.save();
              console.log(`[AIAssistant] Auto-disabled expired VIP for user ${userId} (User model)`);
            } else {
              isVIP = user.isVIP && expiry && new Date(expiry) > new Date();
            }
          }
        }
      }
    } catch (error) {
      console.log('[AIAssistant] Unauthenticated user accessing AI prediction');
    }

    // Check AI quota for non-VIP users (authenticated only)
    if (!isVIP && userId) {
      const usage = await AIUsage.getTodayUsage(userId);
      if (!usage.canMakeRequest(false)) {
        // Log the blocked request
        await AIRequestLog.create({
          userId,
          userIP,
          message: `Match prediction request for ${matchId}`,
          matchId: matchId.toString(),
          sport,
          isVIP: false,
          success: false,
          errorMessage: 'Quota exceeded',
          processingTime: Date.now() - startTime,
        });
        
        return sendError(
          res,
          'Your daily AI search limit has been reached. Upgrade to VIP for unlimited access.',
          429
        );
      }
      
      // Increment usage
      await usage.increment();
    }

    // Fetch match from database
    let matchData = await HighlightlyMatch.findOne({
      matchId: matchId.toString(),
      sport,
    });

    // If not in Highlightly, try API
    if (!matchData) {
      try {
        if (sport === 'football') {
          const result = await getFootballMatchDetails(matchId);
          if (result.success && result.data && result.data.length > 0) {
            matchData = result.data[0];
          }
        } else if (sport === 'basketball') {
          const result = await getBasketballMatchDetails(matchId);
          if (result.success && result.data && result.data.length > 0) {
            matchData = result.data[0];
          }
        }
      } catch (error) {
        console.error('[AIAssistant] Error fetching match details:', error);
      }
    }

    if (!matchData) {
      return sendError(res, 'Match not found or could not be retrieved', 404);
    }

    // Get or generate predictions using prediction engine
    let predictions = await Prediction.find({
      matchId: matchId.toString(),
      isPublic: true,
    }).limit(5);

    // If no predictions exist, generate them
    if (predictions.length === 0 && sport === 'football') {
      const transformedFixture = {
        fixture: {
          id: matchData.matchId || matchId,
          date: matchData.matchDate || matchData.fixture?.date,
          status: { short: matchData.status || matchData.fixture?.status?.short },
        },
        league: matchData.league || matchData.league,
        teams: {
          home: matchData.homeTeam || matchData.teams?.home,
          away: matchData.awayTeam || matchData.teams?.away,
        },
        goals: matchData.score || matchData.goals,
      };

      const generatedPredictions = await generatePredictionForFixture(transformedFixture);
      if (generatedPredictions && generatedPredictions.length > 0) {
        predictions = generatedPredictions;
      }
    }

    // Prepare match data for AI analysis
    const matchDataForAI = {
      homeTeam: matchData.homeTeam?.name || matchData.homeTeam || matchData.teams?.home?.name,
      awayTeam: matchData.awayTeam?.name || matchData.awayTeam || matchData.teams?.away?.name,
      league: matchData.league?.name || matchData.league || 'Unknown League',
      matchDate: matchData.matchDate || matchData.fixture?.date,
      isLive: matchData.status === 'LIVE' || matchData.status === 'HT' || matchData.status === '2H' || 
              matchData.fixture?.status?.short === 'LIVE',
      homeScore: matchData.score?.home || matchData.goals?.home || 0,
      awayScore: matchData.score?.away || matchData.goals?.away || 0,
      statistics: matchData.rawData?.statistics || matchData.statistics || [],
    };

    // Use AI to analyze the match and explain predictions
    const query = userQuery || `Analyze the match between ${matchDataForAI.homeTeam} and ${matchDataForAI.awayTeam}. Who will win and why? What are the key factors? Include goal prediction and confidence levels.`;
    
    let aiAnalysis = await analyzeMatch(matchDataForAI, predictions, query);
    
    // CRITICAL: Ensure analysis is never empty or blank
    if (!aiAnalysis || typeof aiAnalysis !== 'string' || aiAnalysis.trim().length === 0) {
      console.error('[AIAssistant] Empty AI analysis received, using fallback');
      aiAnalysis = `Based on the available data for ${matchDataForAI.homeTeam} vs ${matchDataForAI.awayTeam}:

**Analysis:**
- League: ${matchDataForAI.league}
- Match Date: ${matchDataForAI.matchDate || 'TBD'}
- Status: ${matchDataForAI.isLive ? 'LIVE' : 'Scheduled'}

**Confidence Level:** Low (Limited data available)

⚠️ **Risk Disclaimer:** The AI analysis service encountered an issue generating detailed analysis. Predictions are based on statistical analysis and should not be considered guarantees. Sports outcomes are inherently unpredictable.

For a detailed prediction, please try again or contact support.`;
    }

    const processingTime = Date.now() - startTime;

    // Log the request
    try {
      await AIRequestLog.create({
        userId,
        userIP,
        message: query,
        responseLength: aiAnalysis.length,
        matchId: matchId.toString(),
        sport,
        isVIP,
        success: true,
        processingTime,
      });
    } catch (logError) {
      console.error('[AIAssistant] Error logging prediction request:', logError);
    }

    return sendSuccess(
      res,
      {
        prediction: {
          matchId,
          sport,
          homeTeam: matchDataForAI.homeTeam,
          awayTeam: matchDataForAI.awayTeam,
          league: matchDataForAI.league,
          matchDate: matchDataForAI.matchDate,
          isLive: matchDataForAI.isLive,
          aiAnalysis, // AI-generated explanation
          predictions: predictions.map(p => ({
            tip: p.tip || p.prediction,
            confidence: p.confidence,
            notes: p.notes,
            type: p.predictionType,
          })),
          generatedAt: new Date(),
        },
        usage: userId ? {
          remaining: isVIP ? 'unlimited' : Math.max(0, 5 - (await AIUsage.getTodayUsage(userId)).count),
          isVIP,
        } : null,
      },
      'Match prediction generated successfully'
    );
  } catch (error) {
    console.error('[AIAssistant] Error in predictMatch:', error);
    
    // Log the error
    try {
      await AIRequestLog.create({
        userId,
        userIP: req.ip || 'unknown',
        message: `Match prediction request for ${req.body?.matchId || 'unknown'}`,
        matchId: req.body?.matchId?.toString(),
        sport: req.body?.sport || 'football',
        isVIP,
        success: false,
        errorMessage: error.message,
        processingTime: Date.now() - startTime,
      });
    } catch (logError) {
      console.error('[AIAssistant] Error logging failed prediction request:', logError);
    }
    
    return sendError(res, 'Failed to generate match prediction', 500);
  }
};

module.exports = {
  getWebAnalytics,
  chat,
  predictMatch,
};
