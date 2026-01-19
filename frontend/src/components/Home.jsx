import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Target, TrendingUp, Zap, Radio, Users, BarChart3, Info, FileText, MessageSquare, Newspaper, Bot } from 'lucide-react';
import { BannerAd, SidebarAd } from './GoogleAds';
import { API_BASE_URL, API_ENDPOINTS, apiGet } from '../config/api';
import logoImage from '../assets/logo.png';

export function Home({ setCurrentPage, showAds = false, openAIAssistant }) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [featuredSports, setFeaturedSports] = useState([]);
  const [loading, setLoading] = useState(true);

  // API functions for fetching data
  async function fetchLiveMatches() {
    try {
      const result = await apiGet(API_ENDPOINTS.FOOTBALL.LIVE);

      if (result.success && result.data?.matches && Array.isArray(result.data.matches)) {
        // Transform API data to match component format
        const transformed = result.data.matches.map(match => ({
          id: match.match_id,
          home: match.teams?.home?.name || 'TBD',
          away: match.teams?.away?.name || 'TBD',
          homeScore: match.goals?.home ?? 0,
          awayScore: match.goals?.away ?? 0,
          league: match.league?.name || 'Unknown League',
          status: match.fixture?.status?.short || 'NS',
          time: match.fixture?.status?.elapsed ? `${match.fixture.status.elapsed}'` : match.fixture?.date ? new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
        }));
        setLiveMatches(transformed);
      } else {
        setLiveMatches([]);
      }
    } catch (error) {
      console.error('Error fetching live matches:', error);
      setLiveMatches([]);
    }
  }

  async function fetchUpcomingMatches() {
    try {
      const result = await apiGet(API_ENDPOINTS.FOOTBALL.UPCOMING);

      if (result.success && result.data?.matches && Array.isArray(result.data.matches)) {
        // Transform API data to match component format
        const transformed = result.data.matches.slice(0, 10).map(match => ({
          id: match.match_id,
          home: match.teams?.home?.name || 'TBD',
          away: match.teams?.away?.name || 'TBD',
          league: match.league?.name || 'Unknown League',
          date: match.fixture?.date ? new Date(match.fixture.date).toLocaleDateString() : 'TBD',
          time: match.fixture?.date ? new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
        }));
        setUpcomingMatches(transformed);
      } else {
        setUpcomingMatches([]);
      }
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      setUpcomingMatches([]);
    }
  }

  async function fetchFeaturedSports() {
    try {
      // Get live match counts for featured sports
      const [footballResult, basketballResult] = await Promise.all([
        apiGet(API_ENDPOINTS.FOOTBALL.LIVE).catch(() => ({ success: false, data: { matches: [] } })),
        apiGet(API_ENDPOINTS.BASKETBALL.LIVE).catch(() => ({ success: false, data: { matches: [] } })),
      ]);

      const footballData = footballResult;
      const basketballData = basketballResult;

      const footballCount = footballData.success ? footballData.data?.matches?.length || 0 : 0;
      const basketballCount = basketballData.success ? basketballData.data?.matches?.length || 0 : 0;

      setFeaturedSports([
        { name: 'Football', matches: footballCount, icon: Target, color: 'from-green-500 to-green-600' },
        { name: 'Basketball', matches: basketballCount, icon: Target, color: 'from-amber-500 to-amber-600' },
      ]);
    } catch (error) {
      console.error('[Home] Error fetching featured sports:', error);
      setFeaturedSports([]);
      // Silently fail for featured sports - not critical
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchLiveMatches(),
        fetchUpcomingMatches(),
        fetchFeaturedSports()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  const quickLinks = [
    { id: 'predictions', name: 'Predictions', icon: Target, color: 'from-amber-500 to-amber-600' },
    { id: 'bulletin', name: 'Bulletin', icon: FileText, color: 'from-green-500 to-green-600' },
    { id: 'live', name: 'Live Scores', icon: Radio, color: 'from-green-500 to-green-600' },
    { id: 'vip', name: 'VIP', icon: Crown, color: 'from-amber-500 to-amber-600' },
    { id: 'community', name: 'Community', icon: MessageSquare, color: 'from-green-500 to-green-600' },
    { id: 'news', name: 'News', icon: Newspaper, color: 'from-amber-500 to-amber-600' },
  ];

  // Background images for the slider
  const backgroundImages = [
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070&auto=format&fit=crop', // Football
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2070&auto=format&fit=crop', // Basketball Player
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=2070&auto=format&fit=crop', // Football
    'https://images.unsplash.com/photo-1587960184060-aa880aabdd04?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Basketball
    'https://images.unsplash.com/photo-1486286701208-1d58e9338013?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Football
    'https://images.unsplash.com/photo-1434648957308-5e6a859697e8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Basketball
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto slide background
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <div className="min-h-screen pb-20 relative">

      {/* Fixed Ads Box - Bottom Right */}
      {showAds && (
        <div className="fixed bottom-4 right-4 z-40 p-4 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 shadow-lg max-w-[300px]">
          <div className="text-white text-sm font-semibold mb-1">Sponsored</div>
          <div className="text-gray-300 text-xs">
            Unlock premium features to remove ads and get exclusive predictions.
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-[600px] flex items-center justify-center">
        {/* Background Slider */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <img
                src={backgroundImages[currentImageIndex]}
                alt="Sports Background"
                className="w-full h-full object-cover"
              />
              {/* Overlay to ensure text readability */}
              <div className="absolute inset-0 bg-black/60" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
              className="inline-block"
            >
              <img
                src={logoImage}
                alt="OptikGoal Logo"
                className="h-56 md:h-80 w-auto object-contain mx-auto drop-shadow-2xl"
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-8xl font-black text-white mb-6 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] -mt-4 md:-mt-6"
              style={{ fontFamily: '"Oswald", sans-serif', textShadow: '0 0 20px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}
            >
              ELEVATE YOUR GAME
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-3xl text-gray-100 mb-10 font-medium tracking-wide"
            >
              Visual Analytics for Peak Performance
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <motion.button
                onClick={() => setCurrentPage('predictions')}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all flex items-center space-x-2 text-white font-semibold text-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Target className="w-6 h-6" />
                <span>View Predictions</span>
              </motion.button>
              <motion.button
                onClick={() => setCurrentPage('vip')}
                className="px-8 py-4 bg-transparent border-2 border-amber-500 rounded-xl hover:bg-amber-500/10 transition-all flex items-center space-x-2 text-white font-semibold text-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Crown className="w-6 h-6 text-amber-500" />
                <span>Go VIP</span>
              </motion.button>
            </motion.div>

            {/* AI Robot Logo - Prominent and Clickable - Opens AI Assistant Chat */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', bounce: 0.5 }}
              className="mt-12 flex justify-center"
            >
              <motion.button
                onClick={() => {
                  // Prefer direct prop callback (most reliable). Fallback to DOM event for safety.
                  if (typeof openAIAssistant === 'function') {
                    openAIAssistant();
                    return;
                  }
                  const evt = new CustomEvent('openAIAssistant', { bubbles: true, composed: true });
                  document.dispatchEvent(evt);
                  window.dispatchEvent(evt);
                }}
                className="group relative p-6 bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm rounded-2xl border-2 border-green-500/50 hover:border-green-400 transition-all cursor-pointer"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-green-500 blur-2xl opacity-50 rounded-full" />
                  <Bot className="w-20 h-20 text-green-400 relative z-10" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-4 text-green-400 font-bold text-lg group-hover:text-green-300 transition-colors"
                >
                  🤖 AI Assistant
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="mt-1 text-gray-300 text-sm group-hover:text-white transition-colors"
                >
                  Click to chat with AI about matches
                </motion.p>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Top Banner Ad - Only for regular users */}
      {showAds && (
        <div className="container mx-auto px-4 py-6">
          <BannerAd />
        </div>
      )}

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Live Scores Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-green-500 blur-lg opacity-50 rounded-full"
                    />
                    <Radio className="w-6 h-6 text-green-500 relative" />
                  </div>
                  <h2 className="text-3xl">Live Matches</h2>
                </div>
                <motion.button
                  onClick={() => setCurrentPage('live')}
                  className="text-green-500 hover:text-green-400 transition-colors flex items-center space-x-1"
                  whileHover={{ x: 5 }}
                >
                  <span>View All</span>
                  <TrendingUp className="w-4 h-4" />
                </motion.button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"
                  />
                  <p className="text-gray-400 text-sm">Loading live matches...</p>
                </div>
              ) : liveMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Radio className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No live matches at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-xl p-4 hover:border-amber-500/40 transition-all relative overflow-hidden group"
                      whileHover={{ y: -4 }}
                    >
                      <div className="absolute top-0 right-0 m-3">
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center space-x-1"
                        >
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          <span>{match.status}</span>
                        </motion.span>
                      </div>

                      <div className="text-xs text-gray-400 mb-3">{match.league}</div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white">{match.home}</span>
                          <span className="text-2xl text-green-500">{match.homeScore}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white">{match.away}</span>
                          <span className="text-2xl text-green-500">{match.awayScore}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-center text-sm text-gray-500">{match.time}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Upcoming Matches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h3 className="text-2xl mb-4">Upcoming Matches</h3>
              {loading ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"
                  />
                  <p className="text-gray-400 text-sm">Loading upcoming matches...</p>
                </div>
              ) : upcomingMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No upcoming matches scheduled</p>
                  <p className="text-gray-500 text-sm mt-2">No data available — free API plan limit.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4 hover:border-amber-500/40 transition-all"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="text-xs text-amber-500 mb-2">{match.league}</div>
                      <div className="space-y-1 text-sm mb-3">
                        <div className="text-white">{match.home} vs {match.away}</div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{match.date}</span>
                        <span className="text-green-500">{match.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar Ads - Only for regular users on desktop */}
          {showAds && (
            <div className="hidden lg:block w-80">
              <SidebarAd />
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="container mx-auto px-4 py-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl mb-8 text-center"
        >
          Quick Access
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.button
                key={link.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setCurrentPage(link.id)}
                className="relative group"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 hover:border-amber-500/50 transition-all overflow-hidden">
                  {/* Glow Effect */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                  />

                  <div className="relative z-10">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="text-white text-sm">{link.name}</div>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Featured Sports */}
      <div className="container mx-auto px-4 py-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl mb-8 text-center"
        >
          Featured Sports
        </motion.h2>
        {loading ? (
          <div className="text-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"
            />
            <p className="text-gray-400 text-sm">Loading featured sports...</p>
          </div>
        ) : featuredSports.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No featured sports available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredSports.map((sport, index) => {
              const Icon = sport.icon;
              const sportType = sport.name.toLowerCase();
              return (
                <motion.button
                  key={sport.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative group cursor-pointer"
                  whileHover={{ scale: 1.03, y: -5 }}
                  onClick={() => {
                    const url = `/live?type=${sportType}`;
                    window.history.pushState({}, '', url);
                    // Update the page with the full path including query params
                    setCurrentPage(`live?type=${sportType}`);
                  }}
                >
                  <div className="relative bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-8 overflow-hidden">
                    {/* Animated Background */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${sport.color} opacity-0 group-hover:opacity-20 transition-opacity`}
                    />

                    <div className="relative z-10 text-center">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${sport.color} flex items-center justify-center shadow-2xl`}
                      >
                        <Icon className="w-10 h-10 text-white" />
                      </motion.div>
                      <h3 className="text-2xl mb-2 text-white">{sport.name}</h3>
                      <p className="text-gray-400">
                        <span className="text-3xl text-green-500">{sport.matches}</span> Live Matches
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* VIP CTA */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(29,185,84,0.15),rgba(255,201,64,0.1),transparent_70%)]" />

          <div className="relative border border-amber-500/30 rounded-3xl p-12 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-6"
            >
              <img
                src={logoImage}
                alt="OptikGoal Logo"
                className="h-16 w-auto object-contain"
              />
            </motion.div>
            <h2 className="text-4xl mb-4">Unlock VIP Features</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get access to exclusive predictions, advanced analytics, and priority support with our VIP membership
            </p>
            <motion.button
              onClick={() => setCurrentPage('vip')}
              className="px-10 py-4 bg-gradient-to-r from-green-600 to-green-700 rounded-xl text-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all text-white"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore VIP Plans
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}



