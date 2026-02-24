import express from 'express';
import { body, validationResult } from 'express-validator';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Community from '../models/Community.js';
import Notification from '../models/Notification.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { io } from '../server.js';

const router = express.Router();

router.get('/post/:postId', optionalAuth, async (req, res) => {
  try {
    const { sort = 'best', limit = 50 } = req.query;
    
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
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
        sortOption = { voteScore: 1 };
        break;
      default:
        sortOption = { voteScore: -1, createdAt: -1 };
    }

    const comments = await Comment.find({ 
      post: req.params.postId,
      isRemoved: false
    })
      .populate('author', 'username avatar displayName karma')
      .sort(sortOption)
      .limit(parseInt(limit));

    if (req.user) {
      comments.forEach(comment => {
        comment._doc.isUpvoted = comment.upvotes.includes(req.user._id);
        comment._doc.isDownvoted = comment.downvotes.includes(req.user._id);
      });
    }

    const buildCommentTree = (comments, parentId = null) => {
      return comments
        .filter(comment => {
          const commentParent = comment.parent?.toString();
          return (parentId === null && !commentParent) || 
                 commentParent === parentId;
        })
        .map(comment => ({
          ...comment.toObject(),
          replies: buildCommentTree(comments, comment._id.toString())
        }));
    };

    const commentTree = buildCommentTree(comments);

    res.json({
      success: true,
      data: commentTree
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب التعليقات'
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username avatar displayName karma')
      .populate('post', 'title slug')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username avatar displayName karma'
        }
      });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'التعليق غير موجود'
      });
    }

    if (req.user) {
      comment._doc.isUpvoted = comment.upvotes.includes(req.user._id);
      comment._doc.isDownvoted = comment.downvotes.includes(req.user._id);
    }

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب التعليق'
    });
  }
});

router.post('/', protect, [
  body('content').trim().notEmpty().isLength({ max: 10000 }),
  body('post').notEmpty(),
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

    if (req.user.restrictions?.includes('التعليق') || !req.user.canComment) {
      return res.status(403).json({
        success: false,
        message: 'تم تقييد صلاحيتك من التعليق'
      });
    }

    const post = await Post.findById(req.body.post);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    if (post.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'المنشور مقفل، لا يمكن إضافة تعليقات'
      });
    }

    const commentData = {
      content: req.body.content,
      author: req.user._id,
      post: req.body.post,
      community: req.body.community,
      parent: req.body.parent || null
    };

    const comment = await Comment.create(commentData);

    await post.addComment();

    await comment.populate('author', 'username avatar displayName karma');

    io.to(`post:${post._id}`).emit('new-comment', comment);

    if (!post.author.equals(req.user._id)) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'post_reply',
        title: `رد جديد على منشورك`,
        content: req.body.content.substring(0, 100),
        post: post._id,
        comment: comment._id
      });

      io.to(`user:${post.author}`).emit('notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        sender: req.user._id,
        post: post._id,
        isRead: false,
        createdAt: notification.createdAt
      });
    }

    if (req.body.parent) {
      const parentComment = await Comment.findById(req.body.parent);
      if (parentComment && !parentComment.author.equals(req.user._id)) {
        const replyNotification = await Notification.create({
          recipient: parentComment.author,
          sender: req.user._id,
          type: 'comment_reply',
          title: `رد جديد على تعليقك`,
          content: req.body.content.substring(0, 100),
          post: post._id,
          comment: comment._id
        });

        io.to(`user:${parentComment.author}`).emit('notification', {
          _id: replyNotification._id,
          type: replyNotification.type,
          title: replyNotification.title,
          content: replyNotification.content,
          sender: req.user._id,
          post: post._id,
          isRead: false,
          createdAt: replyNotification.createdAt
        });
      }
    }

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء التعليق'
    });
  }
});

router.put('/:id', protect, [
  body('content').trim().notEmpty().isLength({ max: 10000 })
], async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'التعليق غير موجود'
      });
    }

    if (!comment.author.equals(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتعديل هذا التعليق'
      });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث التعليق'
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'التعليق غير موجود'
      });
    }

    const community = await Community.findById(comment.community);
    const isMod = community?.isModerator(req.user._id);

    if (!comment.author.equals(req.user._id) && !isMod && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا التعليق'
      });
    }

    await comment.deleteOne();

    const post = await Post.findById(comment.post);
    if (post) {
      await post.removeComment();
    }

    res.json({
      success: true,
      message: 'تم حذف التعليق بنجاح'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف التعليق'
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

    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'التعليق غير موجود'
      });
    }

    const upvoteIndex = comment.upvotes.indexOf(req.user._id);
    const downvoteIndex = comment.downvotes.indexOf(req.user._id);

    if (upvoteIndex !== -1) comment.upvotes.splice(upvoteIndex, 1);
    if (downvoteIndex !== -1) comment.downvotes.splice(downvoteIndex, 1);

    if (voteType === 'upvote') {
      comment.upvotes.push(req.user._id);
    } else if (voteType === 'downvote') {
      comment.downvotes.push(req.user._id);
    }

    comment.voteScore = comment.upvotes.length - comment.downvotes.length;
    await comment.save();

    const User = (await import('../models/User.js')).default;
    const author = await User.findById(comment.author);
    if (author) {
      await author.updateKarma();
    }

    res.json({
      success: true,
      data: {
        voteScore: comment.voteScore,
        upvotes: comment.upvotes.length,
        downvotes: comment.downvotes.length,
        isUpvoted: comment.upvotes.includes(req.user._id),
        isDownvoted: comment.downvotes.includes(req.user._id)
      }
    });
  } catch (error) {
    console.error('Vote comment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في التصويت'
    });
  }
});

export default router;
