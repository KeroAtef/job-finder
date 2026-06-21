const API_BASE = '/api';

async function apiUploadCV(file) {
  const formData = new FormData();
  formData.append('cv', file);
  const res = await fetch(`${API_BASE}/upload/cv`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

async function apiUploadCoverLetter(file) {
  const formData = new FormData();
  formData.append('coverLetter', file);
  const res = await fetch(`${API_BASE}/upload/cover-letter`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

async function apiGetCVAnalysis() {
  const res = await fetch(`${API_BASE}/analyze/cv`);
  if (!res.ok) throw new Error('No CV found');
  return res.json();
}

async function apiGetATSScore() {
  const res = await fetch(`${API_BASE}/analyze/ats-score`);
  if (!res.ok) throw new Error('No CV found');
  return res.json();
}

async function apiGetATSImprovements() {
  const res = await fetch(`${API_BASE}/analyze/ats-improvements`);
  if (!res.ok) throw new Error('No CV found');
  return res.json();
}

async function apiGetFullAnalysis() {
  const res = await fetch(`${API_BASE}/analyze/full-analysis`, { method: 'POST' });
  if (!res.ok) throw new Error('No CV found');
  return res.json();
}

async function apiGetMatchedJobs(query, location, source) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (location) params.set('location', location);
  if (source) params.set('source', source);
  const res = await fetch(`${API_BASE}/analyze/matched-jobs?${params}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

async function apiSearchJobs(query, location, source) {
  const params = new URLSearchParams({ q: query });
  if (location) params.set('location', location);
  if (source) params.set('source', source);
  const res = await fetch(`${API_BASE}/jobs/search?${params}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

async function apiGetSources() {
  const res = await fetch(`${API_BASE}/jobs/sources`);
  return res.json();
}

async function apiGetTracker() {
  const res = await fetch(`${API_BASE}/tracker`);
  return res.json();
}

async function apiAddTracker(entry) {
  const res = await fetch(`${API_BASE}/tracker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  return res.json();
}

async function apiUpdateTracker(id, data) {
  const res = await fetch(`${API_BASE}/tracker/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function apiDeleteTracker(id) {
  const res = await fetch(`${API_BASE}/tracker/${id}`, { method: 'DELETE' });
  return res.json();
}

async function apiGetOptimizeReport() {
  const res = await fetch(`${API_BASE}/optimize/report`);
  if (!res.ok) throw new Error('No CV found');
  return res.json();
}

async function apiGenerateImprovedCV() {
  const res = await fetch(`${API_BASE}/optimize/generate`);
  if (!res.ok) throw new Error('No CV found');
  return res.json();
}

async function apiGetAnalytics() {
  const res = await fetch(`${API_BASE}/insights/analytics`);
  return res.json();
}

async function apiGetStates() {
  const res = await fetch(`${API_BASE}/insights/states`);
  return res.json();
}

async function apiVerifyPipeline() {
  const res = await fetch(`${API_BASE}/insights/verify`);
  return res.json();
}

async function apiGetFollowup() {
  const res = await fetch(`${API_BASE}/insights/followup`);
  return res.json();
}

async function apiGetStories() {
  const res = await fetch(`${API_BASE}/insights/stories`);
  return res.json();
}

async function apiAddStory(story) {
  const res = await fetch(`${API_BASE}/insights/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story)
  });
  return res.json();
}

async function apiDedupTracker() {
  const res = await fetch(`${API_BASE}/insights/dedup-tracker`, { method: 'POST' });
  return res.json();
}

async function apiNormalizeTracker() {
  const res = await fetch(`${API_BASE}/insights/normalize-tracker`);
  return res.json();
}

async function apiGetSalary(title, location) {
  const params = new URLSearchParams({ title });
  if (location) params.set('location', location);
  const res = await fetch(`${API_BASE}/extra/salary?${params}`);
  return res.json();
}

async function apiCheckLiveness(url) {
  const res = await fetch(`${API_BASE}/extra/liveness?url=${encodeURIComponent(url)}`);
  return res.json();
}

async function apiLookupCompany(name) {
  const res = await fetch(`${API_BASE}/extra/company?name=${encodeURIComponent(name)}`);
  return res.json();
}

async function apiGenerateCoverLetter(jobData) {
  const res = await fetch(`${API_BASE}/extra/cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData)
  });
  return res.json();
}

function apiExportCSV() { window.open(`${API_BASE}/extra/export/csv`, '_blank'); }
function apiExportJSON() { window.open(`${API_BASE}/extra/export/json`, '_blank'); }

/* === SKILL GAP === */
async function apiGetSkillGap(data) {
  const res = await fetch(`${API_BASE}/analyze/skill-gap`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Skill gap failed');
  return res.json();
}

/* === SAVED SEARCHES === */
async function apiGetSavedSearches() {
  const res = await fetch(`${API_BASE}/tracker/saved-searches`);
  return res.json();
}
async function apiSaveSearch(data) {
  const res = await fetch(`${API_BASE}/tracker/saved-searches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return res.json();
}
async function apiDeleteSavedSearch(id) {
  const res = await fetch(`${API_BASE}/tracker/saved-searches/${id}`, { method: 'DELETE' });
  return res.json();
}
async function apiCheckSavedSearches() {
  const res = await fetch(`${API_BASE}/tracker/saved-searches/check`);
  return res.json();
}
