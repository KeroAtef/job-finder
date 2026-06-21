const express = require('express');
const fs = require('fs');
const path = require('path');
const atsScorer = require('../services/atsScorer');
const jobMatcher = require('../services/jobMatcher');

const router = express.Router();

router.get('/cv', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'cv-data.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'No CV found. Please upload first.' });
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ats-score', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'cv-data.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'No CV found. Please upload first.' });
    }
    const cvData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const score = atsScorer.score(cvData);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ats-improvements', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'cv-data.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'No CV found.' });
    }
    const cvData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const tips = atsScorer.getImprovements(cvData);
    res.json(tips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/matched-jobs', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'cv-data.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'No CV found.' });
    }
    const cvData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const query = req.query.q || '';
    const location = req.query.location || '';
    const source = req.query.source || 'all';
    const jobs = await jobMatcher.searchJobs(cvData, query, location, source);
    const matched = jobMatcher.matchJobs(cvData, jobs);
    res.json({ total: matched.length, jobs: matched.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/skill-gap', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'cv-data.json');
    if (!fs.existsSync(dataPath)) return res.status(404).json({ error: 'No CV found.' });
    const cvData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const jobDesc = (req.body.description || '').toLowerCase();
    const jobTitle = (req.body.title || '').toLowerCase();
    const cvSkills = (cvData.skills || []).map(s => s.toLowerCase());
    const allTech = ['python','javascript','typescript','java','c#','c++','php','ruby','go','rust',
      'react','angular','vue','node','express','django','flask','spring','html','css','sql','mysql',
      'postgresql','mongodb','redis','docker','kubernetes','aws','azure','gcp','git','linux',
      'machine learning','tensorflow','pytorch','flutter','dart','swift','kotlin','plc','scada',
      'automation','control','embedded','iot','robotics','matlab','labview','autocad','solidworks',
      'firebase','api','rest','graphql','devops','ci/cd','selenium','jest','testing','agile','scrum',
      'excel','power bi','tableau','data analysis','selenium','network','security','cloud','mobile'];
    const missing = [];
    const jobText = `${jobTitle} ${jobDesc}`;
    for (const tech of allTech) {
      if (jobText.includes(tech) && !cvSkills.some(s => s.includes(tech) || tech.includes(s))) {
        missing.push(tech);
      }
    }
    const found = cvSkills.filter(s => jobText.includes(s));
    const pct = cvSkills.length > 0 ? Math.round((found.length / Math.min(cvSkills.length + missing.length, 20)) * 100) : 0;
    res.json({ found, missing: [...new Set(missing)].slice(0, 20), gapScore: Math.min(pct + 30, 95) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/full-analysis', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'cv-data.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'No CV found.' });
    }
    const cvData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const atsScore = atsScorer.score(cvData);
    const improvements = atsScorer.getImprovements(cvData);
    res.json({ cv: cvData, ats: atsScore, improvements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
