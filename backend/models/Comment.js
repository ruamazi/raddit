import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment must be at least 1 character'],
    maxlength: [10000, 'Comment cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  depth: {
    type: Number,
    default: 0
  },
  isRemoved: {
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
  isLocked: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
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
  awards: [{
    type: {
      type: String,
      enum: ['gold', 'silver', 'platinum', 'helpful', 'wholesome', 'laugh', 'bravo']
    },
    givenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    givenAt: { type: Date, default: () => new Date() }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

commentSchema.virtual('isRoot').get(function() {
  return this.parent === null;
});

commentSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

commentSchema.methods.vote = async function(userId, voteType) {
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

commentSchema.methods.addReply = async function(replyId) {
  this.replies.push(replyId);
  await this.save();
};

commentSchema.methods.removeReply = async function(replyId) {
  this.replies = this.replies.filter(r => !r.equals(replyId));
  await this.save();
};

commentSchema.pre('save', async function(next) {
  if (this.isNew && this.parent) {
    const Comment = mongoose.model('Comment');
    const parentComment = await Comment.findById(this.parent);
    if (parentComment) {
      this.depth = parentComment.depth + 1;
      parentComment.replies.push(this._id);
      await parentComment.save();
    }
  }
  next();
});

commentSchema.post('remove', async function(doc) {
  if (doc.parent) {
    const Comment = mongoose.model('Comment');
    const parentComment = await Comment.findById(doc.parent);
    if (parentComment) {
      parentComment.replies = parentComment.replies.filter(r => !r.equals(doc._id));
      await parentComment.save();
    }
  }
  
  const Post = mongoose.model('Post');
  const post = await Post.findById(doc.post);
  if (post) {
    await post.removeComment();
  }
});

commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ community: 1, createdAt: -1 });

export default mongoose.model('Comment', commentSchema);
