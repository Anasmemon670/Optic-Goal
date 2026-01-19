import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home } from './components/Home';
import { Predictions } from './components/Predictions';
import { MatchBulletin } from './components/MatchBulletin';
import { LiveScores } from './components/LiveScores';
import { VIPMembership } from './components/VIPMembership';
import { Community } from './components/Community';
import { News } from './components/News';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { Navigation } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Footer } from './components/Footer';
import { InfoBanner } from './components/InfoBanner';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { Notifications } from './components/Notifications';
import { AIAssistant } from './components/AIAssistant';
import { AISearch } from './components/AISearch';
import ErrorBoundary from './components/ErrorBoundary';
import {
  login as authLogin,
  register as authRegister,
  adminLogin,
  verifySession,
  clearAuth,
  saveAuth,
  getUser,
  getToken,
  isAdmin as checkIsAdmin,
  isVIP as checkIsVIP
} from './utils/auth';

// Portal wrapper to render AIAssistant directly to document.body
// This bypasses all parent transforms/filters that break position:fixed
function AIAssistantPortal(props) {
  return createPortal(
    <AIAssistant {...props} />,
    document.body
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isVerifying, setIsVerifying] = useState(true);
  const [aiOpenRequestId, setAiOpenRequestId] = useState(0);
  const isLoggingOutRef = useRef(false);

  // Handle page changes with scroll to top and URL update
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Update URL without reload
    const url = page.includes('?') ? `/${page}` : `/${page}`;
    window.history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Robust open signal for AI Assistant (avoids relying on DOM events)
  const openAIAssistant = () => setAiOpenRequestId((v) => v + 1);

  // Initialize page from URL on mount
  useEffect(() => {
    const path = window.location.pathname.slice(1) || 'home';
    const search = window.location.search;
    const fullPath = search ? `${path}${search}` : path;
    setCurrentPage(fullPath);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      // Check if this is admin email - if so, use admin login
      const ADMIN_EMAIL = 'sameer123@gmail.com'; // Match backend .env
      if (email === ADMIN_EMAIL) {
        // This is admin login - use admin endpoint
        const result = await adminLogin(email, password);
        saveAuth(result.token, result.user);
        setIsAuthenticated(true);
        setIsAdmin(true);
        setIsVIP(false);
        setShowAuthModal(false);
        handlePageChange('admin');
        return;
      }

      // Regular user login
      const result = await authLogin(email, password);

      // Save authentication (this stores the role and isVIP)
      saveAuth(result.token, result.user);

      // Update state - ensure role is checked correctly
      setIsAuthenticated(true);
      const userRole = result.user?.role || getUser()?.role;
      setIsAdmin(userRole === 'admin');
      setIsVIP(result.user?.isVIP || false);
      setShowAuthModal(false);

      // Redirect based on role
      if (userRole === 'admin') {
        handlePageChange('admin');
      } else {
        // Regular user - redirect to home
        handlePageChange('home');
      }
    } catch (error) {
      // Error is handled in AuthModal
      throw error;
    }
  };

  const handleSignup = async (name, email, password) => {
    try {
      const result = await authRegister(name, email, password);

      // Save authentication (this stores the role and isVIP)
      saveAuth(result.token, result.user);

      // Update state - ensure role is checked correctly
      setIsAuthenticated(true);
      const userRole = result.user?.role || getUser()?.role;
      setIsAdmin(userRole === 'admin');
      setIsVIP(result.user?.isVIP || false);
      setShowAuthModal(false);

      // Redirect based on role
      if (userRole === 'admin') {
        handlePageChange('admin');
      } else {
        // Regular user - redirect to home/dashboard
        handlePageChange('home');
      }
    } catch (error) {
      // Error is handled in AuthModal
      throw error;
    }
  };

  const handleAdminLogin = async (email, password) => {
    try {
      const result = await adminLogin(email, password);

      // Save admin authentication
      saveAuth(result.token, result.user);

      // Update state
      setIsAuthenticated(true);
      setIsAdmin(true);
      setIsVIP(false);

      // Redirect to admin dashboard
      handlePageChange('admin');
    } catch (error) {
      // Re-throw with better error message
      const errorMessage = error.message || 'Login failed. Please check your credentials and ensure the backend server is running.';
      throw new Error(errorMessage);
    }
  };

  const handleLogout = () => {
    // Prevent multiple logout calls
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    // Clear authentication
    clearAuth();

    // Reset state
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsVIP(false);

    // Redirect based on current page - only redirect if on admin pages
    const pagePath = currentPage.split('?')[0];
    if (pagePath === 'admin' || pagePath === 'admin/login') {
      handlePageChange('home');
    }

    // Reset logout flag after a short delay to allow state updates to complete
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 100);
  };

  // Verify session on mount - single initialization point
  useEffect(() => {
    const checkAuth = async () => {
      setIsVerifying(true);
      try {
        const result = await verifySession();
        if (result.authenticated && result.user) {
          // Use verified session data (primary source)
          setIsAuthenticated(true);
          const userRole = result.user?.role || 'user';
          setIsAdmin(userRole === 'admin');
          setIsVIP(result.user?.isVIP || false);
        } else {
          // Verification failed - check localStorage as fallback
          const storedUser = getUser();
          const token = getToken();
          if (storedUser && token) {
            // Use cached credentials (fallback)
            setIsAuthenticated(true);
            setIsAdmin(storedUser.role === 'admin');
            setIsVIP(storedUser.isVIP || false);
            console.log('[App] Using cached auth state (verification failed)');
          } else {
            // No valid credentials
            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsVIP(false);
          }
        }
      } catch (error) {
        console.error('[App] Auth verification error:', error);
        // On error, fallback to localStorage
        const storedUser = getUser();
        const token = getToken();
        if (storedUser && token) {
          setIsAuthenticated(true);
          setIsAdmin(storedUser.role === 'admin');
          setIsVIP(storedUser.isVIP || false);
          console.log('[App] Using cached auth state (verification error)');
        } else {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setIsVIP(false);
        }
      } finally {
        setIsVerifying(false);
      }
    };

    checkAuth();
  }, []);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Protect routes based on authentication and role
  // This useEffect handles all route protection and redirects
  useEffect(() => {
    if (isVerifying) return; // Don't check routes while verifying
    if (isLoggingOutRef.current) return; // Don't check routes during logout

    const pagePath = currentPage.split('?')[0];
    const token = getToken();
    const storedUser = getUser();

    // Check if user is admin (from state or localStorage)
    const userIsAdmin = isAdmin || storedUser?.role === 'admin';

    // If admin status from localStorage but not in state, update state
    // Only update if we have a token (user is actually logged in)
    if (!isAdmin && storedUser?.role === 'admin' && token && isAuthenticated) {
      setIsAdmin(true);
      setIsAuthenticated(true);
      return; // Exit early to avoid redirect conflicts
    }

    // Handle profile, settings, notifications - redirect to home and open auth modal if not authenticated
    if ((pagePath === 'profile' || pagePath === 'settings' || pagePath === 'notifications') && !isAuthenticated && !token) {
      handlePageChange('home');
      openAuthModal('login');
      return;
    }

    // Admin login page - accessible to everyone (but will redirect if already admin)
    if (pagePath === 'admin/login') {
      if (userIsAdmin && token && isAuthenticated) {
        // Already logged in as admin, redirect to dashboard
        handlePageChange('admin');
      }
      return;
    }

    // All admin pages (dashboard, users, predictions, comments, settings, reports)
    const adminPages = ['admin', 'admin/dashboard', 'admin/users', 'admin/predictions', 'admin/comments', 'admin/settings', 'admin/reports'];
    if (adminPages.includes(pagePath)) {
      // If no token → redirect to /admin/login
      if (!token || !isAuthenticated) {
        handlePageChange('admin/login');
        return;
      }

      // If token exists but role !== "admin" → redirect to /
      if (!userIsAdmin) {
        handlePageChange('home');
        return;
      }
    }

    // VIP pages - check if user has VIP access
    if (pagePath === 'vip' && !isVIP && isAuthenticated) {
      // User is logged in but not VIP - they can see the VIP page to upgrade
      // This is handled in VIPMembership component
    }
  }, [currentPage, isAdmin, isVIP, isAuthenticated, isVerifying]);

  const renderPage = () => {
    // Show ads only for authenticated regular users (not VIP, not admin)
    const showAds = isAuthenticated && !isVIP && !isAdmin;

    // Show loading state while verifying
    if (isVerifying) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    // Parse current page and query params
    const pagePath = currentPage.split('?')[0];
    const params = new URLSearchParams(window.location.search);

    // Check authentication for protected pages - return home if not authenticated
    // (redirects are handled in useEffect above)
    const token = getToken();
    if ((pagePath === 'profile' || pagePath === 'settings' || pagePath === 'notifications') && !isAuthenticated && !token) {
      return <Home setCurrentPage={handlePageChange} showAds={showAds} openAIAssistant={openAIAssistant} />;
    }

    // Check admin access for admin pages
    if (pagePath === 'admin') {
      const storedUser = getUser();
      const userIsAdmin = isAdmin || storedUser?.role === 'admin';
      if (!userIsAdmin || !token || !isAuthenticated) {
        return <Home setCurrentPage={handlePageChange} showAds={showAds} openAIAssistant={openAIAssistant} />;
      }
    }

    // Check admin login page - if already admin, show home (redirect handled in useEffect)
    if (pagePath === 'admin/login') {
      const loginStoredUser = getUser();
      const loginUserIsAdmin = isAdmin || loginStoredUser?.role === 'admin';
      if (loginUserIsAdmin && token && isAuthenticated) {
        return <Home setCurrentPage={handlePageChange} showAds={showAds} openAIAssistant={openAIAssistant} />;
      }
    }

    switch (pagePath) {
      case 'home':
        return <Home setCurrentPage={handlePageChange} showAds={showAds} openAIAssistant={openAIAssistant} />;
      case 'predictions':
        return <Predictions isAuthenticated={isAuthenticated} isVIP={isVIP} showAds={showAds} />;
      case 'bulletin': {
        return <MatchBulletin showAds={showAds} isAuthenticated={isAuthenticated} />;
      }
      case 'live': {
        const sportType = params.get('type') || 'football';
        return <LiveScores sportType={sportType} showAds={showAds} isAuthenticated={isAuthenticated} />;
      }
      case 'vip':
        return <VIPMembership isAuthenticated={isAuthenticated} isVIP={isVIP} openAuthModal={openAuthModal} />;
      case 'community':
        return <Community isAuthenticated={isAuthenticated} openAuthModal={openAuthModal} showAds={showAds} />;
      case 'news':
        return <News showAds={showAds} />;
      case 'ai-search':
        return <AISearch setCurrentPage={handlePageChange} />;
      case 'admin/login':
        return <AdminLogin onLogin={handleAdminLogin} />;
      case 'admin':
        return <AdminPanel onLogout={handleLogout} />;
      case 'profile':
        return <Profile onLogout={handleLogout} openAuthModal={openAuthModal} setCurrentPage={handlePageChange} />;
      case 'settings':
        return <Settings />;
      case 'notifications':
        return <Notifications openAuthModal={openAuthModal} />;
      default:
        return <Home setCurrentPage={handlePageChange} showAds={showAds} openAIAssistant={openAIAssistant} />;
    }
  };

  return (
    <>
      {/* Main App Container */}
      <div className="min-h-screen bg-gray-900 text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {currentPage !== 'admin' && currentPage !== 'admin/login' && (
          <>
            <Navigation
              currentPage={currentPage}
              setCurrentPage={handlePageChange}
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              isVIP={isVIP}
              onLogout={handleLogout}
              openAuthModal={openAuthModal}
              language={language}
              setLanguage={setLanguage}
            />

            <InfoBanner />
          </>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>

        {currentPage !== 'admin' && currentPage !== 'admin/login' && <Footer setCurrentPage={handlePageChange} language={language} />}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onLogin={handleLogin}
          onSignup={handleSignup}
          setMode={setAuthMode}
          language={language}
        />
      </div>

      {/* AI Assistant - Rendered via Portal for proper fixed positioning */}
      {/* CRITICAL: Uses React Portal to bypass all parent transforms/filters */}
      {/* Available on all pages except admin pages */}
      {currentPage !== 'admin' && currentPage !== 'admin/login' && (
        <ErrorBoundary fallbackMessage="AI Assistant is temporarily unavailable. Please refresh the page or try again later.">
          <AIAssistantPortal
            isAuthenticated={isAuthenticated}
            isVIP={isVIP}
            isVerifying={isVerifying}
            openRequestId={aiOpenRequestId}
          />
        </ErrorBoundary>
      )}
    </>
  );
}

