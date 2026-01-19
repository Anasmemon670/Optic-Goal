import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

export function AuthModal({ isOpen, onClose, mode, onLogin, onSignup, setMode, language }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateEmail = (value) => {
    if (!value) {
      return 'This field is required';
    }
    
    // Check if it looks like an email
    if (!/\S+@\S+\.\S+/.test(value)) {
      return 'Email is invalid';
    }
    
    return '';
  };

  const validatePassword = (value) => {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateName = (value) => {
    if (!value) {
      return 'Name is required';
    }
    if (value.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (value.length > 50) {
      return 'Name cannot exceed 50 characters';
    }
    return '';
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (touched.email) {
      const error = validateEmail(value);
      setErrors(prev => ({ ...prev, email: error }));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleNameChange = (value) => {
    setName(value);
    setApiError(''); // Clear API error when user types
    if (touched.name) {
      const error = validateName(value);
      setErrors(prev => ({ ...prev, name: error }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'email') {
      const error = validateEmail(email);
      setErrors(prev => ({ ...prev, email: error }));
    } else if (field === 'password') {
      const error = validatePassword(password);
      setErrors(prev => ({ ...prev, password: error }));
    } else if (field === 'name') {
      const error = validateName(name);
      setErrors(prev => ({ ...prev, name: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(''); // Clear previous API errors
    
    // Touch all fields
    const allTouched = { 
      email: true, 
      password: true, 
      name: mode === 'signup' 
    };
    setTouched(allTouched);
    
    // Validate all
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const nameError = mode === 'signup' ? validateName(name) : '';
    
    const newErrors = {
      email: emailError,
      password: passwordError,
      ...(mode === 'signup' && { name: nameError })
    };
    
    setErrors(newErrors);
    
    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    
    if (!hasErrors) {
      setLoading(true);
      try {
        if (mode === 'login') {
          await onLogin(email, password);
        } else {
          await onSignup(name, email, password);
        }
        // Reset form on success
        setEmail('');
        setPassword('');
        setName('');
        setErrors({});
        setTouched({});
        setApiError('');
      } catch (error) {
        setApiError(error.message || 'An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setErrors({});
    setTouched({});
    setApiError('');
    setLoading(false);
  };

  const handleModeToggle = () => {
    resetForm();
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                {/* Title */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl text-gray-300 mb-2">
                    {mode === 'login' ? 'Login to access premium features' : 'Create your account'}
                  </h2>
                </div>

                {/* API Error Message */}
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <p className="text-red-400 text-sm">{apiError}</p>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          onBlur={() => handleBlur('name')}
                          className={`w-full pl-11 pr-4 py-3 bg-gray-900 border ${
                            errors.name && touched.name ? 'border-red-500' : 'border-amber-500/30'
                          } rounded-lg focus:border-amber-500 focus:outline-none transition-all duration-200 text-white placeholder:text-gray-600 hover:border-amber-500/50`}
                          placeholder="John Doe"
                          disabled={loading}
                        />
                      </div>
                      {errors.name && touched.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm mt-1"
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          handleEmailChange(e.target.value);
                          setApiError(''); // Clear API error when user types
                        }}
                        onBlur={() => handleBlur('email')}
                        className={`w-full pl-11 pr-4 py-3 bg-gray-900 border ${
                          errors.email && touched.email ? 'border-red-500' : 'border-amber-500/30'
                        } rounded-lg focus:border-amber-500 focus:outline-none transition-all duration-200 text-white placeholder:text-gray-600 hover:border-amber-500/50`}
                        placeholder="your@email.com"
                        disabled={loading}
                      />
                    </div>
                    {errors.email && touched.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          handlePasswordChange(e.target.value);
                          setApiError(''); // Clear API error when user types
                        }}
                        onBlur={() => handleBlur('password')}
                        className={`w-full pl-11 pr-11 py-3 bg-gray-900 border ${
                          errors.password && touched.password ? 'border-red-500' : 'border-amber-500/30'
                        } rounded-lg focus:border-amber-500 focus:outline-none transition-all duration-200 text-white placeholder:text-gray-600 hover:border-amber-500/50`}
                        placeholder="••••••••"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00c46a] transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-6 bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-[#00c46a] hover:to-green-600 hover:shadow-lg hover:shadow-[#00c46a]/50 transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {mode === 'login' ? (loading ? 'Logging in...' : 'Login') : (loading ? 'Creating Account...' : 'Create Account')}
                  </motion.button>
                </form>

                {/* Toggle Mode */}
                <div className="mt-6 text-center">
                  <button
                    onClick={handleModeToggle}
                    className="text-sm text-gray-400 hover:text-[#00c46a] transition-colors duration-200"
                  >
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <span className="text-[#00c46a]">
                      {mode === 'login' ? 'Sign Up' : 'Login'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

