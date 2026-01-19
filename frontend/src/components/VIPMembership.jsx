import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Crown, Check, Zap, Star, Shield, CreditCard, Smartphone, 
  DollarSign, Target, TrendingUp, Gift, Users, Video, 
  Share2, Clock, Sparkles, AlertCircle, CheckCircle2, X
} from 'lucide-react';
import { getToken, isAuthenticated, isVIP as checkIsVIP } from '../utils/auth';
import { API_BASE_URL, API_ENDPOINTS, apiGet, apiPost } from '../config/api';
import logoImage from '../assets/logo.png';

export function VIPMembership({ isAuthenticated, isVIP = false, openAuthModal }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [vipStatus, setVipStatus] = useState(null);
  const [adWatchStatus, setAdWatchStatus] = useState(null);
  const [referralCode, setReferralCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVIPStatus();
      fetchAdWatchStatus();
      fetchReferralCode();
    }
  }, [isAuthenticated]);

  const fetchVIPStatus = async () => {
    try {
      const token = getToken();
      if (!token) {
        // No token = not authenticated, clear VIP status
        setVipStatus(null);
        return;
      }

      const result = await apiGet(API_ENDPOINTS.VIP.STATUS, token);
      if (result.success && result.data) {
        // Sync state with backend response
        setVipStatus(result.data);
      } else {
        // Backend returned failure - clear VIP status
        setVipStatus(null);
        console.warn('[VIPMembership] Failed to fetch VIP status:', result.message);
      }
    } catch (error) {
      console.error('[VIPMembership] Error fetching VIP status:', error);
      // On error, don't clear state (might be network issue)
      // State will be updated on next successful fetch
    }
  };

  const fetchAdWatchStatus = async () => {
    try {
      const token = getToken();
      if (!token) {
        // No token = not authenticated, clear ad watch status
        setAdWatchStatus(null);
        return;
      }

      const result = await apiGet(API_ENDPOINTS.AD_WATCH.STATUS, token);
      if (result.success && result.data) {
        // Sync state with backend response
        setAdWatchStatus(result.data);
      } else {
        // Backend returned failure - clear ad watch status
        setAdWatchStatus(null);
        console.warn('[VIPMembership] Failed to fetch ad watch status:', result.message);
      }
    } catch (error) {
      console.error('[VIPMembership] Error fetching ad watch status:', error);
      // On error, don't clear state (might be network issue)
      // State will be updated on next successful fetch
    }
  };

  const fetchReferralCode = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const result = await apiGet(API_ENDPOINTS.REFERRAL.CODE, token);
      if (result.success) {
        setReferralCode(result.data);
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
    }
  };

  const handleWatchAd = async (adId) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      const result = await apiPost(
        API_ENDPOINTS.AD_WATCH.WATCH,
        { adId: `ad_${Date.now()}` },
        token
      );

      if (result.success) {
        setSuccess(result.message || 'Ad watched successfully');
        await fetchAdWatchStatus();
        if (result.data?.vipActivated) {
          await fetchVIPStatus();
          setSuccess('🎉 Congratulations! You\'ve unlocked 1-day VIP membership!');
        }
      } else {
        setError(result.message || 'Failed to process ad watch');
      }
    } catch (error) {
      setError('Failed to process ad watch. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
  };

  const handleSelectPlan = async (planId) => {
    if (!isAuthenticated) {
      openAuthModal('signup');
      return;
    }

    if (planId === 'daily') {
      // Handle 1-day VIP payment
      setSelectedPlan(planId);
      setShowPayment(true);
    } else {
      setSelectedPlan(planId);
      setShowPayment(true);
    }
  };

  const handlePayment = async (paymentMethod = 'stripe') => {
    if (!selectedPlan) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      if (!token) {
        setError('Please login to purchase VIP');
        setLoading(false);
        return;
      }

      const result = await apiPost(
        API_ENDPOINTS.VIP.CREATE_SESSION,
        {
          plan: selectedPlan,
          paymentMethod
        },
        token
      );

      if (result.success) {
        if (result.data?.url) {
          // Redirect to Stripe checkout - clear loading before redirect
          setLoading(false);
          // Small delay to ensure state is cleared before redirect
          setTimeout(() => {
            window.location.href = result.data.url;
          }, 100);
        } else if (result.data?.sessionId) {
          // For testing or non-Stripe payments, activate directly
          // In production, this would go through webhook
          setSuccess('Payment session created! Processing...');
          
          // Simulate payment success for testing (remove in production)
          if (import.meta.env.DEV) {
            setTimeout(async () => {
              try {
                const activateResult = await apiPost(
                  API_ENDPOINTS.VIP.ACTIVATE,
                  { plan: selectedPlan },
                  token
                );
                
                if (activateResult.success) {
                  setSuccess('🎉 VIP activated successfully!');
                  setShowPayment(false);
                  await fetchVIPStatus();
                } else {
                  setError(activateResult.message || 'Failed to activate VIP');
                }
              } catch (error) {
                console.error('Error activating VIP:', error);
                setError('Failed to activate VIP. Please contact support.');
              } finally {
                setLoading(false);
              }
            }, 1000);
          } else {
            // Production: payment will be confirmed via webhook
            setSuccess('Payment session created. You will be redirected to complete payment.');
            setLoading(false);
            // Close modal after a delay
            setTimeout(() => {
              setShowPayment(false);
            }, 2000);
          }
        } else {
          setError(result.message || 'Failed to create payment session');
          setLoading(false);
        }
      } else {
        setError(result.message || 'Failed to create payment session');
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Failed to process payment. Please try again.');
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralCode?.referralLink) {
      navigator.clipboard.writeText(referralCode.referralLink);
      setSuccess('Referral link copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // VIP Plans
  const plans = [
    {
      id: 'daily',
      name: '1-Day VIP',
      price: '2.99',
      period: '24 hours',
      color: 'from-green-500 to-green-600',
      popular: true,
      featured: true,
      savings: null,
      features: [
        'Unlimited AI Searches',
        'No Pop-up Ads',
        'VIP-Only Predictions',
        'Gold Profile Badge',
        'Priority Support'
      ]
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: '9.99',
      period: 'month',
      color: 'from-blue-500 to-blue-600',
      popular: false,
      savings: null,
      features: [
        'All 1-Day VIP Features',
        'Extended Access',
        'Monthly Renewal'
      ]
    },
    {
      id: '3months',
      name: '3 Months',
      price: '24.99',
      period: '3 months',
      color: 'from-purple-500 to-purple-600',
      popular: false,
      savings: '17%',
      features: [
        'All Monthly Features',
        'Save 17%',
        'Best Value'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '79.99',
      period: 'year',
      color: 'from-amber-500 to-amber-600',
      popular: false,
      savings: '33%',
      features: [
        'All Features',
        'Save 33%',
        'Longest Access'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-6"
          >
            <Crown className="w-20 h-20 text-yellow-400 mx-auto" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl mb-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-bold">
            VIP Membership
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock exclusive predictions and premium features. Choose how you want to get VIP access!
          </p>
        </motion.div>

        {/* Current VIP Status */}
        {isAuthenticated && vipStatus && vipStatus.isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-2 border-yellow-500 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Crown className="w-12 h-12 text-yellow-400" />
                <div>
                  <h3 className="text-2xl font-bold text-yellow-400">You're a VIP Member!</h3>
                  <p className="text-gray-300">
                    Expires: {new Date(vipStatus.vipExpiry).toLocaleString()}
                    {vipStatus.daysRemaining > 0 && ` (${vipStatus.daysRemaining} days remaining)`}
                  </p>
                  {vipStatus.acquisitionSource && (
                    <p className="text-sm text-gray-400 mt-1">
                      Source: {vipStatus.acquisitionSource.charAt(0).toUpperCase() + vipStatus.acquisitionSource.slice(1)}
                    </p>
                  )}
                </div>
              </div>
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </motion.div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-green-200">{success}</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </motion.div>
        )}

        {/* Free Ways to Get VIP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Watch Ads Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-green-500/30 rounded-2xl p-8 hover:border-green-500/60 transition-all"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Watch Ads (FREE)</h2>
                <p className="text-gray-400">Watch 3 rewarded ads to unlock 1-day VIP</p>
              </div>
            </div>

            {isAuthenticated ? (
              <>
                {adWatchStatus && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-green-400 font-bold">
                        {adWatchStatus.adsWatchedToday}/3 ads watched
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(adWatchStatus.adsWatchedToday / 3) * 100}%` }}
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                      />
                    </div>
                    {adWatchStatus.adsRemaining > 0 && (
                      <p className="text-sm text-gray-400 mb-4">
                        {adWatchStatus.adsRemaining} more {adWatchStatus.adsRemaining === 1 ? 'ad' : 'ads'} to unlock VIP
                      </p>
                    )}
                  </div>
                )}

                <motion.button
                  onClick={() => handleWatchAd(`ad_${Date.now()}`)}
                  disabled={loading || (adWatchStatus && adWatchStatus.adsRemaining === 0)}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      <span>Watch Ad Now</span>
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={() => openAuthModal('login')}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl text-white font-bold text-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Login to Watch Ads
              </motion.button>
            )}

            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Each ad counts only once per day</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>VIP activates automatically after 3 ads</span>
              </div>
            </div>
          </motion.div>

          {/* Invite Friend Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/60 transition-all"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Invite a Friend (FREE)</h2>
                <p className="text-gray-400">Get 1-day VIP when your friend registers</p>
              </div>
            </div>

            {isAuthenticated ? (
              <>
                {referralCode ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-2">Your Referral Code</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-2 bg-gray-800 rounded-lg text-green-400 font-mono text-lg font-bold">
                          {referralCode.referralCode}
                        </code>
                        <motion.button
                          onClick={copyReferralLink}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Share2 className="w-5 h-5 text-white" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-2">Referral Link</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={referralCode.referralLink}
                          readOnly
                          className="flex-1 px-4 py-2 bg-gray-800 rounded-lg text-white text-sm"
                        />
                        <motion.button
                          onClick={copyReferralLink}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Copy
                        </motion.button>
                      </div>
                    </div>

                    {referralCode.totalReferrals > 0 && (
                      <div className="p-4 bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg border border-blue-500/30">
                        <p className="text-blue-400 font-semibold">
                          {referralCode.completedReferrals} friend{referralCode.completedReferrals !== 1 ? 's' : ''} joined!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">Loading referral code...</p>
                )}
              </>
            ) : (
              <motion.button
                onClick={() => openAuthModal('signup')}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl text-white font-bold text-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign Up to Get Referral Code
              </motion.button>
            )}

            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400" />
                <span>Friend must register and verify email</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400" />
                <span>You get VIP when they complete registration</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Paid Plans */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">Or Purchase VIP Directly</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-gradient-to-br from-gray-900 to-gray-900 border-2 rounded-2xl p-6 ${
                  plan.featured 
                    ? 'border-yellow-500 shadow-2xl shadow-yellow-500/20 scale-105' 
                    : plan.id === 'monthly'
                    ? 'border-blue-500/60 hover:border-blue-500'
                    : plan.id === '3months'
                    ? 'border-purple-500/60 hover:border-purple-500'
                    : plan.id === 'yearly'
                    ? 'border-amber-500/60 hover:border-amber-500'
                    : 'border-gray-700 hover:border-gray-600'
                } transition-all hover:shadow-xl`}
                whileHover={{ y: -8, scale: plan.featured ? 1.05 : 1.02 }}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full text-sm font-bold text-gray-900 shadow-lg">
                    ⭐ BEST VALUE
                  </div>
                )}

                {plan.savings && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 rounded-full text-sm font-bold text-white">
                    Save {plan.savings}
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-green-400">${plan.price}</span>
                  </div>
                  <div className="text-gray-400 text-sm">per {plan.period}</div>
                </div>

                <motion.button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-3 rounded-xl mb-6 bg-gradient-to-r ${plan.color} hover:shadow-lg transition-all text-white font-bold`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {plan.id === 'daily' ? 'Get VIP Now' : 'Choose Plan'}
                </motion.button>

                <div className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Payment Modal */}
        {showPayment && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPayment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold mb-4 text-white">Complete Payment</h3>
              <p className="text-gray-400 mb-6">
                You're purchasing: <span className="text-yellow-400 font-bold">
                  {plans.find(p => p.id === selectedPlan)?.name} - ${plans.find(p => p.id === selectedPlan)?.price}
                </span>
              </p>

              <motion.button
                onClick={() => handlePayment('stripe')}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 rounded-xl text-white font-bold mb-4 transition-all"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </motion.button>

              <button
                onClick={() => setShowPayment(false)}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* VIP Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-500/30 rounded-2xl p-8"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-white">VIP Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Target, text: 'Unlimited AI Searches', color: 'from-green-500 to-green-600' },
              { icon: Zap, text: 'No Pop-up Ads', color: 'from-blue-500 to-blue-600' },
              { icon: Crown, text: 'VIP-Only Predictions', color: 'from-yellow-500 to-amber-500' },
              { icon: Star, text: 'Gold Profile Badge', color: 'from-amber-500 to-yellow-500' },
              { icon: Shield, text: 'Priority Support', color: 'from-purple-500 to-purple-600' },
              { icon: TrendingUp, text: 'Advanced Analytics', color: 'from-green-600 to-green-700' },
              { icon: Check, text: 'Post Predictions', color: 'from-blue-600 to-blue-700' },
              { icon: Sparkles, text: 'Early Access Features', color: 'from-pink-500 to-pink-600' },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-300 font-medium">{feature.text}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
