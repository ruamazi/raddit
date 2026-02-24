import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Report from '../models/Report.js';

dotenv.config();

const clearDatabase = async () => {
  console.log('Clearing database...');
  
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
    console.log(`Cleared collection: ${key}`);
  }
  
  console.log('Database cleared successfully!\n');
};

const generateDummyData = async () => {
  console.log('Generating dummy data...\n');

  const users = [];
  const communities = [];
  const posts = [];
  const comments = [];
  const messages = [];
  const notifications = [];
  const reports = [];

  const plainPassword = 'password123';

  console.log('Creating users...');
  const adminUser = await User.create({
    username: 'admin',
    email: 'admin@arabreddit.com',
    password: plainPassword,
    displayName: 'مدير النظام',
    bio: 'مدير منصة رديت',
    isVerified: true,
    isAdmin: true,
    karma: 5000,
    preferences: {
      theme: 'system',
      language: 'ar',
      showNSFW: false,
      emailNotifications: true,
      showOnlineStatus: true
    }
  });
  users.push(adminUser);

  const moderatorUsers = [];
  for (let i = 1; i <= 5; i++) {
    const mod = await User.create({
      username: `moderator${i}`,
      email: `moderator${i}@arabreddit.com`,
      password: plainPassword,
      displayName: `مشرف ${i}`,
      bio: `مشرف في المجتمع العربي`,
      isVerified: true,
      karma: Math.floor(Math.random() * 1000) + 500,
      preferences: {
        theme: 'dark',
        language: 'ar'
      }
    });
    moderatorUsers.push(mod);
    users.push(mod);
  }

  const regularUsers = [];
  for (let i = 1; i <= 20; i++) {
    const user = await User.create({
      username: `user${i}`,
      email: `user${i}@arabreddit.com`,
      password: plainPassword,
      displayName: `مستخدم ${i}`,
      bio: `مرحباً، أنا مستخدم رقم ${i} في منصة رديت`,
      isVerified: i <= 10,
      karma: Math.floor(Math.random() * 500),
      preferences: {
        theme: i % 3 === 0 ? 'dark' : i % 3 === 1 ? 'light' : 'system',
        language: 'ar'
      }
    });
    regularUsers.push(user);
    users.push(user);
  }

  for (let i = 0; i < 10; i++) {
    const follower = users[Math.floor(Math.random() * users.length)];
    const following = users[Math.floor(Math.random() * users.length)];
    if (follower._id.toString() !== following._id.toString()) {
      if (!follower.following.includes(following._id)) {
        follower.following.push(following._id);
        following.followers.push(follower._id);
      }
    }
  }

  for (const user of users) {
    await user.save();
  }

  console.log(`Created ${users.length} users\n`);

  console.log('Creating communities...');
  const communityData = [
    {
      name: 'programming',
      displayName: 'برمجة',
      description: 'مجتمع للمبرمجين العرب لمناقشة كل ما يتعلق بالبرمجة وتطوير البرمجيات',
      type: 'public',
      isNSFW: false,
      isVerified: true
    },
    {
      name: 'technology',
      displayName: 'تكنولوجيا',
      description: 'أخبار ونقاشات حول أحدث التقنيات والأجهزة',
      type: 'public',
      isNSFW: false,
      isVerified: true
    },
    {
      name: 'gaming',
      displayName: 'ألعاب',
      description: 'مجتمع عشاق الألعاب الإلكترونية',
      type: 'public',
      isNSFW: false,
      isVerified: true
    },
    {
      name: 'islam',
      displayName: 'الإسلام',
      description: 'مجتمع لمناقشة المواضيع الإسلامية',
      type: 'public',
      isNSFW: false,
      isVerified: true
    },
    {
      name: 'funny',
      displayName: 'مضحك',
      description: 'صور وفيديوهات ومحتوى مضحك',
      type: 'public',
      isNSFW: false
    },
    {
      name: 'news',
      displayName: 'أخبار',
      description: 'آخر الأخبار العربية والعالمية',
      type: 'public',
      isNSFW: false
    },
    {
      name: 'sports',
      displayName: 'رياضة',
      description: 'كل ما يتعلق بالرياضة',
      type: 'public',
      isNSFW: false
    },
    {
      name: 'movies',
      displayName: 'أفلام ومسلسلات',
      description: 'مناقشات حول الأفلام والمسلسلات',
      type: 'public',
      isNSFW: false
    },
    {
      name: 'private_community',
      displayName: 'مجتمع خاص',
      description: 'مجتمع خاص للأعضاء المحددين فقط',
      type: 'private',
      isNSFW: false
    },
    {
      name: 'restricted_community',
      displayName: 'مجتمع مقيد',
      description: 'مجتمع مقيد حيث يمكن فقط للمشرفين النشر',
      type: 'restricted',
      isNSFW: false
    }
  ];

  for (let i = 0; i < communityData.length; i++) {
    const data = communityData[i];
    const creator = i < moderatorUsers.length ? moderatorUsers[i] : moderatorUsers[0];
    
    const members = [creator._id];
    for (let j = 0; j < 10 + Math.floor(Math.random() * 10); j++) {
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      if (!members.includes(randomUser._id)) {
        members.push(randomUser._id);
      }
    }

    const community = await Community.create({
      ...data,
      creator: creator._id,
      moderators: [{
        user: creator._id,
        role: 'owner',
        addedAt: new Date()
      }],
      members,
      memberCount: members.length,
      rules: [
        {
          title: 'احترام الآخرين',
          description: 'يجب احترام جميع الأعضاء وعدم الإساءة إليهم',
          order: 1
        },
        {
          title: 'عدم نشر محتوى مسيء',
          description: 'يمنع نشر أي محتوى مسيء أو غير لائق',
          order: 2
        },
        {
          title: 'المصادر الموثوقة',
          description: 'عند نقل معلومات يجب ذكر المصدر',
          order: 3
        }
      ],
      flairs: [
        { text: 'نقاش', color: '#0079D3', textColor: '#FFFFFF' },
        { text: 'سؤال', color: '#FF4500', textColor: '#FFFFFF' },
        { text: 'خبر', color: '#46D160', textColor: '#FFFFFF' },
        { text: 'مهم', color: '#EA0027', textColor: '#FFFFFF', modOnly: true }
      ]
    });
    communities.push(community);
  }

  console.log(`Created ${communities.length} communities\n`);

  console.log('Creating posts...');
  const postData = [
    { title: 'أفضل لغات البرمجة للمبتدئين في 2024', type: 'text' },
    { title: 'كيف تبدأ في تعلم تطوير الويب؟', type: 'text' },
    { title: 'مقارنة بين React و Vue و Angular', type: 'text' },
    { title: 'نصائح للحصول على أول وظيفة كمبرمج', type: 'text' },
    { title: 'أحدث أخبار التقنية هذا الأسبوع', type: 'link' },
    { title: 'ما هو رأيكم في الهاتف الجديد؟', type: 'poll' },
    { title: 'أفضل ألعاب هذا العام', type: 'text' },
    { title: 'تجربتي مع اللعبة الجديدة', type: 'text' },
    { title: 'دليل شامل للمبتدئين في البرمجة', type: 'text' },
    { title: 'أسئلة وأجوبة حول تطوير التطبيقات', type: 'text' },
    { title: 'صورة مضحكة من الإنترنت', type: 'text' },
    { title: 'أخبار عاجلة من العالم العربي', type: 'text' },
    { title: 'نتائج المباريات اليوم', type: 'text' },
    { title: 'أفضل الأفلام العربية الكلاسيكية', type: 'text' },
    { title: 'نصائح صحية للحياة اليومية', type: 'text' }
  ];

  for (let i = 0; i < postData.length; i++) {
    const data = postData[i];
    const author = regularUsers[Math.floor(Math.random() * regularUsers.length)];
    const community = communities[Math.floor(Math.random() * (communities.length - 2))];

    const upvotes = [];
    const downvotes = [];
    for (const user of regularUsers.slice(0, Math.floor(Math.random() * 10) + 3)) {
      if (Math.random() > 0.2) {
        upvotes.push(user._id);
      } else {
        downvotes.push(user._id);
      }
    }

    let postContent = {
      title: data.title,
      content: `هذا محتوى تجريبي للمنشور رقم ${i + 1}. يمكن أن يحتوي المنشور على نص طويل وصور وروابط.`,
      author: author._id,
      community: community._id,
      type: data.type,
      upvotes,
      downvotes,
      voteScore: upvotes.length - downvotes.length,
      viewCount: Math.floor(Math.random() * 500) + 50,
      commentCount: 0,
      isNSFW: false,
      isSpoiler: false,
      isLocked: false,
      isPinned: i === 0
    };

    if (data.type === 'poll') {
      postContent.poll = {
        options: [
          { text: 'خيار رائع جداً', votes: Math.floor(Math.random() * 50) },
          { text: 'خيار جيد', votes: Math.floor(Math.random() * 30) },
          { text: 'خيار متوسط', votes: Math.floor(Math.random() * 20) },
          { text: 'خيار ضعيف', votes: Math.floor(Math.random() * 10) }
        ],
        totalVotes: 0,
        allowMultipleVotes: false
      };
      postContent.poll.totalVotes = postContent.poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    }

    if (data.type === 'link') {
      postContent.link = {
        url: 'https://example.com/article',
        title: 'مقالة مهمة',
        description: 'وصف المقالة هنا'
      };
    }

    if (i % 4 === 0) {
      postContent.flair = {
        text: 'نقاش',
        color: '#0079D3',
        textColor: '#FFFFFF'
      };
    }

    const post = await Post.create(postContent);
    posts.push(post);
  }

  for (let i = 0; i < 20; i++) {
    const author = regularUsers[Math.floor(Math.random() * regularUsers.length)];
    const community = communities[Math.floor(Math.random() * (communities.length - 2))];

    const upvotes = [];
    const downvotes = [];
    for (const user of regularUsers.slice(0, Math.floor(Math.random() * 8) + 2)) {
      if (Math.random() > 0.3) {
        upvotes.push(user._id);
      } else {
        downvotes.push(user._id);
      }
    }

    const post = await Post.create({
      title: `منشور تجريبي رقم ${i + 16}`,
      content: `محتوى المنشور التجريبي. هذا منشور اختباري لاختبار وظائف التطبيق المختلفة.`,
      author: author._id,
      community: community._id,
      type: 'text',
      upvotes,
      downvotes,
      voteScore: upvotes.length - downvotes.length,
      viewCount: Math.floor(Math.random() * 300) + 10,
      commentCount: 0
    });
    posts.push(post);
  }

  console.log(`Created ${posts.length} posts\n`);

  console.log('Creating comments...');
  for (const post of posts) {
    const numComments = Math.floor(Math.random() * 5) + 2;
    const postComments = [];

    for (let i = 0; i < numComments; i++) {
      const author = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      
      const upvotes = [];
      const downvotes = [];
      for (const user of regularUsers.slice(0, Math.floor(Math.random() * 5))) {
        if (Math.random() > 0.3) {
          upvotes.push(user._id);
        } else {
          downvotes.push(user._id);
        }
      }

      const comment = await Comment.create({
        content: `هذا تعليق تجريبي رقم ${i + 1} على المنشور. شكراً للمشاركة!`,
        author: author._id,
        post: post._id,
        community: post.community._id || post.community,
        parent: null,
        depth: 0,
        upvotes,
        downvotes,
        voteScore: upvotes.length - downvotes.length
      });
      postComments.push(comment);
      comments.push(comment);

      await post.updateOne({ $inc: { commentCount: 1 } });
    }

    for (let i = 0; i < Math.min(3, postComments.length); i++) {
      const parentComment = postComments[i];
      const author = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      
      const reply = await Comment.create({
        content: `هذا رد على التعليق. شكراً لملاحظتك!`,
        author: author._id,
        post: post._id,
        community: post.community._id || post.community,
        parent: parentComment._id,
        depth: 1,
        upvotes: [author._id],
        downvotes: [],
        voteScore: 1
      });
      comments.push(reply);
      await post.updateOne({ $inc: { commentCount: 1 } });
    }
  }

  console.log(`Created ${comments.length} comments\n`);

  console.log('Creating messages...');
  for (let i = 0; i < 10; i++) {
    const sender = users[Math.floor(Math.random() * users.length)];
    let recipient = users[Math.floor(Math.random() * users.length)];
    while (recipient._id.toString() === sender._id.toString()) {
      recipient = users[Math.floor(Math.random() * users.length)];
    }

    const message = await Message.create({
      sender: sender._id,
      recipient: recipient._id,
      subject: `رسالة تجريبية رقم ${i + 1}`,
      content: `مرحباً، هذه رسالة تجريبية لاختبار نظام الرسائل. شكراً لاستخدام رديت!`,
      isRead: Math.random() > 0.5
    });
    messages.push(message);
  }

  console.log(`Created ${messages.length} messages\n`);

  console.log('Creating notifications...');
  const notificationTypes = [
    'post_reply', 'comment_reply', 'mention', 'upvote_post',
    'upvote_comment', 'new_follower', 'message'
  ];

  for (let i = 0; i < 15; i++) {
    const recipient = users[Math.floor(Math.random() * users.length)];
    const sender = users[Math.floor(Math.random() * users.length)];
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const post = posts[Math.floor(Math.random() * posts.length)];

    const notification = await Notification.create({
      recipient: recipient._id,
      sender: sender._id,
      type,
      title: `إشعار تجريبي من نوع ${type}`,
      content: `هذا إشعار تجريبي لاختبار نظام الإشعارات`,
      post: type.includes('post') || type.includes('comment') ? post._id : undefined,
      isRead: Math.random() > 0.6
    });
    notifications.push(notification);
  }

  console.log(`Created ${notifications.length} notifications\n`);

  console.log('Creating reports...');
  const reportReasons = ['spam', 'harassment', 'hate_speech', 'violence', 'misinformation', 'other'];
  
  for (let i = 0; i < 5; i++) {
    const reporter = regularUsers[Math.floor(Math.random() * regularUsers.length)];
    const reportedPost = posts[Math.floor(Math.random() * posts.length)];
    
    const report = await Report.create({
      reporter: reporter._id,
      reportedPost: reportedPost._id,
      community: reportedPost.community._id || reportedPost.community,
      reason: reportReasons[Math.floor(Math.random() * reportReasons.length)],
      description: `بلاغ تجريبي لاختبار نظام البلاغات`,
      status: i < 2 ? 'pending' : i < 4 ? 'reviewed' : 'resolved'
    });
    reports.push(report);
  }

  console.log(`Created ${reports.length} reports\n`);

  console.log('Setting user karma...');
  for (const user of users) {
    const userPosts = posts.filter(p => p.author.toString() === user._id.toString());
    const userComments = comments.filter(c => c.author.toString() === user._id.toString());
    let karma = 0;
    userPosts.forEach(p => { karma += p.voteScore || 0; });
    userComments.forEach(c => { karma += c.voteScore || 0; });
    await User.updateOne({ _id: user._id }, { karma });
  }

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log(`\nSummary:`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Communities: ${communities.length}`);
  console.log(`- Posts: ${posts.length}`);
  console.log(`- Comments: ${comments.length}`);
  console.log(`- Messages: ${messages.length}`);
  console.log(`- Notifications: ${notifications.length}`);
  console.log(`- Reports: ${reports.length}`);
  console.log(`\nTest credentials:`);
  console.log(`- Admin: admin@arabreddit.com / password123`);
  console.log(`- Moderator: moderator1@arabreddit.com / password123`);
  console.log(`- User: user1@arabreddit.com / password123`);
};

const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arabreddit';
    console.log(`Connecting to MongoDB: ${mongoUri}\n`);
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected\n');

    await clearDatabase();
    await generateDummyData();

    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runSeed();
