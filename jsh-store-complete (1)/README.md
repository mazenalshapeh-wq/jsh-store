# JSH Store - متجر وصيانة الأجهزة المحمولة

## ⚠️ تحذير مهم حول Vercel

**Vercel غير مناسب لهذا المشروع** لأن:
- Vercel مصمم لـ Serverless Functions وليس سيرفرات طويلة الأمد
- نظام الملفات مؤقت - **قاعدة البيانات ستُفقد عند كل تحديث**
- SQLite يحتاج ملف دائم على السيرفر

## ✅ الحلول الموصى بها

### الخيار 1: Railway.app (الأسهل - مجاني)
1. ارفع المشروع على GitHub
2. اذهب إلى [railway.app](https://railway.app)
3. سجل دخول بحساب GitHub
4. اضغط "New Project" → "Deploy from GitHub repo"
5. اختر المستودع
6. Railway سيكتشف Node.js تلقائياً

### الخيار 2: Render.com (مجاني)
1. ارفع المشروع على GitHub
2. اذهب إلى [render.com](https://render.com)
3. اضغط "New" → "Web Service"
4. اربط المستودع
5. اختر "Node" environment
6. Build Command: `npm install`
7. Start Command: `node server.js`

### الخيار 3: VPS (DigitalOcean, Hetzner, etc.)
```bash
git clone YOUR_REPO
cd jsh-store
npm install
npm install -g pm2
pm2 start server.js --name jsh-store
pm2 save
pm2 startup
```

## 📦 التثبيت المحلي

```bash
# تثبيت المتطلبات
npm install

# تشغيل السيرفر
node server.js

# الموقع: http://localhost:3000
# لوحة التحكم: http://localhost:3000/admin
```

## 🔐 بيانات الدخول الافتراضية

- **رقم الهاتف:** `01001234567`
- **كلمة المرور:** `JSH@2024`

**⚠️ غيّر كلمة المرور فوراً بعد أول دخول!**

## 📁 هيكل المشروع

```
jsh-store/
├── server.js          # السيرفر الرئيسي
├── database.js        # إعداد قاعدة البيانات
├── store.db           # قاعدة البيانات (يُنشأ تلقائياً)
├── package.json
├── .gitignore
├── api/
│   └── index.js       # Vercel serverless function (للتجربة فقط)
├── vercel.json        # إعدادات Vercel (للتجربة فقط)
└── public/
    ├── index.html     # الموقع الرئيسي
    └── admin.html     # لوحة التحكم
```

## 🎯 المميزات

### الموقع الرئيسي
- ✅ سلة تسوق كاملة
- ✅ صفحة دفع مع بيانات العميل
- ✅ طرق دفع متعددة (فيزا، فودافون كاش، دفع عند الاستلام)
- ✅ نموذج تقييم الهواتف القديمة
- ✅ زر واتساب مباشر
- ✅ تصميم متجاوب

### لوحة التحكم (`/admin`)
- ✅ إحصائيات شاملة
- ✅ إدارة المنتجات (إضافة، تعديل، حذف)
- ✅ إدارة الطلبات
- ✅ تقييمات الهواتف
- ✅ إعدادات المتجر
- ✅ تعديل طرق الدفع
- ✅ تغيير الألوان والمظهر
- ✅ تغيير كلمة المرور

## 🚀 النشر على Railway (الخطوات التفصيلية)

### 1. ارفع المشروع على GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/jsh-store.git
git push -u origin main
```

### 2. انشر على Railway
1. اذهب إلى [railway.app](https://railway.app)
2. سجل دخول بحساب GitHub
3. اضغط "New Project"
4. اختر "Deploy from GitHub repo"
5. اختر مستودع `jsh-store`
6. Railway سيكتشف Node.js تلقائياً
7. انتظر حتى يكتمل النشر (2-3 دقائق)
8. الموقع سيكون متاح على رابط مثل: `jsh-store.up.railway.app`

### 3. ادخل لوحة التحكم
- اذهب إلى `YOUR-DOMAIN.up.railway.app/admin`
- استخدم بيانات الدخول الافتراضية
- **غيّر كلمة المرور فوراً!**

## ⚙️ الإعدادات

### تغيير رقم الواتساب
من لوحة التحكم → الإعدادات → معلومات المتجر → رقم واتساب

### تغيير طرق الدفع
من لوحة التحكم → الإعدادات → طرق الدفع المتاحة

### تغيير الألوان
من لوحة التحكم → الإعدادات → المظهر والألوان

## 📞 الدعم

للمساعدة أو الاستفسارات، تواصل عبر واتساب.

---

**تم التطوير بواسطة MuleRun Super Agent**
