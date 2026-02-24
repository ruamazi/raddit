import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Community from '../models/Community.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('الملف يجب أن يكون صورة (jpeg, jpg, png, gif, webp)'));
  }
});

router.get('/profile/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -refreshToken -email -preferences')
      .populate('following', 'username avatar displayName')
      .populate('followers', 'username avatar displayName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (!user.cakeDay) {
      user.cakeDay = new Date();
    }

    let postsQuery = { author: user._id, isRemoved: false };
    let commentsQuery = { author: user._id, isRemoved: false };

    const isOwner = req.user && req.user._id.toString() === user._id.toString();
    
    if (!isOwner) {
      postsQuery.isHidden = false;
    }

    const posts = await Post.find(postsQuery)
      .populate('community', 'name displayName icon')
      .sort({ createdAt: -1 })
      .limit(20);

    const postsWithHidden = posts.map(post => {
      const postObj = post.toObject();
      postObj.isHidden = post.isHidden;
      return postObj;
    });

    const comments = await Comment.find(commentsQuery)
      .populate('post', 'title slug')
      .populate('community', 'name displayName icon')
      .sort({ createdAt: -1 })
      .limit(20);

    let isFollowing = false;
    let isBlocked = false;
    
    if (req.user) {
      isFollowing = req.user.following.includes(user._id);
      isBlocked = req.user.blockedUsers.includes(user._id);
    }

    res.json({
      success: true,
      data: {
        user,
        posts: postsWithHidden,
        comments,
        isFollowing,
        isBlocked,
        isOwner: req.user?._id?.equals(user._id)
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الملف الشخصي',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    
    const updateData = {};
    
    if (displayName) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (req.file) updateData.avatar = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الملف الشخصي'
    });
  }
});

router.put('/preferences', protect, [
  body('theme').optional().isIn(['light', 'dark', 'system']),
  body('language').optional().isIn(['ar', 'en']),
  body('showNSFW').optional().isBoolean(),
  body('emailNotifications').optional().isBoolean(),
  body('showOnlineStatus').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: { ...req.user.preferences, ...req.body } },
      { new: true }
    ).select('-password -refreshToken');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الإعدادات'
    });
  }
});

router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
  body('newPassword').isLength({ min: 8 }).withMessage('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تغيير كلمة المرور'
    });
  }
});

router.post('/follow/:userId', protect, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (req.user._id.equals(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك متابعة نفسك'
      });
    }

    const isFollowing = req.user.following.includes(req.params.userId);

    if (isFollowing) {
      req.user.following = req.user.following.filter(
        id => !id.equals(req.params.userId)
      );
      userToFollow.followers = userToFollow.followers.filter(
        id => !id.equals(req.user._id)
      );
    } else {
      req.user.following.push(req.params.userId);
      userToFollow.followers.push(req.user._id);
    }

    await req.user.save();
    await userToFollow.save();

    res.json({
      success: true,
      data: {
        isFollowing: !isFollowing,
        followersCount: userToFollow.followers.length
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في المتابعة'
    });
  }
});

router.post('/block/:userId', protect, async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.userId);
    
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (req.user._id.equals(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حظر نفسك'
      });
    }

    const isBlocked = req.user.blockedUsers.includes(req.params.userId);

    if (isBlocked) {
      req.user.blockedUsers = req.user.blockedUsers.filter(
        id => !id.equals(req.params.userId)
      );
    } else {
      req.user.blockedUsers.push(req.params.userId);
    }

    await req.user.save();

    res.json({
      success: true,
      data: { isBlocked: !isBlocked }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حظر المستخدم'
    });
  }
});

router.get('/saved', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedPosts',
        populate: {
          path: 'community',
          select: 'name displayName icon'
        }
      });

    res.json({
      success: true,
      data: user.savedPosts
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المنشورات المحفوظة'
    });
  }
});

router.post('/saved/:postId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const isSaved = req.user.savedPosts.includes(req.params.postId);

    if (isSaved) {
      req.user.savedPosts = req.user.savedPosts.filter(
        id => !id.equals(req.params.postId)
      );
    } else {
      req.user.savedPosts.push(req.params.postId);
    }

    await req.user.save();

    res.json({
      success: true,
      data: { isSaved: !isSaved }
    });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حفظ المنشور'
    });
  }
});

router.post('/hide/:postId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك إخفاء هذا المنشور'
      });
    }

    post.isHidden = !post.isHidden;
    await post.save();

    res.json({
      success: true,
      data: { isHidden: post.isHidden }
    });
  } catch (error) {
    console.error('Hide post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إخفاء المنشور'
    });
  }
});

export default router;
