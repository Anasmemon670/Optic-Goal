import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, Search, TrendingUp, Target, Zap, AlertCircle, Crown } from 'lucide-react';
import { isAuthenticated, getToken, isVIP as checkIsVIP } from '../utils/auth';
import { API_ENDPOINTS, apiPost } from '../config/api';

export function AISearch({ setCurrentPage }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [matchId, setMatchId] = useState('');
  const [sport, setSport] = useState('football');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [isVIPUser, setIsVIPUser] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null);

  useEffect(() => {
    setIsAuthenticatedUser(isAuthenticated());
    setIsVIPUser(checkIsVIP());
  }, []);

  useEffect(() => {
    if (isAuthenticatedUser) {
      fetchUsageInfo();
    }
  }, [isAuthenticatedUser]);

  const fetchUsageInfo = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Get usage info from AI chat endpoint (we'll add a dedicated endpoint later)
      // For now, we'll show it after a prediction
    } catch (error) {
      console.error('Error fetching usage info:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!matchId.trim()) {
      setError('Please enter a match ID');
      return;
    }

    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const token = getToken();
      const result = await apiPost(
        API_ENDPOINTS.AI.PREDICT,
        {
          matchId: matchId.trim(),
          sport,
        },
        token
      );

      if (result.success) {
        setPrediction(result.data?.prediction || result.data);
        if (result.data?.usage) {
          setUsageInfo(result.data.usage);
        }
      } else {
        setError(result.message || 'Failed to generate prediction');
        if (result.message?.includes('limit')) {
          // Show upgrade message
        }
      }
    } catch (error) {
      console.error('Error generating prediction:', error);
      setError('Failed to connect to AI service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-green-500 blur-xl opacity-30 rounded-full"
              />
              <Bot className="w-16 h-16 text-green-500 relative z-10" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              AI Match Predictions
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Get AI-powered match predictions, goal forecasts, and team analysis
          </p>
        </motion.div>

        {/* Usage Info */}
        {isAuthenticatedUser && usageInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isVIPUser ? (
                  <>
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <span className="text-green-400 font-semibold">VIP: Unlimited AI searches</span>
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">
                      Remaining searches today: <span className="font-bold text-green-400">{usageInfo.remaining}</span>
                    </span>
                  </>
                )}
              </div>
              {!isVIPUser && (
                <button
                  onClick={() => setCurrentPage('vip')}
                  className="text-sm bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Upgrade to VIP
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sport Type
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-green-500 focus:outline-none"
              >
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Match ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  placeholder="Enter match ID (e.g., 123456)"
                  className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-green-500 focus:outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !matchId.trim()}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Predict</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Find match IDs from the Live Scores or Match Bulletin pages
              </p>
            </div>
          </form>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="flex-1">
              <p className="text-red-200 font-medium">{error}</p>
              {error.includes('limit') && !isVIPUser && (
                <button
                  onClick={() => setCurrentPage('vip')}
                  className="mt-2 text-sm text-red-300 hover:text-red-100 underline"
                >
                  Upgrade to VIP for unlimited access
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Prediction Results */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Match Info */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-green-400" />
                Match Prediction
              </h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Home Team</p>
                  <p className="text-xl font-semibold">{prediction.homeTeam}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Away Team</p>
                  <p className="text-xl font-semibold">{prediction.awayTeam}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">League</p>
                  <p className="text-lg">{prediction.league}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Match Date</p>
                  <p className="text-lg">{new Date(prediction.matchDate).toLocaleString()}</p>
                </div>
              </div>
              {prediction.isLive && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                  <p className="text-green-400 font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Live Match
                  </p>
                </div>
              )}
            </div>

            {/* Result Prediction */}
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl p-6 border border-green-700">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Result Prediction
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-green-400">{prediction.resultPrediction}</p>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Confidence</p>
                  <p className="text-xl font-bold text-white">{prediction.resultConfidence}%</p>
                </div>
              </div>
            </div>

            {/* Goal Prediction */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-3">Goal Prediction</h3>
              <p className="text-2xl font-bold text-white">{prediction.goalPrediction}</p>
            </div>

            {/* Team Comparison */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Team Comparison</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Home Team</p>
                  <p className="font-semibold">{prediction.comparison.homeTeam.name}</p>
                  <p className="text-sm text-gray-400 mt-1">Form: {prediction.comparison.homeTeam.form}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Away Team</p>
                  <p className="font-semibold">{prediction.comparison.awayTeam.name}</p>
                  <p className="text-sm text-gray-400 mt-1">Form: {prediction.comparison.awayTeam.form}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-2">Key Factors</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  {prediction.comparison.keyFactors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Box */}
        {!prediction && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center"
          >
            <Bot className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">AI-Powered Predictions</h3>
            <p className="text-gray-400 mb-4">
              Enter a match ID above to get instant AI-generated predictions including:
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-gray-700 rounded-lg">
                <Target className="w-6 h-6 text-green-400 mb-2" />
                <p className="font-semibold mb-1">Match Result</p>
                <p className="text-sm text-gray-400">Win, draw, or loss prediction</p>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                <p className="font-semibold mb-1">Goal Forecast</p>
                <p className="text-sm text-gray-400">Expected score prediction</p>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg">
                <Zap className="w-6 h-6 text-green-400 mb-2" />
                <p className="font-semibold mb-1">Team Analysis</p>
                <p className="text-sm text-gray-400">Detailed team comparison</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
