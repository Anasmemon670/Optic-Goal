import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Home, Target, FileText, Radio, Crown, MessageSquare, Newspaper, Settings, User, User2, Bell } from 'lucide-react';
import { t } from '../utils/translations.js';
import logoImage from '../assets/logo.png';
import { getUser } from '../utils/auth';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navigation({
  currentPage,
  setCurrentPage,
  isAuthenticated,
  isAdmin,
  isVIP,
  onLogout,
  openAuthModal,
  language,
  setLanguage
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Read stored user once for avatar logic (no extra hooks)
  const storedUser = getUser();
  const profilePhoto =
    storedUser?.profile?.photo ||
    storedUser?.profile?.avatar ||
    storedUser?.profilePhoto ||
    '';

  const navItems = [
    { id: 'home', label: t('home', language), icon: Home },
    { id: 'predictions', label: t('predictions', language), icon: Target },
    { id: 'bulletin', label: t('bulletin', language), icon: FileText },
    { id: 'live', label: t('live', language), icon: Radio },
    { id: 'community', label: t('community', language), icon: MessageSquare },
    { id: 'news', label: t('news', language), icon: Newspaper },
  ];

  // Only show VIP page to non-VIP users (VIP members already have access)
  if (!isVIP) {
    navItems.splice(4, 0, { id: 'vip', label: t('vip', language), icon: Crown });
  }

  if (isAdmin) {
    navItems.push({ id: 'admin', label: t('admin', language), icon: Settings });
  }

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-amber-500/20"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('home')}
            >
              <img
                src={logoImage}
                alt="OptikGoal Logo"
                className="h-20 w-auto object-contain"
              />
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 relative group ${isActive
                      ? 'text-green-400'
                      : 'text-gray-300 hover:text-amber-400'
                      }`}
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                    }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/15 rounded-xl border-2 border-green-500 shadow-lg shadow-green-500/30"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-2 border-amber-500/60 shadow-md shadow-amber-500/25"
                      />
                    )}
                    <Icon
                      className={`w-5 h-5 relative transition-all duration-300 z-10 ${isActive
                        ? 'text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                        : 'text-gray-300 group-hover:text-amber-400 group-hover:scale-110 group-hover:drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                        }`}
                      aria-hidden="true"
                    />
                    <span className={`relative text-sm font-medium transition-all duration-300 z-10 ${isActive
                      ? 'text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.4)]'
                      : 'text-gray-300 group-hover:text-amber-400'
                      }`}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Language Switcher - Icon Only */}
              <LanguageSwitcher language={language} setLanguage={setLanguage} />

              {/* Auth Buttons */}
              <div className="hidden lg:flex items-center space-x-3">
                {/* VIP Badge */}
                {isVIP && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg shadow-green-500/50 text-white"
                  >
                    <Crown className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-white">VIP Member</span>
                  </motion.div>
                )}

                {!isAuthenticated ? (
                  <>
                    <motion.button
                      onClick={() => openAuthModal('login')}
                      className="px-5 py-2 text-green-500 hover:text-green-400 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Login
                    </motion.button>
                    <motion.button
                      onClick={() => openAuthModal('signup')}
                      className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all text-white"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Sign Up
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      onClick={() => setCurrentPage('profile')}
                      className={`px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all group ${currentPage === 'profile'
                        ? 'text-green-500 bg-green-500/10'
                        : 'text-gray-300 hover:text-green-500'
                        }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Profile"
                      aria-current={currentPage === 'profile' ? 'page' : undefined}
                    >
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Profile avatar"
                          className="w-8 h-8 rounded-full object-cover border border-gray-700 shadow-sm"
                          aria-hidden="true"
                        />
                      ) : (
                        <User2 className="w-6 h-6" aria-hidden="true" />
                      )}
                      <span className={`text-sm font-medium hidden xl:inline transition-colors ${currentPage === 'profile'
                        ? 'text-green-500'
                        : 'text-gray-300 group-hover:text-green-500'
                        }`}>
                        Profile
                      </span>
                    </motion.button>
                    <motion.button
                      onClick={() => setCurrentPage('settings')}
                      className={`px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all group ${currentPage === 'settings'
                        ? 'text-green-500 bg-green-500/10'
                        : 'text-gray-300 hover:text-green-500'
                        }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Settings"
                      aria-current={currentPage === 'settings' ? 'page' : undefined}
                    >
                      <Settings className="w-5 h-5" aria-hidden="true" />
                      <span className={`text-sm font-medium hidden xl:inline transition-colors ${currentPage === 'settings'
                        ? 'text-green-500'
                        : 'text-gray-300 group-hover:text-green-500'
                        }`}>
                        Settings
                      </span>
                    </motion.button>
                    <motion.button
                      onClick={() => setCurrentPage('notifications')}
                      className={`px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all group ${currentPage === 'notifications'
                        ? 'text-green-500 bg-green-500/10'
                        : 'text-gray-300 hover:text-green-500'
                        }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Notifications"
                      aria-current={currentPage === 'notifications' ? 'page' : undefined}
                    >
                      <Bell className="w-5 h-5" aria-hidden="true" />
                      <span className={`text-sm font-medium hidden xl:inline transition-colors ${currentPage === 'notifications'
                        ? 'text-green-500'
                        : 'text-gray-300 group-hover:text-green-500'
                        }`}>
                        Notifications
                      </span>
                    </motion.button>
                    {!isVIP && (
                      <motion.button
                        onClick={() => setCurrentPage('vip')}
                        className="px-4 py-2 rounded-lg flex items-center space-x-2 text-amber-500 hover:text-amber-400 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Crown className="w-5 h-5" />
                        <span>VIP</span>
                      </motion.button>
                    )}
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-green-500 p-2"
                whileTap={{ scale: 0.95 }}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden fixed top-20 left-0 right-0 bg-gray-900/98 backdrop-blur-xl border-b border-amber-500/20 z-40 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3.5 rounded-xl flex items-center space-x-3 transition-all duration-300 relative group ${isActive
                      ? 'text-green-400'
                      : 'text-gray-300 hover:text-amber-400'
                      }`}
                    whileHover={{
                      scale: 1.02,
                      x: 4,
                    }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId={`mobileActiveTab-${item.id}`}
                        className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/15 rounded-xl border-2 border-green-500 shadow-lg shadow-green-500/30"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-2 border-amber-500/60 shadow-md shadow-amber-500/25"
                      />
                    )}
                    <Icon
                      className={`w-5 h-5 transition-all duration-300 z-10 ${isActive
                        ? 'text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                        : 'text-gray-300 group-hover:text-amber-400 group-hover:scale-110 group-hover:drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                        }`}
                      aria-hidden="true"
                    />
                    <span className={`text-sm font-medium transition-all duration-300 z-10 ${isActive
                      ? 'text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.4)]'
                      : 'text-gray-300 group-hover:text-amber-400'
                      }`}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}

              <div className="pt-4 border-t border-amber-500/20 space-y-2">
                {!isAuthenticated ? (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        openAuthModal('login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all text-white"
                    >
                      {t('login', language)}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        openAuthModal('signup');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-all"
                    >
                      {t('signup', language)}
                    </motion.button>
                  </>
                ) : (
                  <>
                    {/* Profile Card Mobile */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-gray-800 to-gray-900 border border-amber-500/20 rounded-xl p-4 mb-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">Profile</span>
                            {isVIP && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded text-xs flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">Manage your account</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* User Menu Items */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCurrentPage('profile');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg flex items-center space-x-3 transition-all ${currentPage === 'profile'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                        : 'text-gray-300 hover:bg-green-500/5 hover:text-green-500'
                        }`}
                    >
                      <User className="w-5 h-5" />
                      <span>Profile</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCurrentPage('settings');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg flex items-center space-x-3 transition-all ${currentPage === 'settings'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                        : 'text-gray-300 hover:bg-green-500/5 hover:text-green-500'
                        }`}
                    >
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCurrentPage('notifications');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg flex items-center space-x-3 transition-all ${currentPage === 'notifications'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                        : 'text-gray-300 hover:bg-green-500/5 hover:text-green-500'
                        }`}
                    >
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </motion.button>

                    {!isVIP && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCurrentPage('vip');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 rounded-lg flex items-center space-x-3 text-amber-500 hover:bg-amber-500/5 transition-all"
                      >
                        <Crown className="w-5 h-5" />
                        <span>VIP</span>
                      </motion.button>
                    )}

                    {isAdmin && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCurrentPage('admin');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center space-x-2 text-white"
                      >
                        <Settings className="w-5 h-5" />
                        <span>{t('admin', language)} Panel</span>
                      </motion.button>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                      {t('logout', language)}
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

