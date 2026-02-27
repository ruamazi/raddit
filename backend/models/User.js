import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_\u0600-\u06FF]+$/, 'Username can only contain letters, numbers, underscores, and Arabic characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [50, 'Display name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  banExpiresAt: {
    type: Date,
    default: null
  },
  canPost: {
    type: Boolean,
    default: true
  },
  canComment: {
    type: Boolean,
    default: true
  },
  karma: {
    type: Number,
    default: 0
  },
  cakeDay: {
    type: Date,
    default: () => new Date()
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'ar'
    },
    showNSFW: {
      type: Boolean,
      default: false
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    showOnlineStatus: {
      type: Boolean,
      default: true
    }
  },
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  savedComments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  hiddenPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  hiddenCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }],
  refreshToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  verificationToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('postsCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
  count: true
});

userSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'author',
  count: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateKarma = async function() {
  const Post = mongoose.model('Post');
  const Comment = mongoose.model('Comment');
  
  const posts = await Post.find({ author: this._id });
  const comments = await Comment.find({ author: this._id });
  
  let totalKarma = 0;
  
  posts.forEach(post => {
    totalKarma += post.voteScore || 0;
  });
  
  comments.forEach(comment => {
    totalKarma += comment.voteScore || 0;
  });
  
  this.karma = totalKarma;
  await this.save();
};

userSchema.index({ username: 'text', displayName: 'text' });

export default mongoose.model('User', userSchema);
