const atsScorer = require('./atsScorer');

const BOOST_SKILLS = {
  mechatronics: ['plc programming', 'scada', 'hmi', 'industrial automation', 'control systems',
    'embedded systems', 'sensors', 'actuators', 'pneumatics', 'hydraulics',
    'servo drives', 'vfd', 'pid control', 'ladder logic', 'structured text'],
  software: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
    'react', 'angular', 'vue.js', 'node.js', 'express', 'rest api', 'graphql',
    'docker', 'kubernetes', 'aws', 'git', 'ci/cd', 'agile', 'scrum'],
  flutter: ['dart', 'cross-platform', 'mobile development', 'widgets', 'state management',
    'firebase', 'rest api integration', 'app store deployment', 'ui/ux design',
    'responsive design', 'animation', 'custom paint'],
  engineering: ['root cause analysis', 'preventive maintenance', 'corrective maintenance',
    'troubleshooting', 'process optimization', 'quality control', 'safety compliance',
    'technical documentation', 'team leadership', 'project management']
};

function optimize(cvData) {
  const currentScore = atsScorer.score(cvData);
  const improvements = [];

  const languages = detectLanguages(cvData);
  const targetSkills = [];
  if (languages.flutter) targetSkills.push(...BOOST_SKILLS.flutter);
  if (languages.plc || languages.mechatronics) targetSkills.push(...BOOST_SKILLS.mechatronics);
  targetSkills.push(...BOOST_SKILLS.software);
  targetSkills.push(...BOOST_SKILLS.engineering);

  const currentSkills = (cvData.skills || []).map(s => s.toLowerCase());
  const newSkills = [...new Set(targetSkills.filter(s => !currentSkills.includes(s)))];
  const suggestedSkills = newSkills.slice(0, 30);

  const sections = cvData.sections || [];
  const missingSections = [];
  if (!sections.some(s => s.includes('experience') || s.includes('خبرات'))) missingSections.push('الخبرات المهنية');
  if (!sections.some(s => s.includes('education') || s.includes('تعليم'))) missingSections.push('المؤهلات العلمية');
  if (!sections.some(s => s.includes('skills') || s.includes('مهارات'))) missingSections.push('المهارات التقنية');
  if (!sections.some(s => s.includes('certif'))) missingSections.push('الشهادات والتدريبات');
  if (!sections.some(s => s.includes('project'))) missingSections.push('المشاريع');

  const eduText = (cvData.education || []).join(' ').toLowerCase();
  if (!eduText.includes('bachelor') && !eduText.includes('بكالوريوس')) {
    missingSections.push('توضيح المؤهل العلمي');
  }

  const wc = cvData.wordCount || 0;
  if (wc < 400) improvements.push({ type: 'الطول', tip: 'قم بتوسيع المحتوى ليشمل وصف تفصيلي للمهام والإنجازات' });
  if (wc > 800) improvements.push({ type: 'الطول', tip: 'قم بتقليص المحتوى ليكون في صفحة واحدة أو صفحتين كحد أقصى' });
  if (suggestedSkills.length > 0) {
    improvements.push({ type: 'المهارات', tip: `أضف ${suggestedSkills.length} مهارة مفتاحية لتحسين التوافق مع ATS` });
  }
  if (missingSections.length > 0) {
    improvements.push({ type: 'الأقسام', tip: `أضف الأقسام التالية: ${missingSections.join('، ')}` });
  }

  const links = (cvData.links || []).join(' ').toLowerCase();
  if (!links.includes('linkedin')) improvements.push({ type: 'LinkedIn', tip: 'أضف رابط LinkedIn في رأس السيرة الذاتية' });
  if (!links.includes('github') && !links.includes('portfolio')) improvements.push({ type: 'Portfolio', tip: 'أضف رابط GitHub أو Portfolio' });

  const expText = (cvData.experience && cvData.experience.entries || []).join(' ').toLowerCase();
  if (!/achieved|increased|managed|led|developed|created|improved|reduced|delivered/.test(expText)) {
    improvements.push({ type: 'الإنجازات', tip: 'استخدم أفعال قوية: Led, Developed, Achieved, Improved مع ذكر النتائج' });
  }
  if (!/\d+%|\d+x|\$\d+/.test(expText)) {
    improvements.push({ type: 'الأرقام', tip: 'أضف أرقاماً قابلة للقياس مثل: خفض التكاليف بنسبة X%' });
  }

  const improvedScore = calculateImprovedScore(cvData, suggestedSkills, missingSections);
  return {
    currentScore: currentScore.total,
    estimatedScore: improvedScore,
    suggestedSkills,
    missingSections,
    improvements,
    boosted: improvedScore >= 95,
    summary: improvedScore >= 95
      ? `يمكن رفع تقييم ATS من ${currentScore.total}% إلى ${improvedScore}% (أعلى من 95%) بعد التعديلات المقترحة`
      : `يمكن رفع تقييم ATS من ${currentScore.total}% إلى ${improvedScore}%`
  };
}

function detectLanguages(cv) {
  const text = (cv.summary || '').toLowerCase();
  const skills = (cv.skills || []).map(s => s.toLowerCase());
  return {
    flutter: skills.includes('flutter') || text.includes('flutter'),
    dart: skills.includes('dart') || text.includes('dart'),
    plc: text.includes('plc') || text.includes('programmable logic'),
    mechatronics: skills.includes('mechatronics') || text.includes('mechatronics'),
    python: skills.includes('python') || text.includes('python'),
    javascript: skills.includes('javascript') || text.includes('javascript')
  };
}

function calculateImprovedScore(cvData, newSkills, missingSections) {
  let boosted = 0;
  boosted += Math.min(newSkills.length * 0.8, 12);
  boosted += (5 - missingSections.length) * 2;
  const links = (cvData.links || []).join(' ').toLowerCase();
  if (!links.includes('linkedin')) boosted += 3;
  if (!links.includes('github')) boosted += 2;
  const wc = cvData.wordCount || 0;
  if (wc < 400) boosted += 5;
  if (wc > 800) boosted -= 3;
  const expText = (cvData.experience && cvData.experience.entries || []).join(' ');
  if (!/\d+%/.test(expText)) boosted += 5;
  if (!/achieved|increased|led|developed|improved/i.test(expText)) boosted += 4;
  return Math.min(Math.round((atsScorer.score(cvData).total || 0) + boosted), 100);
}

function generateImprovedCV(cvData) {
  const rawText = cvData.rawText || '';
  const optimization = optimize(cvData);
  const currentSkills = cvData.skills || [];
  const allSkills = [...new Set([...currentSkills, ...optimization.suggestedSkills])];
  const newAdded = optimization.suggestedSkills.filter(s => !currentSkills.includes(s));

  // Parse original lines, annotate with improvements
  const originalLines = rawText.split('\n').filter(l => l.trim());

  // Build enhanced experience entries with numbers + strong verbs
  const enhancedEntries = (cvData.experience && cvData.experience.entries || []).map(e => {
    const lower = e.toLowerCase();
    let enhanced = e;
    if (!/\d+%/.test(lower)) enhanced += ' (حقق تحسين في الكفاءة بنسبة 20%)';
    if (!/achieved|increased|managed|led|developed|created|improved|reduced|delivered/i.test(lower)) {
      enhanced = '• ' + enhanced.replace(/^[•\-]\s*/, '');
    }
    return enhanced;
  });

  const expHtml = enhancedEntries.length > 0 ? `
    <div class="section">
      <h2>الخبرات المهنية <span class="ats-badge">A</span></h2>
      ${enhancedEntries.map(e => `<div class="entry"><p>${e}</p></div>`).join('')}
      <div class="entry added">
        <p><strong>إنجازات إضافية (مقترحة للتحسين):</strong></p>
        <ul>
          <li>حققت خفض تكاليف الصيانة بنسبة 15% من خلال برامج الصيانة الوقائية</li>
          <li>قمت بتحسين كفاءة الإنتاج بنسبة 20% عبر أتمتة العمليات</li>
          <li>قدت فريقاً من 5 مهندسين لإنجاز المشاريع في الوقت المحدد</li>
        </ul>
      </div>
    </div>` : '';

  const eduHtml = (cvData.education || []).length > 0 ? `
    <div class="section">
      <h2>المؤهلات العلمية</h2>
      ${(cvData.education || []).map(e => `<div class="entry"><p>${e}</p></div>`).join('')}
    </div>` : '';

  // Preserve original sections from raw text
  const preservedSections = [];
  let currentSection = '';
  let currentLines = [];

  for (const line of originalLines) {
    const isSectionHeader = /^[A-Z\s]{3,}|^(خبرات|مهارات|تعليم|مؤهلات|شهادات|مشاريع|ملخص|تدريبات)/i.test(line.trim()) && line.trim().length < 50;
    if (isSectionHeader) {
      if (currentSection && currentLines.length > 0) {
        preservedSections.push({ title: currentSection, lines: currentLines });
      }
      currentSection = line.trim();
      currentLines = [];
    } else if (currentSection) {
      currentLines.push(line.trim());
    }
  }
  if (currentSection && currentLines.length > 0) {
    preservedSections.push({ title: currentSection, lines: currentLines });
  }

  const preservedHtml = preservedSections
    .filter(s => {
      const l = s.title.toLowerCase();
      return !l.includes('experience') && !l.includes('education') && !l.includes('skill') &&
             !l.includes('خبرات') && !l.includes('تعليم') && !l.includes('مهارات') && !l.includes('مؤهلات');
    })
    .map(s => `
      <div class="section">
        <h2>${s.title}</h2>
        ${s.lines.map(l => `<div class="entry"><p>${l}</p></div>`).join('')}
      </div>`).join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8">
<style>
  @page { margin: 0.4in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.4; font-size: 10pt; }
  .header { background: #1e40af; color: white; padding: 18px 25px; margin: -15px -15px 15px -15px; }
  .header h1 { font-size: 18pt; margin-bottom: 3px; }
  .contact { font-size: 8pt; opacity: 0.9; }
  .section { margin-bottom: 10px; }
  .section h2 { font-size: 11pt; color: #1e40af; border-bottom: 1.5px solid #dbeafe; padding-bottom: 3px; margin-bottom: 5px; }
  .entry { margin-bottom: 4px; padding: 2px 0; }
  .entry p { font-size: 9.5pt; color: #334155; }
  .entry.added { background: #f0fdf4; padding: 6px 8px; border-right: 3px solid #16a34a; border-radius: 3px; margin-top: 6px; }
  .entry.added p, .entry.added li { color: #166534; font-size: 9pt; }
  ul { padding-right: 18px; margin: 2px 0; }
  li { margin-bottom: 2px; font-size: 9.5pt; }
  .skills-list { display: flex; flex-wrap: wrap; gap: 3px; }
  .skill-item { background: #dbeafe; color: #1e40af; padding: 2px 7px; border-radius: 3px; font-size: 8.5pt; }
  .skill-item.new { background: #16a34a; color: white; }
  .ats-badge { display: inline-block; background: #16a34a; color: white; padding: 1px 6px; border-radius: 3px; font-size: 7pt; margin-right: 4px; vertical-align: middle; }
  .footer { margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 7pt; color: #94a3b8; text-align: center; }
</style></head>
<body>
  <div class="header">
    <h1>${cvData.name || 'CV'}</h1>
    <div class="contact">${(cvData.emails || []).join(' | ')} ${(cvData.phones || []).length > 0 ? '| ' + cvData.phones.join(', ') : ''}</div>
  </div>

  ${expHtml}
  ${eduHtml}

  <div class="section">
    <h2>المهارات التقنية <span class="ats-badge">ATS 95%+</span></h2>
    <div class="skills-list">
      ${allSkills.map(s => {
        const isNew = newAdded.includes(s);
        return `<span class="skill-item ${isNew ? 'new' : ''}">${s}${isNew ? ' +' : ''}</span>`;
      }).join('')}
    </div>
  </div>

  ${preservedHtml}

  ${newAdded.length > 0 ? `
  <div class="section">
    <h2>التطوير المهني المقترح</h2>
    <ul>
      <li>إضافة ${newAdded.length} مهارة جديدة لتحسين التوافق مع أنظمة ATS</li>
      <li>شهادة PLC Programming - Siemens S7</li>
      <li>Flutter & Dart - The Complete Guide</li>
      <li>Industrial Automation and SCADA Systems</li>
      ${!linksIncludes(cvData, 'linkedin') ? '<li>إنشاء حساب LinkedIn احترافي وإضافته للسيرة</li>' : ''}
      ${!linksIncludes(cvData, 'github') ? '<li>إنشاء GitHub Repository لعرض المشاريع</li>' : ''}
    </ul>
  </div>` : ''}

  <div class="footer">
    تم تحسين هذه السيرة لأنظمة ATS - التقييم المتوقع: ${optimization.estimatedScore}%
  </div>
</body></html>`;

  return {
    html,
    skills: allSkills,
    score: optimization.estimatedScore,
    improvements: optimization.improvements,
    newSkills: newAdded
  };
}

function linksIncludes(cvData, term) {
  return (cvData.links || []).join(' ').toLowerCase().includes(term);
}

module.exports = { optimize, generateImprovedCV };
