import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Trash2, 
  Search, 
  Filter, 
  Loader, 
  AlertCircle,
  RefreshCw,
  User,
  Clock,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { adminGetComments, adminDeleteComment } from '../api/commentsApi';
import { getToken } from '../utils/auth';

export function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const result = await adminGetComments(token, {
        page,
        limit: 50,
        search: search.trim(),
        filter: filter || '',
      });

      if (result.success && result.data) {
        setComments(result.data.comments || []);
        setTotalPages(result.data.pagination?.pages || 1);
        setTotal(result.data.pagination?.total || 0);
      } else {
        setError(result.message || 'Failed to fetch comments');
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(error.message || 'Failed to fetch comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setDeleting(id);
      const token = getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const result = await adminDeleteComment(id, token);
      if (result.success) {
        // Remove comment from list
        setComments(comments.filter(c => c._id !== id));
        setTotal(total - 1);
      } else {
        setError(result.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.message || 'Failed to delete comment');
    } finally {
      setDeleting(null);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Unknown';
    try {
      return new Date(date).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const filteredComments = comments.filter(comment => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      comment.message?.toLowerCase().includes(searchLower) ||
      comment.username?.toLowerCase().includes(searchLower) ||
      comment.matchId?.toString().includes(searchLower)
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-8 h-8 text-amber-500" />
          <div>
            <h2 className="text-2xl font-bold text-white">Comments Management</h2>
            <p className="text-sm text-gray-400">Manage and moderate user comments</p>
          </div>
        </div>
        <motion.button
          onClick={fetchComments}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Comments</div>
          <div className="text-2xl font-bold text-white">{total}</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Displayed</div>
          <div className="text-2xl font-bold text-white">{comments.length}</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Flagged</div>
          <div className="text-2xl font-bold text-amber-500">
            {comments.filter(c => c.isFlagged).length}
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Spam</div>
          <div className="text-2xl font-bold text-red-500">
            {comments.filter(c => c.isSpam).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search comments, users, or match IDs..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500 appearance-none"
            >
              <option value="">All Comments</option>
              <option value="normal">Normal</option>
              <option value="flagged">Flagged</option>
              <option value="spam">Spam</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2 text-red-400"
        >
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Comments Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading comments...</p>
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No comments found</p>
          <p className="text-gray-500 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Comment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Match ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredComments.map((comment) => (
                  <tr key={comment._id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-white">{comment.username || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 max-w-md truncate">
                        {comment.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-400">
                        {comment.matchId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(comment.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {comment.isSpam && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Spam</span>
                          </span>
                        )}
                        {comment.isFlagged && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span>Flagged</span>
                          </span>
                        )}
                        {!comment.isSpam && !comment.isFlagged && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                            Normal
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.button
                        onClick={() => handleDelete(comment._id)}
                        disabled={deleting === comment._id}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded flex items-center space-x-1 disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {deleting === comment._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        <span>Delete</span>
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page {page} of {totalPages} ({total} total)
              </div>
              <div className="flex space-x-2">
                <motion.button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Previous
                </motion.button>
                <motion.button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next
                </motion.button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

