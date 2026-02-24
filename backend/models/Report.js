import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  reportedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  },
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'nsfw',
      'misinformation',
      'personal_info',
      'copyright',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  action: {
    type: String,
    enum: ['none', 'warning', 'removal', 'ban', 'delete'],
    default: 'none'
  },
  actionNote: {
    type: String
  }
}, {
  timestamps: true
});

reportSchema.methods.resolve = async function(action, actionNote, reviewedBy) {
  this.status = 'resolved';
  this.action = action;
  this.actionNote = actionNote;
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  await this.save();
};

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ community: 1, status: 1 });
reportSchema.index({ reporter: 1 });

export default mongoose.model('Report', reportSchema);
