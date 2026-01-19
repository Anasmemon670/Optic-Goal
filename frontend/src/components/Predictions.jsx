import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Lock, Shield, Zap, X, Calendar, Clock, TrendingUp, BarChart3, Info } from 'lucide-react';
import { BannerAd, SidebarAd } from './GoogleAds';
import { PredictionCard } from './PredictionCard';
import { getToken } from '../utils/auth';
import {
  getAllPredictions,
  getBankerPredictions,
  getSurprisePredictions,
  getVIPPredictions,
  getPredictionById,
} from '../api/predictionsApi';

export function Predictions({ isAuthenticated, isVIP = false, showAds = true }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // API function for fetching predictions
  async function fetchPredictions(category = 'all') {
    setLoading(true);
    try {
      const token = getToken();
      let result;

      if (category === 'banker') {
        result = await getBankerPredictions();
      } else if (category === 'surprise') {
        result = await getSurprisePredictions();
      } else if (category === 'vip') {
        if (!isAuthenticated || !isVIP) {
          setPredictions([]);
          setLoading(false);
          return;
        }
        result = await getVIPPredictions(token);
      } else {
        // 'all' category - show all non-VIP predictions
        result = await getAllPredictions();
      }

      // 🔍 DEBUG: Log raw API response
      console.log('[DEBUG Predictions.jsx] Raw API response:', JSON.stringify(result, null, 2));
      console.log('[DEBUG Predictions.jsx] result.success:', result.success);
      console.log('[DEBUG Predictions.jsx] result.data:', result.data);
      console.log('[DEBUG Predictions.jsx] result.data?.predictions:', result.data?.predictions);
      console.log('[DEBUG Predictions.jsx] result.data?.predictions?.length:', result.data?.predictions?.length);
      console.log('[DEBUG Predictions.jsx] Array.isArray(result.data?.predictions):', Array.isArray(result.data?.predictions));

      // 🔍 BUG CHECK: Empty array truthy check
      if (result.success && result.data?.predictions) {
        console.log('[DEBUG Predictions.jsx] ⚠️ BUG: Using truthy check on array - empty array is truthy!');
        console.log('[DEBUG Predictions.jsx] Should check: result.data?.predictions?.length > 0');
      }

      if (result.success && result.data?.predictions && result.data.predictions.length > 0) {
        // Transform API data to match component format
        const transformed = result.data.predictions.map(pred => ({
          id: pred._id || pred.id,
          matchId: pred.matchId,
          predictionType: pred.predictionType || 'all',
          tip: pred.tip || pred.prediction || 'TBD',
          prediction: pred.prediction || pred.tip || 'TBD', // Backward compatibility
          confidence: pred.confidence || 50,
          homeTeam: pred.homeTeam || 'TBD',
          awayTeam: pred.awayTeam || 'TBD',
          league: pred.league || 'Unknown League',
          matchStart: pred.matchStart || pred.matchTime || pred.matchDate || new Date(),
          matchTime: pred.matchTime || pred.matchStart || pred.matchDate || new Date(),
          notes: pred.notes || '',
          isVIP: pred.isVIP || pred.predictionType === 'vip',
          source: pred.source || 'api-football',
        }));
        
        // 🔍 DEBUG: Log transformed array used to render
        console.log('[DEBUG Predictions.jsx] Transformed predictions array:', transformed);
        console.log('[DEBUG Predictions.jsx] Transformed array length:', transformed.length);
        console.log('[DEBUG Predictions.jsx] First prediction sample:', transformed[0]);
        
        setPredictions(transformed);
      } else {
        console.log('[DEBUG Predictions.jsx] Setting predictions to empty array');
        console.log('[DEBUG Predictions.jsx] Reason - success:', result.success, 'predictions length:', result.data?.predictions?.length);
        setPredictions([]);
        // Show error if result exists but failed
        if (result && !result.success) {
          console.error('Error fetching predictions:', result.message || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
      // Ensure error is visible in console for debugging
      // In production, could add error state to show to user
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPredictions(selectedCategory);
  }, [selectedCategory, isVIP, isAuthenticated]);

  const categories = [
    { id: 'all', label: 'All Predictions', icon: Target, color: 'from-gray-500 to-gray-600' },
    { id: 'banker', label: 'Banker', icon: Shield, color: 'from-green-500 to-green-600', description: 'High confidence' },
    { id: 'surprise', label: 'Surprise', icon: Zap, color: 'from-amber-500 to-amber-600', description: 'Dark horses' },
    { id: 'vip', label: 'VIP Only', icon: Lock, color: 'from-amber-500 to-amber-600', description: 'Exclusive predictions' },
  ];

  // Filter predictions based on selected category
  // The API already filters, but we do client-side filtering as backup
  const filteredPredictions = predictions.filter(pred => {
    if (selectedCategory === 'all') {
      // Show all non-VIP predictions
      const shouldShow = !pred.isVIP && pred.predictionType !== 'vip';
      // 🔍 DEBUG: Log filter results
      if (!shouldShow) {
        console.log('[DEBUG Predictions.jsx] Filtered out (all):', {
          id: pred.id,
          isVIP: pred.isVIP,
          predictionType: pred.predictionType
        });
      }
      return shouldShow;
    } else if (selectedCategory === 'banker') {
      // Show only banker predictions (non-VIP)
      const shouldShow = pred.predictionType === 'banker' && !pred.isVIP;
      if (!shouldShow) {
        console.log('[DEBUG Predictions.jsx] Filtered out (banker):', {
          id: pred.id,
          predictionType: pred.predictionType,
          isVIP: pred.isVIP
        });
      }
      return shouldShow;
    } else if (selectedCategory === 'surprise') {
      // Show only surprise predictions (non-VIP)
      const shouldShow = pred.predictionType === 'surprise' && !pred.isVIP;
      if (!shouldShow) {
        console.log('[DEBUG Predictions.jsx] Filtered out (surprise):', {
          id: pred.id,
          predictionType: pred.predictionType,
          isVIP: pred.isVIP
        });
      }
      return shouldShow;
    } else if (selectedCategory === 'vip') {
      // Show only VIP predictions
      const shouldShow = pred.isVIP || pred.predictionType === 'vip';
      if (!shouldShow) {
        console.log('[DEBUG Predictions.jsx] Filtered out (vip):', {
          id: pred.id,
          isVIP: pred.isVIP,
          predictionType: pred.predictionType
        });
      }
      return shouldShow;
    }
    return true;
  });
  
  // 🔍 DEBUG: Log filter results
  console.log('[DEBUG Predictions.jsx] Filtered predictions count:', filteredPredictions.length);
  console.log('[DEBUG Predictions.jsx] Original predictions count:', predictions.length);
  console.log('[DEBUG Predictions.jsx] Selected category:', selectedCategory);

  // Handle view details
  const handleViewDetails = async (predictionId) => {
    if (!predictionId) {
      alert('Error: No prediction ID provided');
      return;
    }
    
    setLoadingDetails(true);
    setShowDetailsModal(true);
    try {
      const token = getToken();
      const result = await getPredictionById(predictionId, token);
      
      if (result.success && result.data?.prediction) {
        setSelectedPrediction(result.data.prediction);
      } else {
        const errorMsg = result.error || result.message || 'Unknown error';
        alert('Failed to load prediction details: ' + errorMsg);
        setShowDetailsModal(false);
        setSelectedPrediction(null);
      }
    } catch (error) {
      console.error('Error fetching prediction details:', error);
      alert('Error loading prediction details: ' + error.message);
      setShowDetailsModal(false);
      setSelectedPrediction(null);
    } finally {
      setLoadingDetails(false);
    }
  };


  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl mb-4">
            Predictions
          </h1>
          <p className="text-gray-400 text-lg">Match predictions for today's games</p>
        </motion.div>

        {/* Top Banner Ad - Only for regular users */}
        {showAds && (
          <div className="mb-8">
            <BannerAd />
          </div>
        )}

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`relative px-6 py-3 rounded-xl flex items-center space-x-2 transition-all overflow-hidden ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategory"
                    className={`absolute inset-0 bg-gradient-to-r ${category.color} rounded-xl`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-gray-900 border border-amber-500/20 rounded-xl" />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <div className="relative z-10">
                  <div>{category.label}</div>
                  {category.description && (
                    <div className="text-xs opacity-75">{category.description}</div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Predictions Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-gray-400">Loading predictions...</p>
              </div>
            ) : selectedCategory === 'vip' && (!isAuthenticated || !isVIP) ? (
              <div className="text-center py-12">
                <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">VIP Only Predictions</p>
                <p className="text-gray-500 text-sm">
                  {!isAuthenticated ? 'Please log in to view VIP predictions' : 'Upgrade to VIP to access exclusive predictions'}
                </p>
              </div>
            ) : filteredPredictions.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No predictions available</p>
                <p className="text-gray-500 text-sm">Check back later for new predictions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredPredictions.map((prediction, index) => (
                  <PredictionCard
                    key={prediction.id || prediction._id}
                    prediction={prediction}
                    index={index}
                    isVIP={isVIP}
                    isAuthenticated={isAuthenticated}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Ad - Only for regular users */}
          {showAds && (
            <div className="hidden lg:block">
              <SidebarAd />
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {!loading && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              { label: 'Total Predictions', value: predictions.length.toString(), color: 'from-green-500 to-green-600' },
              { label: 'Active Today', value: predictions.filter(p => {
                if (!p.matchStart) return false;
                const matchDate = new Date(p.matchStart);
                const today = new Date();
                return matchDate.toDateString() === today.toDateString();
              }).length.toString(), color: 'from-amber-500 to-amber-600' },
            ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-xl p-6 text-center"
              whileHover={{ y: -4 }}
            >
              <div className={`text-3xl mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
          </motion.div>
        )}

        {/* Prediction Details Modal */}
        <AnimatePresence>
          {showDetailsModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPrediction(null);
                }}
                className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  {loadingDetails ? (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
                      />
                      <p className="text-gray-400">Loading prediction details...</p>
                    </div>
                  ) : selectedPrediction ? (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Prediction Details</h2>
                        <button
                          onClick={() => {
                            setShowDetailsModal(false);
                            setSelectedPrediction(null);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Match Info */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm text-gray-400 uppercase">{selectedPrediction.league || 'Unknown League'}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>
                              {selectedPrediction.matchStart || selectedPrediction.matchTime
                                ? new Date(selectedPrediction.matchStart || selectedPrediction.matchTime).toLocaleString()
                                : 'TBD'}
                            </span>
                          </div>
                        </div>
                        <div className="text-center mb-6">
                          <div className="text-2xl text-white font-bold mb-2">{selectedPrediction.homeTeam || 'TBD'}</div>
                          <div className="text-gray-500 text-sm mb-2">VS</div>
                          <div className="text-2xl text-white font-bold">{selectedPrediction.awayTeam || 'TBD'}</div>
                        </div>
                      </div>

                      {/* Prediction Tip */}
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                        <div className="text-xs text-gray-400 mb-2 uppercase">Tip</div>
                        <div className="text-xl text-amber-500 font-bold mb-4">
                          {selectedPrediction.tip || selectedPrediction.prediction || 'TBD'}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Confidence</span>
                          <span className="text-lg text-amber-500 font-semibold">{selectedPrediction.confidence || 50}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedPrediction.confidence || 50}%` }}
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                          />
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="text-xs text-gray-400 mb-2">Source</div>
                          <div className="text-white">
                            {selectedPrediction.source === 'ai' ? 'AI Generated' :
                             selectedPrediction.source === 'api-football' ? 'API-Football' :
                             selectedPrediction.source || 'Manual'}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="text-xs text-gray-400 mb-2">Category</div>
                          <div className="text-white capitalize">
                            {selectedPrediction.predictionType || 'Standard'}
                          </div>
                        </div>
                        {selectedPrediction.matchId && (
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="text-xs text-gray-400 mb-2">Match ID</div>
                            <div className="text-white">{selectedPrediction.matchId}</div>
                          </div>
                        )}
                        {selectedPrediction.views !== undefined && (
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="text-xs text-gray-400 mb-2">Views</div>
                            <div className="text-white">{selectedPrediction.views || 0}</div>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {selectedPrediction.notes && (
                        <div className="mb-6">
                          <div className="text-sm text-gray-400 mb-2 flex items-center space-x-2">
                            <Info className="w-4 h-4" />
                            <span>Notes</span>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-4 text-gray-300">
                            {selectedPrediction.notes}
                          </div>
                        </div>
                      )}

                      {/* Analysis/Reasoning */}
                      {selectedPrediction.analysis && (
                        <div className="mb-6">
                          <div className="text-sm text-gray-400 mb-2 flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4" />
                            <span>Analysis</span>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-4 text-gray-300">
                            {selectedPrediction.analysis}
                          </div>
                        </div>
                      )}

                      {/* Match Statistics (if available) */}
                      {selectedPrediction.matchId && (
                        <div className="mt-6 pt-6 border-t border-amber-500/20">
                          <div className="text-sm text-gray-400 mb-2">Match Details</div>
                          <a
                            href={`/live?type=football&match=${selectedPrediction.matchId}`}
                            className="text-amber-500 hover:text-amber-400 text-sm flex items-center space-x-2"
                          >
                            <span>View Live Match Details</span>
                            <TrendingUp className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No prediction details available</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
