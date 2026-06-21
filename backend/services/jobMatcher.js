const axios = require('axios');
const cheerio = require('cheerio');

function computeMatch(cvData, job) {
  let score = 0;
  const matched = [];
  const missing = [];

  const cvSkills = (cvData.skills || []).map(s => s.toLowerCase().trim());
  const jobTitle = (job.title || '').toLowerCase();
  const jobDesc = (job.description || job.summary || '').toLowerCase();
  const jobText = `${jobTitle} ${jobDesc}`;

  const cvRaw = ((cvData.summary || '') + ' ' + ((cvData.experience || {}).entries || []).join(' ')).toLowerCase();
  const domainTerms = ['automation', 'plc', 'scada', 'embedded', 'mechatronics', 'industrial',
    'control', 'iot', 'robotics', 'electrical', 'instrumentation', 'production',
    'manufacturing', 'maintenance', 'flutter', 'mobile', 'engineer', 'developer',
    'software', 'hardware', 'firmware', 'sensors', 'actuators', 'network',
    'devops', 'cloud', 'machine learning', 'python', 'javascript',
    'control panel', 'production line', 'troubleshooting', 'mechanical'];

  const cvDomainTerms = domainTerms.filter(t => {
    const pattern = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    return pattern.test(cvRaw);
  });

  const matchedSkills = cvSkills.filter(s => jobText.includes(s));
  if (matchedSkills.length > 0) {
    const skillPts = Math.min(Math.round((matchedSkills.length / Math.max(cvSkills.length, 1)) * 35), 35);
    score += skillPts;
    matched.push(...matchedSkills);
  }

  if (cvDomainTerms.length > 0) {
    const domainMatches = cvDomainTerms.filter(t => jobTitle.includes(t) || jobDesc.includes(t));
    if (domainMatches.length > 0) {
      const domainPts = Math.min(Math.round((domainMatches.length / Math.max(cvDomainTerms.length, 1)) * 25), 25);
      score += domainPts;
      matched.push(...domainMatches.slice(0, 5));
    } else {
      score += 5;
    }
  } else {
    const broadMatches = ['engineer', 'developer', 'manager', 'analyst', 'specialist',
      'automation', 'control', 'software', 'data', 'designer', 'consultant',
      'architect', 'scientist', 'lead', 'director', 'product', 'project'].filter(k => jobTitle.includes(k));
    if (broadMatches.length > 0) {
      score += Math.min(broadMatches.length * 5, 20);
      matched.push(...broadMatches);
    }
  }

  const expEntries = (cvData.experience || {}).entries || [];
  const expYears = (cvData.experience || {}).years || [];
  if (expEntries.length > 0) {
    if (expEntries.length >= 4) score += 12;
    else if (expEntries.length >= 2) score += 9;
    else score += 6;
    matched.push('خبرة');
    if (expYears.length >= 2) {
      const diff = parseInt(expYears[expYears.length - 1]) - parseInt(expYears[0]);
      if (diff >= 3) score += 3;
    }
  }

  const eduEntries = cvData.education || [];
  const eduText = eduEntries.join(' ').toLowerCase();
  const hasRelevantDegree = /bachelor|master|b\.?sc|m\.?sc|مهندس|بكالوريوس|ماجستير/.test(eduText);
  if (eduEntries.length > 0) {
    if (hasRelevantDegree) {
      score += 13;
      matched.push('مؤهل مناسب');
    } else score += 6;
  }

  const descWords = jobDesc.split(/\s+/).filter(w => w).length;
  if (descWords > 30) score += Math.min(5, Math.round(descWords / 100));
  if (jobTitle.length > 5) score += 2;

  return {
    score: Math.min(Math.round(score), 100),
    matchedKeywords: [...new Set(matched)].slice(0, 15),
    missingRequirements: [...new Set(missing)]
  };
}

async function searchJobsDirect(query, location, source) {
  const jobs = [];
  const q = (query || '').toLowerCase();

  const seenTitles = new Set();
  function isDuplicate(title) {
    const key = title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s]/g, '').trim();
    if (seenTitles.has(key)) return true;
    seenTitles.add(key);
    return false;
  }

  function addJob(job) {
    if (!isDuplicate(job.title)) jobs.push(job);
  }

  if (source === 'all' || source === 'remoteok') {
    try {
      const res = await axios.get('https://remoteok.com/api', { timeout: 15000 });
      if (Array.isArray(res.data)) {
        const titleMatches = [];
        const descMatches = [];
        for (let i = 1; i < res.data.length; i++) {
          const job = res.data[i];
          const title = (job.position || '').trim();
          const desc = (job.description || '').replace(/<[^>]+>/g, '');
          const titleLower = title.toLowerCase();
          if (titleMatch(titleLower, q)) {
            titleMatches.push(formatRemoteOK(job));
          } else if (desc.toLowerCase().includes(q)) {
            descMatches.push(formatRemoteOK(job));
          }
        }
        titleMatches.forEach(addJob);
        descMatches.forEach(addJob);
      }
    } catch (e) {
      console.error('RemoteOK error:', e.message);
    }
  }

  if (source === 'all' || source === 'weworkremotely') {
    try {
      const res = await axios.get('https://weworkremotely.com/categories/remote-programming-jobs', {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const $ = cheerio.load(res.data);
      const items = $('li.job, li:has(.tooltip--flag-logo), .jobs-container > li, ul.jobs > li, article, .job-list > div, tr.job');
      items.slice(0, 100).each((i, el) => {
        const title = $(el).find('.title, h2, h3, a[href*="/remote-jobs/"], .job-title, .position').first().text().trim()
          || $(el).attr('data-job-title') || $(el).find('a').first().text().trim();
        const company = $(el).find('.company, .name, .company-name, span.company').first().text().trim()
          || $(el).find('.listing-header-container a').first().text().trim();
        const link = $(el).find('a').attr('href') || '';
        const desc = $(el).text().trim().substring(0, 500);
        if (title && titleMatch(title, q)) {
          addJob({
            id: `wwr-${i}`,
            title,
            company: company || '',
            url: link.startsWith('http') ? link : `https://weworkremotely.com${link}`,
            source: 'weworkremotely',
            summary: desc.substring(0, 300),
            location: 'Remote',
            date: ''
          });
        }
      });
    } catch (e) {
      console.error('WWR error:', e.message);
    }
  }

  if (source === 'all' || source === 'indeed') {
    const indeedJobs = await searchIndeed(q, location);
    indeedJobs.forEach(addJob);
  }

  if (source === 'all' || source === 'googlejobs') {
    const googleJobs = await searchGoogleJobs(q, location);
    googleJobs.forEach(addJob);
  }

  if (source === 'all' || source === 'glassdoor') {
    const gdJobs = await searchGlassdoor(q, location);
    gdJobs.forEach(addJob);
  }

  if (source === 'all' || source === 'remotive') {
    try {
      const res = await axios.get('https://remotive.com/api/remote-jobs', { timeout: 10000 });
      if (res.data && res.data.jobs) {
        const rtMatch = [];
        const rdMatch = [];
        for (const job of res.data.jobs) {
          const t = (job.title || '');
          if (titleMatch(t, q)) {
            rtMatch.push(formatRemotive(job));
          } else {
            const desc = (job.description || '').toLowerCase().replace(/<[^>]+>/g, '');
            if (desc.includes(q)) rdMatch.push(formatRemotive(job));
          }
        }
        rtMatch.forEach(addJob);
        rdMatch.forEach(addJob);
      }
    } catch (e) {}
  }

  if (source === 'all' || source === 'jobicy') {
    try {
      const res = await axios.get('https://jobicy.com/api/v2/remote-jobs?count=50', { timeout: 10000 });
      if (res.data && res.data.jobs) {
        const jtMatch = [];
        const jdMatch = [];
        for (const job of res.data.jobs) {
          const t = (job.jobTitle || '');
          if (titleMatch(t, q)) {
            jtMatch.push(formatJobicy(job));
          } else {
            const desc = (job.jobDescription || '').toLowerCase().replace(/<[^>]+>/g, '');
            if (desc.includes(q)) jdMatch.push(formatJobicy(job));
          }
        }
        jtMatch.forEach(addJob);
        jdMatch.forEach(addJob);
      }
    } catch (e) {}
  }

  if (source === 'all' || source === 'linkedin') {
    const linkedInJobs = await searchLinkedIn(q, location);
    linkedInJobs.forEach(addJob);
  }

  return jobs;
}

function titleMatch(title, query) {
  if (!query) return true;
  return title.toLowerCase().includes(query);
}

function formatRemoteOK(job) {
  const desc = (job.description || '').replace(/<[^>]+>/g, '').substring(0, 300);
  return {
    id: `remoteok-${job.id || Math.random().toString(36).substr(2, 9)}`,
    title: job.position || '',
    company: job.company || '',
    url: job.apply_url || job.url || '',
    source: 'remoteok',
    summary: desc,
    location: job.location || 'Remote',
    date: job.date || ''
  };
}

function formatRemotive(job) {
  return {
    id: `remotive-${job.id || Math.random().toString(36).substr(2, 9)}`,
    title: job.title || '',
    company: job.company_name || '',
    url: job.url || job.apply_url || '',
    source: 'remotive',
    summary: (job.description || '').replace(/<[^>]+>/g, '').substring(0, 400),
    location: job.candidate_required_location || 'Remote',
    date: job.publication_date || ''
  };
}

function formatJobicy(job) {
  return {
    id: `jobicy-${job.id || Math.random().toString(36).substr(2, 9)}`,
    title: job.jobTitle || '',
    company: job.companyName || '',
    url: job.url || job.applyUrl || `https://jobicy.com/jobs/${job.id}`,
    source: 'jobicy',
    summary: (job.jobDescription || '').replace(/<[^>]+>/g, '').substring(0, 400),
    location: job.jobGeo || 'Remote',
    date: job.pubDate || ''
  };
}

async function searchGoogleJobs(query, location) {
  const jobs = [];
  try {
    const q = `${encodeURIComponent(query)} ${encodeURIComponent(location || '')} jobs`;
    const url = `https://www.google.com/search?q=${q}&ibp=htl;jobs`;
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(res.data);
    $('div[data-jk], .i0jTy, .Fp1jN, .job-card, .vNEEBe').slice(0, 20).each((i, el) => {
      const title = $(el).find('div[role="heading"], h3, h2, .jobTitle').first().text().trim()
        || $(el).attr('aria-label') || $('h3', el).first().text().trim();
      const company = $(el).find('.vNEEBe, .WsMG1c, .company, .companyName').first().text().trim()
        || $(el).find('[itemprop="name"]').text().trim();
      const snippet = $(el).find('.HBvz6, .YgLbBe, .job-snippet, .summary').text().trim() || '';
      const loc = $(el).find('.Qk80J, .K5hUy, .location, .companyLocation').text().trim() || location;
      if (title) {
        jobs.push({
          id: `google-${i}`,
          title,
          company: company || '',
          url: `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + company)}`,
          source: 'googlejobs',
          summary: snippet,
          location: loc,
          date: ''
        });
      }
    });
  } catch (e) {}
  return jobs;
}

async function searchGlassdoor(query, location) {
  const jobs = [];
  try {
    const url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(query)}&locT=&locId=&locKeyword=${encodeURIComponent(location || '')}`;
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(res.data);
    $('li[data-test="jobListing"], .jobListing, .react-job-listing, [class*="jobListing"], tr[class*="job"]').slice(0, 15).each((i, el) => {
      const title = $(el).find('a.jobLink, [data-test="job-title"], .job-title, a[href*="/partner/joblisting"]').first().text().trim()
        || $(el).find('a').first().text().trim();
      const company = $(el).find('[data-test="employer-name"], .employer-name, .company').first().text().trim() || '';
      const loc = $(el).find('[data-test="location"], .location, .loc').first().text().trim() || location || '';
      const link = $(el).find('a.jobLink, a[href*="/partner/joblisting"], a').first().attr('href') || '';
      if (title) {
        jobs.push({
          id: `glassdoor-${i}`,
          title,
          company,
          url: link.startsWith('http') ? link : `https://www.glassdoor.com${link}`,
          source: 'glassdoor',
          summary: '',
          location: loc,
          date: ''
        });
      }
    });
  } catch (e) {}
  return jobs;
}

async function searchIndeed(query, location) {
  const jobs = [];
  try {
    const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location || '')}`;
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(res.data);
    $('.job_seen_beacon, .card, .job-card, .jobsearch-SerpJobCard, .result, [data-testid*="job"], .jobListItem, .clickcard').slice(0, 20).each((i, el) => {
      const title = $(el).find('.jobTitle, .title, h2, h3, a[data-jk]').first().text().trim()
        || $(el).find('[class*="title"] a').first().text().trim() || $(el).find('a').first().text().trim();
      const company = $(el).find('.companyName, .company, .employer, [class*="company"]').first().text().trim() || '';
      const snippet = $(el).find('.job-snippet, .summary, .description, [class*="snippet"]').first().text().trim().substring(0, 300) || '';
      const loc = $(el).find('.companyLocation, .location, [class*="location"]').first().text().trim() || location || '';
      const link = $(el).find('a.jcs-JobTitle, a[data-jk], a').first().attr('href') || '';
      if (title) {
        jobs.push({
          id: `indeed-${i}`,
          title,
          company,
          url: link.startsWith('http') ? link : `https://www.indeed.com${link}`,
          source: 'indeed',
          summary: snippet,
          location: loc,
          date: ''
        });
      }
    });
  } catch (e) {}
  return jobs;
}

async function searchLinkedIn(query, location) {
  const jobs = [];
  try {
    const q = encodeURIComponent(query);
    const loc = encodeURIComponent(location || '');
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${q}&location=${loc}&start=0`;
    const res = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.linkedin.com/jobs/'
      }
    });
    const $ = cheerio.load(res.data);
    $('li, .job-search-card, [data-job-id], .base-card').slice(0, 25).each((i, el) => {
      const title = $(el).find('.base-search-card__title, h3, [class*="title"]').first().text().trim()
        || $(el).attr('data-job-title') || $(el).find('a').first().text().trim();
      const company = $(el).find('.base-search-card__subtitle, h4, [class*="subtitle"], [class*="company"]').first().text().trim() || '';
      const link = $(el).find('a.base-card__full-link, a[href*="/jobs/view"], a').first().attr('href') || '';
      const loc = $(el).find('.job-search-card__location, [class*="location"]').first().text().trim() || location || '';
      const snippet = $(el).find('.base-search-card__snippet, [class*="snippet"]').first().text().trim() || '';
      if (title && title.length > 3) {
        jobs.push({
          id: `linkedin-${i}-${Date.now()}`,
          title,
          company,
          url: link || `https://www.linkedin.com/jobs/search/?keywords=${q}`,
          source: 'linkedin',
          summary: snippet || '',
          location: loc,
          date: ''
        });
      }
    });
  } catch (e) {}
  return jobs;
}

function matchesQuery(title, company, description, query) {
  if (!query) return true;
  const text = `${title} ${company} ${description}`.toLowerCase();
  const terms = query.split(/\s+/).filter(t => t.length > 1);
  return terms.every(t => text.includes(t));
}

async function searchJobs(cvData, query, location, source) {
  const searchQuery = query || (cvData.skills || []).slice(0, 3).join(' ');
  const jobs = await searchJobsDirect(searchQuery, location, source);
  return jobs;
}

function matchJobs(cvData, jobs) {
  return jobs.map(job => {
    const match = computeMatch(cvData, job);
    return { ...job, match };
  }).sort((a, b) => b.match.score - a.match.score);
}

module.exports = { searchJobs, matchJobs, searchJobsDirect };
