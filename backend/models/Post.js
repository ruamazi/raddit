import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character'],
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  content: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'link', 'poll'],
    default: 'text'
  },
  images: [{
    url: String,
    publicId: String
  }],
  video: {
    url: String,
    publicId: String,
    thumbnail: String
  },
  link: {
    url: String,
    title: String,
    description: String,
    image: String,
    siteName: String
  },
  poll: {
    options: [{
      text: { type: String, required: true },
      votes: { type: Number, default: 0 }
    }],
    totalVotes: { type: Number, default: 0 },
    endsAt: Date,
    allowMultipleVotes: { type: Boolean, default: false }
  },
  pollVotes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    options: [Number],
    votedAt: { type: Date, default: () => new Date() }
  }],
  flair: {
    text: String,
    color: String,
    textColor: String
  },
  isNSFW: {
    type: Boolean,
    default: false
  },
  isSpoiler: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isRemoved: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  removedReason: {
    type: String,
    default: ''
  },
  removedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  voteScore: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  awards: [{
    type: {
      type: String,
      enum: ['gold', 'silver', 'platinum', 'helpful', 'wholesome', 'laugh', 'bravo']
    },
    givenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    givenAt: { type: Date, default: () => new Date() }
  }],
  editedAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    unique: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  justOne: false
});

postSchema.virtual('hotScore').get(function() {
  if (!this.createdAt) return 0;
  const order = Math.log10(Math.max(Math.abs(this.voteScore), 1));
  const sign = this.voteScore > 0 ? 1 : this.voteScore < 0 ? -1 : 0;
  const seconds = (this.createdAt.getTime() / 1000) - 1134028003;
  return sign * order + seconds / 45000;
});

postSchema.methods.vote = async function(userId, voteType) {
  const upvoteIndex = this.upvotes.indexOf(userId);
  const downvoteIndex = this.downvotes.indexOf(userId);

  if (voteType === 'upvote') {
    if (upvoteIndex !== -1) {
      this.upvotes.splice(upvoteIndex, 1);
    } else {
      if (downvoteIndex !== -1) {
        this.downvotes.splice(downvoteIndex, 1);
      }
      this.upvotes.push(userId);
    }
  } else if (voteType === 'downvote') {
    if (downvoteIndex !== -1) {
      this.downvotes.splice(downvoteIndex, 1);
    } else {
      if (upvoteIndex !== -1) {
        this.upvotes.splice(upvoteIndex, 1);
      }
      this.downvotes.push(userId);
    }
  }

  this.voteScore = this.upvotes.length - this.downvotes.length;
  await this.save();
  return this;
};

postSchema.methods.addComment = async function() {
  this.commentCount += 1;
  await this.save();
};

postSchema.methods.removeComment = async function() {
  if (this.commentCount > 0) {
    this.commentCount -= 1;
    await this.save();
  }
};

postSchema.methods.addView = async function() {
  this.viewCount += 1;
  await this.save();
};

postSchema.pre('save', async function(next) {
  if (this.isNew) {
    const slug = this.title
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
    
    const Post = mongoose.model('Post');
    const existingPost = await Post.findOne({ slug });
    
    if (existingPost) {
      this.slug = `${slug}-${Date.now()}`;
    } else {
      this.slug = slug;
    }
  }
  next();
});

postSchema.index({ title: 'text', content: 'text' });
postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ voteScore: -1 });
postSchema.index({ hotScore: -1 });

export default mongoose.model('Post', postSchema);
