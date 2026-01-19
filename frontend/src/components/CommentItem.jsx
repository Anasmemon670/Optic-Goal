import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Clock, ThumbsUp, Flag } from 'lucide-react';
import { likeComment, reportComment } from '../api/commentsApi';
import { getToken } from '../utils/auth';

export function CommentItem({ comment, index = 0, isAuthenticated = false, onUpdate = null }) {
  // Get current user ID from token or localStorage
  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user._id || user.id;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();
  const [isLiked, setIsLiked] = useState(
    comment.likedBy && Array.isArray(comment.likedBy) && comment.likedBy.some(
      (id) => {
        const idStr = typeof id === 'object' ? id.toString() : String(id);
        const userIdStr = currentUserId ? String(currentUserId) : '';
        return idStr === userIdStr;
      }
    )
  );
  const [likes, setLikes] = useState(comment.likes || 0);
  const [isReporting, setIsReporting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const formatTime = (date) => {
    if (!date) return 'Just now';
    
    try {
      const commentDate = new Date(date);
      const now = new Date();
      const diffMs = now - commentDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      } else {
        return commentDate.toLocaleDateString();
      }
    } catch (error) {
      return 'Recently';
    }
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please log in to like comments');
      return;
    }

    const commentId = comment._id || comment.id;
    if (!commentId) {
      console.error('No comment ID found');
      return;
    }

    setIsLiking(true);
    try {
      const token = getToken();
      if (!token) {
        alert('Please log in to like comments');
        setIsLiking(false);
        return;
      }

      console.log('Liking comment:', commentId);
      const result = await likeComment(commentId, token);
      console.log('Like result:', result);
      
      if (result.success && result.data?.comment) {
        setIsLiked(result.data.comment.isLiked);
        setLikes(result.data.comment.likes);
        if (onUpdate) {
          onUpdate();
        }
      } else {
        alert(result.message || result.error || 'Failed to like comment');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      alert('Error liking comment: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLiking(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please log in to report comments');
      return;
    }

    if (!confirm('Are you sure you want to report this comment?')) {
      return;
    }

    const commentId = comment._id || comment.id;
    if (!commentId) {
      console.error('No comment ID found');
      return;
    }

    setIsReporting(true);
    try {
      const token = getToken();
      if (!token) {
        alert('Please log in to report comments');
        setIsReporting(false);
        return;
      }

      console.log('Reporting comment:', commentId);
      const result = await reportComment(commentId, token);
      console.log('Report result:', result);
      
      if (result.success) {
        alert('Comment reported successfully. Thank you for helping keep our community safe.');
        if (onUpdate) {
          onUpdate();
        }
      } else {
        alert(result.message || result.error || 'Failed to report comment');
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
      alert('Error reporting comment: ' + (error.message || 'Unknown error'));
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mb-3 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start space-x-3">
        {/* User Avatar/Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Username and Time */}
          <div className="flex items-center space-x-2 mb-1">
            <span 
              className={`text-sm font-semibold ${
                comment.user?.isVIP || comment.isVIP 
                  ? 'text-yellow-400' 
                  : 'text-white'
              }`}
              style={
                comment.user?.isVIP || comment.isVIP
                  ? { color: '#fbbf24', fontWeight: 600 }
                  : {}
              }
            >
              {comment.username || comment.user?.name || 'Anonymous'}
              {(comment.user?.isVIP || comment.isVIP) && (
                <span className="ml-1 text-xs">👑</span>
              )}
            </span>
            <span className="text-xs text-gray-500 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(comment.createdAt)}</span>
            </span>
          </div>

          {/* Message */}
          <div className="text-sm text-gray-300 leading-relaxed break-words mb-3">
            {comment.message}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 mt-2">
            <motion.button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
                isLiked
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={{ scale: isLiking ? 1 : 1.05 }}
              whileTap={{ scale: isLiking ? 1 : 0.95 }}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-green-400' : ''}`} />
              <span>{likes}</span>
            </motion.button>

            <motion.button
              onClick={handleReport}
              disabled={isReporting}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isReporting ? 1 : 1.05 }}
              whileTap={{ scale: isReporting ? 1 : 0.95 }}
            >
              <Flag className="w-4 h-4" />
              <span>Report</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

