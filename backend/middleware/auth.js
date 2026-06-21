const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'jobfinder-secret-key-change-in-production';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'انتهت الجلسة، سجل الدخول مرة أخرى' });
  }
}

async function checkSubscription(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    if (!user.isSubscriptionValid()) {
      return res.status(403).json({
        error: 'انتهت صلاحية الاشتراك',
        expired: true,
        phone: '+201220714614',
        message: 'انتهت صلاحية حسابك. تواصل مع +201220714614 لتجديد الاشتراك'
      });
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { auth, checkSubscription, JWT_SECRET };
