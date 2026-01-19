import { motion } from 'motion/react';
import { Shield, Zap, Lock, Target, TrendingUp, Calendar, Clock } from 'lucide-react';

export function PredictionCard({ prediction, index = 0, isVIP = false, isAuthenticated = false, onViewDetails = null }) {
  const isVIPPrediction = prediction.isVIP || prediction.predictionType === 'vip';
  const tip = prediction.tip || prediction.prediction || 'TBD';
  const source = prediction.source || 'api-football';
  const matchTime = prediction.matchTime || prediction.matchStart || new Date();

  const getCategoryBadge = (predictionType) => {
    switch (predictionType) {
      case 'banker':
        return { icon: Shield, label: 'BANKER', color: 'bg-green-500' };
      case 'surprise':
        return { icon: Zap, label: 'SURPRISE', color: 'bg-amber-500' };
      case 'vip':
        return { icon: Lock, label: 'VIP ONLY', color: 'bg-amber-500' };
      default:
        return { icon: Target, label: 'PICK', color: 'bg-gray-500' };
    }
  };

  const getCategoryColor = (predictionType) => {
    switch (predictionType) {
      case 'banker':
        return 'from-green-500 to-green-600';
      case 'surprise':
        return 'from-amber-500 to-amber-600';
      case 'vip':
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatMatchTime = (date) => {
    if (!date) return 'TBD';
    try {
      const d = new Date(date);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      
      if (isToday) {
        return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'TBD';
    }
  };

  const badge = getCategoryBadge(prediction.predictionType);
  const BadgeIcon = badge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 hover:border-amber-500/40 transition-all overflow-hidden group ${
        isVIPPrediction && !isVIP ? 'blur-sm' : ''
      }`}
      whileHover={{ y: -4 }}
    >
      {/* VIP Lock Overlay */}
      {isVIPPrediction && (!isAuthenticated || !isVIP) && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-900/60 backdrop-blur-sm rounded-2xl pointer-events-none">
          <div className="text-center">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-2" />
            <p className="text-amber-500 font-semibold">VIP Members Only</p>
          </div>
        </div>
      )}

      {/* Glow Effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(prediction.predictionType)} opacity-0 group-hover:opacity-5 transition-opacity`}
      />

      {/* Category Badge & League */}
      <div className="flex items-center justify-between mb-4">
        <div className={`px-3 py-1.5 rounded-lg ${badge.color} flex items-center space-x-2 text-xs font-bold text-white`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>
        <div className="text-xs text-gray-500 uppercase">{prediction.league || 'Unknown League'}</div>
      </div>

      {/* Teams */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl text-white font-semibold">{prediction.homeTeam || 'TBD'}</span>
        </div>
        <div className="flex items-center justify-center my-2">
          <div className="text-gray-400 text-sm font-medium">vs</div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl text-white font-semibold">{prediction.awayTeam || 'TBD'}</span>
        </div>
      </div>

      {/* Tip/Prediction */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Tip</div>
          <div className="text-lg text-amber-500 font-semibold leading-tight">{tip}</div>
        </div>

        {/* Confidence Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="uppercase tracking-wide">Confidence</span>
            <span className="text-amber-500 font-semibold">{prediction.confidence || 50}%</span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prediction.confidence || 50}%` }}
              transition={{ duration: 1, delay: index * 0.1 }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Source Badge */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500">Source:</span>
          <span className={`px-2 py-1 rounded ${
            source === 'ai' ? 'bg-purple-500/20 text-purple-400' :
            source === 'api-football' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {source === 'ai' ? 'AI' : source === 'api-football' ? 'API-Football' : 'Manual'}
          </span>
        </div>
      </div>

      {/* Notes (if available) */}
      {prediction.notes && (
        <div className="mb-4 text-sm text-gray-400">
          <div className="text-xs text-gray-500 mb-1">Notes</div>
          <div>{prediction.notes}</div>
        </div>
      )}

      {/* Match Time & Actions */}
      <div className="mt-4 flex items-center justify-between text-sm relative z-30">
        <div className="flex items-center space-x-2 text-gray-400 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatMatchTime(matchTime)}</span>
        </div>
        <motion.button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onViewDetails && (prediction.id || prediction._id)) {
              onViewDetails(prediction.id || prediction._id);
            }
          }}
          disabled={!onViewDetails || !(prediction.id || prediction._id)}
          className="text-amber-500 hover:text-amber-400 transition-colors flex items-center space-x-1 text-xs cursor-pointer relative z-30 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          style={{ position: 'relative', zIndex: 30 }}
        >
          <span>View Details</span>
          <TrendingUp className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

