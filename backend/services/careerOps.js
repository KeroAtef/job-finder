const fs = require('fs');
const path = require('path');

const STATES_PATH = path.join(__dirname, '..', '..', 'data', 'states.json');
const STORIES_PATH = path.join(__dirname, '..', '..', 'data', 'stories.json');

const CANONICAL_STATES = [
  { id: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending', color: '#f59e0b', aliases: ['pending', 'waiting', 'new', 'قيد الانتظار'] },
  { id: 'applied', labelAr: 'تم التقديم', labelEn: 'Applied', color: '#3b82f6', aliases: ['applied', 'submitted', 'sent', 'تم التقديم'] },
  { id: 'responded', labelAr: 'تم الرد', labelEn: 'Responded', color: '#8b5cf6', aliases: ['responded', 'replied', 'contacted', 'تم الرد'] },
  { id: 'interview', labelAr: 'مقابلة', labelEn: 'Interview', color: '#06b6d4', aliases: ['interview', 'meeting', 'screen', 'مقابلة'] },
  { id: 'offer', labelAr: 'عرض وظيفي', labelEn: 'Offer', color: '#16a34a', aliases: ['offer', 'accepted offer', 'عرض وظيفي'] },
  { id: 'rejected', labelAr: 'مرفوض', labelEn: 'Rejected', color: '#ef4444', aliases: ['rejected', 'declined', 'refused', 'مرفوض'] },
  { id: 'accepted', labelAr: 'مقبول', labelEn: 'Accepted', color: '#22c55e', aliases: ['accepted', 'hired', 'مقبول'] },
  { id: 'skip', labelAr: 'تم التجاهل', labelEn: 'Skipped', color: '#64748b', aliases: ['skip', 'skipped', 'discarded', 'تم التجاهل'] }
];

function getStates() {
  return CANONICAL_STATES;
}

function normalizeStatus(input) {
  if (!input) return 'pending';
  const val = input.toLowerCase().trim();
  for (const s of CANONICAL_STATES) {
    if (s.aliases.some(a => val === a || val.startsWith(a))) return s.id;
  }
  return 'pending';
}

function fuzzyRoleMatch(title1, title2) {
  const t1 = (title1 || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const t2 = (title2 || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  if (!t1 || !t2) return 0;
  const stopWords = new Set(['the', 'a', 'an', 'of', 'in', 'for', 'and', 'or', 'to', 'at', 'ii', 'iii', 'iv']);
  const w1 = t1.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  const w2 = t2.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  if (!w1.length || !w2.length) return 0;
  const common = w1.filter(w => w2.includes(w));
  const jaccard = common.length / Math.max(w1.length, w2.length);
  const sameBaseline = w1.some(w => w2.includes(w) && !['senior', 'junior', 'staff', 'lead', 'principal', 'head', 'manager', 'director'].includes(w)) ? 0.1 : 0;
  return Math.min(jaccard + sameBaseline, 1);
}

function getFollowupCadence(entries) {
  const cadence = {
    pending: 3,
    applied: 7,
    responded: 4,
    interview: 2,
    offer: 3,
    rejected: 0,
    accepted: 0,
    skip: 0
  };
  return (entries || []).map(e => {
    const daysSince = Math.floor((Date.now() - new Date(e.date || Date.now()).getTime()) / 86400000);
    const dueDays = cadence[e.status] || 7;
    const overdue = dueDays > 0 && daysSince >= dueDays;
    const urgency = overdue ? (daysSince >= dueDays * 2 ? 'urgent' : 'overdue') : 'waiting';
    return { ...e, daysSince, dueDays, overdue, urgency };
  });
}

function analyzePipeline(entries) {
  const total = entries.length;
  if (total === 0) return { total: 0, summary: {} };
  const byStatus = {};
  CANONICAL_STATES.forEach(s => { byStatus[s.id] = 0; });
  entries.forEach(e => { byStatus[e.status] = (byStatus[e.status] || 0) + 1; });
  const conversion = {
    appliedToInterview: byStatus['interview'] + byStatus['offer'] + byStatus['accepted'],
    interviewToOffer: byStatus['offer'] + byStatus['accepted'],
    acceptanceRate: total > 0 ? Math.round(((byStatus['offer'] + byStatus['accepted']) / total) * 100) : 0
  };
  const byMonth = {};
  entries.forEach(e => {
    const m = (e.date || '').substring(0, 7);
    if (m) { byMonth[m] = (byMonth[m] || 0) + 1; }
  });
  const monthlyTrend = Object.entries(byMonth).sort().map(([month, count]) => ({ month, count }));
  const companies = [...new Set(entries.map(e => e.company).filter(Boolean))];
  return { total, byStatus, conversion, monthlyTrend, uniqueCompanies: companies.length };
}

function loadStories() {
  try {
    if (fs.existsSync(STORIES_PATH)) return JSON.parse(fs.readFileSync(STORIES_PATH, 'utf-8'));
  } catch (e) {}
  return [];
}

function saveStories(stories) {
  fs.writeFileSync(STORIES_PATH, JSON.stringify(stories, null, 2));
}

function addStory(story) {
  const stories = loadStories();
  const entry = {
    id: Date.now().toString(),
    title: story.title || '',
    situation: story.situation || '',
    task: story.task || '',
    action: story.action || '',
    result: story.result || '',
    reflection: story.reflection || '',
    tags: story.tags || [],
    createdAt: new Date().toISOString()
  };
  stories.unshift(entry);
  saveStories(stories);
  return entry;
}

function verifyPipeline(entries) {
  const issues = [];
  if (!entries || entries.length === 0) {
    issues.push({ type: 'warning', message: 'لا توجد طلبات في tracker' });
    return { healthy: false, issues, score: 0, total: 0 };
  }
  const statuses = entries.map(e => e.status);
  const validStatuses = CANONICAL_STATES.map(s => s.id);
  const invalid = statuses.filter(s => !validStatuses.includes(s));
  if (invalid.length > 0) issues.push({ type: 'error', message: `${invalid.length} حالة غير معروفة` });
  const seen = new Set();
  const dups = entries.filter(e => {
    const key = `${e.company}|${e.role}`.toLowerCase();
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
  if (dups.length > 0) issues.push({ type: 'warning', message: `${dups.length} إدخال مكرر (نفس الشركة + الوظيفة)` });
  const noDate = entries.filter(e => !e.date);
  if (noDate.length > 0) issues.push({ type: 'info', message: `${noDate.length} إدخال بدون تاريخ` });
  const recentGaps = entries.filter(e => {
    if (!e.date) return false;
    return (Date.now() - new Date(e.date).getTime()) > 30 * 86400000 && e.status === 'pending';
  });
  if (recentGaps.length > 0) issues.push({ type: 'warning', message: `${recentGaps.length} طلب pending من أكثر من 30 يوم` });
  const score = Math.max(0, 100 - issues.reduce((s, i) => s + (i.type === 'error' ? 20 : i.type === 'warning' ? 10 : 5), 0));
  return { healthy: score >= 80, issues, score, total: entries.length };
}

module.exports = {
  getStates, normalizeStatus, fuzzyRoleMatch, getFollowupCadence,
  analyzePipeline, loadStories, addStory, verifyPipeline
};
