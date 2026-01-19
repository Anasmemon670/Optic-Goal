import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Activity, Clock, Target, AlertCircle, TrendingUp } from 'lucide-react';
import { Comments } from './Comments';
import { API_BASE_URL, API_ENDPOINTS, apiGet } from '../config/api';

export function LiveScores({ sportType = 'football', showAds = false, isAuthenticated = false }) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchDetails, setMatchDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentSport, setCurrentSport] = useState(sportType);

  // Get sport type from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'football';
    setCurrentSport(type);
  }, []);

  // API function for fetching live scores
  async function fetchLiveScores() {
    setLoading(true);
    try {
      const endpoint = currentSport === 'basketball'
        ? API_ENDPOINTS.BASKETBALL.LIVE
        : API_ENDPOINTS.FOOTBALL.LIVE;
      const result = await apiGet(endpoint);

      if (result.success && result.data?.matches && Array.isArray(result.data.matches)) {
        // Transform API data to match component format
        const transformed = result.data.matches.map(match => ({
          id: match.match_id,
          homeTeam: match.teams?.home?.name || 'TBD',
          awayTeam: match.teams?.away?.name || 'TBD',
          homeScore: currentSport === 'basketball'
            ? (match.scores?.home?.total ?? 0)
            : (match.goals?.home ?? 0),
          awayScore: currentSport === 'basketball'
            ? (match.scores?.away?.total ?? 0)
            : (match.goals?.away ?? 0),
          league: match.league?.name || 'Unknown League',
          status: match.fixture?.status?.short || 'NS',
          time: match.fixture?.status?.elapsed ? `${match.fixture.status.elapsed}'` : '0\'',
          shots: {
            home: match.statistics?.[0]?.statistics?.find(s => s.type === 'Shots Total')?.value || 0,
            away: match.statistics?.[1]?.statistics?.find(s => s.type === 'Shots Total')?.value || 0,
          },
          shotsOnTarget: {
            home: match.statistics?.[0]?.statistics?.find(s => s.type === 'Shots on Goal')?.value || 0,
            away: match.statistics?.[1]?.statistics?.find(s => s.type === 'Shots on Goal')?.value || 0,
          },
          corners: {
            home: match.statistics?.[0]?.statistics?.find(s => s.type === 'Corner Kicks')?.value || 0,
            away: match.statistics?.[1]?.statistics?.find(s => s.type === 'Corner Kicks')?.value || 0,
          },
          possession: {
            home: parseInt(match.statistics?.[0]?.statistics?.find(s => s.type === 'Ball Possession')?.value?.replace('%', '') || '50'),
            away: parseInt(match.statistics?.[1]?.statistics?.find(s => s.type === 'Ball Possession')?.value?.replace('%', '') || '50'),
          },
          events: (match.events || []).map(event => ({
            time: event.time?.elapsed || 0,
            player: event.player?.name || 'Unknown',
            assist: event.assist?.name || null,
            type: event.type?.toLowerCase() || 'unknown',
            detail: event.detail || '',
            team: event.team?.id === match.teams?.home?.id ? 'home' : 'away',
          })),
        }));
        setLiveMatches(transformed);
      } else {
        setLiveMatches([]);
      }
    } catch (error) {
      console.error('Error fetching live scores:', error);
      setLiveMatches([]);
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh live scores
  useEffect(() => {
    fetchLiveScores();
    const interval = setInterval(() => {
      fetchLiveScores();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [currentSport]);

  // Fetch detailed match data when expanded
  const fetchMatchDetails = async (matchId) => {
    if (matchDetails[matchId]) {
      return; // Already loaded
    }

    setLoadingDetails(prev => ({ ...prev, [matchId]: true }));
    try {
      const endpoint = currentSport === 'basketball'
        ? API_ENDPOINTS.BASKETBALL.MATCH(matchId)
        : API_ENDPOINTS.FOOTBALL.MATCH(matchId);

      const result = await apiGet(endpoint);

      if (result.success && result.data) {
        setMatchDetails(prev => ({
          ...prev,
          [matchId]: result.data,
        }));
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [matchId]: false }));
    }
  };

  // Handle match expansion
  const handleMatchClick = (matchId) => {
    if (selectedMatch === matchId) {
      setSelectedMatch(null);
    } else {
      setSelectedMatch(matchId);
      fetchMatchDetails(matchId);
    }
  };

  const getEventIcon = (type, detail) => {
    if (currentSport === 'basketball') {
      switch (type?.toLowerCase()) {
        case 'point':
        case '2pt':
        case '3pt':
          return '🏀';
        case 'foul':
          return '⚠️';
        case 'timeout':
          return '⏸️';
        default:
          return '📊';
      }
    } else {
      switch (type?.toLowerCase()) {
        case 'goal':
          return '⚽';
        case 'card':
          if (detail?.toLowerCase().includes('red')) return '🟥';
          return '🟨';
        case 'subst':
        case 'substitution':
          return '🔄';
        default:
          return '';
      }
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-green-500 blur-xl opacity-50 rounded-full"
            />
            <Radio className="w-8 h-8 text-green-500 relative" />
          </div>
          <div>
            <h1 className="text-4xl">Live Scores</h1>
            <p className="text-gray-400">Real-time match updates</p>
          </div>
        </motion.div>

        {/* Live Matches */}
        {loading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400">Loading live scores...</p>
          </div>
        ) : liveMatches.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No live matches at the moment</p>
            <p className="text-gray-500 text-sm">No data available — free API plan limit.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {liveMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl overflow-hidden ${currentSport === 'basketball' ? 'basketball-match' : ''
                  }`}
              >
                {/* Match Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-amber-500/5 transition-colors"
                  onClick={() => handleMatchClick(match.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-sm rounded-lg">
                      {match.league}
                    </span>
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded flex items-center space-x-1"
                      >
                        <Radio className="w-3 h-3" />
                        <span>LIVE</span>
                      </motion.div>
                      <span className="text-white text-sm font-mono">{match.time}'</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
                    <div className="text-right">
                      <div className="text-2xl text-white mb-2">{match.homeTeam}</div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center space-x-4">
                        <motion.div
                          key={`home-${match.homeScore}`}
                          initial={{ scale: 1.5, color: '#f59e0b' }}
                          animate={{ scale: 1, color: '#ffffff' }}
                          className="text-5xl"
                        >
                          {match.homeScore}
                        </motion.div>
                        <div className="text-2xl text-gray-500">-</div>
                        <motion.div
                          key={`away-${match.awayScore}`}
                          initial={{ scale: 1.5, color: '#f59e0b' }}
                          animate={{ scale: 1, color: '#ffffff' }}
                          className="text-5xl"
                        >
                          {match.awayScore}
                        </motion.div>
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-2xl text-white mb-2">{match.awayTeam}</div>
                    </div>
                  </div>

                  {/* Quick Stats - Different for basketball */}
                  {currentSport === 'basketball' ? (
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Field Goals</div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-green-500">{match.shots?.home || 0}</span>
                          <span className="text-gray-600">-</span>
                          <span className="text-green-500">{match.shots?.away || 0}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">3-Pointers</div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-amber-500">{match.shotsOnTarget?.home || 0}</span>
                          <span className="text-gray-600">-</span>
                          <span className="text-amber-500">{match.shotsOnTarget?.away || 0}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Shots</div>
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-green-500">{match.shots?.home || 0}</span>
                            <span className="text-gray-600">-</span>
                            <span className="text-green-500">{match.shots?.away || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">On Target</div>
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-amber-500">{match.shotsOnTarget?.home || 0}</span>
                            <span className="text-gray-600">-</span>
                            <span className="text-amber-500">{match.shotsOnTarget?.away || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Corners</div>
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-amber-500">{match.corners?.home || 0}</span>
                            <span className="text-gray-600">-</span>
                            <span className="text-amber-500">{match.corners?.away || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Possession Bar - Football only */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                          <span>Possession</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-green-500">{match.possession?.home || 50}%</span>
                            <span>-</span>
                            <span className="text-green-500">{match.possession?.away || 50}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${match.possession?.home || 50}%` }}
                            className="bg-gradient-to-r from-green-500 to-green-600"
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${match.possession?.away || 50}%` }}
                            className="bg-gradient-to-r from-amber-500 to-amber-600"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedMatch === match.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-amber-500/20 overflow-hidden"
                    >
                      <div className="p-6 bg-gray-900/30">
                        {loadingDetails[match.id] ? (
                          <div className="text-center py-8">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
                            />
                            <p className="text-gray-400">Loading match details...</p>
                          </div>
                        ) : (
                          <>
                            {/* Goals/Cards Summary (Football) or Points Summary (Basketball) */}
                            {currentSport === 'football' && matchDetails[match.id]?.goalsList && (
                              <div className="mb-6">
                                <h3 className="text-lg mb-3 flex items-center space-x-2">
                                  <span>⚽</span>
                                  <span>Goals</span>
                                </h3>
                                <div className="space-y-2">
                                  {matchDetails[match.id].goalsList.map((goal, idx) => (
                                    <div key={idx} className={`flex items-center space-x-3 p-2 rounded ${goal.team === 'home' ? 'bg-green-500/10' : 'bg-amber-500/10'
                                      }`}>
                                      <span className="text-sm font-semibold">{goal.time}'</span>
                                      <span className="text-white">{goal.player}</span>
                                      {goal.assist && <span className="text-gray-400 text-sm">(assist: {goal.assist})</span>}
                                      <span className="text-xs text-gray-500 ml-auto">{goal.detail}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {currentSport === 'football' && matchDetails[match.id]?.cardsList && matchDetails[match.id].cardsList.length > 0 && (
                              <div className="mb-6">
                                <h3 className="text-lg mb-3 flex items-center space-x-2">
                                  <span>🟨</span>
                                  <span>Cards</span>
                                </h3>
                                <div className="space-y-2">
                                  {matchDetails[match.id].cardsList.map((card, idx) => (
                                    <div key={idx} className={`flex items-center space-x-3 p-2 rounded ${card.team === 'home' ? 'bg-green-500/10' : 'bg-amber-500/10'
                                      }`}>
                                      <span className="text-2xl">{getEventIcon(card.type, card.detail)}</span>
                                      <span className="text-sm font-semibold">{card.time}'</span>
                                      <span className="text-white">{card.player}</span>
                                      <span className="text-xs text-gray-500 ml-auto">{card.detail}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Basketball Points Summary */}
                            {currentSport === 'basketball' && matchDetails[match.id]?.pointsList && (
                              <div className="mb-6">
                                <h3 className="text-lg mb-3 flex items-center space-x-2">
                                  <span>🏀</span>
                                  <span>Key Plays</span>
                                </h3>
                                <div className="space-y-2">
                                  {matchDetails[match.id].pointsList.slice(0, 10).map((point, idx) => (
                                    <div key={idx} className={`flex items-center space-x-3 p-2 rounded ${point.team === 'home' ? 'bg-green-500/10' : 'bg-amber-500/10'
                                      }`}>
                                      <span className="text-sm font-semibold">Q{point.quarter} {point.time}'</span>
                                      <span className="text-white">{point.player}</span>
                                      <span className="text-xs text-gray-500 ml-auto">{point.type}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Full Timeline */}
                            <div className="mb-6">
                              <h3 className="text-xl mb-4 flex items-center space-x-2">
                                <Activity className="w-5 h-5 text-green-500" />
                                <span>Match Timeline</span>
                              </h3>

                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {(matchDetails[match.id]?.timeline || match.events || []).slice().reverse().map((event, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className={`flex items-center space-x-4 p-3 rounded-lg ${event.team === 'home'
                                        ? 'bg-green-500/10'
                                        : 'bg-amber-500/10'
                                      }`}
                                  >
                                    <span className="text-2xl">{getEventIcon(event.type, event.detail)}</span>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="text-white font-medium">{event.player}</div>
                                          <div className="text-xs text-gray-400">
                                            {currentSport === 'basketball' ? `Q${event.quarter} ${event.time}'` : `${event.time}'`} - {event.type}
                                            {event.detail && ` (${event.detail})`}
                                          </div>
                                        </div>
                                      </div>
                                      {event.assist && (
                                        <div className="text-xs text-gray-500 mt-1">Assist: {event.assist}</div>
                                      )}
                                    </div>
                                  </motion.div>
                                ))}
                                {(!matchDetails[match.id]?.timeline && !match.events) && (
                                  <p className="text-gray-400 text-center py-4">No events available</p>
                                )}
                              </div>
                            </div>

                            {/* Lineups (Football only) */}
                            {currentSport === 'football' && matchDetails[match.id]?.lineups && matchDetails[match.id].lineups.length > 0 && (
                              <div className="mb-6">
                                <h3 className="text-lg mb-3">Lineups</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {matchDetails[match.id].lineups.map((lineup, idx) => (
                                    <div key={idx} className="bg-gray-900/50 rounded-lg p-4">
                                      <div className="text-sm font-semibold mb-2">{lineup.team?.name || 'Team'}</div>
                                      <div className="text-xs text-gray-400 mb-2">Formation: {lineup.formation || 'N/A'}</div>
                                      <div className="space-y-1">
                                        {(lineup.startXI || []).slice(0, 5).map((player, pIdx) => (
                                          <div key={pIdx} className="text-xs text-gray-300">
                                            {player.player?.name || 'Unknown'}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Detailed Statistics */}
                            <div className="mb-6">
                              <h3 className="text-lg mb-3">Statistics</h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {currentSport === 'football' ? (
                                  <>
                                    {[
                                      { label: 'Ball Possession', home: match.possession?.home || 50, away: match.possession?.away || 50, unit: '%' },
                                      { label: 'Total Shots', home: match.shots?.home || 0, away: match.shots?.away || 0, unit: '' },
                                      { label: 'Shots on Target', home: match.shotsOnTarget?.home || 0, away: match.shotsOnTarget?.away || 0, unit: '' },
                                      { label: 'Corner Kicks', home: match.corners?.home || 0, away: match.corners?.away || 0, unit: '' },
                                    ].map((stat, idx) => (
                                      <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-gray-900/50 rounded-lg p-4 text-center"
                                      >
                                        <div className="text-xs text-gray-400 mb-2">{stat.label}</div>
                                        <div className="flex items-center justify-center space-x-3">
                                          <span className="text-xl text-green-500">{stat.home}{stat.unit}</span>
                                          <span className="text-gray-600">-</span>
                                          <span className="text-xl text-amber-500">{stat.away}{stat.unit}</span>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </>
                                ) : (
                                  <>
                                    {matchDetails[match.id]?.quarterScores && matchDetails[match.id].quarterScores.length > 0 && (
                                      <div className="col-span-4 bg-gray-900/50 rounded-lg p-4">
                                        <div className="text-xs text-gray-400 mb-2">Quarter Scores</div>
                                        <div className="grid grid-cols-4 gap-2">
                                          {matchDetails[match.id].quarterScores.map((q, idx) => (
                                            <div key={idx} className="text-center">
                                              <div className="text-xs text-gray-500">Q{idx + 1}</div>
                                              <div className="text-sm text-white">{q.home} - {q.away}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Comments Section */}
                            <div className="mt-8 pt-6 border-t border-amber-500/20">
                              <Comments matchId={match.id?.toString()} isAuthenticated={isAuthenticated} />
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 border border-green-500/20 rounded-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Activity className="w-4 h-4 text-green-500" />
            </motion.div>
            <span className="text-sm text-gray-400">Auto-refreshing live data</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

