const Prediction = require('../models/Prediction');
const { translate } = require('../utils/translations');
const { paginate } = require('../utils/helpers');
const { generatePredictions, generatePredictionsFromLiveFixtures } = require('../services/predictionEngine');
const { getFootballFixtures } = require('../services/apiFootball');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
} = require('../utils/responseHandler');

// Create prediction (Admin only)
const createPrediction = async (req, res) => {
  try {
    const { homeTeam, awayTeam, league, matchStart, predictionType, confidence, notes, isVIP, sport } = req.body;

    // Validate required fields
    const errors = [];
    if (!homeTeam || !homeTeam.trim()) {
      errors.push('Home team is required');
    }
    if (!awayTeam || !awayTeam.trim()) {
      errors.push('Away team is required');
    }
    if (!league || !league.trim()) {
      errors.push('League is required');
    }
    if (!matchStart) {
      errors.push('Match start date is required');
    }
    if (!predictionType) {
      errors.push('Prediction type is required');
    }
    if (!req.body.prediction || !req.body.prediction.trim()) {
      errors.push('Prediction text is required');
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Validate predictionType
    const validTypes = ['all', 'banker', 'surprise', 'vip'];
    if (!validTypes.includes(predictionType)) {
      return sendValidationError(res, `Invalid prediction type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate confidence
    const conf = confidence || 50;
    if (conf < 0 || conf > 100) {
      return sendValidationError(res, 'Confidence must be between 0 and 100');
    }

    // Validate match start date
    const matchStartDate = new Date(matchStart);
    if (isNaN(matchStartDate.getTime())) {
      return sendValidationError(res, 'Invalid match start date format');
    }

    // Create prediction
    const prediction = await Prediction.create({
      homeTeam,
      awayTeam,
      league,
      matchStart: new Date(matchStart),
      predictionType,
      confidence: conf,
      notes: notes || '',
      isVIP: isVIP || false,
      sport: sport || 'football',
      createdBy: req.user._id,
      prediction: req.body.prediction.trim(),
    });

    console.log(`[PredictionController] Prediction created: ${prediction._id} by admin: ${req.user._id}`);
    return sendSuccess(res, { prediction }, 'Prediction created successfully', 201);
  } catch (error) {
    console.error('[PredictionController] Error creating prediction:', error);
    return sendError(res, error.message || 'Failed to create prediction', 500);
  }
};

// Get all predictions (Public - non-VIP only)
// PRIMARY SOURCE: Live matches API
// SECONDARY SOURCE: Stored predictions (DB)
const getAllPredictions = async (req, res) => {
  try {
    const { sport = 'football', page = 1, limit = 50, includePast = 'false' } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);
    
    // Build query for DB predictions
    const query = {
      isPublic: true,
      isVIP: false,
      predictionType: { $ne: 'vip' },
      sport,
    };

    // Only filter by future matches if includePast is false
    // Show matches from the last 24 hours to include today's matches that might have started
    if (includePast === 'false') {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      query.matchStart = { $gte: yesterday };
      // 🔍 DEBUG: Log date filter
      console.log('[DEBUG getAllPredictions] Date filter applied:', {
        includePast,
        yesterday: yesterday.toISOString(),
        now: new Date().toISOString(),
        filter: 'matchStart >= yesterday (24h ago)'
      });
    } else {
      console.log('[DEBUG getAllPredictions] No date filter (includePast=true)');
    }
    
    // STEP 1: Try to get predictions from DB first
    let predictions = await Prediction.find(query)
      .sort({ matchStart: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Prediction.countDocuments(query);
    
    // 🔍 DEBUG: Log DB predictions count
    console.log('[DEBUG getAllPredictions] DB predictions count:', predictions.length);
    console.log('[DEBUG getAllPredictions] DB total count:', total);

    // STEP 2: If no DB predictions, generate from live matches API
    if (predictions.length === 0 && sport === 'football') {
      console.log('[PredictionController] No DB predictions found, generating from live matches API...');
      
      try {
        // Fetch today's fixtures from live API
        const today = new Date().toISOString().split('T')[0];
        const apiResult = await getFootballFixtures(today, null);
        
        // 🔍 DEBUG: Log live fixtures count
        const liveFixturesCount = apiResult.success && Array.isArray(apiResult.data) ? apiResult.data.length : 0;
        console.log('[DEBUG getAllPredictions] Live fixtures count from API:', liveFixturesCount);
        
        if (apiResult.success && Array.isArray(apiResult.data) && apiResult.data.length > 0) {
          // Filter for upcoming matches only
          const now = new Date();
          const upcomingFixtures = apiResult.data.filter(fixture => {
            const status = fixture.fixture?.status?.short || fixture.fixture?.status?.long;
            const matchDate = fixture.fixture?.date ? new Date(fixture.fixture.date) : null;
            const isUpcoming = matchDate && matchDate >= now;
            const isValidStatus = ['NS', 'TBD', 'SCHEDULED', 'NOT_STARTED'].includes(status);
            const shouldInclude = isUpcoming && isValidStatus;
            
            // 🔍 DEBUG: Log filter details for first few fixtures
            if (apiResult.data.indexOf(fixture) < 3) {
              console.log('[DEBUG getAllPredictions] Fixture filter check:', {
                homeTeam: fixture.teams?.home?.name,
                awayTeam: fixture.teams?.away?.name,
                matchDate: matchDate?.toISOString(),
                now: now.toISOString(),
                isUpcoming,
                status,
                isValidStatus,
                shouldInclude
              });
            }
            
            return shouldInclude;
          });

          console.log('[DEBUG getAllPredictions] Upcoming fixtures after filter:', upcomingFixtures.length);

          if (upcomingFixtures.length > 0) {
            console.log(`[PredictionController] Found ${upcomingFixtures.length} upcoming fixtures, generating predictions...`);
            
            // Generate predictions on-the-fly from live fixtures
            const generatedPredictions = await generatePredictionsFromLiveFixtures(upcomingFixtures);
            
            // 🔍 DEBUG: Log generated predictions count
            const generatedCount = generatedPredictions && Array.isArray(generatedPredictions) ? generatedPredictions.length : 0;
            console.log('[DEBUG getAllPredictions] Generated predictions count (before filter):', generatedCount);
            
            if (generatedPredictions && generatedPredictions.length > 0) {
              // Filter to match query criteria (non-VIP, public)
              const filteredPredictions = generatedPredictions
                .filter(p => !p.isVIP && p.predictionType !== 'vip')
                .slice(skip, skip + limitNum);
              
              console.log('[DEBUG getAllPredictions] Filtered predictions count (after VIP filter):', filteredPredictions.length);
              
              // Transform to match DB format
              predictions = filteredPredictions.map((pred, index) => ({
                _id: `live-${pred.matchId}-${pred.tip.replace(/\s+/g, '-')}-${index}`, // Temporary ID for live predictions
                matchId: pred.matchId,
                homeTeam: pred.homeTeam,
                awayTeam: pred.awayTeam,
                league: pred.league,
                matchStart: pred.matchTime,
                matchTime: pred.matchTime, // Add matchTime for frontend compatibility
                predictionType: pred.predictionType || 'all',
                confidence: pred.confidence,
                notes: pred.notes || '',
                isVIP: false,
                isPublic: true,
                sport: 'football',
                prediction: pred.tip,
                tip: pred.tip,
                source: 'live-api',
                createdAt: new Date(),
              }));

              console.log(`[PredictionController] ✅ Generated ${predictions.length} predictions from live matches`);
            } else {
              console.log('[DEBUG getAllPredictions] No predictions generated from fixtures');
            }
          } else {
            console.log('[DEBUG getAllPredictions] No upcoming fixtures found');
          }
        } else {
          console.log('[DEBUG getAllPredictions] API result not successful or empty:', {
            success: apiResult?.success,
            isArray: Array.isArray(apiResult?.data),
            dataLength: apiResult?.data?.length
          });
        }
      } catch (apiError) {
        console.error('[PredictionController] Error generating predictions from live API:', apiError.message);
        // Continue with empty predictions if API fails
      }
    }

    // STEP 3: Return predictions (from DB or generated from live API)
    if (predictions.length === 0) {
      const emptyResponse = {
        success: true,
        data: {
          predictions: [],
          count: 0,
          pagination: {
            page: parseInt(page) || 1,
            limit: limitNum,
            total: 0,
            pages: 0,
          },
        },
        message: 'No predictions available. No live matches found at the moment.',
      };
      // 🔍 DEBUG: Log final response when empty
      console.log('[DEBUG getAllPredictions] FINAL RESPONSE (empty):', JSON.stringify(emptyResponse, null, 2));
      return res.json(emptyResponse);
    }

    const successResponse = {
      predictions,
      count: predictions.length,
      pagination: {
        page: parseInt(page) || 1,
        limit: limitNum,
        total: predictions.length, // Use generated count for live predictions
        pages: Math.ceil(predictions.length / limitNum),
      },
      source: total > 0 ? 'database' : 'live-api',
    };
    
    // 🔍 DEBUG: Log final response with predictions
    console.log('[DEBUG getAllPredictions] FINAL RESPONSE (with predictions):', JSON.stringify({
      ...successResponse,
      predictions: successResponse.predictions.map(p => ({
        _id: p._id,
        homeTeam: p.homeTeam,
        awayTeam: p.awayTeam,
        predictionType: p.predictionType,
        isVIP: p.isVIP,
        matchStart: p.matchStart
      }))
    }, null, 2));
    console.log('[DEBUG getAllPredictions] Predictions array length:', predictions.length);

    return sendSuccess(
      res,
      successResponse,
      'Predictions retrieved successfully'
    );
  } catch (error) {
    console.error('[PredictionController] Error fetching all predictions:', error);
    return sendError(res, error.message || 'Failed to fetch predictions', 500);
  }
};

// Get Banker predictions (Public)
// PRIMARY SOURCE: Live matches API
// SECONDARY SOURCE: Stored predictions (DB)
const getBanker = async (req, res) => {
  try {
    const { sport = 'football', page = 1, limit = 50, includePast = 'false' } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);
    
    // Build query for DB predictions
    const query = {
      isPublic: true,
      predictionType: 'banker',
      isVIP: false,
      sport,
    };

    // Only filter by future matches if includePast is false
    if (includePast === 'false') {
      query.matchStart = { $gte: new Date() };
    }
    
    // STEP 1: Try to get predictions from DB first
    let predictions = await Prediction.find(query)
      .sort({ matchStart: -1, confidence: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Prediction.countDocuments(query);

    // STEP 2: If no DB predictions, generate from live matches API
    if (predictions.length === 0 && sport === 'football') {
      console.log('[PredictionController] No DB banker predictions found, generating from live matches API...');
      
      try {
        // Fetch today's fixtures from live API
        const today = new Date().toISOString().split('T')[0];
        const apiResult = await getFootballFixtures(today, null);
        
        if (apiResult.success && Array.isArray(apiResult.data) && apiResult.data.length > 0) {
          // Filter for upcoming matches only
          const upcomingFixtures = apiResult.data.filter(fixture => {
            const status = fixture.fixture?.status?.short || fixture.fixture?.status?.long;
            const matchDate = fixture.fixture?.date ? new Date(fixture.fixture.date) : null;
            const isUpcoming = matchDate && matchDate >= new Date();
            const isValidStatus = ['NS', 'TBD', 'SCHEDULED', 'NOT_STARTED'].includes(status);
            return isUpcoming && isValidStatus;
          });

          if (upcomingFixtures.length > 0) {
            console.log(`[PredictionController] Found ${upcomingFixtures.length} upcoming fixtures, generating banker predictions...`);
            
            // Generate predictions on-the-fly from live fixtures
            const generatedPredictions = await generatePredictionsFromLiveFixtures(upcomingFixtures);
            
            if (generatedPredictions && generatedPredictions.length > 0) {
              // Filter to match query criteria (banker type, non-VIP)
              const filteredPredictions = generatedPredictions
                .filter(p => p.predictionType === 'banker' && !p.isVIP)
                .sort((a, b) => b.confidence - a.confidence)
                .slice(skip, skip + limitNum);
              
              // Transform to match DB format
              predictions = filteredPredictions.map(pred => ({
                _id: pred.matchId + '-' + pred.tip,
                matchId: pred.matchId,
                homeTeam: pred.homeTeam,
                awayTeam: pred.awayTeam,
                league: pred.league,
                matchStart: pred.matchTime,
                predictionType: pred.predictionType,
                confidence: pred.confidence,
                notes: pred.notes || '',
                isVIP: false,
                isPublic: true,
                sport: 'football',
                prediction: pred.tip,
                tip: pred.tip,
                source: 'live-api',
                createdAt: new Date(),
              }));

              console.log(`[PredictionController] ✅ Generated ${predictions.length} banker predictions from live matches`);
            }
          }
        }
      } catch (apiError) {
        console.error('[PredictionController] Error generating banker predictions from live API:', apiError.message);
        // Continue with empty predictions if API fails
      }
    }

    // STEP 3: Return predictions (from DB or generated from live API)
    if (predictions.length === 0) {
      return res.json({
        success: true,
        data: { predictions: [] },
        count: 0,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
        message: 'No banker predictions available. No live matches found at the moment.',
      });
    }

    res.json({
      success: true,
      data: { predictions },
      count: predictions.length,
      pagination: {
        page: parseInt(page) || 1,
        limit: limitNum,
        total: predictions.length,
        pages: Math.ceil(predictions.length / limitNum),
      },
      source: total > 0 ? 'database' : 'live-api',
    });
  } catch (error) {
    console.error('[PredictionsController] Error fetching banker predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch banker predictions',
      data: { predictions: [] },
      count: 0,
    });
  }
};

// Get Surprise predictions (Public)
// PRIMARY SOURCE: Live matches API
// SECONDARY SOURCE: Stored predictions (DB)
const getSurprise = async (req, res) => {
  try {
    const { sport = 'football', page = 1, limit = 50, includePast = 'false' } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);
    
    // Build query for DB predictions
    const query = {
      isPublic: true,
      predictionType: 'surprise',
      isVIP: false,
      sport,
    };

    // Only filter by future matches if includePast is false
    if (includePast === 'false') {
      query.matchStart = { $gte: new Date() };
    }
    
    // STEP 1: Try to get predictions from DB first
    let predictions = await Prediction.find(query)
      .sort({ matchStart: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Prediction.countDocuments(query);

    // STEP 2: If no DB predictions, generate from live matches API
    if (predictions.length === 0 && sport === 'football') {
      console.log('[PredictionController] No DB surprise predictions found, generating from live matches API...');
      
      try {
        // Fetch today's fixtures from live API
        const today = new Date().toISOString().split('T')[0];
        const apiResult = await getFootballFixtures(today, null);
        
        if (apiResult.success && Array.isArray(apiResult.data) && apiResult.data.length > 0) {
          // Filter for upcoming matches only
          const upcomingFixtures = apiResult.data.filter(fixture => {
            const status = fixture.fixture?.status?.short || fixture.fixture?.status?.long;
            const matchDate = fixture.fixture?.date ? new Date(fixture.fixture.date) : null;
            const isUpcoming = matchDate && matchDate >= new Date();
            const isValidStatus = ['NS', 'TBD', 'SCHEDULED', 'NOT_STARTED'].includes(status);
            return isUpcoming && isValidStatus;
          });

          if (upcomingFixtures.length > 0) {
            console.log(`[PredictionController] Found ${upcomingFixtures.length} upcoming fixtures, generating surprise predictions...`);
            
            // Generate predictions on-the-fly from live fixtures
            const generatedPredictions = await generatePredictionsFromLiveFixtures(upcomingFixtures);
            
            if (generatedPredictions && generatedPredictions.length > 0) {
              // Filter to match query criteria (surprise type, non-VIP)
              const filteredPredictions = generatedPredictions
                .filter(p => p.predictionType === 'surprise' && !p.isVIP)
                .sort((a, b) => new Date(b.matchTime) - new Date(a.matchTime))
                .slice(skip, skip + limitNum);
              
              // Transform to match DB format
              predictions = filteredPredictions.map(pred => ({
                _id: pred.matchId + '-' + pred.tip,
                matchId: pred.matchId,
                homeTeam: pred.homeTeam,
                awayTeam: pred.awayTeam,
                league: pred.league,
                matchStart: pred.matchTime,
                predictionType: pred.predictionType,
                confidence: pred.confidence,
                notes: pred.notes || '',
                isVIP: false,
                isPublic: true,
                sport: 'football',
                prediction: pred.tip,
                tip: pred.tip,
                source: 'live-api',
                createdAt: new Date(),
              }));

              console.log(`[PredictionController] ✅ Generated ${predictions.length} surprise predictions from live matches`);
            }
          }
        }
      } catch (apiError) {
        console.error('[PredictionController] Error generating surprise predictions from live API:', apiError.message);
        // Continue with empty predictions if API fails
      }
    }

    // STEP 3: Return predictions (from DB or generated from live API)
    if (predictions.length === 0) {
      return res.json({
        success: true,
        data: { predictions: [] },
        count: 0,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
        message: 'No surprise predictions available. No live matches found at the moment.',
      });
    }

    res.json({
      success: true,
      data: { predictions },
      count: predictions.length,
      pagination: {
        page: parseInt(page) || 1,
        limit: limitNum,
        total: predictions.length,
        pages: Math.ceil(predictions.length / limitNum),
      },
      source: total > 0 ? 'database' : 'live-api',
    });
  } catch (error) {
    console.error('[PredictionsController] Error fetching surprise predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch surprise predictions',
      data: { predictions: [] },
      count: 0,
    });
  }
};

// Get VIP predictions (VIP only)
// VIP status is now enforced via requireVIP middleware in routes
const getVIP = async (req, res) => {
  try {
    const { sport = 'football', page = 1, limit = 50 } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);
    
    // VIP status already verified by requireVIP middleware
    // req.user and req.membership are available
    const userId = req.user._id;
    
    console.log(`[PredictionsController] VIP predictions requested by user ${userId} (sport: ${sport})`);
    
    const { includePast = 'false' } = req.query;
    
    // Build query
    const query = {
      isPublic: true,
      $or: [
        { isVIP: true },
        { predictionType: 'vip' }
      ],
      sport,
    };

    // Only filter by future matches if includePast is false
    if (includePast === 'false') {
      query.matchStart = { $gte: new Date() };
    }
    
    const predictions = await Prediction.find(query)
      .sort({ matchStart: -1, confidence: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Prediction.countDocuments(query);

    // If no predictions found, check if any exist at all
    if (predictions.length === 0) {
      const totalVIP = await Prediction.countDocuments({
        $or: [
          { isVIP: true },
          { predictionType: 'vip' }
        ],
        sport,
      });
      const totalPublic = await Prediction.countDocuments({
        isPublic: true,
        sport,
      });
      
      return res.json({
        success: true,
        data: { predictions: [] },
        count: 0,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
        message: totalVIP === 0 
          ? 'No VIP predictions found. Generate predictions using /api/predictions/generate (Admin only)'
          : totalPublic === 0
          ? 'No public predictions found. Check isPublic field.'
          : 'No upcoming VIP predictions found. Try adding ?includePast=true to see past predictions.',
        diagnostic: {
          totalVIPPredictions: totalVIP,
          totalPublicPredictions: totalPublic,
          filter: includePast === 'true' ? 'all' : 'upcoming only',
        },
      });
    }

    res.json({
      success: true,
      data: { predictions },
      count: predictions.length,
      pagination: {
        page: parseInt(page) || 1,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[PredictionsController] Error fetching VIP predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch VIP predictions',
      data: { predictions: [] },
      count: 0,
    });
  }
};

// Get all predictions (legacy - for pagination)
const getPredictions = async (req, res) => {
  try {
    const { page, limit, predictionType, status, sport } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    const filter = { isPublic: true, isVIP: false };
    if (predictionType) filter.predictionType = predictionType;
    if (status) filter.status = status;
    if (sport) filter.sport = sport;

    const predictions = await Prediction.find(filter)
      .populate('createdBy', 'username')
      .skip(skip)
      .limit(limitNum)
      .sort({ matchStart: 1, createdAt: -1 });

    const total = await Prediction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch predictions',
    });
  }
};

// Get single prediction
const getPrediction = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Prediction ID is required',
      });
    }
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID format',
      });
    }
    
    const prediction = await Prediction.findById(id)
      .populate('createdBy', 'name username');

    if (!prediction) {
      return sendNotFound(res, 'Prediction not found');
    }

    // Check VIP access
    if (prediction.isVIP || prediction.predictionType === 'vip') {
      if (!req.user) {
        return sendUnauthorized(res, 'Authentication required for VIP predictions');
      }
      
      const userId = req.user._id;
      const now = new Date();
      
      // Check Membership model first
      const Membership = require('../models/Membership');
      const membership = await Membership.findOne({ userId });
      
      // Auto-disable expired VIP
      if (membership && membership.vipStatus && membership.vipExpiry) {
        if (new Date(membership.vipExpiry) <= now) {
          membership.vipStatus = false;
          membership.vipPlan = 'none';
          await membership.save();
          
          // Sync with User model
          await User.findByIdAndUpdate(userId, {
            isVIP: false,
            vipPlan: 'none',
          });
          
          console.log(`[PredictionsController] Auto-disabled expired VIP for user ${userId} when accessing VIP prediction ${id}`);
          return sendForbidden(res, 'VIP membership required to view this prediction. Your membership has expired.');
        }
      }
      
      let isVIPActive = false;
      if (membership && membership.isActive()) {
        isVIPActive = true;
        console.log(`[PredictionsController] VIP prediction ${id} accessed by VIP user ${userId}`);
      } else if (req.user && req.user.isVIPActive && req.user.isVIPActive()) {
        // Fallback to User model
        isVIPActive = true;
        console.log(`[PredictionsController] VIP prediction ${id} accessed by VIP user ${userId} (User model)`);
      }
      
      if (!isVIPActive) {
        console.log(`[PredictionsController] VIP prediction ${id} access denied to user ${userId} - not VIP`);
        return sendForbidden(res, 'VIP membership required to view this prediction');
      }
    }

    // Increment views
    prediction.views = (prediction.views || 0) + 1;
    await prediction.save();

    return sendSuccess(res, { prediction }, 'Prediction retrieved successfully');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch prediction',
    });
  }
};

// Get user's predictions (if needed for admin)
const getMyPredictions = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    const predictions = await Prediction.find({ createdBy: req.user._id })
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Prediction.countDocuments({ createdBy: req.user._id });

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch predictions',
    });
  }
};

// Update prediction (Admin only)
const updatePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    // Only admin can update
    if (req.user.role !== 'admin') {
      return sendForbidden(res, 'Admin access required');
    }

    // Update fields
    const updateData = {};
    if (req.body.homeTeam) updateData.homeTeam = req.body.homeTeam;
    if (req.body.awayTeam) updateData.awayTeam = req.body.awayTeam;
    if (req.body.league) updateData.league = req.body.league;
    if (req.body.matchStart) updateData.matchStart = new Date(req.body.matchStart);
    if (req.body.predictionType) updateData.predictionType = req.body.predictionType;
    if (req.body.confidence !== undefined) updateData.confidence = req.body.confidence;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.isVIP !== undefined) updateData.isVIP = req.body.isVIP;
    if (req.body.prediction) updateData.prediction = req.body.prediction;
    if (req.body.sport) updateData.sport = req.body.sport;

    const updated = await Prediction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Prediction updated successfully',
      data: { prediction: updated },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update prediction',
    });
  }
};

// Delete prediction (Admin only)
const deletePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    // Only admin can delete
    if (req.user.role !== 'admin') {
      return sendForbidden(res, 'Admin access required');
    }

    await Prediction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Prediction deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete prediction',
    });
  }
};

// Generate predictions (Admin only)
const generatePredictionsEndpoint = async (req, res) => {
  try {
    const { date } = req.body;

    // Validate date if provided
    if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
        });
      }
    }

    console.log('[PredictionsController] Starting prediction generation...');
    const result = await generatePredictions(date);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to generate predictions',
        data: result,
      });
    }

    res.json({
      success: true,
      message: `Generated ${result.generated} predictions`,
      data: result,
    });
  } catch (error) {
    console.error('[PredictionsController] Error generating predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate predictions',
    });
  }
};

module.exports = {
  createPrediction,
  getAllPredictions,
  getBanker,
  getSurprise,
  getVIP,
  getPredictions,
  getPrediction,
  getMyPredictions,
  updatePrediction,
  deletePrediction,
  generatePredictionsEndpoint,
};
