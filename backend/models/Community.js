import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Community name must be at least 3 characters'],
    maxlength: [30, 'Community name cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_\u0600-\u06FF]+$/, 'Community name can only contain letters, numbers, underscores, and Arabic characters']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator'],
      default: 'moderator'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  memberCount: {
    type: Number,
    default: 1
  },
  rules: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  type: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  isNSFW: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  allowedPostTypes: {
    text: { type: Boolean, default: true },
    image: { type: Boolean, default: true },
    video: { type: Boolean, default: true },
    link: { type: Boolean, default: true },
    poll: { type: Boolean, default: true }
  },
  postingRestrictions: {
    minAccountAge: {
      type: Number,
      default: 0
    },
    minKarma: {
      type: Number,
      default: 0
    },
    trustedMembersOnly: {
      type: Boolean,
      default: false
    }
  },
  flairSettings: {
    enabled: { type: Boolean, default: true },
    selfAssign: { type: Boolean, default: true }
  },
  flairs: [{
    text: { type: String, required: true },
    color: { type: String, default: '#0079D3' },
    textColor: { type: String, default: '#FFFFFF' },
    modOnly: { type: Boolean, default: false }
  }],
  welcomeMessage: {
    enabled: { type: Boolean, default: false },
    message: { type: String, maxlength: 1000 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

communitySchema.virtual('postsCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'community',
  count: true
});

communitySchema.methods.isMember = function(userId) {
  return this.members.includes(userId);
};

communitySchema.methods.isModerator = function(userId) {
  return this.moderators.some(m => m.user.equals(userId));
};

communitySchema.methods.canPost = function(user) {
  if (this.isBanned) return false;
  if (!this.isMember(user._id)) return false;
  if (this.postingRestrictions.trustedMembersOnly) {
    const mod = this.moderators.find(m => m.user.equals(user._id));
    if (!mod) return false;
  }
  if (this.postingRestrictions.minKarma > 0) {
    if (user.karma < this.postingRestrictions.minKarma) return false;
  }
  return true;
};

communitySchema.methods.addMember = async function(userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    this.memberCount = this.members.length;
    await this.save();
  }
};

communitySchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(m => !m.equals(userId));
  this.memberCount = this.members.length;
  await this.save();
};

communitySchema.index({ name: 'text', displayName: 'text', description: 'text' });

export default mongoose.model('Community', communitySchema);
