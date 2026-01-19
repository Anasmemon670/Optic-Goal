import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Calendar, Filter, MessageSquare } from 'lucide-react';
import { BannerAd, SidebarAd } from './GoogleAds';
import { Comments } from './Comments';
import { API_ENDPOINTS, apiGet } from '../config/api';

export function MatchBulletin({ showAds = true, isAuthenticated = false }) {
  const [matches, setMatches] = useState([]);
  const [sports, setSports] = useState(['all']);
  const [selectedSport, setSelectedSport] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  // Initialize from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type === 'football' || type === 'basketball') {
      setSelectedSport(type);
    }
  }, []);

  // API function for fetching matches
  async function fetchMatches(sportType = 'all') {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const allMatches = [];
      
      // Fetch football matches - try API-Football first, then fallback to SportsDB teams/leagues
      if (sportType === 'all' || sportType === 'football') {
        try {
          // Primary: API-Football upcoming matches
          const footballResult = await apiGet(`${API_ENDPOINTS.FOOTBALL.UPCOMING}?date=${today}`);
          const footballData = footballResult;
          
          if (footballData.success && footballData.data?.matches && footballData.data.matches.length > 0) {
            const footballMatches = footballData.data.matches.map(match => ({
              id: match.match_id || match.id || `football-${Math.random()}`,
              homeTeam: match.teams?.home?.name || match.homeTeam?.name || 'TBD',
              awayTeam: match.teams?.away?.name || match.awayTeam?.name || 'TBD',
              league: match.league?.name || match.leagueName || 'Unknown League',
              date: match.fixture?.date ? new Date(match.fixture.date).toLocaleDateString() : (match.date ? new Date(match.date).toLocaleDateString() : today),
              time: match.fixture?.date ? new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (match.date ? new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'),
              sport: 'football',
              source: 'api-football',
            }));
            allMatches.push(...footballMatches);
            console.log(`[MatchBulletin] Loaded ${footballMatches.length} football matches`);
          } else {
            console.log(`[MatchBulletin] No football matches found, trying fallback...`);
            // Fallback: Use SportsDB teams/leagues to show available teams (static info)
            try {
              const sportsDBTeamsResult = await apiGet(`${API_ENDPOINTS.FOOTBALL.SPORTSDB_TEAMS}?search=`);
              const sportsDBTeamsData = sportsDBTeamsResult;
              if (sportsDBTeamsData.success && sportsDBTeamsData.data?.teams && sportsDBTeamsData.data.teams.length > 0) {
                // Show teams from SportsDB as placeholder (no actual match times)
                const teams = sportsDBTeamsData.data.teams.slice(0, 10);
                const fallbackMatches = teams.map((team, index) => ({
                  id: `sportsdb-${team.team_id || index}`,
                  homeTeam: team.team?.strTeam || 'TBD',
                  awayTeam: 'vs',
                  league: team.team?.strLeague || 'Unknown League',
                  date: today,
                  time: 'TBD',
                  sport: 'football',
                  source: 'thesportsdb',
                  isPlaceholder: true,
                }));
                allMatches.push(...fallbackMatches);
                console.log(`[MatchBulletin] Loaded ${fallbackMatches.length} football team placeholders`);
              }
            } catch (error) {
              console.error('[MatchBulletin] Error fetching SportsDB football teams:', error);
            }
          }
        } catch (error) {
          console.error('[MatchBulletin] Error fetching football matches:', error);
        }
      }
      
      // Fetch basketball matches - try API-Football first, then fallback to SportsDB
      if (sportType === 'all' || sportType === 'basketball') {
        try {
          // Primary: API-Football upcoming matches
          const basketballResult = await apiGet(`${API_ENDPOINTS.BASKETBALL.UPCOMING}?date=${today}`);
          const basketballData = basketballResult;
          
          if (basketballData.success && basketballData.data?.matches && basketballData.data.matches.length > 0) {
            const basketballMatches = basketballData.data.matches.map(match => ({
              id: match.match_id || match.id || `basketball-${Math.random()}`,
              homeTeam: match.teams?.home?.name || match.homeTeam?.name || 'TBD',
              awayTeam: match.teams?.away?.name || match.awayTeam?.name || 'TBD',
              league: match.league?.name || match.leagueName || 'Unknown League',
              date: match.fixture?.date ? new Date(match.fixture.date).toLocaleDateString() : (match.date ? new Date(match.date).toLocaleDateString() : today),
              time: match.fixture?.date ? new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (match.date ? new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'),
              sport: 'basketball',
              source: 'api-football',
            }));
            allMatches.push(...basketballMatches);
            console.log(`[MatchBulletin] Loaded ${basketballMatches.length} basketball matches`);
          } else {
            console.log(`[MatchBulletin] No basketball matches found, trying fallback...`);
            // Fallback: Use SportsDB teams/leagues
            try {
              const sportsDBTeamsResult = await apiGet(`${API_ENDPOINTS.BASKETBALL.SPORTSDB_TEAMS}?search=`);
              const sportsDBTeamsData = sportsDBTeamsResult;
              if (sportsDBTeamsData.success && sportsDBTeamsData.data?.teams && sportsDBTeamsData.data.teams.length > 0) {
                const teams = sportsDBTeamsData.data.teams.slice(0, 10);
                const fallbackMatches = teams.map((team, index) => ({
                  id: `sportsdb-${team.team_id || index}`,
                  homeTeam: team.team?.strTeam || 'TBD',
                  awayTeam: 'vs',
                  league: team.team?.strLeague || 'Unknown League',
                  date: today,
                  time: 'TBD',
                  sport: 'basketball',
                  source: 'thesportsdb',
                  isPlaceholder: true,
                }));
                allMatches.push(...fallbackMatches);
                console.log(`[MatchBulletin] Loaded ${fallbackMatches.length} basketball team placeholders`);
              }
            } catch (error) {
              console.error('[MatchBulletin] Error fetching SportsDB basketball teams:', error);
            }
          }
        } catch (error) {
          console.error('[MatchBulletin] Error fetching basketball matches:', error);
        }
      }
      
      setMatches(allMatches);
      if (allMatches.length === 0) {
        console.log('[MatchBulletin] No matches found for today. The database may be empty. The backend will try to fetch from API on next request.');
      }
    } catch (error) {
      console.error('[MatchBulletin] Fatal error fetching matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  // API function for fetching sports
  async function fetchSports() {
    try {
      // Set available sports
      setSports(['all', 'football', 'basketball']);
    } catch (error) {
      setSports(['all']);
    }
  }

  useEffect(() => {
    fetchMatches(selectedSport);
    fetchSports();
    // Update URL when sport changes
    const url = selectedSport === 'all' ? '/bulletin' : `/bulletin?type=${selectedSport}`;
    window.history.pushState({}, '', url);
  }, [selectedSport]);

  const filteredMatches = selectedSport === 'all' 
    ? matches 
    : matches.filter(m => m.sport === selectedSport);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-4xl">Match Bulletin</h1>
              <p className="text-gray-400">Today's matches</p>
            </div>
          </div>
        </motion.div>

        {/* Sport Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-3 mb-8"
        >
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {sports.map((sport) => (
              <motion.button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedSport === sport
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sport === 'all' ? 'All Sports' : sport}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Matches List */}
        {loading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400">Loading matches...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No scheduled matches today</p>
            <p className="text-gray-500 text-sm mb-4">
              The database is currently empty. The system will automatically fetch matches from the API on the next request.
            </p>
            <motion.button
              onClick={() => fetchMatches(selectedSport)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Refresh Matches
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {filteredMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-xl overflow-hidden transition-all hover:border-amber-500/40"
              whileHover={{ x: 4 }}
            >
              <div 
                className="p-6 cursor-pointer hover:bg-amber-500/5 transition-colors"
                onClick={() => setSelectedMatchId(selectedMatchId === match.id ? null : match.id)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Match Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs rounded-lg">
                        {match.league}
                      </span>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{match.date}</span>
                        <span>•</span>
                        <span>{match.time}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg text-white">{match.homeTeam}</span>
                      </div>
                      <div className="text-gray-500 text-sm">
                        {match.isPlaceholder ? 'Team Info Available' : 'vs'}
                      </div>
                      {!match.isPlaceholder && (
                      <div className="flex items-center space-x-3">
                        <span className="text-lg text-white">{match.awayTeam}</span>
                      </div>
                      )}
                      {match.isPlaceholder && (
                        <div className="text-xs text-gray-500 italic">
                          Match schedule coming soon
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Comments Button */}
                  <div className="flex items-center space-x-2">
                    <motion.button
                      className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors flex items-center space-x-2 text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMatchId(selectedMatchId === match.id ? null : match.id);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{selectedMatchId === match.id ? 'Hide' : 'View'} Comments</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Expanded Comments Section */}
              <AnimatePresence>
                {selectedMatchId === match.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-amber-500/20 overflow-hidden"
                  >
                    <div className="p-6 bg-gray-900/30">
                      <Comments matchId={match.id?.toString() || match.matchId?.toString()} isAuthenticated={isAuthenticated} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
