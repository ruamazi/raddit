import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Community from '../models/Community.js';
import Report from '../models/Report.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalCommunities,
      bannedUsers,
      pendingReports
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Community.countDocuments(),
      User.countDocuments({ isBanned: true }),
      Report.countDocuments({ status: 'pending' })
    ]);

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      newUsersThisWeek,
      newPostsThisWeek,
      newCommunitiesThisWeek
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: lastWeek } }),
      Post.countDocuments({ createdAt: { $gte: lastWeek } }),
      Community.countDocuments({ createdAt: { $gte: lastWeek } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalComments,
        totalCommunities,
        bannedUsers,
        pendingReports,
        newUsersThisWeek,
        newPostsThisWeek,
        newCommunitiesThisWeek
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات'
    });
  }
});

router.post('/fix-comment-counts', async (req, res) => {
  try {
    const posts = await Post.find({});
    let fixed = 0;
    
    for (const post of posts) {
      const actualCount = await Comment.countDocuments({ post: post._id, isRemoved: false });
      if (post.commentCount !== actualCount) {
        post.commentCount = actualCount;
        await post.save();
        fixed++;
      }
    }
    
    res.json({
      success: true,
      message: `تم إصلاح ${fixed} منشور`
    });
  } catch (error) {
    console.error('Fix comment counts error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إصلاح أعداد التعليقات'
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستخدمين'
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { limit = 20, page = 1, banned, search } = req.query;
    
    const query = {};
    
    if (banned === 'true') {
      query.isBanned = true;
    }
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستخدمين'
    });
  }
});

router.put('/users/:id/ban', async (req, res) => {
  try {
    const { reason, duration, canPost, canComment } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حظر مدير'
      });
    }

    const banDuration = parseInt(duration) || 0;
    
    user.isBanned = banDuration > 0 ? false : true;
    user.banReason = reason || 'لم يتم تحديد سبب';
    user.canPost = canPost !== undefined ? !canPost : false;
    user.canComment = canComment !== undefined ? !canComment : false;
    
    if (banDuration > 0) {
      user.banExpiresAt = new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000);
      user.isBanned = false;
    } else {
      user.banExpiresAt = null;
      user.isBanned = true;
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'تم تطبيق الحظر بنجاح'
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حظر المستخدم'
    });
  }
});

router.put('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    user.isBanned = false;
    user.banReason = '';
    user.banExpiresAt = null;
    user.canPost = true;
    user.canComment = true;
    await user.save();

    res.json({
      success: true,
      message: 'تم إلغاء حظر المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إلغاء حظر المستخدم'
    });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const { limit = 20, page = 1, status = 'pending' } = req.query;
    
    const reports = await Report.find({ status })
      .populate('reporter', 'username avatar')
      .populate('reportedUser', 'username avatar')
      .populate('reportedPost', 'title')
      .populate('reportedComment', 'content')
      .populate('community', 'name displayName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب البلاغات'
    });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    const { action, actionNote } = req.body;
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'البلاغ غير موجود'
      });
    }

    await report.resolve(action, actionNote, req.user._id);

    if (action === 'ban' && report.reportedUser) {
      await User.findByIdAndUpdate(report.reportedUser, {
        isBanned: true,
        banReason: actionNote || 'مخالفة قواعد المجتمع'
      });
    }

    if ((action === 'removal' || action === 'delete') && report.reportedPost) {
      if (action === 'delete') {
        await Post.findByIdAndDelete(report.reportedPost);
      } else {
        await Post.findByIdAndUpdate(report.reportedPost, {
          isRemoved: true,
          removedReason: actionNote,
          removedBy: req.user._id
        });
      }
    }

    if ((action === 'removal' || action === 'delete') && report.reportedComment) {
      if (action === 'delete') {
        await Comment.findByIdAndDelete(report.reportedComment);
      } else {
        await Comment.findByIdAndUpdate(report.reportedComment, {
          isRemoved: true,
          removedReason: actionNote,
          removedBy: req.user._id
        });
      }
    }

    res.json({
      success: true,
      message: 'تم معالجة البلاغ بنجاح'
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في معالجة البلاغ'
    });
  }
});

router.get('/communities', async (req, res) => {
  try {
    const { limit = 20, page = 1, banned } = req.query;
    
    const query = {};
    
    if (banned === 'true') {
      query.isBanned = true;
    }

    const communities = await Community.find(query)
      .populate('creator', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.error('Get admin communities error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المجتمعات'
    });
  }
});

router.put('/communities/:id/ban', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'المجتمع غير موجود'
      });
    }

    community.isBanned = true;
    await community.save();

    res.json({
      success: true,
      message: 'تم حظر المجتمع بنجاح'
    });
  } catch (error) {
    console.error('Ban community error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حظر المجتمع'
    });
  }
});

export default router;
