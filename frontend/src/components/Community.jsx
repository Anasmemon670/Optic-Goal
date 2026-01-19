import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ThumbsUp, Flag, Send, User, AlertCircle, Loader } from 'lucide-react';
import { createComment, getComments } from '../api/commentsApi';
import { getToken } from '../utils/auth';

export function Community({ isAuthenticated, openAuthModal, showAds = false }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [spamWarning, setSpamWarning] = useState(false);

  // Fetch comments from API
  async function fetchComments() {
    setLoading(true);
    try {
      const result = await getComments(null, 50); // Get all comments (no matchId filter)
      if (result.success && result.data?.comments) {
        setComments(result.data.comments);
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

  useEffect(() => {
    fetchComments();
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchComments();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLike = (commentId) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    
    if (likedComments.includes(commentId)) {
      setLikedComments(likedComments.filter(id => id !== commentId));
    } else {
      setLikedComments([...likedComments, commentId]);
    }
  };

  const handleSubmitComment = async (e) => {
    e?.preventDefault();
    
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (!newComment.trim() || newComment.trim().length < 2) {
      setError('Comment must be at least 2 characters');
      return;
    }

    if (newComment.length > 1000) {
      setError('Comment cannot exceed 1000 characters');
      return;
    }

    setPosting(true);
    setError('');
    setSpamWarning(false);

    try {
      const token = getToken();
      if (!token) {
        setError('Please log in to post a comment');
        return;
      }

      const result = await createComment(newComment.trim(), null, token); // null matchId for general community comments

      if (result.success && result.comment) {
        // Comment posted successfully
        setNewComment('');
        // Refresh comments list
        await fetchComments();
      } else if (result.isSpam) {
        // Spam detected
        setSpamWarning(true);
        setNewComment('');
        setTimeout(() => setSpamWarning(false), 5000);
      } else {
        // Other error
        setError(result.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError(error.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 mb-8"
        >
          <MessageSquare className="w-8 h-8 text-amber-500" />
          <div>
            <h1 className="text-4xl">Community</h1>
            <p className="text-gray-400">Join the discussion with other sports enthusiasts</p>
          </div>
        </motion.div>

        {/* Comment Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl mb-4">Share Your Thoughts</h2>
          <form onSubmit={handleSubmitComment}>
            <div className="space-y-4">
              <textarea
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  setError('');
                  setSpamWarning(false);
                }}
                placeholder={isAuthenticated ? "What's on your mind?" : "Login to join the conversation..."}
                className="w-full h-32 px-4 py-3 bg-gray-900/50 border border-amber-500/30 rounded-lg focus:border-amber-500 focus:outline-none text-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isAuthenticated || posting}
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-400">
                    {isAuthenticated 
                      ? 'Share your thoughts with the community' 
                      : 'Please login to post a comment.'
                    }
                  </p>
                  {isAuthenticated && (
                    <p className="text-xs text-gray-500 mt-1">
                      {newComment.length}/1000 characters
                    </p>
                  )}
                </div>
                <motion.button
                  type="submit"
                  disabled={!isAuthenticated || posting || !newComment.trim() || newComment.trim().length < 2}
                  className={`px-6 py-3 rounded-xl flex items-center space-x-2 transition-all ${
                    isAuthenticated && newComment.trim() && newComment.trim().length >= 2 && !posting
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg hover:shadow-green-500/50 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  whileHover={isAuthenticated && newComment.trim() && !posting ? { scale: 1.05 } : {}}
                  whileTap={isAuthenticated && newComment.trim() && !posting ? { scale: 0.95 } : {}}
                >
                  {posting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Post Comment</span>
                    </>
                  )}
                </motion.button>
              </div>
              
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Spam Warning */}
              {spamWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center space-x-2 text-amber-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Your comment looks like spam and was not posted.</span>
                </motion.div>
              )}
            </div>
          </form>
        </motion.div>

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
            <p className="text-gray-400 text-lg mb-2">No comments yet</p>
            <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => {
              const formatTime = (date) => {
                if (!date) return 'Just now';
                try {
                  const commentDate = new Date(date);
                  const now = new Date();
                  const diffMs = now - commentDate;
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);

                  if (diffMins < 1) return 'Just now';
                  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
                  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
                  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
                  return commentDate.toLocaleDateString();
                } catch {
                  return 'Recently';
                }
              };

              return (
                <motion.div
                  key={comment._id || comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-6 transition-all"
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">{comment.username || 'Anonymous'}</div>
                        <div className="text-sm text-gray-400">{formatTime(comment.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <p className="text-gray-300 mb-4 leading-relaxed break-words">{comment.message}</p>

                  {/* Comment Actions */}
                  <div className="flex items-center space-x-4">
                    <motion.button
                      onClick={() => handleLike(comment._id || comment.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        likedComments.includes(comment._id || comment.id)
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ThumbsUp className={`w-5 h-5 ${likedComments.includes(comment._id || comment.id) ? 'fill-green-500' : ''}`} />
                      <span>{0}</span>
                    </motion.button>

                    <motion.button
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Flag className="w-5 h-5" />
                      <span>Report</span>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Community Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl p-6"
        >
          <h3 className="text-xl mb-4">Community Guidelines</h3>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Be respectful and courteous to other members</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span>No spam, advertising, or self-promotion</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Keep discussions relevant to sports and predictions</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span>All comments are moderated before approval</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Report inappropriate content using the flag button</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

