const axios = require('axios');
const { URL } = require('url');

async function checkLiveness(url) {
  const result = { url, alive: false, status: 0, error: null, tookMs: 0 };
  if (!url || !url.startsWith('http')) return { ...result, error: 'Invalid URL' };
  try {
    new URL(url);
    if (url.includes('linkedin.com') || url.includes('glassdoor.com')) return { ...result, alive: true, status: 200, note: 'Skipped (blocks automated checks)' };
    const start = Date.now();
    const res = await axios.get(url, { timeout: 10000, maxRedirects: 3, responseType: 'text', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    result.tookMs = Date.now() - start;
    result.status = res.status;
    result.alive = res.status >= 200 && res.status < 400;
    result.note = result.alive ? 'Active' : (`HTTP ${res.status}`);
    const body = (res.data || '').toLowerCase();
    if (body.includes('page not found') || body.includes('404') || body.includes('job has been filled') || body.includes('no longer accepting') || body.includes('position has been filled')) {
      result.alive = false;
      result.note = 'Expired/filled';
    }
  } catch (e) {
    result.error = e.code || e.message.substring(0, 50);
    result.alive = false;
    result.note = e.code === 'ECONNABORTED' ? 'Timeout' : 'Unreachable';
  }
  return result;
}

module.exports = { checkLiveness };
