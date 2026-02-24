import express from 'express';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { io, connectedUsers } from '../server.js';

const router = express.Router();

router.get('/conversations', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, isDeletedBySender: false },
        { recipient: req.user._id, isDeletedByRecipient: false }
      ]
    })
      .populate('sender', 'username avatar displayName')
      .populate('recipient', 'username avatar displayName')
      .sort({ createdAt: -1 });

    const conversations = {};
    
    messages.forEach(message => {
      const otherUserId = message.sender._id.equals(req.user._id) 
        ? message.recipient._id.toString()
        : message.sender._id.toString();
      
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          user: message.sender._id.equals(req.user._id) 
            ? message.recipient 
            : message.sender,
          lastMessage: message,
          unreadCount: 0
        };
      }
      
      if (message.recipient._id.equals(req.user._id) && !message.isRead) {
        conversations[otherUserId].unreadCount += 1;
      }
    });

    res.json({
      success: true,
      data: Object.values(conversations)
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المحادثات'
    });
  }
});

router.get('/:userId', protect, async (req, res) => {
  try {
    const otherUser = await User.findById(req.params.userId);
    
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (req.user.blockedUsers.includes(otherUser._id) || 
        otherUser.blockedUsers?.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك إرسال رسائل لهذا المستخدم'
      });
    }

    const messages = await Message.getConversation(req.user._id, req.params.userId)
      .populate('sender', 'username avatar displayName')
      .populate('recipient', 'username avatar displayName');

    await Message.updateMany(
      { sender: req.params.userId, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      data: {
        messages,
        otherUser: {
          _id: otherUser._id,
          username: otherUser.username,
          avatar: otherUser.avatar,
          displayName: otherUser.displayName
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الرسائل'
    });
  }
});

router.post('/', protect, [
  body('recipient').notEmpty(),
  body('content').trim().notEmpty().isLength({ max: 10000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { recipient, content, subject, replyTo } = req.body;

    const recipientUser = await User.findById(recipient);
    
    if (!recipientUser) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (req.user.blockedUsers.includes(recipient) || 
        recipientUser.blockedUsers?.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك إرسال رسائل لهذا المستخدم'
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient,
      content,
      subject,
      replyTo
    });

    await message.populate('sender', 'username avatar displayName');
    await message.populate('recipient', 'username avatar displayName');

    const recipientSocketId = connectedUsers.get(recipient.toString());
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new-message', message);
    }

    const notification = await Notification.create({
      recipient,
      sender: req.user._id,
      type: 'message',
      title: `رسالة جديدة من ${req.user.username}`,
      content: content.substring(0, 100),
      message: message._id
    });

    io.to(`user:${recipient.toString()}`).emit('notification', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      sender: req.user._id,
      isRead: false,
      createdAt: notification.createdAt
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال الرسالة'
    });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة'
      });
    }

    if (!message.recipient.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية'
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الرسالة'
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة'
      });
    }

    if (message.sender.equals(req.user._id)) {
      message.isDeletedBySender = true;
    } else if (message.recipient.equals(req.user._id)) {
      message.isDeletedByRecipient = true;
    } else {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية'
      });
    }

    if (message.isDeletedBySender && message.isDeletedByRecipient) {
      await message.deleteOne();
    } else {
      await message.save();
    }

    res.json({
      success: true,
      message: 'تم حذف الرسالة بنجاح'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الرسالة'
    });
  }
});

router.delete('/conversation/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent } = req.query;

    if (permanent === 'true') {
      await Message.deleteMany({
        $or: [
          { sender: req.user._id, recipient: userId },
          { sender: userId, recipient: req.user._id }
        ]
      });
    } else {
      await Message.updateMany(
        { sender: req.user._id, recipient: userId },
        { isDeletedBySender: true }
      );
      await Message.updateMany(
        { sender: userId, recipient: req.user._id },
        { isDeletedByRecipient: true }
      );
      
      await Message.deleteMany({
        isDeletedBySender: true,
        isDeletedByRecipient: true
      });
    }

    res.json({
      success: true,
      message: permanent === 'true' ? 'تم حذف المحادثة نهائياً' : 'تم مسح المحادثة'
    });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في مسح المحادثة'
    });
  }
});

export default router;
