const axios = require('axios');

const SALARY_BANDS = {
  engineer: { junior: '60k-90k', mid: '90k-140k', senior: '140k-200k', lead: '180k-260k' },
  developer: { junior: '55k-85k', mid: '85k-130k', senior: '130k-190k', lead: '170k-250k' },
  manager: { junior: '70k-100k', mid: '100k-150k', senior: '150k-220k', lead: '200k-300k' },
  designer: { junior: '50k-75k', mid: '75k-110k', senior: '110k-160k', lead: '150k-220k' },
  analyst: { junior: '55k-80k', mid: '80k-120k', senior: '120k-170k', lead: '160k-230k' },
  data: { junior: '70k-100k', mid: '100k-150k', senior: '150k-210k', lead: '190k-280k' },
  default: { junior: '50k-80k', mid: '80k-120k', senior: '120k-170k', lead: '160k-230k' }
};

function detectLevel(title) {
  const t = (title || '').toLowerCase();
  if (/junior|jr|trainee|intern|entry/i.test(t)) return 'junior';
  if (/senior|sr|staff|principal|lead/i.test(t)) return 'senior';
  if (/head|director|vp|chief|cxo|manager|lead/i.test(t)) return 'lead';
  return 'mid';
}

function detectRole(title) {
  const t = (title || '').toLowerCase();
  const keywords = { engineer: ['engineer', 'engineering', 'sdet', 'qa'], developer: ['developer', 'dev', 'programmer', 'software', 'frontend', 'backend', 'fullstack', 'full stack'],
    manager: ['manager', 'management'], designer: ['designer', 'design', 'ui', 'ux'], analyst: ['analyst', 'analytics'], data: ['data', 'data science', 'ml', 'machine learning', 'ai'] };
  for (const [role, kws] of Object.entries(keywords)) { if (kws.some(k => t.includes(k))) return role; }
  return 'default';
}

function guessSalary(title, location) {
  const role = detectRole(title);
  const level = detectLevel(title);
  const band = SALARY_BANDS[role] || SALARY_BANDS.default;
  const range = band[level] || band.mid;
  const highCostAreas = ['san francisco', 'new york', 'seattle', 'la', 'bay area', 'washington dc', 'boston', 'london', 'zurich', 'tokyo'];
  const multiplier = location && highCostAreas.some(c => location.toLowerCase().includes(c)) ? 1.25 : 1;
  const [min, max] = range.split('-').map(s => parseInt(s.replace('k', '')) * 1000);
  return { min: Math.round(min * multiplier), max: Math.round(max * multiplier), currency: 'USD', level, role, range: range };
}

async function researchSalary(title, location) {
  const guess = guessSalary(title, location);
  try {
    const q = `${encodeURIComponent(title)} ${encodeURIComponent(location || 'remote')} salary`;
    const url = `https://www.google.com/search?q=${q}`;
    const res = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    const text = res.data.toLowerCase().substring(0, 5000);
    const payMatch = text.match(/\$(\d{2,3})[kK]\s*[-–to]+\s*\$?(\d{2,3})[kK]/);
    if (payMatch) {
      guess.min = parseInt(payMatch[1]) * 1000;
      guess.max = parseInt(payMatch[2]) * 1000;
      guess.source = 'live';
    }
  } catch (e) {}
  return guess;
}

module.exports = { researchSalary, guessSalary };
