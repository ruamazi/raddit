# عربيديت - ArabReddit

منصة عربية للنقاش والمشاركة، مشابهة لـ Reddit، مبنية بأحدث التقنيات.

## 🚀 المميزات

- **المصادقة**: تسجيل، دخول، استعادة كلمة المرور، JWT tokens
- **المجتمعات**: إنشاء، إدارة، انضمام، قواعد، إشراف
- **المنشورات**: نص، صور، روابط، استطلاعات، تثبيت، قفل
- **التعليقات**: نظام تعليقات متداخل، تحرير، حذف
- **التصويت**: تصويت إيجابي/سلبي مع حساب الكارما
- **الرسائل**: محادثات مباشرة في الوقت الحقيقي
- **الإشعارات**: إشعارات فورية للتفاعلات
- **البحث**: بحث متقدم في المنشورات والمجتمعات والمستخدمين
- **الإدارة**: لوحة تحكم للمدراء
- **الوضع المظلم**: دعم كامل للوضع الفاتح والداكن
- **RTL**: دعم كامل للغة العربية

## 🛠️ التقنيات المستخدمة

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.io للوقت الحقيقي
- JWT للمصادقة
- Multer لرفع الملفات

### Frontend
- React 18 + Vite
- Tailwind CSS
- Zustand لإدارة الحالة
- React Router v6
- Socket.io Client
- Framer Motion للحركات

## 📦 التثبيت

### المتطلبات
- Node.js 18+
- MongoDB 6+

### خطوات التثبيت

1. استنساخ المشروع:
```bash
git clone <repo-url>
cd arabreddit
```

2. تثبيت الاعتماديات:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. إعداد متغيرات البيئة:
```bash
# في مجلد backend
cp .env.example .env
# عدّل ملف .env بمعلوماتك
```

4. تشغيل MongoDB:
```bash
mongod
```

5. تشغيل التطبيق:
```bash
# Backend (من مجلد backend)
npm run dev

# Frontend (من مجلد frontend، في نافذة جديدة)
npm run dev
```

6. افتح المتصفح على `http://localhost:5173`

## 🔧 متغيرات البيئة

أنشئ ملف `.env` في مجلد `backend`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/arabreddit
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## 📁 هيكل المشروع

```
arabreddit/
├── backend/
│   ├── models/         # نماذج MongoDB
│   ├── routes/         # مسارات API
│   ├── middleware/     # برمجيات وسيطة
│   ├── utils/          # أدوات مساعدة
│   ├── uploads/        # ملفات مرفوعة
│   └── server.js       # نقطة الدخول
├── frontend/
│   ├── src/
│   │   ├── components/ # مكونات React
│   │   ├── pages/      # صفحات التطبيق
│   │   ├── stores/     # حالة التطبيق (Zustand)
│   │   ├── hooks/      # خطافات مخصصة
│   │   ├── utils/      # أدوات مساعدة
│   │   ├── services/   # خدمات API
│   │   └── App.jsx     # المكون الرئيسي
│   └── public/
└── README.md
```

## 🎨 الألوان والتصميم

- **Primary**: أزرق (#0079D3)
- **Orange**: برتقالي Reddit (#FF4500)
- **Success**: أخضر (#46D160)
- **Error**: أحمر (#EA0027)

## 🌐 API Endpoints

### المصادقة
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `POST /api/auth/refresh` - تحديث التوكن
- `GET /api/auth/me` - بيانات المستخدم الحالي

### المنشورات
- `GET /api/posts` - قائمة المنشورات
- `GET /api/posts/:id` - منشور محدد
- `POST /api/posts` - إنشاء منشور
- `PUT /api/posts/:id` - تعديل منشور
- `DELETE /api/posts/:id` - حذف منشور
- `POST /api/posts/:id/vote` - التصويت

### التعليقات
- `GET /api/comments/post/:postId` - تعليقات المنشور
- `POST /api/comments` - إنشاء تعليق
- `PUT /api/comments/:id` - تعديل تعليق
- `DELETE /api/comments/:id` - حذف تعليق
- `POST /api/comments/:id/vote` - التصويت

### المجتمعات
- `GET /api/communities` - قائمة المجتمعات
- `GET /api/communities/:name` - مجتمع محدد
- `POST /api/communities` - إنشاء مجتمع
- `PUT /api/communities/:name` - تعديل مجتمع
- `POST /api/communities/:name/join` - الانضمام/المغادرة

### المستخدمون
- `GET /api/users/profile/:username` - الملف الشخصي
- `PUT /api/users/profile` - تعديل الملف
- `PUT /api/users/preferences` - تعديل الإعدادات
- `POST /api/users/follow/:userId` - متابعة/إلغاء متابعة

## 🚀 النشر

### Backend
```bash
cd backend
npm run start
```

### Frontend
```bash
cd frontend
npm run build
# استخدم nginx أو أي خادم لخدمة ملفات dist/
```

## 📝 الترخيص

MIT License

## 👨‍💻 المساهمة

نرحب بالمساهمات! يرجى فتح issue أو pull request.

---

صنع بـ ❤️ للمجتمع العربي
