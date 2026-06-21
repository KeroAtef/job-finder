const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cvParser = require('../services/cvParser');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, DOC files allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = req.file.path;
    const text = await cvParser.parse(filePath);

    const analysis = cvParser.analyze(text);
    const cvData = {
      id: path.basename(req.file.filename, path.extname(req.file.filename)),
      fileName: req.file.originalname,
      uploadedAt: new Date().toISOString(),
      rawText: text.substring(0, 3000),
      ...analysis
    };

    const dataDir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'cv-data.json'), JSON.stringify(cvData, null, 2));

    const response = { ...cvData };
    delete response.rawText;
    res.json({ message: 'تم رفع وتحليل السيرة الذاتية بنجاح', data: response });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'فشل رفع الملف: ' + err.message });
  }
});

router.post('/cover-letter', upload.single('coverLetter'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const text = await cvParser.parse(req.file.path);
    const dataDir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'cover-letter.json'), JSON.stringify({
      fileName: req.file.originalname,
      uploadedAt: new Date().toISOString(),
      text
    }, null, 2));
    res.json({ message: 'Cover letter uploaded', text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
