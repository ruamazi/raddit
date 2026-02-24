import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح بالوصول. يرجى تسجيل الدخول'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `تم حظر حسابك. السبب: ${user.banReason}`
      });
    }

    if (user.banExpiresAt && new Date(user.banExpiresAt) > new Date()) {
      const restrictions = [];
      if (!user.canPost) restrictions.push('النشر');
      if (!user.canComment) restrictions.push('التعليق');
      
      req.user = user;
      req.user.restrictions = restrictions;
    } else if (!user.canPost || !user.canComment) {
      user.canPost = true;
      user.canComment = true;
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'رمز غير صالح'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'هذا الإجراء يتطلب صلاحيات المدير'
    });
  }
  next();
};

export const moderatorOnly = async (req, res, next) => {
  try {
    const Community = (await import('../models/Community.js')).default;
    
    const communityId = req.params.communityId || req.body.community;
    
    if (!communityId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المجتمع مطلوب'
      });
    }

    const community = await Community.findById(communityId);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'المجتمع غير موجود'
      });
    }

    const isMod = community.moderators.some(m => m.user.equals(req.user._id));
    
    if (!isMod && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'هذا الإجراء يتطلب صلاحيات المشرف'
      });
    }

    req.community = community;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};
