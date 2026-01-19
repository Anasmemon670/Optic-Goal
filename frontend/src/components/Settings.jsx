import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Moon, Sun, Globe, Heart } from 'lucide-react';
import { getToken } from '../utils/auth';
import { API_ENDPOINTS, apiGet, apiPut } from '../config/api';

export function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Settings state
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('english');
  const [favTeams, setFavTeams] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([
    'Manchester United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City',
    'Tottenham', 'Barcelona', 'Real Madrid', 'Bayern Munich', 'PSG',
    'Lakers', 'Warriors', 'Celtics', 'Heat', 'Bulls'
  ]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = getToken();
      const result = await apiGet(API_ENDPOINTS.USER.ME, token);

      if (result.success && result.data?.user) {
        const userData = result.data.user;
        setUser(userData);
        setTheme(userData.preferences?.theme || 'light');
        setLanguage(userData.preferences?.language || 'english');
        setFavTeams(userData.notificationSettings?.favTeams || []);
      } else {
        setError(result.message || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load settings');
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
          preferences: {
            theme,
            language,
          },
          favTeams,
        },
        token
      );

      if (result.success) {
        setUser(result.data?.user || result.data);
        setSuccess('Settings saved successfully');
        setTimeout(() => setSuccess(''), 3000);
        
        // Apply theme immediately
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        setError(result.message || 'Failed to save settings');
      }
    } catch (error) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleTeam = (team) => {
    if (favTeams.includes(team)) {
      setFavTeams(favTeams.filter(t => t !== team));
    } else {
      setFavTeams([...favTeams, team]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
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
          <h1 className="text-4xl mb-2">Settings</h1>
          <p className="text-gray-400">Customize your experience</p>
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

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            {theme === 'dark' ? (
              <Moon className="w-6 h-6 text-amber-500" />
            ) : (
              <Sun className="w-6 h-6 text-amber-500" />
            )}
            <h2 className="text-2xl">Theme</h2>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-amber-500 bg-amber-500/20 text-amber-500'
                  : 'border-gray-800 bg-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <Sun className="w-6 h-6 mx-auto mb-2" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-amber-500 bg-amber-500/20 text-amber-500'
                  : 'border-gray-800 bg-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <Moon className="w-6 h-6 mx-auto mb-2" />
              <span>Dark</span>
            </button>
          </div>
        </motion.div>

        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl">Language</h2>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-gray-800 border border-amber-500/30 rounded-lg px-4 py-3 text-white"
          >
            <option value="english">English</option>
            <option value="turkish">Turkish</option>
          </select>
        </motion.div>

        {/* Favorite Teams */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl">Favorite Teams</h2>
          </div>
          <p className="text-gray-400 mb-4 text-sm">
            Select your favorite teams to receive personalized notifications
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableTeams.map((team) => (
              <button
                key={team}
                onClick={() => toggleTeam(team)}
                className={`p-3 rounded-lg border-2 transition-all text-sm ${
                  favTeams.includes(team)
                    ? 'border-amber-500 bg-amber-500/20 text-amber-500'
                    : 'border-gray-800 bg-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </motion.button>
      </div>
    </div>
  );
}

