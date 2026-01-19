import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Crown,
  LogOut,
  TrendingUp,
  Target,
  Activity,
  Plus,
  Edit,
  Trash2,
  Bell,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Eye,
  Filter,
  Search,
  Check,
  XCircle,
  Clock,
  Loader,
  AlertCircle,
  Shield,
  Zap,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Lock,
  Tag,
  Battery,
  BatteryMedium,
  BatteryFull,
  Share2
} from 'lucide-react';
import {
  getDashboardStats,
  getRecentActivity,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPredictions,
  createPrediction,
  updatePrediction,
  deletePrediction,
  getComments,
  deleteComment,
  toggleCommentApproval,
  getReports,
  getSettings,
  updateSettings
} from '../utils/adminApi';
import { getAdminComments, deleteComment as deleteCommentApi } from '../api/commentsApi';
import { getToken } from '../utils/auth';
import logoImage from '../assets/logo.png';

export function AdminPanel({ onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-green-500 to-green-600' },
    { id: 'users', label: 'User Management', icon: Users, color: 'from-amber-500 to-amber-600' },
    { id: 'vip', label: 'VIP Control', icon: Crown, color: 'from-yellow-400 to-yellow-600' },
    { id: 'predictions', label: 'Predictions', icon: Target, color: 'from-green-500 to-green-600' },
    { id: 'comments', label: 'Comments', icon: MessageSquare, color: 'from-green-600 to-green-700' },
    { id: 'reports', label: 'Reports', icon: FileText, color: 'from-amber-500 to-amber-600' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-gray-600' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardContent />;
      case 'users':
        return <UserManagementContent />;
      case 'vip':
        return <VIPControlContent />;
      case 'predictions':
        return <PredictionsContent />;
      case 'comments':
        return <CommentsContent />;
      case 'reports':
        return <ReportsContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed lg:sticky top-0 h-screen w-72 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-900 border-r border-amber-500/20 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-amber-500/20">
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <div className="relative w-12 h-12 flex items-center justify-center overflow-hidden">
                {logoImage ? (
                  <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Crown className="w-7 h-7 text-amber-500" />
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
                Admin Panel
              </h2>
              <p className="text-xs text-gray-400">OptikGoal Control Center</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveSection(item.id)}
                className={`w-full group relative overflow-hidden rounded-xl transition-all ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebar"
                    className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {!isActive && (
                  <div className="absolute inset-0 bg-gray-800/30 rounded-xl group-hover:bg-gray-800/50 transition-colors" />
                )}

                {/* Content */}
                <div className="relative flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-green-500'} transition-colors`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  )}
                </div>

                {/* Glow effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-amber-500/20">
          <motion.button
            onClick={onLogout}
            className="w-full relative group overflow-hidden rounded-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 group-hover:from-red-500/30 group-hover:to-red-600/30 transition-all rounded-xl" />
            <div className="relative flex items-center justify-center space-x-2 p-4 text-red-400 group-hover:text-red-300 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile Sidebar Toggle */}
      <motion.button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 lg:hidden z-50 w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-xl shadow-green-500/50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {sidebarOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-6 h-6 text-black" />}
      </motion.button>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent() {
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats from API
  async function fetchDashboardStats() {
    setLoading(true);
    try {
      const statsData = await getDashboardStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch recent activities from API
  async function fetchRecentActivities() {
    try {
      const activities = await getRecentActivity();
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    }
  }

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivities();
  }, []);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl mb-2 bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-gray-400">Welcome back, Admin. Here's what's happening today.</p>
      </motion.div>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading dashboard stats...</p>
        </div>
      ) : stats.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No data available</p>
          <p className="text-gray-500 text-sm">Statistics will appear here once data is available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group overflow-hidden rounded-2xl"
                whileHover={{ y: -4, scale: 1.02 }}
              >
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl" />

                {/* Glow effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className={`absolute -inset-1 bg-gradient-to-r ${stat.color} blur-2xl opacity-0 group-hover:opacity-30 transition-opacity`}
                />

                {/* Content */}
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <motion.div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${stat.positive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                        }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.3 }}
                    >
                      {stat.change}
                    </motion.div>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl text-white">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl">Recent Activity</h2>
            </div>
            <motion.button
              className="text-sm text-green-500 hover:text-green-400 transition-colors"
              whileHover={{ x: 5 }}
            >
              View All
            </motion.button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center space-x-4 p-4 bg-gray-900/30 rounded-xl hover:bg-gray-900/50 transition-colors group"
                    whileHover={{ x: 4 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center group-hover:from-green-500/30 group-hover:to-green-600/30 transition-colors">
                      <Icon className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white">
                        <span className="font-medium">{activity.user}</span>
                        {' '}
                        <span className="text-gray-400">{activity.action}</span>
                      </p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-500 transition-colors" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// User Management Content Component
function UserManagementContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [vipInfo, setVipInfo] = useState(null);
  const [loadingVIP, setLoadingVIP] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [vipDuration, setVipDuration] = useState('daily');

  // Fetch users from API
  async function fetchUsers() {
    setLoading(true);
    try {
      const { users: usersData } = await getUsers(searchQuery, filterStatus);
      // Fetch VIP info for each user
      const usersWithVIP = await Promise.all(
        (usersData || []).map(async (user) => {
          try {
            const { getUserVIPStatus } = await import('../utils/adminApi');
            const vipStatus = await getUserVIPStatus(user.id || user._id);
            return {
              ...user,
              vipExpiry: vipStatus?.vipExpiry,
              acquisitionSource: vipStatus?.acquisitionSource,
              vipPlan: vipStatus?.vipPlan,
            };
          } catch (error) {
            return user;
          }
        })
      );
      setUsers(usersWithVIP);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, filterStatus]);

  // Handle view user
  const handleViewUser = async (userId) => {
    try {
      const userData = await getUserById(userId);
      // Transform API response to match UI format
      const transformedUser = {
        id: userData._id || userData.id,
        name: userData.name || userData.username || 'Unknown',
        email: userData.email || 'N/A',
        status: userData.isVIP ? 'VIP' : userData.role === 'admin' ? 'Admin' : 'Regular',
        joinDate: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A',
        lastActive: userData.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : 'N/A',
        role: userData.role || 'user',
        isVIP: userData.isVIP || false,
      };
      setSelectedUser(transformedUser);
      setShowViewModal(true);
    } catch (error) {
      alert('Error loading user: ' + error.message);
    }
  };

  // Handle edit user
  const handleEditUser = async (userId) => {
    try {
      const userData = await getUserById(userId);
      // Fetch VIP status
      try {
        const { getUserVIPStatus } = await import('../utils/adminApi');
        const vipStatus = await getUserVIPStatus(userId);
        setVipInfo(vipStatus);
      } catch (error) {
        console.error('Error fetching VIP status:', error);
        setVipInfo(null);
      }
      
      // Transform API response to match UI format
      const transformedUser = {
        id: userData._id || userData.id,
        name: userData.name || userData.username || 'Unknown',
        email: userData.email || 'N/A',
        status: userData.isVIP ? 'VIP' : userData.role === 'admin' ? 'Admin' : 'Regular',
        joinDate: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A',
        lastActive: userData.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : 'N/A',
        role: userData.role || 'user',
        isVIP: userData.isVIP || false,
      };
      setSelectedUser(transformedUser);
      setShowEditModal(true);
    } catch (error) {
      alert('Error loading user: ' + error.message);
    }
  };

  // Handle assign VIP
  const handleAssignVIP = async (userId) => {
    setSelectedUser({ id: userId });
    setShowVIPModal(true);
    setLoadingVIP(false);
    // Fetch current VIP status
    try {
      const { getUserVIPStatus } = await import('../utils/adminApi');
      const vipStatus = await getUserVIPStatus(userId);
      setVipInfo(vipStatus);
    } catch (error) {
      console.error('Error fetching VIP status:', error);
      setVipInfo(null);
    }
  };

  // Handle confirm VIP assignment
  const handleConfirmAssignVIP = async () => {
    if (!selectedUser?.id) return;

    setLoadingVIP(true);
    try {
      const { assignVIP } = await import('../utils/adminApi');
      const result = await assignVIP(selectedUser.id, vipDuration);
      alert(result.message || 'VIP assigned successfully!');
      setShowVIPModal(false);
      setSelectedUser(null);
      setVipInfo(null);
      await fetchUsers();
    } catch (error) {
      alert('Error assigning VIP: ' + error.message);
    } finally {
      setLoadingVIP(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeleting(userId);
    try {
      await deleteUser(userId);
      // Remove user from list
      setUsers(users.filter(u => (u.id || u._id) !== userId));
      alert('User deleted successfully');
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  // Handle save edited user
  const handleSaveUser = async (userData) => {
    try {
      const userId = selectedUser.id || selectedUser._id;

      // Prevent changing role to admin
      if (userData.role === 'admin') {
        alert('Cannot change user role to admin. Admin accounts must be managed separately.');
        return;
      }

      // Transform form data to API format
      const apiData = {
        name: userData.name,
        email: userData.email,
        role: userData.role === 'admin' ? 'user' : userData.role, // Ensure role is never admin
        isVIP: userData.isVIP,
      };
      await updateUser(userId, apiData);
      setShowEditModal(false);
      setSelectedUser(null);
      // Refresh users list
      await fetchUsers();
      alert('User updated successfully');
    } catch (error) {
      alert('Error updating user: ' + error.message);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl mb-2 bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-400">Manage and monitor all registered users (Admin accounts are excluded)</p>
        </div>
        <motion.button
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:shadow-green-500/50 transition-all text-white"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-green-500/20 rounded-xl text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'VIP', 'Regular', 'Banned'].map((status) => (
            <motion.button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-3 rounded-xl transition-all ${filterStatus === status
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-green-500/20'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {status === 'all' ? 'All Users' : status}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No data available</p>
          <p className="text-gray-500 text-sm">Users will appear here once registered</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl" />

          <div className="relative overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-amber-500/20">
                  <th className="text-left p-6 text-gray-400 font-medium">User</th>
                  <th className="text-left p-6 text-gray-400 font-medium">Status</th>
                  <th className="text-left p-6 text-gray-400 font-medium">VIP Info</th>
                  <th className="text-left p-6 text-gray-400 font-medium">Join Date</th>
                  <th className="text-left p-6 text-gray-400 font-medium">Last Active</th>
                  <th className="text-right p-6 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'VIP'
                        ? 'bg-amber-500/20 text-amber-400'
                        : user.status === 'Regular'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                        }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-6">
                      {user.isVIP ? (
                        <div className="text-xs">
                          <div className="text-amber-400 font-semibold">VIP Active</div>
                          {user.vipExpiry && (
                            <div className="text-gray-400 mt-1">
                              Expires: {new Date(user.vipExpiry).toLocaleDateString()}
                            </div>
                          )}
                          {user.acquisitionSource && (
                            <div className="text-gray-500 mt-1">
                              Source: {user.acquisitionSource}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">Not VIP</span>
                      )}
                    </td>
                    <td className="p-6 text-gray-400">{user.joinDate}</td>
                    <td className="p-6 text-gray-400">{user.lastActive}</td>
                    <td className="p-6">
                      <div className="flex items-center justify-end space-x-2">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewUser(user.id || user._id);
                          }}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignVIP(user.id || user._id);
                          }}
                          className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Assign VIP"
                        >
                          <Crown className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(user.id || user._id);
                          }}
                          className="p-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id || user._id);
                          }}
                          disabled={deleting === (user.id || user._id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          whileHover={{ scale: deleting === (user.id || user._id) ? 1 : 1.1 }}
                          whileTap={{ scale: deleting === (user.id || user._id) ? 1 : 0.9 }}
                          title="Delete"
                        >
                          {deleting === (user.id || user._id) ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Activity className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* View User Modal */}
      <AnimatePresence>
        {showViewModal && selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowViewModal(false);
                setSelectedUser(null);
              }}
              className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">User Details</h2>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedUser(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Name</label>
                    <p className="text-white">{selectedUser.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p className="text-white">{selectedUser.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Status</label>
                    <p className="text-white">{selectedUser.status || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Join Date</label>
                    <p className="text-white">{selectedUser.joinDate || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Last Active</label>
                    <p className="text-white">{selectedUser.lastActive || 'N/A'}</p>
                  </div>
                  
                  {/* VIP Information */}
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-amber-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                        <Crown className="w-5 h-5" />
                        VIP Status
                      </h3>
                      <motion.button
                        onClick={() => {
                          setShowViewModal(false);
                          handleAssignVIP(selectedUser.id);
                        }}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-gray-900 font-semibold text-sm transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {vipInfo?.isActive ? 'Extend VIP' : 'Assign VIP'}
                      </motion.button>
                    </div>
                    {vipInfo ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={vipInfo.isActive ? 'text-green-400 font-semibold' : 'text-gray-500'}>
                            {vipInfo.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {vipInfo.vipExpiry && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Expires:</span>
                            <span className="text-white">
                              {new Date(vipInfo.vipExpiry).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {vipInfo.daysRemaining !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Days Remaining:</span>
                            <span className="text-white font-semibold">
                              {vipInfo.daysRemaining} days
                            </span>
                          </div>
                        )}
                        {vipInfo.acquisitionSource && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Source:</span>
                            <span className="text-amber-400 capitalize">
                              {vipInfo.acquisitionSource}
                            </span>
                          </div>
                        )}
                        {vipInfo.vipPlan && vipInfo.vipPlan !== 'none' && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Plan:</span>
                            <span className="text-white capitalize">
                              {vipInfo.vipPlan}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No VIP membership</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VIP Assignment Modal */}
      <AnimatePresence>
        {showVIPModal && selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowVIPModal(false);
                setSelectedUser(null);
                setVipInfo(null);
              }}
              className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                    <Crown className="w-6 h-6" />
                    Assign VIP Membership
                  </h2>
                  <button
                    onClick={() => {
                      setShowVIPModal(false);
                      setSelectedUser(null);
                      setVipInfo(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {vipInfo && vipInfo.isActive && (
                  <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                      Current VIP expires: {new Date(vipInfo.vipExpiry).toLocaleString()}
                    </p>
                    <p className="text-yellow-300 text-xs mt-1">
                      Source: {vipInfo.acquisitionSource || 'Unknown'}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">VIP Duration</label>
                    <select
                      value={vipDuration}
                      onChange={(e) => setVipDuration(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="daily">1 Day ($2.99)</option>
                      <option value="monthly">1 Month ($9.99)</option>
                      <option value="3months">3 Months ($24.99)</option>
                      <option value="yearly">1 Year ($79.99)</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleConfirmAssignVIP}
                      disabled={loadingVIP}
                      className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:opacity-50 rounded-lg text-gray-900 font-bold transition-all"
                      whileHover={{ scale: loadingVIP ? 1 : 1.02 }}
                      whileTap={{ scale: loadingVIP ? 1 : 0.98 }}
                    >
                      {loadingVIP ? 'Assigning...' : 'Assign VIP'}
                    </motion.button>
                    <button
                      onClick={() => {
                        setShowVIPModal(false);
                        setSelectedUser(null);
                        setVipInfo(null);
                      }}
                      className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSave={handleSaveUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    isVIP: user.isVIP || user.status === 'VIP',
    role: user.role || 'user',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-6 max-w-2xl w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Edit User</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-amber-500/30 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-amber-500/30 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => {
                  // Prevent changing to admin role in user management
                  if (e.target.value === 'admin') {
                    alert('Cannot change user role to admin. Admin accounts must be managed separately.');
                    return;
                  }
                  setFormData({ ...formData, role: e.target.value });
                }}
                className="w-full px-4 py-2 bg-gray-800 border border-amber-500/30 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                disabled={formData.role === 'admin'}
              >
                <option value="user">User</option>
                <option value="admin" disabled>Admin (Not available in user management)</option>
              </select>
              {formData.role === 'admin' && (
                <p className="text-xs text-amber-400 mt-1">Admin accounts cannot be edited through user management</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVIP"
                checked={formData.isVIP}
                onChange={(e) => setFormData({ ...formData, isVIP: e.target.checked })}
                className="w-4 h-4 text-amber-500 bg-gray-800 border-amber-500/30 rounded focus:ring-amber-500"
              />
              <label htmlFor="isVIP" className="text-sm text-gray-400">VIP User</label>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors disabled:opacity-50"
                whileHover={{ scale: saving ? 1 : 1.05 }}
                whileTap={{ scale: saving ? 1 : 0.95 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}

// Predictions Content Component
function PredictionsContent() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  async function fetchPredictions() {
    setLoading(true);
    try {
      const { predictions: predictionsData } = await getPredictions();
      setPredictions(predictionsData || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-4xl bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">
        Predictions Management
      </h1>
      <p className="text-gray-400">Manage manual predictions and categories</p>

      {loading ? (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading predictions...</p>
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No data available</p>
          <p className="text-gray-500 text-sm">Predictions will appear here once created</p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <div key={prediction._id || prediction.id} className="bg-gray-900 border border-amber-500/20 rounded-xl p-4">
              <p className="text-white font-medium">{prediction.homeTeam} vs {prediction.awayTeam}</p>
              <p className="text-gray-400 text-sm">{prediction.league}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Comments Content Component
function CommentsContent() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [searchQuery, filter]);

  async function fetchComments() {
    setLoading(true);
    try {
      const token = getToken();
      const result = await getAdminComments(token, {
        page: 1,
        limit: 100,
        search: searchQuery,
        filter: filter === 'all' ? '' : filter,
      });

      if (result.success && result.data?.comments) {
        setComments(result.data.comments || []);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setDeletingId(commentId);
    try {
      const token = getToken();
      const result = await deleteCommentApi(commentId, token);

      if (result.success) {
        // Remove from list
        setComments(comments.filter(c => (c._id || c.id) !== commentId));
      } else {
        alert(result.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl mb-2 bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">
          Comments Management
        </h1>
        <p className="text-gray-400">Monitor and moderate user comments</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-green-500/20 rounded-xl text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'normal', 'spam', 'flagged'].map((filterType) => (
            <motion.button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-6 py-3 rounded-xl transition-all capitalize ${filter === filterType
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-green-500/20'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filterType === 'all' ? 'All Comments' : filterType}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No comments available</p>
          <p className="text-gray-500 text-sm">Comments will appear here once users start commenting</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {comments.map((comment, index) => (
            <motion.div
              key={comment._id || comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-900 border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Username and Status */}
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-white font-semibold">
                      {comment.username || comment.userId?.name || 'Unknown'}
                    </span>
                    {comment.isSpam && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        SPAM
                      </span>
                    )}
                    {comment.isFlagged && (
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        FLAGGED
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Recently'}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-gray-300 mb-2 break-words">{comment.message}</p>

                  {/* Match ID if available */}
                  {comment.matchId && (
                    <p className="text-xs text-gray-500">
                      Match ID: {comment.matchId}
                    </p>
                  )}
                </div>

                {/* Delete Button */}
                <motion.button
                  onClick={() => handleDelete(comment._id || comment.id)}
                  disabled={deletingId === (comment._id || comment.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Delete comment"
                >
                  {deletingId === (comment._id || comment.id) ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}


// Reports Content Component
function ReportsContent() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const reportsData = await getReports();
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-4xl bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">
        Reports & Analytics
      </h1>
      <p className="text-gray-400">View detailed reports and statistics</p>

      {loading ? (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading reports...</p>
        </div>
      ) : !reports ? (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No data available</p>
          <p className="text-gray-500 text-sm">Reports will appear here once data is available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-6">
            <h3 className="text-xl mb-4">Statistics</h3>
            <div className="space-y-2">
              <p className="text-gray-400">Total Users: <span className="text-white">{reports.stats?.totalUsers || 0}</span></p>
              <p className="text-gray-400">VIP Users: <span className="text-white">{reports.stats?.vipUsers || 0}</span></p>
              <p className="text-gray-400">Total Predictions: <span className="text-white">{reports.stats?.totalPredictions || 0}</span></p>
              <p className="text-gray-400">Total Comments: <span className="text-white">{reports.stats?.totalComments || 0}</span></p>
            </div>
          </div>
          <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-6">
            <h3 className="text-xl mb-4">Prediction Accuracy</h3>
            <p className="text-3xl text-green-500">{reports.predictions?.accuracy || 0}%</p>
            <p className="text-gray-400 text-sm mt-2">
              Won: {reports.predictions?.won || 0} | Lost: {reports.predictions?.lost || 0} | Pending: {reports.predictions?.pending || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Content Component
function SettingsContent() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'seo', label: 'SEO', icon: Search }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const settingsData = await getSettings();
      // Ensure nested objects exist
      setSettings({
        ...settingsData,
        socialMedia: settingsData.socialMedia || {},
        seo: settingsData.seo || {}
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings({
        appName: 'OptikGoal',
        appLogo: '/assets/logo.png',
        supportEmail: 'support@optikgoal.com',
        tagline: 'Your Ultimate Sports Prediction Platform',
        contactPhone: '',
        footerText: 'Professional sports predictions and analysis',
        copyrightText: '© 2024 OptikGoal. All rights reserved.',
        maintenanceMode: false,
        maintenanceMessage: '',
        registrationEnabled: true,
        commentsEnabled: true,
        vipEnabled: true,
        liveScoresEnabled: true,
        socialMedia: {},
        seo: {},
        languages: ['en', 'tr', 'ar'],
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const updateField = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  const updateNestedField = (parent, field, value) => {
    setSettings({
      ...settings,
      [parent]: { ...settings[parent], [field]: value }
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-green-400">System Settings</h1>
          <p className="text-gray-400 mt-2">Configure system preferences and options</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all ${activeTab === tab.id
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900 border border-green-500/20 rounded-xl p-6">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <h2 className="text-2xl text-white mb-4">General Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">App Name</label>
                <input
                  type="text"
                  value={settings.appName || ''}
                  onChange={(e) => updateField('appName', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">App Logo URL</label>
                <input
                  type="text"
                  value={settings.appLogo || ''}
                  onChange={(e) => updateField('appLogo', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail || ''}
                  onChange={(e) => updateField('supportEmail', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={settings.contactPhone || ''}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-2">Website Tagline</label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-2">Footer Text</label>
                <textarea
                  value={settings.footerText || ''}
                  onChange={(e) => updateField('footerText', e.target.value)}
                  rows="2"
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-2">Copyright Text</label>
                <input
                  type="text"
                  value={settings.copyrightText || ''}
                  onChange={(e) => updateField('copyrightText', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6">
            <h2 className="text-2xl text-white mb-4">Feature Toggles</h2>

            {/* Maintenance Mode */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">Maintenance Mode</h3>
                  <p className="text-gray-400 text-sm">Put website in maintenance mode</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode || false}
                    onChange={(e) => updateField('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              {settings.maintenanceMode && (
                <input
                  type="text"
                  value={settings.maintenanceMessage || ''}
                  onChange={(e) => updateField('maintenanceMessage', e.target.value)}
                  placeholder="Maintenance message..."
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none mt-2"
                />
              )}
            </div>

            {/* Other Feature Toggles */}
            {[
              { key: 'registrationEnabled', label: 'User Registration', desc: 'Allow new users to register' },
              { key: 'commentsEnabled', label: 'Comments System', desc: 'Enable comments on predictions' },
              { key: 'vipEnabled', label: 'VIP Membership', desc: 'Enable VIP membership features' },
              { key: 'liveScoresEnabled', label: 'Live Scores', desc: 'Show live scores section' }
            ].map(feature => (
              <div key={feature.key} className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{feature.label}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[feature.key] !== false}
                    onChange={(e) => updateField(feature.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-4">
            <h2 className="text-2xl text-white mb-4">Social Media Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'facebook', label: 'Facebook URL', icon: '📘' },
                { key: 'twitter', label: 'Twitter/X URL', icon: '🐦' },
                { key: 'instagram', label: 'Instagram URL', icon: '📷' },
                { key: 'youtube', label: 'YouTube URL', icon: '📺' },
                { key: 'telegram', label: 'Telegram URL', icon: '✈️' },
                { key: 'whatsapp', label: 'WhatsApp Number', icon: '💬' }
              ].map(social => (
                <div key={social.key}>
                  <label className="block text-gray-300 mb-2">
                    {social.icon} {social.label}
                  </label>
                  <input
                    type="text"
                    value={settings.socialMedia?.[social.key] || ''}
                    onChange={(e) => updateNestedField('socialMedia', social.key, e.target.value)}
                    placeholder={`https://...`}
                    className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-4">
            <h2 className="text-2xl text-white mb-4">SEO Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Meta Description</label>
                <textarea
                  value={settings.seo?.metaDescription || ''}
                  onChange={(e) => updateNestedField('seo', 'metaDescription', e.target.value)}
                  rows="3"
                  placeholder="Brief description of your website for search engines..."
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Meta Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={settings.seo?.metaKeywords || ''}
                  onChange={(e) => updateNestedField('seo', 'metaKeywords', e.target.value)}
                  placeholder="sports, predictions, betting, tips..."
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Google Analytics ID</label>
                  <input
                    type="text"
                    value={settings.seo?.googleAnalyticsId || ''}
                    onChange={(e) => updateNestedField('seo', 'googleAnalyticsId', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={settings.seo?.facebookPixelId || ''}
                    onChange={(e) => updateNestedField('seo', 'facebookPixelId', e.target.value)}
                    placeholder="123456789012345"
                    className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Favicon URL</label>
                <input
                  type="text"
                  value={settings.seo?.faviconUrl || ''}
                  onChange={(e) => updateNestedField('seo', 'faviconUrl', e.target.value)}
                  placeholder="/favicon.ico"
                  className="w-full px-4 py-2 bg-gray-800 border border-green-500/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// VIP Control Content Component
function VIPControlContent() {
  const [vipUsers, setVipUsers] = useState([]);
  const [vipPredictions, setVipPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState({
    monthly: { price: 29.99, discount: 0, features: ['All VIP Predictions', 'Priority Support'] },
    quarterly: { price: 79.99, discount: 10, features: ['All VIP Predictions', 'Priority Support', 'Expert Analysis'] },
    yearly: { price: 249.99, discount: 20, features: ['All VIP Predictions', 'Priority Support', 'Expert Analysis', 'Direct Consultant'] }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVIPData();
  }, []);

  const [selectedVIPUser, setSelectedVIPUser] = useState(null);
  const [showVIPUserModal, setShowVIPUserModal] = useState(false);
  const [vipUserInfo, setVipUserInfo] = useState(null);
  const [assigningVIP, setAssigningVIP] = useState(false);
  const [vipDuration, setVipDuration] = useState('daily');

  async function fetchVIPData() {
    setLoading(true);
    try {
      // Fetch VIP Users with full VIP info
      const { users } = await getUsers('', 'VIP');
      const usersWithVIPInfo = await Promise.all(
        (users || []).map(async (user) => {
          try {
            const { getUserVIPStatus } = await import('../utils/adminApi');
            const vipStatus = await getUserVIPStatus(user.id || user._id);
            return {
              ...user,
              vipExpiry: vipStatus?.vipExpiry,
              acquisitionSource: vipStatus?.acquisitionSource,
              vipPlan: vipStatus?.vipPlan,
              daysRemaining: vipStatus?.daysRemaining,
              isActive: vipStatus?.isActive,
            };
          } catch (error) {
            return user;
          }
        })
      );
      setVipUsers(usersWithVIPInfo);

      // Fetch VIP Predictions
      const { predictions } = await getPredictions();
      const vipPreds = (predictions || []).filter(p => p.isVIP || p.predictionType === 'vip');
      setVipPredictions(vipPreds);


      // Fetch Settings for Pricing
      const settings = await getSettings();
      if (settings?.vipPricing) {
        // Merge with defaults to ensure features are preserved
        const defaultPricing = {
          monthly: { price: 29.99, discount: 0, features: ['All VIP Predictions', 'Priority Support'] },
          quarterly: { price: 79.99, discount: 10, features: ['All VIP Predictions', 'Priority Support', 'Expert Analysis'] },
          yearly: { price: 249.99, discount: 20, features: ['All VIP Predictions', 'Priority Support', 'Expert Analysis', 'Direct Consultant'] }
        };

        const mergedPricing = {
          monthly: { ...defaultPricing.monthly, ...settings.vipPricing.monthly },
          quarterly: { ...defaultPricing.quarterly, ...settings.vipPricing.quarterly },
          yearly: { ...defaultPricing.yearly, ...settings.vipPricing.yearly }
        };

        setPricing(mergedPricing);
      }
    } catch (error) {
      console.error('Error fetching VIP data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePricing() {
    setSaving(true);
    try {
      const currentSettings = await getSettings() || {};
      await updateSettings({
        ...currentSettings,
        vipPricing: pricing
      });
      alert('VIP Pricing & Features updated successfully!');
    } catch (error) {
      console.error('Error saving pricing:', error);
      alert('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  }

  const handlePriceChange = (plan, field, value) => {
    setPricing(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const addfeature = (plan, feature) => {
    if (!feature) return;
    setPricing(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        features: [...prev[plan].features, feature]
      }
    }));
  };

  const removeFeature = (plan, index) => {
    setPricing(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        features: prev[plan].features.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header - ALWAYS VISIBLE */}
      <div className="mb-6">
        <h1 className="text-4xl mb-2 font-bold text-yellow-400">
          VIP Section Control
        </h1>
        <p className="text-gray-400">Manage VIP exclusive content, members, and pricing</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading VIP data...</p>
        </div>
      ) : (
        <>
          {/* Pricing Management - MOVED TO TOP FOR VISIBILITY */}
          <div className="space-y-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 bg-gray-800/30 p-4 rounded-lg">
              <h2 className="text-2xl text-white flex items-center space-x-2">
                <Tag className="w-6 h-6 text-yellow-500" />
                <span>Pricing Plans Management</span>
              </h2>
              <button
                onClick={handleSavePricing}
                disabled={saving}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#eab308'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#facc15'}
                style={{ backgroundColor: '#facc15' }}
                className="w-full md:w-auto px-8 py-3 text-gray-900 font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving Changes...' : 'Save All Changes'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                { id: 'monthly', label: 'Monthly Plan', icon: Battery },
                { id: 'quarterly', label: '3 Months Plan', icon: BatteryMedium },
                { id: 'yearly', label: 'Yearly Plan', icon: BatteryFull }
              ].map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gray-900 border border-yellow-500/20 rounded-xl p-6 hover:border-yellow-500/40 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <plan.icon className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-xl font-bold text-white">{plan.label}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Base Price ($)</label>
                      <input
                        type="number"
                        value={pricing[plan.id]?.price || 0}
                        onChange={(e) => handlePriceChange(plan.id, 'price', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-yellow-500/20 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Discount (%)</label>
                      <input
                        type="number"
                        value={pricing[plan.id]?.discount || 0}
                        onChange={(e) => handlePriceChange(plan.id, 'discount', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-yellow-500/20 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                      <label className="block text-sm text-gray-400 mb-2">Features</label>
                      <div className="space-y-2 mb-3">
                        {(pricing[plan.id]?.features || []).map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-center justify-between text-sm bg-gray-800 px-3 py-1.5 rounded">
                            <span className="text-gray-300">{feature}</span>
                            <button
                              onClick={() => removeFeature(plan.id, fIdx)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add feature"
                          className="flex-1 px-3 py-1.5 bg-gray-800 border border-yellow-500/20 rounded-lg text-sm text-white focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addfeature(plan.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          className="p-1.5 bg-yellow-500/20 text-yellow-500 rounded-lg hover:bg-yellow-500/30"
                          title="Press Enter to add"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-yellow-500/20 rounded-xl p-6"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">VIP Members</h3>
                  <p className="text-gray-400">Active Subscribers</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{vipUsers.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 border border-yellow-500/20 rounded-xl p-6"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">VIP Predictions</h3>
                  <p className="text-gray-400">Exclusive Tips</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{vipPredictions.length}</p>
            </motion.div>
          </div>

          {/* VIP Users Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl text-white flex items-center space-x-2">
                <Users className="w-6 h-6 text-yellow-500" />
                <span>VIP Members Management</span>
              </h2>
              <motion.button
                onClick={fetchVIPData}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-gray-900 font-semibold transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Activity className="w-4 h-4" />
                Refresh
              </motion.button>
            </div>
            
            <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="text-left p-4 text-gray-400 font-medium">User</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Expiration</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Source</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Plan</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vipUsers.map((user, idx) => (
                      <motion.tr
                        key={user.id || user._id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
                              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{user.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.isActive !== false && user.vipExpiry && new Date(user.vipExpiry) > new Date()
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {user.isActive !== false && user.vipExpiry && new Date(user.vipExpiry) > new Date() ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="p-4">
                          {user.vipExpiry ? (
                            <div className="text-sm">
                              <p className="text-white">
                                {new Date(user.vipExpiry).toLocaleDateString()}
                              </p>
                              {user.daysRemaining !== undefined && (
                                <p className="text-xs text-gray-400">
                                  {user.daysRemaining > 0 ? `${user.daysRemaining} days left` : 'Expired'}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          {user.acquisitionSource ? (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium capitalize">
                              {user.acquisitionSource}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Unknown</span>
                          )}
                        </td>
                        <td className="p-4">
                          {user.vipPlan && user.vipPlan !== 'none' ? (
                            <span className="text-amber-400 text-sm font-medium capitalize">
                              {user.vipPlan}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              onClick={() => {
                                setSelectedVIPUser(user);
                                setShowVIPUserModal(true);
                                // Fetch detailed VIP info
                                (async () => {
                                  try {
                                    const { getUserVIPStatus } = await import('../utils/adminApi');
                                    const vipStatus = await getUserVIPStatus(user.id || user._id);
                                    setVipUserInfo(vipStatus);
                                  } catch (error) {
                                    console.error('Error fetching VIP status:', error);
                                  }
                                })();
                              }}
                              className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Manage VIP"
                            >
                              <Crown className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                setSelectedVIPUser(user);
                                setVipDuration('daily');
                                setShowVIPUserModal(true);
                                (async () => {
                                  try {
                                    const { getUserVIPStatus } = await import('../utils/adminApi');
                                    const vipStatus = await getUserVIPStatus(user.id || user._id);
                                    setVipUserInfo(vipStatus);
                                  } catch (error) {
                                    console.error('Error fetching VIP status:', error);
                                  }
                                })();
                              }}
                              className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Assign/Extend VIP"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {vipUsers.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500">
                          No VIP members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* VIP User Management Modal */}
          <AnimatePresence>
            {showVIPUserModal && selectedVIPUser && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setShowVIPUserModal(false);
                    setSelectedVIPUser(null);
                    setVipUserInfo(null);
                  }}
                  className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                        <Crown className="w-6 h-6" />
                        Manage VIP: {selectedVIPUser.name}
                      </h2>
                      <button
                        onClick={() => {
                          setShowVIPUserModal(false);
                          setSelectedVIPUser(null);
                          setVipUserInfo(null);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Current VIP Status */}
                    {vipUserInfo && (
                      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-yellow-500/30">
                        <h3 className="text-lg font-bold text-white mb-3">Current VIP Status</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={vipUserInfo.isActive ? 'text-green-400 font-semibold' : 'text-red-400'}>
                              {vipUserInfo.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {vipUserInfo.vipExpiry && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Expires:</span>
                              <span className="text-white">
                                {new Date(vipUserInfo.vipExpiry).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {vipUserInfo.daysRemaining !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Days Remaining:</span>
                              <span className="text-white font-semibold">
                                {vipUserInfo.daysRemaining} days
                              </span>
                            </div>
                          )}
                          {vipUserInfo.acquisitionSource && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Source:</span>
                              <span className="text-amber-400 capitalize">
                                {vipUserInfo.acquisitionSource}
                              </span>
                            </div>
                          )}
                          {vipUserInfo.vipPlan && vipUserInfo.vipPlan !== 'none' && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Plan:</span>
                              <span className="text-white capitalize">
                                {vipUserInfo.vipPlan}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Assign/Extend VIP */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white">Assign/Extend VIP</h3>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">VIP Duration</label>
                        <select
                          value={vipDuration}
                          onChange={(e) => setVipDuration(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                        >
                          <option value="daily">1 Day ($2.99)</option>
                          <option value="monthly">1 Month ($9.99)</option>
                          <option value="3months">3 Months ($24.99)</option>
                          <option value="yearly">1 Year ($79.99)</option>
                        </select>
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          onClick={async () => {
                            if (!selectedVIPUser?.id) return;
                            setAssigningVIP(true);
                            try {
                              const { assignVIP } = await import('../utils/adminApi');
                              const result = await assignVIP(selectedVIPUser.id, vipDuration);
                              alert(result.message || 'VIP assigned successfully!');
                              setShowVIPUserModal(false);
                              setSelectedVIPUser(null);
                              setVipUserInfo(null);
                              await fetchVIPData();
                            } catch (error) {
                              alert('Error assigning VIP: ' + error.message);
                            } finally {
                              setAssigningVIP(false);
                            }
                          }}
                          disabled={assigningVIP}
                          className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:opacity-50 rounded-lg text-gray-900 font-bold transition-all"
                          whileHover={{ scale: assigningVIP ? 1 : 1.02 }}
                          whileTap={{ scale: assigningVIP ? 1 : 0.98 }}
                        >
                          {assigningVIP ? 'Assigning...' : 'Assign VIP'}
                        </motion.button>
                        <button
                          onClick={() => {
                            setShowVIPUserModal(false);
                            setSelectedVIPUser(null);
                            setVipUserInfo(null);
                          }}
                          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* VIP Predictions List */}
          <div className="space-y-4">
            <h2 className="text-2xl text-white flex items-center space-x-2">
              <Target className="w-6 h-6 text-yellow-500" />
              <span>Active VIP Predictions</span>
            </h2>
            <div className="grid gap-4">
              {vipPredictions.slice(0, 5).map((pred, idx) => (
                <div key={idx} className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium">{pred.homeTeam} vs {pred.awayTeam}</h4>
                    <p className="text-yellow-500 text-sm mt-1">{pred.tip}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-lg text-xs font-bold uppercase">
                      VIP
                    </span>
                    <p className="text-gray-500 text-xs mt-2">{pred.league}</p>
                  </div>
                </div>
              ))}
              {vipPredictions.length === 0 && (
                <div className="p-8 text-center text-gray-500 bg-gray-900 border border-yellow-500/20 rounded-xl">
                  No VIP predictions active
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

