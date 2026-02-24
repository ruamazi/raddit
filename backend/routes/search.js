import express from 'express';
import Post from '../models/Post.js';
import Community from '../models/Community.js';
import User from '../models/User.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, type = 'all', limit = 20, page = 1, sort = 'relevance' } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'يجب أن يكون البحث حرفين على الأقل'
      });
    }

    const searchQuery = q.trim();
    const skip = (page - 1) * limit;
    
    let results = {
      posts: [],
      communities: [],
      users: []
    };

    let sortOption = {};
    switch (sort) {
      case 'new':
        sortOption = { createdAt: -1 };
        break;
      case 'top':
        sortOption = { voteScore: -1 };
        break;
      default:
        sortOption = { score: { $meta: 'textScore' } };
    }

    if (type === 'all' || type === 'posts') {
      const postQuery = Post.find(
        { $text: { $search: searchQuery }, isRemoved: false },
        { score: { $meta: 'textScore' } }
      )
        .populate('author', 'username avatar displayName')
        .populate('community', 'name displayName icon')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit));

      results.posts = await postQuery;
    }

    if (type === 'all' || type === 'communities') {
      const communityQuery = Community.find(
        { $text: { $search: searchQuery }, isBanned: false },
        { score: { $meta: 'textScore' } }
      )
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit));

      results.communities = await communityQuery;
    }

    if (type === 'all' || type === 'users') {
      const userQuery = User.find(
        { $text: { $search: searchQuery }, isBanned: false },
        { score: { $meta: 'textScore' } }
      )
        .select('username displayName avatar bio karma')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit));

      results.users = await userQuery;
    }

    res.json({
      success: true,
      data: results,
      query: searchQuery
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في البحث'
    });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchQuery = q.trim();

    const [communities, users] = await Promise.all([
      Community.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { displayName: { $regex: searchQuery, $options: 'i' } }
        ],
        isBanned: false
      })
        .select('name displayName icon memberCount')
        .limit(5),
      
      User.find({
        $or: [
          { username: { $regex: searchQuery, $options: 'i' } },
          { displayName: { $regex: searchQuery, $options: 'i' } }
        ],
        isBanned: false
      })
        .select('username displayName avatar')
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        communities,
        users
      }
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الاقتراحات'
    });
  }
});

export default router;
