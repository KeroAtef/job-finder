const express = require('express');
const fs = require('fs');
const jobMatcher = require('../services/jobMatcher');
const { getDataPath } = require('../utils/paths');

const router = express.Router();
const trackPath = getDataPath('tracker.json');

router.get('/search', async (req, res) => {
  try {
    const { q, location, source } = req.query;
    if (!q) return res.status(400).json({ error: 'Query (q) is required' });
    const jobs = await jobMatcher.searchJobsDirect(q, location || '', source || 'all');
    res.json({ total: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sources', (req, res) => {
  res.json({
    sources: [
      { id: 'all', name: '📡 جميع المصادر (8 منصات)', type: 'api' },
      { id: 'remoteok', name: 'RemoteOK', url: 'https://remoteok.com', type: 'api' },
      { id: 'weworkremotely', name: 'We Work Remotely', url: 'https://weworkremotely.com', type: 'scrape' },
      { id: 'remotive', name: 'Remotive', url: 'https://remotive.com', type: 'api' },
      { id: 'jobicy', name: 'Jobicy', url: 'https://jobicy.com', type: 'api' },
      { id: 'indeed', name: 'Indeed', url: 'https://www.indeed.com', type: 'scrape' },
      { id: 'googlejobs', name: 'Google Jobs', url: 'https://www.google.com', type: 'scrape' },
      { id: 'glassdoor', name: 'Glassdoor', url: 'https://www.glassdoor.com', type: 'scrape' },
      { id: 'linkedin', name: 'LinkedIn (يدوي)', url: 'https://www.linkedin.com/jobs', type: 'manual' }
    ]
  });
});

router.get('/tracked', (req, res) => {
  try {
    if (!fs.existsSync(trackPath)) {
      return res.json([]);
    }
    const data = JSON.parse(fs.readFileSync(trackPath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tracked', (req, res) => {
  try {
    let tracker = [];
    if (fs.existsSync(trackPath)) {
      tracker = JSON.parse(fs.readFileSync(trackPath, 'utf-8'));
    }
    const entry = {
      id: Date.now().toString(),
      company: req.body.company,
      role: req.body.role,
      url: req.body.url,
      status: req.body.status || 'Pending',
      date: new Date().toISOString().split('T')[0],
      notes: req.body.notes || ''
    };
    tracker.unshift(entry);
    fs.writeFileSync(trackPath, JSON.stringify(tracker, null, 2));
    res.json({ message: 'Job tracked', entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tracked/:id', (req, res) => {
  try {
    if (!fs.existsSync(trackPath)) return res.status(404).json({ error: 'No tracker found' });
    let tracker = JSON.parse(fs.readFileSync(trackPath, 'utf-8'));
    const idx = tracker.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Entry not found' });
    tracker[idx] = { ...tracker[idx], ...req.body };
    fs.writeFileSync(trackPath, JSON.stringify(tracker, null, 2));
    res.json(tracker[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
