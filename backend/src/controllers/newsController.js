const News = require('../models/News');
const { getCachedNews, refreshCache } = require('../services/newsService');
const { paginate } = require('../utils/helpers');
const {
  sendSuccess,
  sendError,
} = require('../utils/responseHandler');

/**
 * Get all news articles
 * GET /api/news?limit=20&page=1&source=api1|api2|trt&tag=sport
 */
const getNews = async (req, res) => {
  try {
    const { limit = 20, page = 1, source, tag } = req.query;

    // Try to get from cache first
    try {
      const cached = getCachedNews({
        limit: parseInt(limit),
        page: parseInt(page),
        source,
        tag,
      });

      if (cached.articles.length > 0 || cached.total === 0) {
        return sendSuccess(res, {
          total: cached.total,
          page: parseInt(page),
          limit: parseInt(limit),
          articles: cached.articles,
        }, 'News retrieved successfully');
      }
    } catch (cacheError) {
      // Fall through to DB query if cache fails
      console.warn('[News Controller] Cache error, falling back to DB:', cacheError.message);
    }

    // Fallback to database query
    const { skip, limit: limitNum } = paginate(page, limit);
    const filter = { isActive: true };

    if (source) {
      filter.source = source;
    }

    if (tag) {
      filter.tags = tag;
    }

    const [articles, total] = await Promise.all([
      News.find(filter)
        .select('-raw') // Don't send raw data to frontend
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      News.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      total,
      page: parseInt(page),
      limit: limitNum,
      articles,
    }, 'News retrieved successfully');
  } catch (error) {
    console.error('[News Controller] Error in getNews:', error.message);
    return sendError(res, error.message || 'Error fetching news', 500);
  }
};

/**
 * Get news bulletin (minimal fields)
 * GET /api/news/bulletin?limit=50
 */
const getBulletin = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const limitNum = parseInt(limit);

    // Try cache first
    try {
      const cached = getCachedNews({
        limit: limitNum,
        page: 1,
      });

      if (cached.articles.length > 0) {
        const bulletin = cached.articles.map(article => ({
          title: article.title,
          link: article.link,
          publishedAt: article.publishedAt,
          source: article.source,
          image: article.image,
        }));

        return res.json({
          success: true,
          articles: bulletin,
          total: bulletin.length,
        });
      }
    } catch (cacheError) {
      // Fall through to DB
    }

    // Fallback to database
    const articles = await News.find({ isActive: true })
      .select('title link publishedAt source image')
      .sort({ publishedAt: -1 })
      .limit(limitNum)
      .lean();

    const bulletin = articles.map(article => ({
      title: article.title,
      link: article.link,
      publishedAt: article.publishedAt,
      source: article.source,
      image: article.image,
    }));

    res.json({
      success: true,
      articles: bulletin,
      total: bulletin.length,
    });
  } catch (error) {
    console.error('[News Controller] Error in getBulletin:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching bulletin',
      articles: [],
      total: 0,
    });
  }
};

/**
 * Get single news article
 * GET /api/news/:id
 */
const getSingleNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).select('-raw');

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found',
      });
    }

    // Increment views
    news.views = (news.views || 0) + 1;
    await news.save();

    res.json({
      success: true,
      article: news,
    });
  } catch (error) {
    console.error('[News Controller] Error in getSingleNews:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching news article',
    });
  }
};

/**
 * Refresh news (Admin only)
 * POST /api/news/refresh
 */
const refreshNews = async (req, res) => {
  try {
    const { fetchAllNews } = require('../services/newsService');
    const result = await fetchAllNews();

    res.json({
      success: result.success,
      message: result.success
        ? `Fetched ${result.inserted} new articles`
        : result.message,
      data: {
        inserted: result.inserted,
        skipped: result.skipped,
        api1: result.api1,
        trt: result.trt,
      },
    });
  } catch (error) {
    console.error('[News Controller] Error in refreshNews:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error refreshing news',
    });
  }
};

module.exports = {
  getNews,
  getBulletin,
  getSingleNews,
  refreshNews,
};
