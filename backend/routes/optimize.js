const express = require('express');
const fs = require('fs');
const path = require('path');
const atsOptimizer = require('../services/atsOptimizer');
const pdfGenerator = require('../services/pdfGenerator');

const router = express.Router();

router.get('/report', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'cv-data.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'No CV found.' });
    }
    const cvData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const result = atsOptimizer.optimize(cvData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/generate', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'cv-data.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'No CV found.' });
    }
    const cvData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const result = atsOptimizer.generateImprovedCV(cvData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/print', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data', 'cv-data.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).send('<h2>No CV found. Please upload first.</h2>');
    }
    const cvData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const html = pdfGenerator.generatePrintHTML(cvData);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send('<h2>Error: ' + err.message + '</h2>');
  }
});

module.exports = router;
