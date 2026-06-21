const ATS_WEIGHTS = {
  keywords: 25,
  format: 10,
  contact: 10,
  education: 15,
  experience: 25,
  achievements: 10,
  length: 5,
  sections: 5
};

function score(cvData) {
  const details = {};

  details.keywords = { score: scoreKeywords(cvData), max: ATS_WEIGHTS.keywords, label: 'الكلمات المفتاحية' };
  details.format = { score: scoreFormat(cvData), max: ATS_WEIGHTS.format, label: 'التنسيق والتنظيم' };
  details.contact = { score: scoreContact(cvData), max: ATS_WEIGHTS.contact, label: 'معلومات الاتصال' };
  details.education = { score: scoreEducation(cvData), max: ATS_WEIGHTS.education, label: 'المؤهلات العلمية' };
  details.experience = { score: scoreExperience(cvData), max: ATS_WEIGHTS.experience, label: 'الخبرات' };
  details.achievements = { score: scoreAchievements(cvData), max: ATS_WEIGHTS.achievements, label: 'الإنجازات المقاسة' };
  details.length = { score: scoreLength(cvData), max: ATS_WEIGHTS.length, label: 'حجم السيرة الذاتية' };
  details.sections = { score: scoreSections(cvData), max: ATS_WEIGHTS.sections, label: 'الأقسام' };

  let total = 0;
  Object.values(details).forEach(d => total += d.score);
  const maxTotal = Object.values(ATS_WEIGHTS).reduce((a, b) => a + b, 0);
  const percentage = Math.round((total / maxTotal) * 100);

  return {
    total: percentage,
    maxScore: 100,
    grade: getGrade(percentage),
    details,
    summary: getSummary(percentage)
  };
}

function scoreKeywords(cv) {
  const count = (cv.skills || []).length;
  const text = ((cv.summary || '') + ' ' + ((cv.experience || {}).entries || []).join(' ')).toLowerCase();
  const techTerms = ['flutter', 'dart', 'python', 'javascript', 'java', 'c++', 'c#', 'react',
    'angular', 'vue', 'node', 'express', 'sql', 'mysql', 'postgresql', 'mongodb', 'docker',
    'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'linux', 'api', 'rest', 'graphql',
    'html', 'css', 'php', 'typescript', 'firebase', 'tensorflow', 'pytorch', 'plc', 'scada',
    'iot', 'embedded', 'autocad', 'solidworks', 'matlab', 'labview', 'raspberry', 'arduino',
    'opencv', 'nlp', 'machine learning', 'deep learning', 'data science', 'devops', 'agile',
    'scrum', 'jira', 'jenkins', 'selenium', 'test', 'qa', 'ui/ux', 'figma', 'bootstrap',
    'tailwind', 'redux', 'webpack', 'android', 'ios', 'swift', 'kotlin', 'go', 'rust'];
  let extraCount = 0;
  for (const term of techTerms) {
    if (text.includes(term)) extraCount++;
  }
  const k = count + extraCount;
  if (k >= 25) return 25;
  if (k >= 20) return 23;
  if (k >= 15) return 21;
  if (k >= 10) return 18;
  if (k >= 8) return 16;
  if (k >= 6) return 16;
  if (k >= 4) return 14;
  if (k >= 2) return 9;
  return 3;
}

function scoreFormat(cv) {
  let score = 5;
  const text = (cv.summary || '');
  const sections = cv.sections || [];
  if (sections.length >= 4) score += 2;
  else if (sections.length >= 2) score += 1;
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > 25) score += 2;
  else if (lines.length > 10) score += 1;
  if (text.length > 300) score += 1;
  return Math.min(score, 10);
}

function scoreContact(cv) {
  let score = 3;
  if (cv.emails && cv.emails.length > 0) score += 3;
  if (cv.phones && cv.phones.length > 0) score += 2;
  if (cv.name && cv.name.length > 1) score += 1;
  if (cv.links && cv.links.length > 0) {
    const links = cv.links.join(' ').toLowerCase();
    if (links.includes('linkedin')) score += 2;
  }
  return Math.min(score, 10);
}

function scoreEducation(cv) {
  const edu = cv.education || [];
  if (edu.length === 0) return 6;
  let score = 9;
  const text = edu.join(' ').toLowerCase();
  if (/bachelor|بكالوريوس|b\.?s|b\.?a/.test(text)) score += 4;
  if (/\d{4}/.test(text)) score += 1;
  if (text.length > 20) score += 1;
  return Math.min(score, 15);
}

function scoreExperience(cv) {
  const exp = cv.experience || {};
  const years = exp.years || [];
  const entries = exp.entries || [];
  if (entries.length === 0) return 8;
  let score = 12;
  if (entries.length >= 5) score += 5;
  else if (entries.length >= 3) score += 3;
  else if (entries.length >= 2) score += 2;
  if (years.length >= 2) {
    const diff = parseInt(years[years.length - 1]) - parseInt(years[0]);
    if (diff >= 8) score += 4;
    else if (diff >= 5) score += 3;
    else if (diff >= 3) score += 2;
    else score += 1;
  }
  const text = entries.join(' ').toLowerCase();
  const verbs = ['developed', 'managed', 'led', 'created', 'improved', 'designed',
    'implemented', 'built', 'achieved', 'delivered', 'optimized'];
  const found = verbs.filter(v => text.includes(v));
  if (found.length >= 4) score += 4;
  else if (found.length >= 2) score += 2;
  else if (found.length >= 1) score += 1;
  return Math.min(score, 25);
}

function scoreAchievements(cv) {
  const entries = ((cv.experience || {}).entries || []).join(' ') + ' ' + (cv.summary || '');
  let score = 4;
  if (/\d+/.test(entries)) score += 2;
  if (/\d+%/.test(entries)) score += 2;
  if (/[\$€£]/.test(entries)) score += 1;
  const words = ['increased', 'reduced', 'improved', 'delivered', 'managed',
    'led', 'developed', 'created', 'achieved', 'saved', 'launched'];
  const found = words.filter(w => entries.toLowerCase().includes(w));
  if (found.length >= 4) score += 3;
  else if (found.length >= 2) score += 2;
  else if (found.length >= 1) score += 1;
  if (((cv.experience || {}).years || []).length >= 4) score += 1;
  return Math.min(score, 10);
}

function scoreLength(cv) {
  const wc = cv.wordCount || 0;
  if (wc >= 350 && wc <= 1000) return 5;
  if (wc >= 250 && wc <= 1500) return 4;
  if (wc >= 150 && wc <= 2000) return 3;
  if (wc >= 80) return 2;
  return 1;
}

function scoreSections(cv) {
  const sections = cv.sections || [];
  const required = ['experience', 'education', 'skills'];
  const found = required.filter(r => sections.some(s => s.toLowerCase().includes(r)));
  let score = 2;
  score += found.length;
  if (sections.some(s => s.toLowerCase().includes('certif'))) score += 1;
  if (sections.some(s => s.toLowerCase().includes('project'))) score += 1;
  if (sections.some(s => s.toLowerCase().includes('language'))) score += 1;
  return Math.min(score, 5);
}

function getGrade(percentage) {
  if (percentage >= 85) return 'A - ممتاز';
  if (percentage >= 70) return 'B - جيد جدا';
  if (percentage >= 55) return 'C - جيد';
  if (percentage >= 40) return 'D - مقبول';
  return 'F - يحتاج تحسين';
}

function getSummary(percentage) {
  if (percentage >= 85) return 'سيرتك الذاتية ممتازة وتتوافق مع معايير ATS';
  if (percentage >= 70) return 'سيرتك الذاتية جيدة جدا مع بعض فرص التحسين';
  if (percentage >= 55) return 'سيرتك الذاتية جيدة ولكن تحتاج تحسينات في عدة مجالات';
  if (percentage >= 40) return 'سيرتك الذاتية تحتاج تحسينات جوهرية لتتوافق مع ATS';
  return 'سيرتك الذاتية تحتاج إعادة صياغة كبيرة لتتوافق مع معايير ATS';
}

function getImprovements(cvData) {
  const tips = [];
  const result = score(cvData);
  const details = result.details;

  if (details.keywords.score < 15) {
    tips.push({ category: 'الكلمات المفتاحية', tip: 'أضف المزيد من المهارات التقنية المرتبطة بمجال عملك. حاول استخدام كلمات مفتاحية من الوصف الوظيفي.' });
  }
  if (details.contact.score < 7) {
    tips.push({ category: 'معلومات الاتصال', tip: 'تأكد من وجود بريد إلكتروني ورقم هاتف ورابط LinkedIn في أعلى السيرة.' });
  }
  if (details.education.score < 10) {
    tips.push({ category: 'المؤهلات العلمية', tip: 'أضف تفاصيل أكثر عن مؤهلاتك العلمية بما في ذلك السنة والتخصص.' });
  }
  if (details.experience.score < 16) {
    tips.push({ category: 'الخبرات', tip: 'استخدم أفعال قوية (Achieved, Led, Managed, Developed) وحدد النتائج بالأرقام.' });
  }
  if (details.achievements.score < 5) {
    tips.push({ category: 'الإنجازات المقاسة', tip: 'أضف أرقاماً قابلة للقياس مثل: زادت المبيعات بنسبة X%، خفض التكاليف بنسبة Y%.' });
  }
  if (details.length.score < 3) {
    tips.push({ category: 'حجم السيرة', tip: 'حافظ على سيرة ذاتية من صفحة إلى صفحتين بحجم خط مناسب.' });
  }
  if (details.sections.score < 3) {
    tips.push({ category: 'الأقسام', tip: 'تأكد من وجود أقسام أساسية: الخبرات، التعليم، المهارات، الشهادات.' });
  }

  const text = (cvData.summary || '').toLowerCase();
  if (!text.includes('linkedin')) {
    tips.push({ category: 'LinkedIn', tip: 'أضف رابط ملفك الشخصي على LinkedIn.' });
  }

  return tips;
}

module.exports = { score, getImprovements };
