import { motion } from 'motion/react';
import { ExternalLink, X } from 'lucide-react';
import { useState } from 'react';

export function GoogleAds({ type = 'banner', className = '' }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const adVariants = {
    banner: {
      width: 'w-full',
      height: 'h-24',
      content: '728 x 90 - Leaderboard Ad'
    },
    square: {
      width: 'w-full max-w-[300px]',
      height: 'h-[250px]',
      content: '300 x 250 - Square Ad'
    },
    vertical: {
      width: 'w-full max-w-[160px]',
      height: 'h-[600px]',
      content: '160 x 600 - Skyscraper Ad'
    },
    horizontal: {
      width: 'w-full',
      height: 'h-20',
      content: '468 x 60 - Banner Ad'
    }
  };

  const currentAd = adVariants[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative ${currentAd.width} ${currentAd.height} ${className}`}
    >
      <div className="relative w-full h-full bg-gradient-to-br from-gray-900/50 to-gray-900/50 border border-amber-500/20 rounded-lg overflow-hidden group">
        {/* Ad Label */}
        <div className="absolute top-1 left-1 px-2 py-0.5 bg-gray-700/80 rounded text-[10px] text-gray-400 z-10">
          Advertisement
        </div>

        {/* Close Button */}
        <motion.button
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-1 w-5 h-5 bg-gray-700/80 hover:bg-gray-600 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Close ad"
        >
          <X className="w-3 h-3" />
        </motion.button>

        {/* Mock Ad Content */}
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mb-2"
          >
            <ExternalLink className="w-8 h-8 text-gray-500" />
          </motion.div>
          <p className="text-xs text-gray-500 mb-1">Google AdSense</p>
          <p className="text-[10px] text-gray-600">{currentAd.content}</p>
          
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        {/* Shimmer effect */}
        <motion.div
          animate={{ x: [-1000, 1000] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
          style={{ width: '100px' }}
        />
      </div>
    </motion.div>
  );
}

// Sidebar Ad Component
export function SidebarAd() {
  return (
    <div className="sticky top-24 space-y-6">
      <GoogleAds type="square" />
      <GoogleAds type="square" />
    </div>
  );
}

// Banner Ad Component
export function BannerAd({ className = '' }) {
  return <GoogleAds type="banner" className={className} />;
}

// Horizontal Ad Component
export function HorizontalAd({ className = '' }) {
  return <GoogleAds type="horizontal" className={className} />;
}

