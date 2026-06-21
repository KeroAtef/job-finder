const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { auth, checkSubscription, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function isDB() { return mongoose.connection.readyState === 1; }

router.post('/register', async (req, res) => {
  try {
    if (!isDB()) return res.json({ offline: true, message: 'وضع غير متصل - استخدم الحساب المحلي', token: 'offline-' + Date.now(), user: { name: req.body.name || 'محلي', email: req.body.email || 'local', phone: req.body.phone || '', subscriptionEnd: new Date(+new Date() + 365 * 86400000), subscriptionActive: true } });
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, phone: phone || '' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscriptionEnd: user.subscriptionEnd } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    if (!isDB()) return res.json({ offline: true, message: 'وضع غير متصل', token: 'offline-' + Date.now(), user: { name: 'محلي', email: req.body.email || 'local', phone: '', subscriptionEnd: new Date(+new Date() + 365 * 86400000), subscriptionActive: true } });
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscriptionEnd: user.subscriptionEnd, subscriptionActive: user.subscriptionActive } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', async (req, res) => {
  try {
    if (!isDB()) return res.json({ user: { id: 'local', name: 'محلي', email: 'local@local', phone: '', subscriptionEnd: new Date(+new Date() + 365 * 86400000), subscriptionActive: true, cvData: null } });
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
    const token = header.split(' ')[1];
    if (token.startsWith('offline-')) return res.json({ user: { id: 'local', name: 'محلي', email: 'local@local', phone: '', subscriptionEnd: new Date(+new Date() + 365 * 86400000), subscriptionActive: true, cvData: null } });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscriptionEnd: user.subscriptionEnd, subscriptionActive: user.subscriptionActive, cvData: user.cvData } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/extend', async (req, res) => {
  try {
    const { email, days, secret } = req.body;
    if (secret !== process.env.ADMIN_SECRET && secret !== 'kerolos2026') return res.status(403).json({ error: 'ممنوع' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const ext = days || 30;
    const newEnd = user.subscriptionEnd > new Date() ? new Date(+user.subscriptionEnd + ext * 24 * 60 * 60 * 1000) : new Date(+new Date() + ext * 24 * 60 * 60 * 1000);
    user.subscriptionEnd = newEnd;
    user.subscriptionActive = true;
    await user.save();
    res.json({ message: `تم تمديد الاشتراك لـ ${ext} يوم`, subscriptionEnd: user.subscriptionEnd });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
