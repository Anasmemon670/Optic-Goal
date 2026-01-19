import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Radio, Target, FileText, TrendingUp, Heart, Save } from 'lucide-react';
import { getToken } from '../utils/auth';
import { API_ENDPOINTS, apiGet, apiPut } from '../config/api';

export function Notifications({ openAuthModal }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Notification settings state
  const [liveAlerts, setLiveAlerts] = useState(true);
  const [goals, setGoals] = useState(true);
  const [bulletin, setBulletin] = useState(true);
  const [predictions, setPredictions] = useState(false);
  const [favTeams, setFavTeams] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        openAuthModal('login');
        return;
      }

      const result = await apiGet(API_ENDPOINTS.USER.ME, token);

      if (result.success && result.data?.user) {
        const data = result;
        const userData = data.data.user;
        setUser(userData);
        
        // Initialize notification settings with defaults if not present
        const settings = userData.notificationSettings || {
          liveAlerts: true,
          goals: true,
          bulletin: true,
          predictions: false,
          favTeams: []
        };
        
        setLiveAlerts(settings.liveAlerts !== undefined ? settings.liveAlerts : true);
        setGoals(settings.goals !== undefined ? settings.goals : true);
        setBulletin(settings.bulletin !== undefined ? settings.bulletin : true);
        setPredictions(settings.predictions !== undefined ? settings.predictions : false);
        setFavTeams(settings.favTeams || []);
      } else {
        setError('Failed to load notification settings');
      }
    } catch (error) {
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      const result = await apiPut(
        API_ENDPOINTS.USER.UPDATE,
        {
          notificationSettings: {
            liveAlerts,
            goals,
            bulletin,
            predictions,
            favTeams
          }
        },
        token
      );

      if (result.success) {
        setUser(result.data?.user || result.data);
        setSuccess('Notification settings saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to save notification settings');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setError('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading notification settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please log in to manage your notifications</p>
          <button
            onClick={() => openAuthModal('login')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl mb-2">Notification Settings</h1>
          <p className="text-gray-400">Manage how and when you receive notifications</p>
        </motion.div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400"
          >
            {success}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Live Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Radio className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl mb-1">Live Alerts</h3>
                <p className="text-sm text-gray-400">Get notified about live match updates</p>
              </div>
            </div>
            <button
              onClick={() => setLiveAlerts(!liveAlerts)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                liveAlerts ? 'bg-green-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  liveAlerts ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Goal Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl mb-1">Goal Alerts</h3>
                <p className="text-sm text-gray-400">Receive notifications when goals are scored</p>
              </div>
            </div>
            <button
              onClick={() => setGoals(!goals)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                goals ? 'bg-green-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  goals ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Bulletin Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl mb-1">Bulletin Alerts</h3>
                <p className="text-sm text-gray-400">Get notified about new match bulletins</p>
              </div>
            </div>
            <button
              onClick={() => setBulletin(!bulletin)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                bulletin ? 'bg-green-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  bulletin ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Prediction Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl mb-1">Prediction Alerts</h3>
                <p className="text-sm text-gray-400">Receive notifications about new predictions</p>
              </div>
            </div>
            <button
              onClick={() => setPredictions(!predictions)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                predictions ? 'bg-green-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  predictions ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Favorite Teams Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl">Favorite Teams Notifications</h2>
          </div>
          <p className="text-gray-400 mb-4 text-sm">
            You can manage your favorite teams in Settings. Notifications for your favorite teams will be enabled when you select teams.
          </p>
          {favTeams.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {favTeams.map((team, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-500 text-sm"
                >
                  {team}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No favorite teams selected. Go to Settings to add teams.</p>
          )}
        </motion.div>

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </motion.button>
      </div>
    </div>
  );
}

