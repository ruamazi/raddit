import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { protect, optionalAuth, moderatorOnly } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/communities/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'community-' + uniqueSuffix + path.extname(file.originalname));
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
    cb(new Error('الملف يجب أن يكون صورة'));
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { sort = 'popular', limit = 20, page = 1 } = req.query;
    
    let sortOption = {};
    switch (sort) {
      case 'new':
        sortOption = { createdAt: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      default:
        sortOption = { memberCount: -1 };
    }

    const communities = await Community.find({ isBanned: false })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-members -moderators');

    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المجتمعات'
    });
  }
});

router.get('/:name', optionalAuth, async (req, res) => {
  try {
    const community = await Community.findOne({ 
      name: req.params.name,
      isBanned: false 
    })
      .populate('moderators.user', 'username avatar displayName')
      .populate('creator', 'username avatar displayName');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'المجتمع غير موجود'
      });
    }

    let isMember = false;
    let isModerator = false;
    
    if (req.user) {
      isMember = community.isMember(req.user._id);
      isModerator = community.isModerator(req.user._id);
    }

    res.json({
      success: true,
      data: {
        community,
        isMember,
        isModerator
      }
    });
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المجتمع'
    });
  }
});

router.post('/', protect, [
  body('name')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_\u0600-\u06FF]+$/),
  body('displayName').trim().notEmpty().isLength({ max: 100 }),
  body('description').trim().notEmpty().isLength({ max: 500 }),
  body('type').optional().isIn(['public', 'private', 'restricted'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const existingCommunity = await Community.findOne({ name: req.body.name });
    
    if (existingCommunity) {
      return res.status(400).json({
        success: false,
        message: 'اسم المجتمع مستخدم بالفعل'
      });
    }

    const community = await Community.create({
      ...req.body,
      creator: req.user._id,
      moderators: [{
        user: req.user._id,
        role: 'owner'
      }],
      members: [req.user._id]
    });

    res.status(201).json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء المجتمع'
    });
  }
});

router.put('/:name', protect, upload.single('icon'), async (req, res) => {
  try {
    const community = await Community.findOne({ name: req.params.name });
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'المجتمع غير موجود'
      });
    }

    if (!community.isModerator(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتعديل هذا المجتمع'
      });
    }

    const allowedUpdates = [
      'displayName', 'description', 'type', 'isNSFW',
      'rules', 'allowedPostTypes', 'postingRestrictions',
      'flairs', 'welcomeMessage'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        community[field] = req.body[field];
      }
    });

    if (req.file) {
      community.icon = `/uploads/communities/${req.file.filename}`;
    }

    await community.save();

    res.json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث المجتمع'
    });
  }
});

router.post('/:name/join', protect, async (req, res) => {
  try {
    const community = await Community.findOne({ name: req.params.name });
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'المجتمع غير موجود'
      });
    }

    const isMember = community.isMember(req.user._id);

    if (isMember) {
      community.members = community.members.filter(
        id => !id.equals(req.user._id)
      );
    } else {
      if (community.type === 'private') {
        return res.status(403).json({
          success: false,
          message: 'هذا المجتمع خاص، يجب أن تدعى للانضمام'
        });
      }
      community.members.push(req.user._id);
    }

    community.memberCount = community.members.length;
    await community.save();

    res.json({
      success: true,
      data: {
        isMember: !isMember,
        memberCount: community.memberCount
      }
    });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الانضمام للمجتمع'
    });
  }
});

router.get('/:name/posts', optionalAuth, async (req, res) => {
  try {
    const { sort = 'hot', limit = 20, page = 1 } = req.query;
    
    const community = await Community.findOne({ 
      name: req.params.name,
      isBanned: false 
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'المجتمع غير موجود'
      });
    }

    let sortOption = {};
    switch (sort) {
      case 'new':
        sortOption = { createdAt: -1 };
        break;
      case 'top':
        sortOption = { voteScore: -1 };
        break;
      case 'controversial':
        sortOption = { commentCount: -1 };
        break;
      default:
        sortOption = { hotScore: -1 };
    }

    const posts = await Post.find({ 
      community: community._id,
      isRemoved: false 
    })
      .populate('author', 'username avatar displayName')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Get community posts error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المنشورات'
    });
  }
});

router.post('/:name/moderators', protect, async (req, res) => {
  try {
    const community = await Community.findOne({ name: req.params.name });
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'المجتمع غير موجود'
      });
    }

    const isOwner = community.moderators.some(
      m => m.user.equals(req.user._id) && m.role === 'owner'
    );

    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'فقط المالك يمكنه إضافة مشرفين'
      });
    }

    const { username, role = 'moderator' } = req.body;
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (!community.isMember(user._id)) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم ليس عضواً في المجتمع'
      });
    }

    if (community.isModerator(user._id)) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم مشرف بالفعل'
      });
    }

    community.moderators.push({
      user: user._id,
      role
    });

    await community.save();

    res.json({
      success: true,
      data: community.moderators
    });
  } catch (error) {
    console.error('Add moderator error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة المشرف'
    });
  }
});

router.delete('/:name/moderators/:userId', protect, async (req, res) => {
  try {
    const community = await Community.findOne({ name: req.params.name });
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'المجتمع غير موجود'
      });
    }

    const isOwner = community.moderators.some(
      m => m.user.equals(req.user._id) && m.role === 'owner'
    );

    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'فقط المالك يمكنه إزالة مشرفين'
      });
    }

    community.moderators = community.moderators.filter(
      m => !m.user.equals(req.params.userId)
    );

    await community.save();

    res.json({
      success: true,
      message: 'تم إزالة المشرف بنجاح'
    });
  } catch (error) {
    console.error('Remove moderator error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إزالة المشرف'
    });
  }
});

export default router;
