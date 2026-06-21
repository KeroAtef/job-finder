let cvData = null;
let currentLang = 'ar';
let darkMode = localStorage.getItem('jobfinder_dark') === 'true';
let companyCache = {};
let compareList = JSON.parse(localStorage.getItem('jobfinder_compare') || '[]');

if (darkMode) document.documentElement.setAttribute('data-theme', 'dark');

const I18N = { ar: { upload: 'رفع السيرة الذاتية', analysis: 'تحليل السيرة', ats: 'تقييم ATS', optimize: 'تحسين ATS', search: 'البحث عن وظائف', tracker: 'متابعة الطلبات', analytics: 'التحليلات', interview: 'تحضير المقابلات', uploadTitle: 'رفع السيرة الذاتية', dragDrop: 'اسحب وأفلت ملف السيرة الذاتية هنا أو اضغط للاختيار', uploadHint: 'PDF أو DOCX - الحد الأقصى 10MB', selectFile: 'اختيار ملف', cvSummary: 'ملخص السيرة الذاتية', coverLetter: 'رفع خطاب التقديم (اختياري)', clHint: 'خطاب التقديم - PDF أو DOCX', analysisTitle: 'تحليل السيرة الذاتية', uploadFirst: 'يرجى رفع السيرة الذاتية أولاً', atsTitle: 'تقييم ATS', optimizeTitle: 'تحسين السيرة الذاتية لـ ATS', searchTitle: 'البحث عن وظائف', quickSearch: 'بحث سريع: ', searchPlaceholder: 'ابحث عن وظائف تتناسب مع مهاراتك', trackerTitle: 'متابعة طلبات التقديم', addRequest: '+ إضافة طلب جديد', addEntry: 'إضافة طلب تقديم', save: 'حفظ', cancel: 'إلغاء', noRequests: 'لا توجد طلبات بعد', analyticsTitle: 'تحليلات التقديم', pipelineHealth: 'صحة البيانات', loading: 'جاري التحميل...', interviewTitle: 'تحضير المقابلات - قصص STAR+R', addStory: '+ إضافة قصة جديدة', newStory: 'قصة STAR+R جديدة', navHome: 'الرئيسية', navDashboard: 'لوحة التحكم', skillGap: 'فجوة المهارات', savedSearch: 'البحث المحفوظ', compare: 'مقارنة', timeline: 'خط زمني', timelineTitle: 'الخط الزمني للطلبات' }, en: { upload: 'Upload CV', analysis: 'CV Analysis', ats: 'ATS Score', optimize: 'ATS Optimize', search: 'Job Search', tracker: 'Tracker', analytics: 'Analytics', interview: 'Interview Prep', uploadTitle: 'Upload CV', dragDrop: 'Drag & drop your CV file here or click to select', uploadHint: 'PDF or DOCX - Max 10MB', selectFile: 'Select File', cvSummary: 'CV Summary', coverLetter: 'Upload Cover Letter (optional)', clHint: 'Cover Letter - PDF or DOCX', analysisTitle: 'CV Analysis', uploadFirst: 'Please upload your CV first', atsTitle: 'ATS Evaluation', optimizeTitle: 'ATS Optimization', searchTitle: 'Job Search', quickSearch: 'Quick Search: ', searchPlaceholder: 'Search for jobs matching your skills', trackerTitle: 'Application Tracker', addRequest: '+ Add Request', addEntry: 'Add Application', save: 'Save', cancel: 'Cancel', noRequests: 'No applications yet', analyticsTitle: 'Application Analytics', pipelineHealth: 'Pipeline Health', loading: 'Loading...', interviewTitle: 'Interview Prep - STAR+R Stories', addStory: '+ Add Story', newStory: 'New STAR+R Story', navHome: 'Home', navDashboard: 'Dashboard', skillGap: 'Skill Gap', savedSearch: 'Saved Searches', compare: 'Compare', timeline: 'Timeline', timelineTitle: 'Application Timeline' } };

function t(key) { return I18N[currentLang]?.[key] || I18N['ar'][key] || key; }
function toggleLang() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  document.getElementById('langLabel').textContent = currentLang === 'ar' ? 'English' : 'العربية';
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.dataset.i18n; el.textContent = t(k); });
}
function toggleDark() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  localStorage.setItem('jobfinder_dark', darkMode);
  const icon = document.getElementById('darkIcon');
  if (icon) icon.textContent = darkMode ? '🌙' : '☀️';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('langLabel').textContent = 'English';
  restoreSession(); initUpload(); initTabs(); initDragDrop(); updateUIState(); loadStates();
  document.getElementById('searchType').value = 'remote';
  loadSavedSearchesUI();
  checkSavedSearches();
  loadSubscriptionInfo();
});
function restoreSession() { const s = sessionStorage.getItem('jobfinder_cv'); if (s) { try { cvData = JSON.parse(s); } catch (e) {} } }
function saveSession() { if (cvData) sessionStorage.setItem('jobfinder_cv', JSON.stringify(cvData)); }
function initUpload() {
  const cv = document.getElementById('cvFile');
  if (cv) cv.addEventListener('change', e => { if (e.target.files.length > 0) handleCVUpload(e.target.files[0]); });
  const cl = document.getElementById('clFile');
  if (cl) cl.addEventListener('change', e => { if (e.target.files.length > 0) handleCLUpload(e.target.files[0]); });
}
function initTabs() {
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault(); switchTab(link.dataset.tab);
    });
  });
}
function switchTab(tab) {
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const link = document.querySelector(`.sidebar-nav a[data-tab="${tab}"]`);
  const content = document.getElementById(`tab-${tab}`);
  if (link) link.classList.add('active');
  if (content) content.classList.add('active');
  if (tab === 'upload') updateUIState();
  if (tab === 'analysis') loadAnalysis();
  if (tab === 'ats') loadATS();
  if (tab === 'optimize') loadOptimize();
  if (tab === 'search') updateSearchTab();
  if (tab === 'tracker') loadTracker();
  if (tab === 'analytics') loadAnalytics();
  if (tab === 'interview') loadStories();
  if (tab === 'skillgap') loadSkillGap();
  if (tab === 'savedsearch') loadSavedSearchesUI();
  if (tab === 'compare') loadCompare();
  if (tab === 'timeline') loadTimeline();
}
function initDragDrop() {
  const area = document.getElementById('uploadArea');
  if (!area) return;
  area.addEventListener('dragover', e => { e.preventDefault(); area.style.borderColor = 'var(--primary)'; });
  area.addEventListener('dragleave', () => { area.style.borderColor = ''; });
  area.addEventListener('drop', e => { e.preventDefault(); area.style.borderColor = ''; if (e.dataTransfer.files.length > 0) handleCVUpload(e.dataTransfer.files[0]); });
  area.addEventListener('click', () => document.getElementById('cvFile').click());
}
function updateUIState() {
  if (cvData) { showCVPreview(cvData); document.querySelectorAll('.sidebar-nav a[data-tab="analysis"], .sidebar-nav a[data-tab="ats"]').forEach(a => a.style.opacity = '1'); }
}
async function handleCVUpload(file) {
  const status = document.getElementById('uploadStatus');
  const preview = document.getElementById('cvPreview');
  if (preview) preview.style.display = 'none';
  status.className = 'upload-status loading';
  status.textContent = t('loading');
  try {
    const result = await apiUploadCV(file);
    cvData = result.data;
    saveSession();
    status.className = 'upload-status success';
    status.textContent = '✓ ' + (currentLang === 'ar' ? 'تم رفع وتحليل السيرة الذاتية بنجاح' : 'CV uploaded and analyzed');
    showCVPreview(cvData);
    document.getElementById('cvFile').value = '';
  } catch (err) { status.className = 'upload-status error'; status.textContent = '✗ ' + t('uploadFirst') + ': ' + err.message; }
}
async function handleCLUpload(file) {
  const status = document.getElementById('clStatus');
  status.className = 'upload-status loading'; status.textContent = t('loading');
  try { await apiUploadCoverLetter(file); status.className = 'upload-status success'; status.textContent = '✓ ' + (currentLang === 'ar' ? 'تم رفع خطاب التقديم بنجاح' : 'Cover letter uploaded'); } catch (err) { status.className = 'upload-status error'; status.textContent = '✗ ' + err.message; }
}
function showCVPreview(data) {
  const preview = document.getElementById('cvPreview');
  const summary = document.getElementById('cvSummary');
  const stats = document.getElementById('cvStats');
  if (!preview || !summary || !stats) return;
  preview.style.display = 'block';
  summary.textContent = data.summary ? data.summary.substring(0, 500) : (currentLang === 'ar' ? 'لا توجد بيانات' : 'No data');
  stats.innerHTML = [{ v: data.skills ? data.skills.length : 0, l: currentLang === 'ar' ? 'مهارات' : 'Skills' }, { v: data.education ? data.education.length : 0, l: currentLang === 'ar' ? 'مؤهلات' : 'Education' }, { v: data.experience && data.experience.entries ? data.experience.entries.length : 0, l: currentLang === 'ar' ? 'خبرات' : 'Experience' }, { v: data.wordCount || 0, l: currentLang === 'ar' ? 'كلمة' : 'Words' }].map(item => `<div class="stat-item"><div class="stat-value">${item.v}</div><div class="stat-label">${item.l}</div></div>`).join('');
}
async function loadStates() {
  try { const data = await apiGetStates(); const sel = document.getElementById('trStatus'); if (sel && data.states) { sel.innerHTML = data.states.map(s => `<option value="${s.id}">${currentLang === 'ar' ? s.labelAr : s.labelEn}</option>`).join(''); } } catch (e) {}
}

/* === ANALYSIS === */
async function loadAnalysis() {
  const container = document.getElementById('analysisContent');
  if (!container) return;
  if (!cvData) { container.innerHTML = `<div class="analysis-placeholder"><p>${t('uploadFirst')}</p></div>`; return; }
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  const cv = cvData;
  container.innerHTML = `
    <div class="analysis-grid">
      <div class="analysis-section"><h3>${currentLang === 'ar' ? 'المعلومات الشخصية' : 'Personal Info'}</h3>
        <p><strong>${currentLang === 'ar' ? 'الاسم' : 'Name'}:</strong> ${cv.name || (currentLang === 'ar' ? 'غير معروف' : 'Unknown')}</p>
        <p><strong>Email:</strong> ${(cv.emails || []).join(', ') || (currentLang === 'ar' ? 'لا يوجد' : 'None')}</p>
        <p><strong>${currentLang === 'ar' ? 'الهاتف' : 'Phone'}:</strong> ${(cv.phones || []).join(', ') || (currentLang === 'ar' ? 'لا يوجد' : 'None')}</p>
        <p><strong>Links:</strong> ${(cv.links || []).length > 0 ? cv.links.map(l => `<a href="${l}" target="_blank" style="display:block;font-size:0.85rem;word-break:break-all">${l}</a>`).join('') : (currentLang === 'ar' ? 'لا يوجد' : 'None')}</p>
      </div>
      <div class="analysis-section"><h3>${currentLang === 'ar' ? 'المهارات' : 'Skills'} (${(cv.skills || []).length})</h3>
        <div class="skill-tags">${(cv.skills || []).length > 0 ? cv.skills.map(s => `<span class="skill-tag">${s}</span>`).join('') : (currentLang === 'ar' ? 'لا توجد مهارات' : 'No skills')}</div>
      </div>
      <div class="analysis-section"><h3>${currentLang === 'ar' ? 'الخبرات' : 'Experience'}</h3>
        ${(cv.experience && cv.experience.entries && cv.experience.entries.length > 0) ? `<ul style="line-height:1.8">${cv.experience.entries.slice(0, 15).map(e => `<li>${e}</li>`).join('')}</ul>` : '<p style="color:var(--gray-400)">' + (currentLang === 'ar' ? 'لا توجد خبرات' : 'No experience') + '</p>'}
      </div>
      <div class="analysis-section"><h3>${currentLang === 'ar' ? 'المؤهلات العلمية' : 'Education'}</h3>
        ${(cv.education && cv.education.length > 0) ? `<ul style="line-height:1.8">${cv.education.map(e => `<li>${e}</li>`).join('')}</ul>` : '<p style="color:var(--gray-400)">' + (currentLang === 'ar' ? 'لا توجد مؤهلات علمية' : 'No education') + '</p>'}
      </div>
    </div>
    <div id="inlineAts" style="margin-top:1.5rem"></div>`;
  loadInlineATS();
}
async function loadInlineATS() {
  const container = document.getElementById('inlineAts');
  if (!container || !cvData) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const data = await apiGetFullAnalysis();
    const ats = data.ats;
    container.innerHTML = `
      <div class="ats-result"><h3>${currentLang === 'ar' ? 'تقييم ATS' : 'ATS Score'}</h3>
        <div class="ats-score-circle" style="--score-pct: ${ats.total}%">
          <div class="ats-score-inner"><div class="ats-score-number">${ats.total}</div><div class="ats-score-label">${currentLang === 'ar' ? 'من 100' : '/100'}</div></div>
        </div>
        <div class="ats-grade">${ats.grade}</div>
        <div class="ats-summary">${ats.summary}</div>
        ${Object.values(ats.details).map(d => { const pct = (d.score / d.max) * 100; return `<div class="ats-detail-row"><span class="ats-detail-label">${d.label}</span><div style="display:flex;align-items:center;gap:0.75rem"><span style="font-size:0.85rem;color:var(--gray-500);min-width:40px">${d.score}/${d.max}</span><div class="ats-detail-bar"><div class="ats-detail-fill" style="width:${pct}%"></div></div></div></div>`; }).join('')}
      </div>`;
  } catch (e) { container.innerHTML = `<div class="ats-result"><p>${currentLang === 'ar' ? 'تعذر حساب تقييم ATS' : 'ATS evaluation failed'}</p></div>`; }
}

/* === ATS TAB === */
async function loadATS() {
  const container = document.getElementById('atsContent');
  if (!container) return;
  if (!cvData) { container.innerHTML = `<div class="analysis-placeholder"><p>${t('uploadFirst')}</p></div>`; return; }
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const data = await apiGetFullAnalysis();
    const ats = data.ats;
    container.innerHTML = `
      <div class="ats-result"><h3>${currentLang === 'ar' ? 'النتيجة الإجمالية' : 'Overall Score'}</h3>
        <div class="ats-score-circle" style="--score-pct: ${ats.total}%">
          <div class="ats-score-inner"><div class="ats-score-number">${ats.total}</div><div class="ats-score-label">${currentLang === 'ar' ? 'من 100' : '/100'}</div></div>
        </div>
        <div class="ats-grade">${ats.grade}</div>
        <div class="ats-summary">${ats.summary}</div>
      </div>
      <div class="ats-tips"><h3>${currentLang === 'ar' ? 'تفاصيل التقييم' : 'Score Details'}</h3>
        ${Object.values(ats.details).map(d => { const pct = (d.score / d.max) * 100; return `<div class="ats-detail-row"><span class="ats-detail-label">${d.label}</span><div style="display:flex;align-items:center;gap:0.75rem"><span style="font-size:0.85rem;color:var(--gray-500);min-width:40px">${d.score}/${d.max}</span><div class="ats-detail-bar"><div class="ats-detail-fill" style="width:${pct}%"></div></div></div></div>`; }).join('')}
      </div>`;
    const tips = data.improvements || [];
    if (tips.length > 0) { container.innerHTML += `<div class="ats-tips" style="margin-top:1rem"><h3>${currentLang === 'ar' ? 'نصائح للتحسين' : 'Improvement Tips'}</h3>${tips.map(t => `<div class="tip-item"><div class="tip-icon">💡</div><div class="tip-content"><div class="tip-category">${t.category}</div><div class="tip-text">${t.tip}</div></div></div>`).join('')}</div>`; }
  } catch (err) { container.innerHTML = `<div class="analysis-placeholder">${err.message}</div>`; }
}

/* === SEARCH === */
function updateSearchTab() {
  const query = document.getElementById('searchQuery');
  const source = document.getElementById('searchSource');
  if (cvData && cvData.skills && cvData.skills.length > 0 && query && !query.value) { query.placeholder = currentLang === 'ar' ? `ابحث مثلاً: ${cvData.skills.slice(0, 3).join(', ')}` : `Search: ${cvData.skills.slice(0, 3).join(', ')}`; }
}
async function searchJobs() {
  const container = document.getElementById('searchResults');
  const query = document.getElementById('searchQuery').value.trim();
  const location = document.getElementById('searchLocation').value;
  const source = document.getElementById('searchSource').value;
  const type = document.getElementById('searchType').value;
  const fullQuery = type ? `${query} ${type}` : query;
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    let q = fullQuery || query;
    let data;
    if (cvData) data = await apiGetMatchedJobs(q, location, source);
    else data = await apiSearchJobs(q || 'developer', location, source);
    if (!data.jobs || data.jobs.length === 0) { container.innerHTML = `<div class="analysis-placeholder">${currentLang === 'ar' ? 'لا توجد نتائج للبحث' : 'No results found'}</div>`; return; }
    const srcLabels = { remoteok: 'RemoteOK', weworkremotely: 'We Work Remotely', remotive: 'Remotive', jobicy: 'Jobicy', indeed: 'Indeed', googlejobs: 'Google Jobs', glassdoor: 'Glassdoor', linkedin: 'LinkedIn' };
    container.innerHTML = `
      <div style="background:var(--card-bg);padding:0.75rem 1rem;border-radius:var(--radius-sm);margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
        <div style="color:var(--text-secondary);font-size:0.9rem">${currentLang === 'ar' ? 'تم العثور على' : 'Found'} ${data.total || data.jobs.length} ${currentLang === 'ar' ? 'وظيفة' : 'jobs'}</div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-sm btn-secondary" onclick='saveCurrentSearch()'>🔖 ${currentLang === 'ar' ? 'حفظ البحث' : 'Save Search'}</button>
        </div>
      </div>
      ${data.jobs.map(job => {
        const match = job.match || { score: 0, matchedKeywords: [], missingRequirements: [] };
        const mc = match.score >= 60 ? 'high' : match.score >= 30 ? 'medium' : 'low';
        const sl = srcLabels[job.source] || job.source || '';
        const jid = (job.id || '').replace(/[^a-z0-9]/gi, '');
        const isComp = compareList.some(c => c.id === jid);
        return `<div class="job-card"><div class="job-info"><h3>${job.title || ''}</h3><div class="job-company">${job.company || ''}</div>
          <div class="job-meta"><span>📍 ${job.location || 'Remote'}</span>${job.date ? `<span>📅 ${job.date.substring(0, 10)}</span>` : ''}<span style="background:var(--card-border);padding:1px 6px;border-radius:3px;font-size:0.8rem">${sl}</span></div>
          ${job.summary ? `<div class="job-summary">${job.summary.substring(0, 300)}</div>` : ''}
          ${job.match && job.match.matchedKeywords && job.match.matchedKeywords.length > 0 ? `<div style="margin-top:0.5rem">${job.match.matchedKeywords.slice(0, 8).map(k => `<span class="skill-tag">${k}</span>`).join('')}</div>` : ''}
          <div class="job-actions" style="margin-top:0.75rem;display:flex;gap:4px;flex-wrap:wrap">
            ${job.url ? `<a href="${job.url}" target="_blank" class="btn btn-primary btn-sm">${currentLang === 'ar' ? 'عرض' : 'View'}</a>` : ''}
            <button class="btn btn-sm btn-secondary" onclick='quickTrackDirect({company: ${JSON.stringify(job.company || '')},title: ${JSON.stringify(job.title || '')},url: ${JSON.stringify(job.url || '')}})'>✅ ${currentLang === 'ar' ? 'تتبع' : 'Track'}</button>
            ${match.missingRequirements && match.missingRequirements.length > 0 ? `<button class="btn btn-sm btn-secondary" onclick='showSkillGapForJob(${JSON.stringify(job).replace(/"/g, '&quot;')})'>📊 ${currentLang === 'ar' ? 'الفجوة' : 'Gap'}</button>` : ''}
            <button class="btn btn-sm btn-secondary" onclick='showSalary("${(job.title || '').replace(/"/g, '&quot;')}")'>💰</button>
            ${job.company ? `<button class="btn btn-sm btn-secondary" onclick='showCompany("${(job.company || '').replace(/"/g, '&quot;')}")'>🏢</button>` : ''}
            <button class="btn btn-sm btn-secondary" onclick='generateCoverLetter("${(job.title || '').replace(/"/g, '&quot;')}", "${(job.company || '').replace(/"/g, '&quot;')}")'>📝</button>
            ${job.url ? `<button class="btn btn-sm btn-secondary" onclick='checkJobURL("${job.url.replace(/"/g, '&quot;')}")'>🔗</button>` : ''}
            <button class="btn btn-sm ${isComp ? 'btn-primary' : 'btn-secondary'}" onclick='toggleCompare(${JSON.stringify({id:jid, title:job.title, company:job.company, location:job.location, source:sl, url:job.url, score:match.score}).replace(/"/g, '&quot;')})'>⚖️</button>
          </div></div>
          <div class="job-match"><div class="match-pct ${mc}">${match.score}%</div><div class="match-label">${currentLang === 'ar' ? 'توافق' : 'Match'}</div></div></div>`;
      }).join('')}`;
  } catch (err) { container.innerHTML = `<div class="analysis-placeholder">${err.message}</div>`; }
}
function quickSearch(term) { document.getElementById('searchQuery').value = term; searchJobs(); }
function saveCurrentSearch() {
  const q = document.getElementById('searchQuery').value.trim();
  if (!q) return alert(currentLang === 'ar' ? 'اكتب كلمة البحث أولاً' : 'Enter a search query first');
  apiSaveSearch({ query: q, location: document.getElementById('searchLocation').value, source: document.getElementById('searchSource').value }).then(() => {
    alert(currentLang === 'ar' ? 'تم حفظ البحث' : 'Search saved'); loadSavedSearchesUI();
  }).catch(e => alert(e.message));
}

/* === ONE-CLICK TRACK (Feature 1) === */
async function quickTrackDirect(job) {
  if (!job.company || !job.title) return;
  try {
    await apiAddTracker({ company: job.company, role: job.title, url: job.url || '', status: 'applied', notes: '' });
    if (Notification.permission === 'granted') new Notification('Job Finder', { body: `✓ ${job.title} @ ${job.company}` });
    alert(`✓ ${currentLang === 'ar' ? 'تمت إضافة' : 'Added'}: ${job.title}`);
  } catch (err) { alert(err.message); }
}

/* === SKILL GAP (Feature 2) === */
async function showSkillGapForJob(job) {
  const box = createModal();
  box.innerHTML = `<div style="background:var(--card-bg);padding:24px;border-radius:12px;min-width:400px;max-width:550px;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
    <h3 style="margin-bottom:12px">📊 ${currentLang === 'ar' ? 'فجوة المهارات' : 'Skill Gap'}</h3>
    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">${job.title} @ ${job.company}</p>
    <div id="sgResult"><p>${t('loading')}</p></div>
    <div style="margin-top:12px;text-align:center"><button class="btn btn-primary" onclick="document.querySelector('[data-modal]')?.remove()">${currentLang === 'ar' ? 'إغلاق' : 'Close'}</button></div>
  </div>`;
  document.body.appendChild(box);
  try {
    const data = await apiGetSkillGap({ title: job.title, description: job.summary || '' });
    const el = document.getElementById('sgResult');
    if (!el) return;
    let html = `<div style="margin-bottom:12px"><strong>${currentLang === 'ar' ? 'درجة الفجوة' : 'Gap Score'}:</strong> <span style="font-size:20px;font-weight:700;color:${data.gapScore >= 70 ? '#16a34a' : data.gapScore >= 40 ? '#f59e0b' : '#ef4444'}">${data.gapScore}%</span></div>`;
    if (data.found && data.found.length > 0) html += `<p style="font-size:13px;color:var(--text-secondary);margin-bottom:6px">✓ ${currentLang === 'ar' ? 'مهارات موجودة' : 'Matching'}: ${data.found.join(', ')}</p>`;
    if (data.missing && data.missing.length > 0) html += `<div style="margin-top:8px"><p style="font-weight:600;font-size:14px;margin-bottom:6px">⚠️ ${currentLang === 'ar' ? 'مهارات ناقصة للوصول لـ 80%+' : 'Missing to reach 80%+'}</p><div class="skill-tags">${data.missing.map(s => `<span class="skill-tag" style="background:var(--error-bg);color:var(--danger)">${s}</span>`).join('')}</div></div>`;
    else html += `<p style="color:#16a34a;font-weight:600;font-size:14px">✅ ${currentLang === 'ar' ? 'لا توجد فجوة كبيرة - مهاراتك ممتازة لهذه الوظيفة' : 'No major gap - great fit!'}</p>`;
    el.innerHTML = html;
  } catch (e) { const el = document.getElementById('sgResult'); if (el) el.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}
async function loadSkillGap() {
  const container = document.getElementById('skillGapContent');
  if (!container) return;
  if (!cvData) { container.innerHTML = `<div class="analysis-placeholder"><p>${t('uploadFirst')}</p></div>`; return; }
  container.innerHTML = `
    <div class="ats-tips"><h3>${currentLang === 'ar' ? 'تحليل فجوة المهارات' : 'Skill Gap Analysis'}</h3>
      <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:12px">${currentLang === 'ar' ? 'الصق الوصف الوظيفي لتحليل الفجوة بين مهاراتك ومتطلبات الوظيفة' : 'Paste a job description to analyze the gap between your skills and job requirements'}</p>
      <textarea id="sgJobDesc" style="width:100%;min-height:150px;padding:12px;border:1px solid var(--card-border);border-radius:var(--radius-sm);font-size:0.9rem;font-family:inherit;background:var(--bg);color:var(--text);margin-bottom:8px" placeholder="${currentLang === 'ar' ? 'الصق الوصف الوظيفي هنا...' : 'Paste job description here...'}"></textarea>
      <input type="text" id="sgJobTitle" style="width:100%;padding:10px 12px;border:1px solid var(--card-border);border-radius:var(--radius-sm);font-size:0.9rem;font-family:inherit;background:var(--bg);color:var(--text);margin-bottom:8px" placeholder="${currentLang === 'ar' ? 'المسمى الوظيفي (اختياري)' : 'Job title (optional)'}">
      <button class="btn btn-primary" onclick="analyzeSkillGap()">📊 ${currentLang === 'ar' ? 'تحليل الفجوة' : 'Analyze Gap'}</button>
    </div>
    <div id="sgResultFull" style="margin-top:12px"></div>`;
}
async function analyzeSkillGap() {
  const desc = document.getElementById('sgJobDesc').value.trim();
  const title = document.getElementById('sgJobTitle').value.trim();
  const container = document.getElementById('sgResultFull');
  if (!desc) { container.innerHTML = `<p style="color:var(--danger)">${currentLang === 'ar' ? 'الصق الوصف الوظيفي أولاً' : 'Paste a job description first'}</p>`; return; }
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const data = await apiGetSkillGap({ title, description: desc });
    let html = `<div class="ats-result"><h4>${currentLang === 'ar' ? 'نتيجة التحليل' : 'Analysis Result'}</h4>`;
    html += `<div style="margin:12px 0"><strong>${currentLang === 'ar' ? 'مهاراتك الموجودة في الوظيفة' : 'Your skills matched'}:</strong> ${data.found.length > 0 ? data.found.join(', ') : (currentLang === 'ar' ? 'لا يوجد' : 'None')}</div>`;
    if (data.missing && data.missing.length > 0) {
      html += `<div style="margin:12px 0"><strong>⚠️ ${currentLang === 'ar' ? 'مهارات ناقصة (أضفها لسيرتك الذاتية)' : 'Missing skills (add to CV)'}:</strong></div><div class="skill-tags">${data.missing.map(s => `<span class="skill-tag" style="background:var(--error-bg);color:var(--danger)">${s}</span>`).join('')}</div>`;
      html += `<p style="margin-top:12px;font-size:0.85rem;color:var(--text-secondary)">${currentLang === 'ar' ? '💡 أضف هذه المهارات لسيرتك الذاتية لزيادة نسبة التطابق مع هذه الوظيفة' : '💡 Add these skills to your CV to increase match rate for this job'}</p>`;
    } else { html += `<p style="color:#16a34a;font-weight:600">✅ ${currentLang === 'ar' ? 'مهاراتك تغطي متطلبات الوظيفة بالكامل' : 'Your skills fully cover this job'}</p>`; }
    html += `<div style="margin-top:16px"><strong>${currentLang === 'ar' ? 'درجة التطابق المقدرة بعد إضافة المهارات الناقصة' : 'Estimated match after adding missing skills'}:</strong> <span style="font-size:24px;font-weight:800;color:${data.gapScore >= 70 ? '#16a34a' : data.gapScore >= 40 ? '#f59e0b' : '#ef4444'}">${data.gapScore}%</span></div>`;
    html += `</div>`;
    container.innerHTML = html;
  } catch (e) { container.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

/* === TRACKER === */
function showAddForm() { document.getElementById('addForm').style.display = 'grid'; }
function hideAddForm() { document.getElementById('addForm').style.display = 'none'; }
async function addTrackerEntry() {
  const entry = { company: document.getElementById('trCompany').value, role: document.getElementById('trRole').value, url: document.getElementById('trUrl').value, status: document.getElementById('trStatus').value, notes: document.getElementById('trNotes').value };
  if (!entry.company || !entry.role) { alert(currentLang === 'ar' ? 'يرجى إدخال اسم الشركة والمسمى الوظيفي' : 'Enter company & role'); return; }
  try { await apiAddTracker(entry); document.getElementById('trCompany').value = ''; document.getElementById('trRole').value = ''; document.getElementById('trUrl').value = ''; document.getElementById('trNotes').value = ''; hideAddForm(); loadTracker(); } catch (err) { alert(err.message); }
}
async function loadTracker() {
  const container = document.getElementById('trackerList');
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const data = await apiGetTracker();
    if (data.length === 0) { container.innerHTML = `<div class="analysis-placeholder">${currentLang === 'ar' ? 'لا توجد طلبات بعد - ابدأ بإضافة طلب جديد' : 'No applications yet'}</div>`; return; }
    const states = await apiGetStates();
    const stateMap = {};
    (states.states || []).forEach(s => { stateMap[s.id] = currentLang === 'ar' ? s.labelAr : s.labelEn; });
    const ar = currentLang === 'ar';
    container.innerHTML = `<div class="tracker-density">${data.length} ${ar ? 'طلب' : 'applications'}</div>
      <div class="tracker-table"><table><thead><tr>
        <th>${ar ? 'التاريخ' : 'Date'}</th><th>${ar ? 'الشركة' : 'Company'}</th><th>${ar ? 'الوظيفة' : 'Role'}</th>
        <th>${ar ? 'الحالة' : 'Status'}</th><th>${ar ? 'ملاحظات' : 'Notes'}</th>
        <th>${ar ? 'الإجراءات' : 'Actions'}</th></tr></thead><tbody>
        ${data.map(entry => {
          const st = stateMap[entry.status] || entry.status;
          const stColor = entry.status === 'rejected' ? '#ef4444' : entry.status === 'interview' ? '#f59e0b' : entry.status === 'offer' ? '#16a34a' : 'var(--text-secondary)';
          return `<tr>
            <td style="font-size:0.85rem">${entry.date}</td>
            <td><strong>${entry.company}</strong></td>
            <td>${entry.role}</td>
            <td><span style="font-size:12px;padding:2px 10px;border-radius:10px;border:1px solid ${stColor};color:${stColor}">${st}</span></td>
            <td style="font-size:0.85rem;color:var(--text-secondary);max-width:200px">${entry.notes || ''}</td>
            <td><button class="btn btn-sm btn-secondary" onclick="editStatus('${entry.id}')">✏️</button> <button class="btn btn-sm btn-secondary" onclick="deleteEntry('${entry.id}')">🗑</button></td>
          </tr>`;
        }).join('')}</tbody></table></div>`;
  } catch (err) { container.innerHTML = `<div class="analysis-placeholder">${err.message}</div>`; }
}
async function editStatus(id) {
  const newStatus = prompt(currentLang === 'ar' ? 'أدخل الحالة الجديدة (applied, interview, offer, rejected, pending):' : 'Enter new status (applied, interview, offer, rejected, pending):');
  if (!newStatus) return;
  try { await apiUpdateTracker(id, { status: newStatus }); loadTracker(); } catch (e) { alert(e.message); }
}
async function deleteEntry(id) {
  if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Delete?')) return;
  try { await apiDeleteTracker(id); loadTracker(); } catch (err) { alert(err.message); }
}
async function dedupAndNormalize() {
  try { const d = await apiDedupTracker(); const n = await apiNormalizeTracker(); alert(`${currentLang === 'ar' ? 'تمت إزالة' : 'Removed'} ${d.removed} ${currentLang === 'ar' ? 'مكرر' : 'duplicates'} ${n.changed} ${currentLang === 'ar' ? 'حالة' : 'statuses'}`); loadTracker(); } catch (e) { alert(e.message); }
}
async function showFollowups() {
  const panel = document.getElementById('followupPanel');
  const list = document.getElementById('followupList');
  if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
  panel.style.display = 'block'; list.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const data = await apiGetFollowup();
    const urgent = data.filter(e => e.urgency === 'urgent');
    const overdue = data.filter(e => e.urgency === 'overdue');
    if (urgent.length === 0 && overdue.length === 0) { list.innerHTML = `<p style="color:var(--text-secondary);font-size:13px">${currentLang === 'ar' ? 'لا توجد متابعات مستحقة' : 'No follow-ups due'}</p>`; return; }
    list.innerHTML = '';
    if (urgent.length > 0) { list.innerHTML += `<p style="font-weight:600;color:#dc2626;margin:4px 0">🔴 ${currentLang === 'ar' ? 'عاجل' : 'Urgent'} (${urgent.length})</p>`; urgent.forEach(e => { list.innerHTML += `<div style="display:flex;justify-content:space-between;padding:4px 8px;background:var(--error-bg);margin:2px 0;border-radius:4px;font-size:13px;color:var(--text)"><span><strong>${e.company}</strong> - ${e.role}</span><span style="color:#dc2626">${e.daysSince} ${currentLang === 'ar' ? 'يوم' : 'days'}</span></div>`; }); }
    if (overdue.length > 0) { list.innerHTML += `<p style="font-weight:600;color:#d97706;margin:8px 0 4px">🟡 ${currentLang === 'ar' ? 'متأخر' : 'Overdue'} (${overdue.length})</p>`; overdue.forEach(e => { list.innerHTML += `<div style="display:flex;justify-content:space-between;padding:4px 8px;background:var(--warning-bg);margin:2px 0;border-radius:4px;font-size:13px;color:var(--text)"><span><strong>${e.company}</strong> - ${e.role}</span><span style="color:#d97706">${e.daysSince} ${currentLang === 'ar' ? 'يوم' : 'days'}</span></div>`; }); }
  } catch (e) { list.innerHTML = `<p style="color:var(--danger);font-size:13px">${e.message}</p>`; }
}

/* === TIMELINE (Feature 5) === */
async function loadTimeline() {
  const container = document.getElementById('timelineContent');
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const data = await apiGetTracker();
    if (data.length === 0) { container.innerHTML = `<div class="analysis-placeholder">${currentLang === 'ar' ? 'لا توجد طلبات بعد' : 'No applications yet'}</div>`; return; }
    const states = await apiGetStates();
    const stateMap = {}; (states.states || []).forEach(s => { stateMap[s.id] = currentLang === 'ar' ? s.labelAr : s.labelEn; });
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    const ar = currentLang === 'ar';
    const statusOrder = ['pending', 'applied', 'phone-screen', 'interview', 'technical', 'offer', 'accepted', 'rejected'];
    container.innerHTML = `<div style="position:relative;padding:10px 0">
      ${sorted.map((entry, i) => {
        const idx = statusOrder.indexOf(entry.status);
        const pct = idx >= 0 ? Math.round((idx / (statusOrder.length - 1)) * 100) : 50;
        const dots = [];
        for (let s of statusOrder) {
          const si = statusOrder.indexOf(s);
          const filled = si <= idx;
          dots.push(`<div style="width:12px;height:12px;border-radius:50%;background:${filled ? '#6366f1' : 'var(--card-border)'};${filled ? 'box-shadow:0 0 6px rgba(99,102,241,0.4)' : ''};flex-shrink:0"></div>`);
        }
        return `<div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--card-border)">
          <div style="text-align:center;min-width:50px;font-size:0.78rem;color:var(--text-secondary)">${entry.date}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:0.9rem">${entry.company} - ${entry.role}</div>
            <div style="display:flex;gap:4px;align-items:center;margin-top:6px">${dots.join('')}</div>
            <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:2px">${ar ? 'الحالي' : 'Current'}: ${stateMap[entry.status] || entry.status} (${pct}%)</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  } catch (e) { container.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

/* === COMPARE (Feature 4) === */
function toggleCompare(job) {
  const idx = compareList.findIndex(c => c.id === job.id);
  if (idx >= 0) compareList.splice(idx, 1);
  else { if (compareList.length >= 5) return alert(currentLang === 'ar' ? 'الحد الأقصى 5 وظائف' : 'Max 5 jobs'); compareList.push(job); }
  localStorage.setItem('jobfinder_compare', JSON.stringify(compareList));
  searchJobs();
}
async function loadCompare() {
  const container = document.getElementById('compareContent');
  if (!container) return;
  if (compareList.length === 0) { container.innerHTML = `<div class="analysis-placeholder">${currentLang === 'ar' ? 'اضغط ⚖️ على وظيفة في نتائج البحث لإضافتها للمقارنة' : 'Click ⚖️ on a job to add to comparison'}</div>`; return; }
  const ar = currentLang === 'ar';
  container.innerHTML = `<div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn btn-sm btn-secondary" onclick="compareList=[];localStorage.setItem('jobfinder_compare','[]');loadCompare()">🗑 ${ar ? 'مسح الكل' : 'Clear All'}</button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
    ${compareList.map(j => `
      <div class="job-card" style="flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:start;width:100%">
          <h4 style="font-size:0.9rem;margin-bottom:4px">${j.title}</h4>
          <button class="btn btn-sm btn-secondary" style="padding:2px 6px;font-size:11px" onclick="toggleCompare(${JSON.stringify(j).replace(/"/g, '&quot;')});loadCompare()">✕</button>
        </div>
        <div style="font-size:0.82rem;color:var(--primary);font-weight:600">${j.company}</div>
        <div style="font-size:0.78rem;color:var(--text-secondary);margin:4px 0">📍 ${j.location || 'Remote'}</div>
        <div style="font-size:0.78rem;color:var(--text-secondary)">🏷️ ${j.source || ''}</div>
        <div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;width:100%">
          <span style="font-size:0.82rem;color:var(--text)"><strong>${ar ? 'التوافق' : 'Match'}:</strong> ${j.score || '?'}%</span>
          ${j.url ? `<a href="${j.url}" target="_blank" class="btn btn-primary btn-sm" style="padding:3px 10px;font-size:0.75rem">${ar ? 'عرض' : 'View'}</a>` : ''}
        </div>
      </div>
    `).join('')}
  </div>`;
}

/* === SAVED SEARCHES (Feature 3) === */
async function loadSavedSearchesUI() {
  const container = document.getElementById('savedSearchContent');
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const data = await apiGetSavedSearches();
    const ar = currentLang === 'ar';
    if (data.length === 0) { container.innerHTML = `<div class="analysis-placeholder">${ar ? 'احفظ عمليات البحث لمراقبتها دورياً' : 'Save searches to monitor them periodically'}</div>`; return; }
    container.innerHTML = `<div class="tracker-density">${data.length} ${ar ? 'بحث محفوظ' : 'saved searches'}</div>
      <div style="display:grid;gap:8px">${data.map(s => `
        <div class="job-card" style="align-items:center;padding:12px 16px">
          <div style="flex:1"><strong style="font-size:0.9rem">${s.query}</strong>
            <div style="font-size:0.78rem;color:var(--text-secondary)">${s.location || ar ? 'كل المناطق' : 'All locations'} | ${s.source === 'all' ? (ar ? 'كل المصادر' : 'All sources') : s.source}${s.lastChecked ? ` | ${ar ? 'آخر فحص' : 'Last checked'}: ${new Date(s.lastChecked).toLocaleDateString()}` : ''}</div>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="runSavedSearch('${s.id}')">🔄</button>
          <button class="btn btn-sm btn-secondary" onclick="deleteSavedSearch('${s.id}')">🗑</button>
        </div>`).join('')}</div>`;
  } catch (e) { container.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}
async function runSavedSearch(id) {
  try {
    const data = await apiCheckSavedSearches();
    const found = data.results.find(r => r.id === id);
    if (found) alert(`${found.query}: ${found.count} ${currentLang === 'ar' ? 'وظيفة جديدة' : 'new jobs'}`);
    else alert(currentLang === 'ar' ? 'لا توجد وظائف جديدة' : 'No new jobs');
    loadSavedSearchesUI();
  } catch (e) { alert(e.message); }
}
async function deleteSavedSearch(id) {
  try { await apiDeleteSavedSearch(id); loadSavedSearchesUI(); } catch (e) { alert(e.message); }
}
async function checkSavedSearches() {
  try {
    const data = await apiCheckSavedSearches();
    if (data.total > 0 && Notification.permission === 'granted') {
      new Notification('Job Finder', { body: `${data.total} ${currentLang === 'ar' ? 'بحث لديه نتائج جديدة' : 'searches have new results'}` });
    }
  } catch (e) {}
}

/* === ATS OPTIMIZE === */
async function loadOptimize() {
  const container = document.getElementById('optimizeContent');
  if (!container) return;
  if (!cvData) { container.innerHTML = `<div class="analysis-placeholder"><p>${t('uploadFirst')}</p></div>`; return; }
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const report = await apiGetOptimizeReport();
    container.innerHTML = `
      <div class="ats-result"><h3>${currentLang === 'ar' ? 'مقارنة تقييم ATS' : 'ATS Score Comparison'}</h3>
        <div style="display:flex;justify-content:center;gap:3rem;align-items:center;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-size:0.85rem;color:var(--text-secondary)">${currentLang === 'ar' ? 'قبل التحسين' : 'Before'}</div>
            <div class="ats-score-circle" style="--score-pct: ${report.currentScore}%;width:120px;height:120px;margin:0.5rem auto">
              <div class="ats-score-inner" style="width:95px;height:95px"><div class="ats-score-number" style="font-size:2rem">${report.currentScore}</div></div></div></div>
          <div style="font-size:2rem;color:var(--primary)">→</div>
          <div style="text-align:center"><div style="font-size:0.85rem;color:var(--text-secondary)">${currentLang === 'ar' ? 'بعد التحسين' : 'After'}</div>
            <div class="ats-score-circle" style="--score-pct: ${report.estimatedScore}%;width:120px;height:120px;margin:0.5rem auto;background:conic-gradient(#16a34a var(--score-pct), var(--gray-200) 0%)">
              <div class="ats-score-inner" style="width:95px;height:95px"><div class="ats-score-number" style="font-size:2rem;color:#16a34a">${report.estimatedScore}</div></div></div>
            ${report.boosted ? '<div style="background:#16a34a;color:white;padding:0.2rem 0.8rem;border-radius:20px;font-size:0.8rem">95%+ ✓</div>' : ''}</div></div>
        <p style="margin-top:1rem;color:var(--text-secondary)">${report.summary}</p></div>
      <div class="ats-tips" style="margin-top:1rem"><h3>${currentLang === 'ar' ? 'المهارات المقترحة' : 'Suggested Skills'} (${report.suggestedSkills.length})</h3>
        <div class="skill-tags" style="margin-top:0.75rem">${report.suggestedSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></div>
      <div class="ats-tips" style="margin-top:1rem"><h3>${currentLang === 'ar' ? 'خطوات التحسين' : 'Improvements'} (${report.improvements.length})</h3>
        ${report.improvements.map(imp => `<div class="tip-item"><div class="tip-icon">💡</div><div class="tip-content"><div class="tip-category">${imp.type}</div><div class="tip-text">${imp.tip}</div></div></div>`).join('')}</div>
      <div style="margin-top:1.5rem;text-align:center"><button class="btn btn-primary btn-lg" onclick="generateImprovedCV()">${currentLang === 'ar' ? 'توليد نسخة محسنة من السيرة الذاتية' : 'Generate Improved CV'}</button></div>
      <div id="improvedCVResult" style="margin-top:1rem"></div>`;
  } catch (err) { container.innerHTML = `<div class="analysis-placeholder">${err.message}</div>`; }
}
async function generateImprovedCV() {
  const container = document.getElementById('improvedCVResult');
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const result = await apiGenerateImprovedCV();
    container.innerHTML = `
      <div class="ats-result"><h3>✓ ${currentLang === 'ar' ? 'تم توليد النسخة المحسنة' : 'Improved CV Generated'}</h3>
        <p>${currentLang === 'ar' ? 'التقييم المتوقع' : 'Estimated Score'}: <strong style="color:#16a34a">${result.score}%</strong></p>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin:0.5rem 0">${result.skills.length} ${currentLang === 'ar' ? 'مهارة محسنة' : 'skills improved'}</p>
        <div class="skill-tags" style="justify-content:center;margin:1rem 0">${result.skills.slice(0, 20).map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
        <button class="btn btn-primary" onclick="downloadImprovedCV()">📥 PDF</button>
        <button class="btn btn-secondary" onclick="previewImprovedCV()">👁 HTML</button></div>`;
    sessionStorage.setItem('jobfinder_improved_html', result.html);
  } catch (err) { container.innerHTML = `<div class="analysis-placeholder">${err.message}</div>`; }
}
function previewImprovedCV() {
  const html = sessionStorage.getItem('jobfinder_improved_html');
  if (!html) return alert(currentLang === 'ar' ? 'لا توجد نسخة محسنة' : 'No improved CV');
  const win = window.open('', '_blank'); win.document.write(html); win.document.close();
}
function downloadImprovedCV() { window.open('/api/optimize/print', '_blank'); }

/* === ANALYTICS === */
async function loadAnalytics() {
  const container = document.getElementById('analyticsContent');
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const data = await apiGetAnalytics();
    if (data.total === 0) { container.innerHTML = `<div class="analysis-placeholder">${currentLang === 'ar' ? 'لا توجد بيانات تحليلية - أضف طلبات في متابعة الطلبات أولاً' : 'No analytics data - add applications first'}</div>`; return; }
    const ar = currentLang === 'ar';
    container.innerHTML = `
      <div class="analytics-grid">
        <div class="analytics-card"><div class="value">${data.total}</div><div class="label">${ar ? 'إجمالي الطلبات' : 'Total Apps'}</div></div>
        <div class="analytics-card"><div class="value">${data.uniqueCompanies}</div><div class="label">${ar ? 'شركات متنوعة' : 'Companies'}</div></div>
        <div class="analytics-card"><div class="value">${data.conversion.appliedToInterview}</div><div class="label">${ar ? 'تمت المقابلة' : 'Interviews'}</div></div>
        <div class="analytics-card"><div class="value">${data.conversion.acceptanceRate}%</div><div class="label">${ar ? 'معدل القبول' : 'Acceptance Rate'}</div></div>
      </div>
      <div class="ats-tips"><h4>${ar ? 'توزيع الحالات' : 'Status Distribution'}</h4>
        ${Object.entries(data.byStatus).filter(([k, v]) => v > 0).map(([k, v]) =>
          `<div class="ats-detail-row"><span>${k}</span><div style="display:flex;align-items:center;gap:8px;flex:1"><div class="ats-detail-bar"><div class="ats-detail-fill" style="width:${(v/data.total)*100}%"></div></div><span style="font-size:13px;color:var(--text-secondary)">${v}</span></div></div>`
        ).join('')}
      </div>
      ${data.monthlyTrend.length > 0 ? `<div class="ats-tips" style="margin-top:12px"><h4>${ar ? 'الاتجاه الشهري' : 'Monthly Trend'}</h4>
        <div class="monthly-chart">${data.monthlyTrend.map(m => {
          const h = Math.max(20, (m.count / Math.max(...data.monthlyTrend.map(x => x.count))) * 80);
          return `<div class="monthly-bar" style="height:${h}px"><div class="lbl">${m.month.substring(5)}</div></div>`;
        }).join('')}</div></div>` : ''}`;
  } catch (err) { container.innerHTML = `<div class="analysis-placeholder">${err.message}</div>`; }
  loadVerify();
}
async function loadVerify() {
  const container = document.getElementById('verifyResult');
  if (!container) return;
  try {
    const v = await apiVerifyPipeline();
    const scoreClass = v.score >= 80 ? 'good' : v.score >= 50 ? 'ok' : 'bad';
    container.innerHTML = `<div class="health-score ${scoreClass}">${v.score}/100</div>${v.issues.map(i => `<div class="verify-issue ${i.type}">${i.message}</div>`).join('')}`;
  } catch (e) { container.innerHTML = `<div class="analysis-placeholder">${e.message}</div>`; }
}

/* === INTERVIEW PREP (STAR+R) === */
async function loadStories() {
  const container = document.getElementById('storiesList');
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const stories = await apiGetStories();
    if (stories.length === 0) { container.innerHTML = `<div class="analysis-placeholder">${currentLang === 'ar' ? 'لا توجد قصص بعد - أضف قصتك الأولى' : 'No stories yet - add your first story'}</div>`; return; }
    container.innerHTML = stories.map(s => `
      <div class="story-card">
        <h4 style="margin-bottom:6px">${s.title}</h4>
        <div class="s"><span class="label">S - ${currentLang === 'ar' ? 'الموقف' : 'Situation'}:</span> ${s.situation}</div>
        <div class="s"><span class="label">T - ${currentLang === 'ar' ? 'المهمة' : 'Task'}:</span> ${s.task}</div>
        <div class="s"><span class="label">A - ${currentLang === 'ar' ? 'الإجراء' : 'Action'}:</span> ${s.action}</div>
        <div class="s"><span class="label">R - ${currentLang === 'ar' ? 'النتيجة' : 'Result'}:</span> ${s.result}</div>
        ${s.reflection ? `<div class="s"><span class="label">R - ${currentLang === 'ar' ? 'التفكر' : 'Reflection'}:</span> ${s.reflection}</div>` : ''}
        ${s.tags && s.tags.length > 0 ? `<div style="margin-top:6px">${s.tags.map(t => `<span class="skill-tag">${t}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');
  } catch (err) { container.innerHTML = `<div class="analysis-placeholder">${err.message}</div>`; }
}
function showStoryForm() { document.getElementById('storyForm').style.display = 'block'; }
function hideStoryForm() { document.getElementById('storyForm').style.display = 'none'; }
async function saveStory() {
  const story = { title: document.getElementById('stTitle').value, situation: document.getElementById('stSituation').value, task: document.getElementById('stTask').value, action: document.getElementById('stAction').value, result: document.getElementById('stResult').value, reflection: document.getElementById('stReflection').value, tags: document.getElementById('stTags').value.split(',').map(s => s.trim()).filter(Boolean) };
  if (!story.title || !story.situation) { alert(currentLang === 'ar' ? 'يرجى إدخال عنوان القصة والموقف' : 'Enter story title & situation'); return; }
  try { await apiAddStory(story); document.getElementById('stTitle').value = ''; document.getElementById('stSituation').value = ''; document.getElementById('stTask').value = ''; document.getElementById('stAction').value = ''; document.getElementById('stResult').value = ''; document.getElementById('stReflection').value = ''; document.getElementById('stTags').value = ''; hideStoryForm(); loadStories(); } catch (err) { alert(err.message); }
}

/* === SALARY RESEARCH === */
function createModal() {
  const box = document.createElement('div');
  box.setAttribute('data-modal', '1');
  box.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2000;display:flex;align-items:center;justify-content:center';
  box.addEventListener('click', function(e) { if (e.target === this) this.remove(); });
  return box;
}
async function showSalary(title) {
  const box = createModal();
  box.innerHTML = `<div style="background:var(--card-bg);padding:24px;border-radius:12px;min-width:300px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
    <h3 style="margin-bottom:12px">💰 ${currentLang === 'ar' ? 'تقدير الراتب' : 'Salary Estimate'}</h3>
    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">${title}</p>
    <div id="salaryResult" style="font-size:24px;font-weight:700;color:var(--primary);margin:12px 0">${currentLang === 'ar' ? 'جاري البحث...' : 'Searching...'}</div>
    <button class="btn btn-primary" onclick="document.querySelector('[data-modal]')?.remove()">${currentLang === 'ar' ? 'إغلاق' : 'Close'}</button>
  </div>`;
  document.body.appendChild(box);
  try {
    const s = await apiGetSalary(title);
    const minK = typeof s.min === 'object' ? (s.range || '').split('-')[0] : (s.min / 1000).toFixed(0);
    const maxK = typeof s.max === 'object' ? (s.range || '').split('-')[1] : (s.max / 1000).toFixed(0);
    const el = document.getElementById('salaryResult');
    if (el) el.textContent = `$${minK}k - $${maxK}k (${s.level})`;
  } catch (e) { const el = document.getElementById('salaryResult'); if (el) el.textContent = currentLang === 'ar' ? 'غير متاح' : 'N/A'; }
}

/* === COMPANY RESEARCH === */
async function showCompany(name) {
  if (companyCache[name]) return showCompanyPopup(name, companyCache[name]);
  const box = createModal();
  box.innerHTML = `<div style="background:var(--card-bg);padding:24px;border-radius:12px;min-width:350px;max-width:500px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
    <h3 style="margin-bottom:12px">🏢 ${name}</h3>
    <div id="companyResult" style="font-size:14px;color:var(--text-secondary);margin:12px 0">${currentLang === 'ar' ? 'جاري البحث...' : 'Searching...'}</div>
    <button class="btn btn-primary" onclick="document.querySelector('[data-modal]')?.remove()">${currentLang === 'ar' ? 'إغلاق' : 'Close'}</button>
  </div>`;
  document.body.appendChild(box);
  try {
    const c = await apiLookupCompany(name);
    companyCache[name] = c;
    box.remove();
    showCompanyPopup(name, c);
  } catch (e) { const el = document.getElementById('companyResult'); if (el) el.textContent = currentLang === 'ar' ? 'غير متاح' : 'N/A'; }
}
function showCompanyPopup(name, data) {
  const box = createModal();
  box.innerHTML = `<div style="background:var(--card-bg);padding:24px;border-radius:12px;min-width:350px;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
    <h3 style="margin-bottom:8px">🏢 ${name}</h3>
    ${data.found ? `<p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:8px">${data.extract}</p>${data.url ? `<a href="${data.url}" target="_blank" style="font-size:13px;color:var(--primary)">Wikipedia →</a>` : ''}` : `<p style="color:var(--text-secondary)">${currentLang === 'ar' ? 'لم يتم العثور على معلومات' : 'No info found'}</p>`}
    <div style="margin-top:12px;text-align:center"><button class="btn btn-primary" onclick="document.querySelector('[data-modal]')?.remove()">${currentLang === 'ar' ? 'إغلاق' : 'Close'}</button></div>
  </div>`;
  document.body.appendChild(box);
}

/* === COVER LETTER === */
async function generateCoverLetter(jobTitle, company) {
  const box = createModal();
  box.innerHTML = `<div style="background:var(--card-bg);padding:24px;border-radius:12px;min-width:400px;max-width:600px;max-height:80vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
    <h3 style="margin-bottom:12px">📝 ${currentLang === 'ar' ? 'خطاب التقديم' : 'Cover Letter'}</h3>
    <div id="clResult"><p style="color:var(--text-secondary)">${currentLang === 'ar' ? 'جاري التوليد...' : 'Generating...'}</p></div>
    <div style="margin-top:12px;text-align:center"><button class="btn btn-primary" onclick="document.querySelector('[data-modal]')?.remove()">${currentLang === 'ar' ? 'إغلاق' : 'Close'}</button></div>
  </div>`;
  document.body.appendChild(box);
  try {
    const letter = await apiGenerateCoverLetter({ title: jobTitle, company });
    const el = document.getElementById('clResult');
    if (el) {
      el.innerHTML = `<p style="font-weight:600;margin-bottom:8px">${letter.subject}</p>
        <pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.6;background:var(--bg);padding:12px;border-radius:8px;color:var(--text)">${letter.body}</pre>
        <button class="btn btn-sm btn-secondary" style="margin-top:8px" onclick="navigator.clipboard.writeText('${letter.subject}\n\n${letter.body.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/"/g, '&quot;')}')">📋 ${currentLang === 'ar' ? 'نسخ' : 'Copy'}</button>`;
    }
  } catch (e) { const el = document.getElementById('clResult'); if (el) el.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

/* === SUBSCRIPTION === */
async function loadSubscriptionInfo() {
  const badge = document.getElementById('subBadge');
  if (!badge) return;
  const token = localStorage.getItem('jf_token');
  if (!token) return;
  try {
    const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) return;
    const data = await res.json();
    const u = data.user;
    const end = new Date(u.subscriptionEnd);
    const now = new Date();
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    badge.style.display = 'inline-block';
    if (daysLeft > 20) {
      badge.style.background = '#16a34a';
      badge.textContent = '💎 ' + (currentLang === 'ar' ? `${daysLeft} يوم` : `${daysLeft} days`);
    } else if (daysLeft > 7) {
      badge.style.background = '#f59e0b';
      badge.textContent = '⚠️ ' + (currentLang === 'ar' ? `${daysLeft} يوم` : `${daysLeft} days left`);
    } else {
      badge.style.background = '#ef4444';
      badge.textContent = '🔴 ' + (currentLang === 'ar' ? `${daysLeft} يوم متبقي` : `${daysLeft} days left`);
    }
    if (daysLeft <= 3) {
      badge.title = currentLang === 'ar' ? 'جدد اشتراكك: +201220714614' : 'Renew: +201220714614';
    }
  } catch (e) {}
}

async function extendSubscription() {
  const email = prompt(currentLang === 'ar' ? 'أدخل البريد الإلكتروني للحساب:' : 'Enter account email:');
  if (!email) return;
  const days = prompt(currentLang === 'ar' ? 'عدد الأيام:' : 'Number of days:', '30');
  if (!days) return;
  try {
    const res = await fetch('/api/auth/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, days: parseInt(days), secret: prompt('المفتاح السري:') || '' })
    });
    const data = await res.json();
    alert(res.ok ? data.message : data.error);
  } catch (e) { alert(e.message); }
}

/* === ADS === */
/* Ad placements are inline in the HTML. For Google AdSense integration:
   1. Get approved at https://adsense.google.com
   2. Add your publisher ID below
   3. Uncomment and replace PUBLISHER_ID
   
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-PUBLISHER_ID" crossorigin="anonymous"></script>
   Then replace ad-placeholder divs with:
   <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-PUBLISHER_ID" data-ad-slot="SLOT_ID" data-ad-format="auto"></ins>
   <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
*/

/* === EXPORT === */
function exportCSV() { apiExportCSV(); }
function exportJSON() { apiExportJSON(); }

/* === NOTIFICATION === */
async function requestNotification() {
  if (!('Notification' in window)) { alert(currentLang === 'ar' ? 'المتصفح لا يدعم الإشعارات' : 'Browser does not support notifications'); return; }
  if (Notification.permission === 'granted') { new Notification('Job Finder', { body: currentLang === 'ar' ? 'الإشعارات مفعلة ✅' : 'Notifications enabled ✅' }); return; }
  if (Notification.permission === 'denied') { alert(currentLang === 'ar' ? 'الإشعارات مرفوضة من المتصفح' : 'Notifications blocked by browser'); return; }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') new Notification('Job Finder', { body: currentLang === 'ar' ? 'الإشعارات مفعلة ✅' : 'Notifications enabled ✅' });
}

/* === LIVENESS CHECK === */
async function checkJobURL(url) {
  if (!url) return;
  const box = createModal();
  box.innerHTML = `<div style="background:var(--card-bg);padding:24px;border-radius:12px;min-width:300px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
    <h3 style="margin-bottom:12px">🔗 ${currentLang === 'ar' ? 'فحص الرابط' : 'URL Check'}</h3>
    <div id="livenessResult" style="margin:12px 0">${currentLang === 'ar' ? 'جاري الفحص...' : 'Checking...'}</div>
    <button class="btn btn-primary" onclick="document.querySelector('[data-modal]')?.remove()">${currentLang === 'ar' ? 'إغلاق' : 'Close'}</button>
  </div>`;
  document.body.appendChild(box);
  try {
    const r = await apiCheckLiveness(url);
    const icon = r.alive ? '✅' : '❌';
    const txt = r.alive ? (currentLang === 'ar' ? 'الرابط نشط' : 'Active') : (currentLang === 'ar' ? 'الرابط غير نشط' : 'Dead') + ` (${r.note || ''})`;
    document.getElementById('livenessResult').innerHTML = `<span style="font-size:32px">${icon}</span><p>${txt}</p>`;
  } catch (e) { document.getElementById('livenessResult').textContent = `⚠️ ${e.message}`; }
}
