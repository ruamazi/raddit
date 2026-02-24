import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Post from '../models/Post.js';
import Community from '../models/Community.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Report from '../models/Report.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { io } from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/posts/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|webm|mov|avi/;
    const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) ||
                    allowedVideoTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('نوع الملف غير مدعوم'));
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      sort = 'hot', 
      limit = 20, 
      page = 1,
      community,
      author,
      timeframe = 'all'
    } = req.query;
    
    let query = { isRemoved: false };
    
    if (community) {
      const communityDoc = await Community.findOne({ name: community });
      if (communityDoc) {
        query.community = communityDoc._id;
      }
    }
    
    if (author) {
      const user = await User.findOne({ username: author });
      if (user) {
        query.author = user._id;
      }
    }

    let hiddenFilter = {};
    if (req.user) {
      hiddenFilter = { $or: [{ isHidden: false }, { isHidden: true, author: req.user._id }] };
    } else {
      hiddenFilter = { isHidden: false };
    }
    query = { ...query, ...hiddenFilter };

    let sortOption = {};
    let timeFilter = {};
    
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      switch (timeframe) {
        case 'hour':
          startDate = new Date(now - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

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
      case 'rising':
        sortOption = { createdAt: -1, voteScore: -1 };
        break;
      default:
        sortOption = { hotScore: -1 };
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar displayName')
      .populate('community', 'name displayName icon')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    let hiddenPostIds = [];
    if (req.user) {
      const currentUser = await User.findById(req.user._id);
      hiddenPostIds = currentUser?.hiddenPosts || [];
    }

    const postsWithMeta = posts.map(post => {
      const postObj = post.toObject();
      if (req.user) {
        postObj.isUpvoted = post.upvotes.includes(req.user._id);
        postObj.isDownvoted = post.downvotes.includes(req.user._id);
        postObj.isSaved = req.user.savedPosts.includes(post._id);
        postObj.isHidden = post.isHidden;
        
        if (post.pollVotes) {
          const userVote = post.pollVotes.find(v => v.user.toString() === req.user._id.toString());
          postObj.hasVoted = !!userVote;
          postObj.userPollVote = userVote ? userVote.options : [];
        }
      }
      return postObj;
    });

    res.json({
      success: true,
      data: postsWithMeta
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المنشورات'
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findOne({
      $or: [
        { _id: req.params.id },
        { slug: req.params.id }
      ]
    })
      .populate('author', 'username avatar displayName karma')
      .populate('community', 'name displayName icon memberCount')
      .populate('awards.givenBy', 'username avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    if (post.isHidden && (!req.user || post.author.toString() !== req.user._id.toString())) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    await post.addView();

    const postData = post.toObject();
    
    if (req.user) {
      postData.isHidden = post.isHidden;
      
      postData.isUpvoted = post.upvotes.includes(req.user._id);
      postData.isDownvoted = post.downvotes.includes(req.user._id);
      postData.isSaved = req.user.savedPosts.includes(post._id);
      
      const userVote = post.pollVotes?.find(v => v.user.toString() === req.user._id.toString());
      postData.hasVoted = !!userVote;
      postData.userPollVote = userVote ? userVote.options : [];
    }

    res.json({
      success: true,
      data: postData
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المنشور'
    });
  }
});

router.post('/', protect, upload.array('images', 5), [
  body('title').trim().notEmpty().isLength({ max: 300 }),
  body('content').optional().isLength({ max: 40000 }),
  body('community').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (req.user.restrictions?.includes('النشر') || !req.user.canPost) {
      return res.status(403).json({
        success: false,
        message: 'تم تقييد صلاحيتك من النشر'
      });
    }

    const community = await Community.findById(req.body.community);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'المجتمع غير موجود'
      });
    }

    if (!community.canPost(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للنشر في هذا المجتمع'
      });
    }

    const postData = {
      title: req.body.title,
      content: req.body.content,
      author: req.user._id,
      community: community._id,
      type: req.body.type || 'text',
      flair: req.body.flair ? JSON.parse(req.body.flair) : undefined,
      isNSFW: req.body.isNSFW === 'true',
      isSpoiler: req.body.isSpoiler === 'true'
    };

    if (req.body.images) {
      postData.type = 'image';
      const imagesData = typeof req.body.images === 'string' 
        ? JSON.parse(req.body.images) 
        : req.body.images;
      postData.images = imagesData.map(img => ({ url: img.url }));
    }

    if (req.files && req.files.length > 0) {
      postData.type = 'image';
      postData.images = req.files.map(file => ({
        url: `/uploads/posts/${file.filename}`
      }));
    }

    if (req.body.video) {
      postData.type = 'video';
      postData.video = req.body.video;
    }

    if (req.body.link) {
      postData.type = 'link';
      postData.link = typeof req.body.link === 'string' ? JSON.parse(req.body.link) : req.body.link;
    }

    if (req.body.poll) {
      postData.type = 'poll';
      postData.poll = typeof req.body.poll === 'string' ? JSON.parse(req.body.poll) : req.body.poll;
    }

    const post = await Post.create(postData);

    await post.populate('author', 'username avatar displayName');
    await post.populate('community', 'name displayName icon');

    io.to(`community:${community._id}`).emit('new-post', post);

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء المنشور'
    });
  }
});

router.put('/:id', protect, upload.array('images', 5), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    if (!post.author.equals(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتعديل هذا المنشور'
      });
    }

    const allowedUpdates = ['title', 'content', 'flair', 'isNSFW', 'isSpoiler'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    if (req.files && req.files.length > 0) {
      post.images = req.files.map(file => ({
        url: `/uploads/posts/${file.filename}`
      }));
    }

    post.isEdited = true;
    post.editedAt = new Date();
    await post.save();

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث المنشور'
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const community = await Community.findById(post.community);
    const isMod = community?.isModerator(req.user._id);

    if (!post.author.equals(req.user._id) && !isMod && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا المنشور'
      });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف المنشور بنجاح'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المنشور'
    });
  }
});

router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body;
    
    if (!['upvote', 'downvote', 'none'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع التصويت غير صالح'
      });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const upvoteIndex = post.upvotes.indexOf(req.user._id);
    const downvoteIndex = post.downvotes.indexOf(req.user._id);

    if (upvoteIndex !== -1) post.upvotes.splice(upvoteIndex, 1);
    if (downvoteIndex !== -1) post.downvotes.splice(downvoteIndex, 1);

    if (voteType === 'upvote') {
      post.upvotes.push(req.user._id);
    } else if (voteType === 'downvote') {
      post.downvotes.push(req.user._id);
    }

    post.voteScore = post.upvotes.length - post.downvotes.length;
    await post.save();

    const author = await User.findById(post.author);
    if (author) {
      await author.updateKarma();
    }

    res.json({
      success: true,
      data: {
        voteScore: post.voteScore,
        upvotes: post.upvotes.length,
        downvotes: post.downvotes.length,
        isUpvoted: post.upvotes.includes(req.user._id),
        isDownvoted: post.downvotes.includes(req.user._id)
      }
    });
  } catch (error) {
    console.error('Vote post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في التصويت'
    });
  }
});

router.post('/:id/pin', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('community');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const community = await Community.findById(post.community._id);
    
    if (!community.isModerator(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتثبيت هذا المنشور'
      });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    res.json({
      success: true,
      data: { isPinned: post.isPinned }
    });
  } catch (error) {
    console.error('Pin post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تثبيت المنشور'
    });
  }
});

router.post('/:id/lock', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('community');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const community = await Community.findById(post.community._id);
    
    if (!community.isModerator(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لقفل هذا المنشور'
      });
    }

    post.isLocked = !post.isLocked;
    await post.save();

    res.json({
      success: true,
      data: { isLocked: post.isLocked }
    });
  } catch (error) {
    console.error('Lock post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في قفل المنشور'
    });
  }
});

router.post('/:id/vote-poll', protect, async (req, res) => {
  try {
    const { options } = req.body;
    
    const post = await Post.findById(req.params.id);
    
    if (!post || post.type !== 'poll') {
      return res.status(404).json({
        success: false,
        message: 'الاستطلاع غير موجود'
      });
    }

    if (post.poll.endsAt && new Date() > post.poll.endsAt) {
      return res.status(400).json({
        success: false,
        message: 'انتهت مدة الاستطلاع'
      });
    }

    const existingVote = post.pollVotes.find(
      v => v.user.equals(req.user._id)
    );

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'لقد صوتت بالفعل'
      });
    }

    const selectedOptions = Array.isArray(options) ? options : [options];
    
    selectedOptions.forEach(optIndex => {
      if (post.poll.options[optIndex]) {
        post.poll.options[optIndex].votes += 1;
      }
    });

    post.poll.totalVotes += 1;
    post.pollVotes.push({
      user: req.user._id,
      options: selectedOptions
    });

    await post.save();

    res.json({
      success: true,
      data: {
        poll: post.poll,
        hasVoted: true
      }
    });
  } catch (error) {
    console.error('Vote poll error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في التصويت'
    });
  }
});

router.post('/:id/report', protect, async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    const validReasons = ['spam', 'harassment', 'hate_speech', 'violence', 'misinformation', 'other'];
    
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'يرجى اختيار سبب البلاغ'
      });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    if (post.author.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك الإبلاغ عن منشورك الخاص'
      });
    }

    const existingReport = await Report.findOne({
      reporter: req.user._id,
      reportedPost: post._id,
      status: 'pending'
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'لقد أبلغت عن هذا المنشور بالفعل'
      });
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedPost: post._id,
      community: post.community,
      reason,
      description
    });

    res.json({
      success: true,
      message: 'تم تقديم البلاغ بنجاح'
    });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تقديم البلاغ'
    });
  }
});

export default router;
