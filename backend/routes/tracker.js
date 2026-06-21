const express = require('express');
const fs = require('fs');
const path = require('path');
const careerOps = require('../services/careerOps');

const router = express.Router();
const trackerPath = path.join(__dirname, '..', '..', 'data', 'tracker.json');

router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(trackerPath)) return res.json([]);
    let data = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
    data = data.map(e => ({ ...e, status: careerOps.normalizeStatus(e.status) }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    let tracker = [];
    if (fs.existsSync(trackerPath)) tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
    const entry = {
      id: Date.now().toString(),
      company: req.body.company || '',
      role: req.body.role || '',
      url: req.body.url || '',
      status: careerOps.normalizeStatus(req.body.status || 'Pending'),
      date: new Date().toISOString().split('T')[0],
      notes: req.body.notes || '',
      followupDate: '',
      lastFollowup: ''
    };
    tracker.unshift(entry);
    fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    if (!fs.existsSync(trackerPath)) return res.status(404).json({ error: 'No tracker' });
    const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
    const idx = tracker.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    if (req.body.status) req.body.status = careerOps.normalizeStatus(req.body.status);
    tracker[idx] = { ...tracker[idx], ...req.body };
    if (req.body.status && req.body.status !== tracker[idx].status) {
      tracker[idx].lastFollowup = new Date().toISOString().split('T')[0];
    }
    fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
    res.json(tracker[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    if (!fs.existsSync(trackerPath)) return res.status(404).json({ error: 'No tracker' });
    let tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
    tracker = tracker.filter(e => e.id !== req.params.id);
    fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* === SAVED SEARCHES === */
const savedPath = path.join(__dirname, '..', '..', 'data', 'saved-searches.json');
function loadSaved() { try { return JSON.parse(fs.readFileSync(savedPath, 'utf-8')); } catch (e) { return []; } }
function saveSaved(arr) { fs.writeFileSync(savedPath, JSON.stringify(arr, null, 2)); }

router.get('/saved-searches', (req, res) => { res.json(loadSaved()); });

router.post('/saved-searches', (req, res) => {
  const list = loadSaved();
  const entry = { id: Date.now().toString(), query: req.body.query, location: req.body.location || '', source: req.body.source || 'all', createdAt: new Date().toISOString(), lastChecked: null };
  if (!entry.query) return res.status(400).json({ error: 'Query required' });
  list.unshift(entry);
  saveSaved(list);
  res.json(entry);
});

router.delete('/saved-searches/:id', (req, res) => {
  let list = loadSaved();
  list = list.filter(e => e.id !== req.params.id);
  saveSaved(list);
  res.json({ message: 'Deleted' });
});

router.get('/saved-searches/check', async (req, res) => {
  const list = loadSaved();
  const jobMatcher = require('../services/jobMatcher');
  const results = [];
  for (const s of list) {
    try {
      const jobs = await jobMatcher.searchJobsDirect(s.query, s.location || '', s.source || 'all');
      if (jobs.length > 0) results.push({ id: s.id, query: s.query, count: jobs.length, jobs: jobs.slice(0, 5) });
      s.lastChecked = new Date().toISOString();
    } catch (e) {}
  }
  saveSaved(list);
  res.json({ total: results.length, results });
});

module.exports = router;
