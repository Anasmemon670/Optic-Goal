import { motion } from 'motion/react';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

export function InfoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-green-900/50 via-amber-900/50 to-green-900/50 border-b border-green-500/30 backdrop-blur-sm"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <Info className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-200">
                <span className="font-semibold text-green-400">Welcome to OptikGoal!</span>
                {' '}Your premier destination for sports predictions and live match updates.
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

