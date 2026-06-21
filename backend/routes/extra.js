const express = require('express');
const fs = require('fs');
const path = require('path');
const salaryResearch = require('../services/salaryResearch');
const livenessCheck = require('../services/livenessCheck');
const companyResearch = require('../services/companyResearch');
const coverLetterGen = require('../services/coverLetterGen');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function readJSON(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch(e) { return null; }
}

router.get('/salary', async (req, res) => {
  try {
    const { title, location } = req.query;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const data = await salaryResearch.researchSalary(title, location);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/liveness', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });
    const result = await livenessCheck.checkLiveness(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/company', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const result = await companyResearch.lookupCompany(name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cover-letter', (req, res) => {
  try {
    const cvData = readJSON('cv-data.json');
    if (!cvData) return res.status(404).json({ error: 'No CV data found' });
    const letter = coverLetterGen.generateCoverLetter(cvData, req.body);
    res.json(letter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/csv', (req, res) => {
  try {
    const tracker = readJSON('tracker.json') || [];
    const header = 'Date,Company,Role,Status,URL,Notes';
    const rows = tracker.map(e => `"${e.date}","${(e.company||'').replace(/"/g,'""')}","${(e.role||'').replace(/"/g,'""')}","${e.status}","${(e.url||'').replace(/"/g,'""')}","${(e.notes||'').replace(/"/g,'""')}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="job-tracker-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + header + '\n' + rows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/json', (req, res) => {
  try {
    const tracker = readJSON('tracker.json') || [];
    const stories = (() => { try { return readJSON('stories.json') || []; } catch(e) { return []; } })();
    const cvData = readJSON('cv-data.json');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="jobfinder-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json({ exportedAt: new Date().toISOString(), tracker, stories, cvData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notify-test', (req, res) => {
  res.json({ message: 'Notification permission checked', supported: typeof Notification !== 'undefined' });
});

module.exports = router;
