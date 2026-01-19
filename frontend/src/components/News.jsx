import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Newspaper, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { API_ENDPOINTS, apiGet } from '../config/api';

export function News({ showAds = false }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [loading, setLoading] = useState(true);

  // API-ready function for fetching news
  async function fetchNews() {
    setLoading(true);
    try {
      const result = await apiGet(`${API_ENDPOINTS.NEWS.LIST}?limit=50`);
      
      if (result.success && result.data?.articles && result.data.articles.length > 0) {
        const data = result.data;
        // Transform backend format to frontend format
        const transformed = data.articles.map((article, index) => ({
          id: article._id || article.id || `news-${index}`,
          title: article.title || '',
          excerpt: article.description || article.content || '',
          content: article.content || article.description || '',
          image: article.image || null,
          link: article.link || '#',
          category: article.tags?.[0] || article.source || 'sport',
          timestamp: article.publishedAt 
            ? new Date(article.publishedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })
            : 'Recently',
          trending: index < 3, // First 3 articles are trending
          source: article.source || 'trt',
        }));
        
        console.log(`[News] Transformed ${transformed.length} articles`);
        setNews(transformed);
      } else {
        console.warn('[News] No articles in response:', data);
        setNews([]);
      }
    } catch (error) {
      console.error('[News] Error fetching news:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }

  // API-ready function for fetching categories
  async function fetchCategories() {
    try {
      // Extract unique categories from news articles
      // For now, use source as category
      const categoriesSet = new Set(['all']);
      
      // Add categories from news articles
      news.forEach(article => {
        if (article.category) {
          categoriesSet.add(article.category);
        }
        if (article.source) {
          categoriesSet.add(article.source);
        }
      });
      
      setCategories(Array.from(categoriesSet));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(['all']);
    }
  }

  useEffect(() => {
    fetchNews();
    // Refresh news every 5 minutes
    const interval = setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update categories when news changes
  useEffect(() => {
    if (news.length > 0) {
      fetchCategories();
    }
  }, [news]);

  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(article => article.category === selectedCategory);

  const featuredNews = news.find(article => article.trending);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 mb-8"
        >
          <Newspaper className="w-8 h-8 text-amber-500" />
          <div>
            <h1 className="text-4xl">Sports News</h1>
            <p className="text-gray-400">Latest updates from the world of sports</p>
          </div>
        </motion.div>

        {/* Featured News */}
        {!loading && featuredNews && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12 relative group cursor-pointer overflow-hidden rounded-3xl"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative h-96 overflow-hidden rounded-3xl">
              <ImageWithFallback
                src={featuredNews.image}
                alt={featuredNews.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="px-3 py-1 bg-green-500 rounded-lg text-sm flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Trending</span>
                  </span>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-lg text-sm">
                    {featuredNews.category}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl mb-3">{featuredNews.title}</h2>
                <p className="text-gray-300 text-lg mb-4">{featuredNews.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{featuredNews.timestamp}</span>
                  </div>
                  <motion.a
                    href={featuredNews.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-green-500 hover:text-green-400 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-lg transition-all ${
                selectedCategory === category
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-amber-500/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category === 'all' ? 'All News' : category}
            </motion.button>
          ))}
        </motion.div>

        {/* News Grid */}
        {loading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400">Loading news...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No news available</p>
            <p className="text-gray-500 text-sm">News articles will appear here once available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all group cursor-pointer"
              whileHover={{ y: -8 }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {article.trending && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 rounded-lg text-xs flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Trending</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-xs rounded-lg">
                    {article.category}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{article.timestamp}</span>
                  </div>
                </div>

                <h3 className="text-xl mb-2 text-white group-hover:text-green-500 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{article.excerpt}</p>

                <motion.a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-green-500 hover:text-green-400 transition-colors"
                  whileHover={{ x: 5 }}
                >
                  <span>Read More</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
              </div>
            </motion.div>
            ))}
          </div>
        )}

        {/* Trending Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h2 className="text-3xl">Trending Stories</h2>
          </div>
          
          {news.filter(article => article.trending).length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No trending stories at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.filter(article => article.trending).map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-900 to-gray-900 border border-amber-500/20 rounded-xl p-4 hover:border-amber-500/40 transition-all cursor-pointer flex items-center space-x-4 group"
                whileHover={{ x: 4 }}
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-1 line-clamp-2 group-hover:text-green-500 transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>{article.category}</span>
                    <span>•</span>
                    <span>{article.timestamp}</span>
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

