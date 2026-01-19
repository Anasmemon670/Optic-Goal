import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, BarChart3, TrendingUp, Users, Target, Wifi, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS, apiGet, apiPost } from '../config/api';
import { getToken } from '../utils/auth';

export function AIAssistant({ isAuthenticated, isVIP, isVerifying = false, openRequestId = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const eventListenerRef = useRef(null);

  // Direct open signal from App (most reliable)
  useEffect(() => {
    if (openRequestId > 0) {
      setHasError(false);
      setError(null);
      setIsOpen(true);
    }
  }, [openRequestId]);

  // Listen for custom event to open AI Assistant from homepage
  // CRITICAL: This must always be mounted and active, even during verification
  useEffect(() => {
    const handleOpenAI = (event) => {
      try {
        console.log('[AIAssistant] Received openAIAssistant event, isVerifying:', isVerifying);
        setHasError(false);
        setError(null);
        
        // Always try to open, even during verification
        // The component will handle verification state internally
        setIsOpen(true);
        
        // Double-check after a short delay to ensure it opened
        setTimeout(() => {
          setIsOpen(prev => {
            if (!prev) {
              console.warn('[AIAssistant] Modal did not open, forcing open...');
              return true;
            }
            return prev;
          });
        }, 200);
      } catch (err) {
        console.error('[AIAssistant] Error opening AI Assistant:', err);
        setHasError(true);
        setError('Failed to open AI Assistant. Please try again.');
        // Still try to open the modal even on error
        setIsOpen(true);
      }
    };

    // Store handler reference for cleanup
    eventListenerRef.current = handleOpenAI;

    // Use capture phase to ensure we catch the event early
    // Also listen on document for better event propagation
    window.addEventListener('openAIAssistant', handleOpenAI, true);
    document.addEventListener('openAIAssistant', handleOpenAI, true);
    
    console.log('[AIAssistant] Event listeners registered');
    
    return () => {
      if (eventListenerRef.current) {
        window.removeEventListener('openAIAssistant', eventListenerRef.current, true);
        document.removeEventListener('openAIAssistant', eventListenerRef.current, true);
      }
    };
    // Remove isOpen from dependencies to prevent re-registering listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerifying]);

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const token = getToken();
        if (!token) {
          setIsOnline(true); // Allow non-authenticated users to use AI
          return;
        }
        
        const result = await apiGet(API_ENDPOINTS.AI.ANALYTICS, token);
        setIsOnline(result?.success !== false);
      } catch (error) {
        console.error('Connection check error:', error);
        setIsOnline(true); // Default to online to allow usage
      }
    };

    if (isOpen) {
      checkConnection();
      const interval = setInterval(checkConnection, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      try {
        setIsInitializing(true);
        setError(null);
        setHasError(false);
        
        // Load analytics in background (non-blocking)
        loadAnalytics().catch(err => {
          console.error('[AIAssistant] Failed to load analytics:', err);
          // Don't block UI if analytics fail
        });
        
        // Initialize welcome message only once per session
        if (!hasInitializedRef.current) {
          try {
            setMessages([{
              id: Date.now(),
              type: 'bot',
              text: `👋 Hello! I'm your AI Assistant for OptikGoal!\n\n✨ I can help you with:\n• Platform features and navigation\n• Understanding predictions and match analysis\n• Live match information\n• Web analytics and insights\n\n💡 Try asking me:\n"Where do I see live matches?"\n"Tell me about predictions"\n"Where is the Bulletin page?"\n\nHow can I help today?`,
              timestamp: new Date(),
            }]);
            hasInitializedRef.current = true;
          } catch (err) {
            console.error('[AIAssistant] Error initializing messages:', err);
            setError('Failed to initialize chat. Please refresh.');
            setHasError(true);
            // Still show a basic message
            setMessages([{
              id: Date.now(),
              type: 'bot',
              text: '👋 Hello! I\'m your AI Assistant. How can I help you today?',
              timestamp: new Date(),
            }]);
          }
        }
        
        // Focus input after a short delay
        setTimeout(() => {
          try {
            inputRef.current?.focus();
          } catch (err) {
            console.error('[AIAssistant] Error focusing input:', err);
          }
          setIsInitializing(false);
        }, 300);
      } catch (err) {
        console.error('[AIAssistant] Error in open effect:', err);
        setHasError(true);
        setError('Failed to initialize AI Assistant. Please try again.');
        setIsInitializing(false);
      }
    } else {
      // Don't clear messages when closing - preserve chat history
      // setMessages([]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAnalytics = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        // Don't load analytics for non-authenticated users
        return;
      }

      const result = await apiGet(API_ENDPOINTS.AI.ANALYTICS, token);
      if (result?.success && result.data?.analytics) {
        setAnalytics(result.data.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Silently fail - analytics are optional
    }
  }, []);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Reset error state when sending new message
    setError(null);
    setHasError(false);

    try {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        text: inputMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      const currentInput = inputMessage;
      setInputMessage('');
      setIsLoading(true);
      setError(null);

      const token = getToken();
      const result = await apiPost(
        API_ENDPOINTS.AI.CHAT,
        {
          message: currentInput,
          // Send a small amount of recent conversation so the AI can avoid repeating itself
          // and keep continuity within the same session.
          conversation: messages
            .filter((m) => !m?.isError && (m?.type === 'user' || m?.type === 'bot') && typeof m?.text === 'string')
            .slice(-6)
            .map((m) => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.text,
            })),
          context: {
            isAuthenticated: isAuthenticated || false,
          },
        },
        token
      );

      if (result?.success) {
        const responseText = result.data?.response || result.data?.message;
        
        // CRITICAL: Ensure response is never empty or blank
        if (!responseText || responseText.trim().length === 0) {
          throw new Error('Received empty response from AI. Please try again.');
        }
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: responseText,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsOnline(true);
        
        // Update quota info if provided
        if (result.data?.usage) {
          setQuotaInfo({
            remaining: result.data.usage.remaining,
            isVIP: result.data.usage.isVIP || false,
          });
        }
      } else {
        // Handle error response - check if it's a quota error
        if (result?.status === 429 || result?.message?.includes('limit') || result?.message?.includes('quota')) {
          throw new Error('🚫 Your daily AI limit has been reached. Please try again tomorrow.');
        }
        throw new Error(result?.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsOnline(true); // Keep UI usable even on error
      
      let errorText = '⚠️ Sorry, I encountered an error. Please try again.';
      
      if (error?.message?.includes('limit') || error?.message?.includes('quota')) {
        errorText = '🚫 Your daily AI limit has been reached. Please try again tomorrow.';
      } else if (error?.message?.includes('429')) {
        errorText = '🚫 Daily limit reached. Please try again tomorrow.';
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch') || error?.message?.includes('CONNECTION_REFUSED') || error?.message?.includes('Failed to fetch')) {
        errorText = '🌐 Backend server is not running. Please start the backend server on port 5001 to use AI Assistant.';
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: errorText,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        try {
          inputRef.current?.focus();
        } catch (err) {
          console.error('Error focusing input:', err);
        }
      }, 100);
    }
  };

  const quickActions = [
    { text: 'Tell me about predictions', icon: Target },
    { text: 'Show web analytics', icon: BarChart3 },
    { text: 'What are live matches?', icon: TrendingUp },
    { text: 'How do I use the site?', icon: HelpCircle },
  ];

  const handleQuickAction = (text) => {
    setInputMessage(text);
    setTimeout(() => {
      const form = inputRef.current?.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  // AI is open to everyone - no authentication required
  // But we show different UI based on auth status

  // CRITICAL: Always render something - never return null or blank
  // If there's a critical error, show fallback UI
  if (hasError && !isOpen) {
    // If we have an error but modal isn't open, still show the button
    // This ensures the UI is never completely blank
  }

  return (
    <>
      {/* Professional Floating Chatbot Widget */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Only on desktop, subtle on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 sm:bg-black/30"
              // Use max-ish z-index to stay above any overlays/ads
              style={{ zIndex: 2147483646 }}
            />
            
            {/* Chat Window - Professional Floating Widget */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.85, 
                y: 30,
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.85, 
                y: 30,
              }}
              transition={{ 
                type: 'spring', 
                damping: 28, 
                stiffness: 350,
                mass: 0.6
              }}
              onClick={(e) => e.stopPropagation()}
              className="fixed bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl shadow-2xl flex flex-col border border-gray-700/40 overflow-hidden"
              style={{
                // Use max-ish z-index to stay above any overlays/ads
                zIndex: 2147483647,
                // Tailwind build in this project is missing bottom-* utilities (only bottom-0 exists),
                // so we force positioning/sizing with inline styles to guarantee visibility.
                right: 16,
                bottom: 16,
                width: 'min(380px, calc(100vw - 2rem))',
                height: 'min(600px, calc(100vh - 6rem))',
                // Solid background so page doesn't show through
                backgroundImage: 'none',
                backgroundColor: 'rgba(3, 7, 18, 0.96)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'rgba(34, 197, 94, 0.18)',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(34, 197, 94, 0.2), 0 0 50px rgba(34, 197, 94, 0.15)',
              }}
            >
              {/* Header - Premium Design */}
              <div className="bg-gradient-to-r from-green-600 via-green-600 to-green-700 px-4 py-4 flex items-center justify-between border-b border-green-500/30 flex-shrink-0 shadow-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/20">
                      <Bot className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                    {isOnline && (
                      <span 
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-300 rounded-full border-2 border-green-700 shadow-md"
                        style={{
                          boxShadow: '0 0 8px rgba(134, 239, 172, 0.8)',
                        }}
                      ></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base leading-tight tracking-tight">AI Assistant</h3>
                    <p className="text-green-50/90 text-xs leading-tight mt-0.5 truncate flex items-center gap-1.5">
                      {isOnline ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse shadow-sm"></span>
                          <span className="font-medium">Online</span>
                        </>
                      ) : (
                        <span className="text-green-100/70">Connecting...</span>
                      )}
                      {quotaInfo && !isVIP && quotaInfo.remaining !== 'unlimited' && (
                        <span className="text-green-100/80 ml-1">• {quotaInfo.remaining} left</span>
                      )}
                      {/* VIP badge intentionally hidden (non‑VIP assistant mode) */}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 active:bg-white/30 rounded-xl p-2 transition-all flex-shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer group"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>

              {/* Analytics Summary - Sleek and Minimal */}
              {analytics && (
                <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700/40 flex-shrink-0 backdrop-blur-sm">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="group">
                      <div className="text-green-400 font-bold text-base group-hover:text-green-300 transition-colors">{analytics.totalUsers}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider font-medium">Users</div>
                    </div>
                    <div className="group border-x border-gray-700/50">
                      <div className="text-green-400 font-bold text-base group-hover:text-green-300 transition-colors">{analytics.totalPredictions}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider font-medium">Predictions</div>
                    </div>
                    <div className="group">
                      <div className="text-green-400 font-bold text-base group-hover:text-green-300 transition-colors">{analytics.liveMatches.total}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider font-medium">Live</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area - Smooth Scrolling */}
              <div 
                className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-gradient-to-b from-gray-900 to-gray-950" 
                style={{ 
                  minHeight: 0,
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#22c55e #1f2937',
                  WebkitOverflowScrolling: 'touch',
                  // Make background solid (avoid page background bleeding through)
                  backgroundImage: 'none',
                  backgroundColor: 'rgba(3, 7, 18, 0.94)',
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 16,
                  paddingBottom: 16,
                }}
              >
                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-900/40 border border-red-500/60 rounded-xl mb-3 backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-100 flex-1 leading-relaxed">{error}</p>
                      <button
                        onClick={() => {
                          setError(null);
                          setHasError(false);
                        }}
                        className="text-red-300 hover:text-red-200 active:text-red-100 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-400 rounded cursor-pointer"
                        aria-label="Dismiss error"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Empty State */}
                {messages.length === 0 && !isInitializing && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-700/50">
                      <Bot className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-300 text-sm font-semibold mb-1">No messages yet</p>
                    <p className="text-gray-500 text-xs">Start a conversation below!</p>
                  </div>
                )}
                
                {/* Loading State */}
                {isInitializing && messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 h-12 border-3 border-green-500/30 border-t-green-500 rounded-full mx-auto mb-3 animate-spin" />
                      <p className="text-gray-400 text-sm font-medium">Initializing...</p>
                    </div>
                  </div>
                )}

                {/* Messages - Bubble Style */}
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 12, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.3,
                      delay: Math.min(index * 0.03, 0.15),
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} w-full`}
                  >
                    <div
                      className={`rounded-2xl shadow-md ${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white rounded-br-md'
                          : message.isError
                          // NOTE: this project’s generated Tailwind CSS is missing many /90 + gray-50 utilities,
                          // so we stick to utilities that exist in src/index.css.
                          ? 'bg-red-500/20 text-white border border-red-500 rounded-bl-md'
                          : 'bg-gray-800/50 text-white border border-gray-700/50 rounded-bl-md backdrop-blur-sm'
                      }`}
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        // Tailwind in this project misses many half-step utilities (px-3.5, mb-1.5, gap-1.5, etc).
                        // Force spacing so text stays INSIDE the bubble.
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        maxWidth: '82%',
                        padding: '12px 14px',
                        boxShadow: message.type === 'user' 
                          ? '0 4px 12px rgba(34, 197, 94, 0.25)' 
                          : '0 2px 8px rgba(0, 0, 0, 0.3)',
                        // Force readable bubble backgrounds even if some Tailwind utilities are missing
                        ...(message.type !== 'user'
                          ? {
                              borderWidth: 1,
                              borderStyle: 'solid',
                              borderColor: message.isError ? 'rgba(239, 68, 68, 0.55)' : 'rgba(107, 114, 128, 0.45)',
                              backgroundColor: message.isError ? 'rgba(127, 29, 29, 0.35)' : 'rgba(17, 24, 39, 0.75)',
                            }
                          : {}),
                      }}
                    >
                      {message.type === 'bot' && !message.isError && (
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-xs text-gray-300 font-semibold uppercase tracking-wide">AI</span>
                        </div>
                      )}
                      <p
                        className="leading-relaxed whitespace-pre-wrap break-words text-white"
                        style={{ lineHeight: '1.65', fontSize: 13 }}
                      >
                        {message.text}
                      </p>
                      <span
                        className={`opacity-60 mt-2 block text-gray-300 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
                        style={{ fontSize: 10 }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
                
                {/* Typing Indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div
                      className="bg-gray-800/50 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-700/50 flex items-center gap-2.5 shadow-md backdrop-blur-sm"
                      style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.75)',
                        borderColor: 'rgba(107, 114, 128, 0.45)',
                        borderWidth: 1,
                        borderStyle: 'solid',
                      }}
                    >
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-gray-300 font-medium">Thinking...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions - Compact Pills */}
              {messages.length <= 1 && (
                <div className="px-3 sm:px-4 py-3 border-t border-gray-700/40 bg-gray-800/40 flex-shrink-0 backdrop-blur-sm">
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action.text)}
                        className="text-[11px] bg-gray-700/70 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-600/30 active:bg-green-700 text-gray-300 px-3 py-1.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer font-medium border border-gray-600/50 hover:border-green-500/50"
                      >
                        {action.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area - Clean and Fixed */}
              <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-gray-700/40 bg-gray-900/80 flex-shrink-0 backdrop-blur-md">
                {/* Quota Warning */}
                {quotaInfo && !isVIP && quotaInfo.remaining !== 'unlimited' && parseInt(quotaInfo.remaining) <= 2 && (
                  <div className="mb-2.5 p-2.5 bg-amber-900/40 border border-amber-500/60 rounded-xl backdrop-blur-sm">
                    <p className="text-xs text-amber-100 text-center font-semibold">
                      ⚠️ {quotaInfo.remaining} search{quotaInfo.remaining !== '1' ? 'es' : ''} remaining
                    </p>
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-800/90 text-white placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/70 focus:ring-offset-2 focus:ring-offset-gray-900 border border-gray-700/60 focus:border-green-500/70 transition-all resize-none shadow-inner"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed disabled:opacity-40 text-white p-2.5 rounded-xl transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg hover:shadow-green-500/40 cursor-pointer disabled:shadow-none"
                    aria-label="Send message"
                    title="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                {!isAuthenticated && (
                  <p className="text-[11px] text-gray-500 mt-2.5 text-center">
                    <button 
                      onClick={() => window.location.href = '#login'} 
                      className="text-green-400 hover:text-green-300 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-green-500 rounded cursor-pointer font-medium"
                    >
                      Login
                    </button> to access account pages (Profile/Settings/Notifications)
                  </p>
                )}
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Chatbot Button - Premium Professional Style */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed"
          // Use max-ish z-index to stay above any overlays/ads
          style={{
            zIndex: 2147483647,
            right: 16,
            bottom: 16,
          }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsOpen(true);
            }}
            className="relative w-16 h-16 sm:w-[70px] sm:h-[70px] bg-gradient-to-br from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white rounded-full shadow-2xl hover:shadow-green-500/60 transition-all duration-300 flex items-center justify-center cursor-pointer group border-2 border-green-400/50"
            style={{
              boxShadow: '0 10px 40px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.25), 0 0 0 0 rgba(34, 197, 94, 0.3)',
            }}
            aria-label="Open AI Assistant"
            type="button"
          >
            {/* Animated Pulse Ring 1 - Outer */}
            <motion.div
              className="absolute inset-0 rounded-full bg-green-400/40"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Animated Pulse Ring 2 - Inner */}
            <motion.div
              className="absolute inset-0 rounded-full bg-green-300/30"
              animate={{
                scale: [1, 1.7, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.7
              }}
            />
            
            {/* Icon Container */}
            <div className="relative z-10 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-lg" />
            </div>
            
            {/* Online Status Indicator - Glowing */}
            <span 
              className="absolute top-0 right-0 w-4 h-4 sm:w-[18px] sm:h-[18px] bg-green-300 rounded-full border-2 border-gray-900 z-10"
              style={{
                boxShadow: '0 0 15px rgba(134, 239, 172, 0.9), 0 0 5px rgba(134, 239, 172, 0.6)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            
            {/* Golden Amber Sparkle Accent - Animated */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-1 left-1 z-10"
            >
              <Sparkles className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-amber-300 drop-shadow-lg" />
            </motion.div>
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-2xl" />
          </motion.button>
        </motion.div>
      )}
    </>
  );
}
