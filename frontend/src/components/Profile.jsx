import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Crown, Calendar, Lock, Bell, Settings, Trash2, LogOut, Camera, Save, X } from 'lucide-react';
import { getToken, clearAuth } from '../utils/auth';
import { API_ENDPOINTS, apiGet, apiPut, apiDelete } from '../config/api';

export function Profile({ onLogout, openAuthModal, setCurrentPage }) {
  // ============================================
  // ALL useState HOOKS - MUST BE AT TOP
  // ============================================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // ============================================
  // ALL useEffect HOOKS - MUST BE AFTER useState
  // ============================================
  useEffect(() => {
    fetchProfile();
  }, []);

  // ============================================
  // FUNCTIONS - BELOW HOOKS
  // ============================================
  const fetchProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        openAuthModal('login');
        return;
      }

      const result = await apiGet(API_ENDPOINTS.USER.ME, token);

      if (result.success && result.data?.user) {
        const userData = result.data.user;
        setUser(userData);
        setUsername(userData.username || userData.name || '');
        setProfilePhoto(userData.profilePhoto || '');
        setPreviewPhoto(userData.profilePhoto || '');
      } else {
        setError(result.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilePhoto(base64String);
        setPreviewPhoto(base64String);
      };
      reader.readAsDataURL(file);
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
          username,
          profilePhoto,
        },
        token
      );

      if (result.success) {
        setUser(result.data?.user || result.data);
        setEditing(false);
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      const token = getToken();
      const result = await apiDelete(API_ENDPOINTS.USER.DELETE, token);

      if (result.success) {
        clearAuth();
        if (onLogout) onLogout();
        if (setCurrentPage) setCurrentPage('home');
      } else {
        setError(result.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    setError('');
    setSuccess('');
    
    try {
      const token = getToken();
      const result = await apiPut(
        API_ENDPOINTS.USER.CHANGE_PASSWORD,
        {
          oldPassword,
          newPassword,
        },
        token
      );
      
      if (result.success) {
        setSuccess('Password changed successfully');
        setShowChangePasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setUsername(user?.username || '');
    setProfilePhoto(user?.profilePhoto || '');
    setPreviewPhoto(user?.profilePhoto || '');
  };

  const handleClosePasswordModal = () => {
    setShowChangePasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirm('');
  };

  // ============================================
  // COMPUTED VALUES - BELOW HOOKS AND FUNCTIONS
  // ============================================
  const isVIP = user?.isVIP && user?.vipPlan !== 'none';
  const vipExpiryDate = user?.vipExpiresAt || user?.vipExpiryDate;

  // ============================================
  // CONDITIONAL RENDERING - AT BOTTOM, NO EARLY RETURNS
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please log in to view your profile</p>
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

  // ============================================
  // MAIN JSX RETURN
  // ============================================
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account settings</p>
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

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 border-4 border-amber-500/30">
                {previewPhoto ? (
                  <img src={previewPhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 bg-green-600 p-2 rounded-full cursor-pointer hover:bg-green-700 transition">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                {editing ? (
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-gray-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white text-xl"
                  />
                ) : (
                  <h2 className="text-3xl">{user.username}</h2>
                )}
                {isVIP && (
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg text-sm flex items-center gap-1">
                    <Crown className="w-4 h-4" />
                    VIP
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>

                {isVIP && vipExpiryDate && (
                  <div className="flex items-center gap-2 text-amber-500">
                    <Calendar className="w-4 h-4" />
                    <span>VIP expires: {new Date(vipExpiryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-6 py-2 bg-amber-500/20 text-amber-500 rounded-lg hover:bg-amber-500/30 border border-amber-500/30"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setCurrentPage && setCurrentPage('settings')}
            className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg mb-1">Settings</h3>
                <p className="text-sm text-gray-400">Theme, language, and preferences</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setCurrentPage && setCurrentPage('notifications')}
            className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg mb-1">Notifications</h3>
                <p className="text-sm text-gray-400">Manage notification preferences</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => setShowChangePasswordModal(true)}
            className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg mb-1">Change Password</h3>
                <p className="text-sm text-gray-400">Update your account password</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => setShowDeleteModal(true)}
            className="bg-gradient-to-br from-gray-900 to-gray-900 border border-red-500/20 rounded-xl p-6 hover:border-red-500/40 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg mb-1">Delete Account</h3>
                <p className="text-sm text-gray-400">Permanently delete your account</p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onLogout}
          className="mt-6 w-full bg-gray-800 border border-red-500/20 rounded-xl p-4 hover:border-red-500/40 transition-all flex items-center justify-center gap-2 text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </motion.button>

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-blue-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-2xl mb-4 text-blue-400">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-blue-500/30 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-blue-500/30 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-blue-500/30 rounded-lg px-4 py-2 text-white"
                    placeholder="Confirm new password"
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={handleClosePasswordModal}
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-red-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-2xl mb-4 text-red-400">Delete Account</h3>
              <p className="text-gray-400 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <p className="text-gray-400 mb-4">
                Type <span className="text-red-400 font-bold">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full bg-gray-800 border border-red-500/30 rounded-lg px-4 py-2 text-white mb-4"
                placeholder="Type DELETE"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE'}
                  className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Account
                </button>
                <button
                  onClick={handleCloseDeleteModal}
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
