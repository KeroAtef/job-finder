const express = require('express');
const fs = require('fs');
const careerOps = require('../services/careerOps');
const { getDataPath } = require('../utils/paths');

const router = express.Router();

function readJSON(file) {
  const p = getDataPath(file);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch(e) { return null; }
}

router.get('/analytics', (req, res) => {
  try {
    const tracker = readJSON('tracker.json') || [];
    res.json(careerOps.analyzePipeline(tracker));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/states', (req, res) => {
  res.json({ states: careerOps.getStates() });
});

router.get('/verify', (req, res) => {
  try {
    const tracker = readJSON('tracker.json') || [];
    res.json(careerOps.verifyPipeline(tracker));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/followup', (req, res) => {
  try {
    const tracker = readJSON('tracker.json') || [];
    res.json(careerOps.getFollowupCadence(tracker));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stories', (req, res) => {
  res.json(careerOps.loadStories());
});

router.post('/stories', (req, res) => {
  try {
    const story = careerOps.addStory(req.body);
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dedup-tracker', (req, res) => {
  try {
    const tracker = readJSON('tracker.json') || [];
    const removed = [];
    const kept = [];
    const seen = new Set();
    for (const entry of tracker) {
      let isDup = false;
      for (const k of seen) {
        const [c, r] = k.split('|||');
        if (careerOps.fuzzyRoleMatch(entry.role || '', r) > 0.5 && (entry.company || '').toLowerCase() === c.toLowerCase()) {
          isDup = true;
          removed.push(entry);
          break;
        }
      }
      if (isDup) continue;
      seen.add(`${entry.company || ''}|||${entry.role || ''}`);
      kept.push(entry);
    }
    fs.writeFileSync(getDataPath('tracker.json'), JSON.stringify(kept, null, 2));
    res.json({ removed: removed.length, kept: kept.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/normalize-tracker', (req, res) => {
  try {
    const tracker = readJSON('tracker.json') || [];
    let changed = 0;
    const normalized = tracker.map(e => {
      const n = careerOps.normalizeStatus(e.status);
      if (n !== e.status) changed++;
      return { ...e, status: n };
    });
    fs.writeFileSync(getDataPath('tracker.json'), JSON.stringify(normalized, null, 2));
    res.json({ changed, total: normalized.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
