import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, AlertCircle, Loader } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { createComment, getComments } from '../api/commentsApi';
import { getToken } from '../utils/auth';

export function Comments({ matchId = null, isAuthenticated = false }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [spamWarning, setSpamWarning] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Fetch comments
  const fetchComments = async () => {
    try {
      const result = await getComments(matchId, 50);
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
  };

  // Initial fetch
  useEffect(() => {
    fetchComments();

    // Auto-refresh every 10 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchComments();
    }, 10000);

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [matchId]);

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e?.preventDefault();

    if (!isAuthenticated) {
      setError('Please log in to post a comment');
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
      const result = await createComment(newComment.trim(), matchId, token);

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
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare className="w-6 h-6 text-amber-500" />
        <h2 className="text-2xl font-semibold">Comments</h2>
        {comments.length > 0 && (
          <span className="text-sm text-gray-400">({comments.length})</span>
        )}
      </div>

      {/* Comment Input */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-xl p-4 mb-6">
        <form onSubmit={handleSubmitComment}>
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setError('');
                setSpamWarning(false);
              }}
              placeholder={isAuthenticated ? "Write a comment..." : "Please log in to post a comment"}
              disabled={!isAuthenticated || posting}
              maxLength={1000}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {newComment.length}/1000 characters
              </div>
              <motion.button
                type="submit"
                disabled={!isAuthenticated || posting || !newComment.trim() || newComment.trim().length < 2}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 hover:from-amber-600 hover:to-amber-700 transition-all"
                whileHover={{ scale: posting ? 1 : 1.05 }}
                whileTap={{ scale: posting ? 1 : 0.95 }}
              >
                {posting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post Comment</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2 text-red-400 text-sm"
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
            className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center space-x-2 text-amber-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Your comment looks like spam and was not posted.</span>
          </motion.div>
        )}
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No comments yet</p>
          <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-0">
          {comments.map((comment, index) => (
            <CommentItem
              key={comment._id || comment.id}
              comment={comment}
              index={index}
              isAuthenticated={isAuthenticated}
              onUpdate={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

