const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const uploadRoute = require('./routes/upload');
const analyzeRoute = require('./routes/analyze');
const jobsRoute = require('./routes/jobs');
const trackerRoute = require('./routes/tracker');
const optimizeRoute = require('./routes/optimize');
const insightsRoute = require('./routes/insights');
const extraRoute = require('./routes/extra');
const authRoute = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/upload', uploadRoute);
app.use('/api/analyze', analyzeRoute);
app.use('/api/jobs', jobsRoute);
app.use('/api/tracker', trackerRoute);
app.use('/api/optimize', optimizeRoute);
app.use('/api/insights', insightsRoute);
app.use('/api/extra', extraRoute);
app.use('/api/auth', authRoute);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// SEO
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://job-finder-app.com</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://job-finder-app.com/login</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://job-finder-app.com/pages/dashboard</loc><priority>0.5</priority><changefreq>daily</changefreq></url>
</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Allow: /login
Disallow: /pages/dashboard

Sitemap: https://job-finder-app.com/sitemap.xml`);
});

connectDB().catch(() => {});

app.listen(PORT, () => {
  console.log(`Job Finder app running at http://localhost:${PORT}`);
});
