const atsOptimizer = require('./atsOptimizer');

function normalizeTextForATS(text) {
  if (!text) return '';
  const replacements = {
    '\u2013': '-', '\u2014': '-', '\u2015': '-',
    '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"',
    '\u2022': '-', '\u2023': '-', '\u25B8': '>', '\u25E6': '-',
    '\u2043': '-', '\u00AB': '"', '\u00BB': '"',
    '\u200B': '', '\u200C': '', '\u200D': '', '\uFEFF': '',
    '\u2192': '->', '\u2190': '<-', '\u2191': '^', '\u2193': 'v',
    '\u20AC': 'EUR', '\u00A3': 'GBP', '\u00A5': 'JPY', '\u00A9': '(c)', '\u00AE': '(r)',
    '\u2026': '...', '\u201A': ',', '\u201E': ',,',
    '\u2039': '<', '\u203A': '>',
  };
  let result = text;
  for (const [from, to] of Object.entries(replacements)) {
    result = result.replace(new RegExp(from, 'g'), to);
  }
  return result;
}

function generatePrintHTML(cvData) {
  const result = atsOptimizer.generateImprovedCV(cvData);
  const originalHtml = result.html;

  // Wrap with print-optimized layout
  const normalizedName = normalizeTextForATS(cvData.name || 'Optimized');
  const normalizedEmails = normalizeTextForATS((cvData.emails || []).join(' | '));
  const normalizedPhones = normalizeTextForATS((cvData.phones || []).join(' | '));
  const normalizedBody = normalizeTextForATS(extractBody(originalHtml));

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CV - ${normalizedName}</title>
<style>
  @page {
    size: A4;
    margin: 1.2cm 1.5cm;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Segoe UI', 'Arial', 'Tahoma', sans-serif;
    color: #1e293b;
    line-height: 1.5;
    background: #f1f5f9;
    padding: 20px;
  }

  .print-container {
    max-width: 21cm;
    margin: 0 auto;
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    border-radius: 0;
    overflow: hidden;
  }

  .header {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: white;
    padding: 28px 32px;
  }

  .header h1 {
    font-size: 22pt;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
  }

  .contact-line {
    font-size: 9pt;
    opacity: 0.9;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
  }

  .contact-line span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .body-content {
    padding: 20px 32px 25px;
  }

  .section {
    margin-bottom: 14px;
  }

  .section-title {
    font-size: 12pt;
    font-weight: 700;
    color: #1e40af;
    border-bottom: 2px solid #dbeafe;
    padding-bottom: 4px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-title .badge {
    font-size: 7pt;
    background: #16a34a;
    color: white;
    padding: 1px 8px;
    border-radius: 10px;
    font-weight: 600;
  }

  .entry {
    margin-bottom: 6px;
    padding: 3px 0;
  }

  .entry p {
    font-size: 9.5pt;
    color: #334155;
    line-height: 1.6;
  }

  .entry.added {
    background: #f0fdf4;
    border-right: 3px solid #16a34a;
    padding: 8px 10px;
    border-radius: 4px;
    margin-top: 8px;
  }

  .entry.added p, .entry.added li {
    color: #166534;
    font-size: 9pt;
  }

  .entry.added strong {
    color: #15803d;
  }

  ul {
    padding-right: 20px;
    margin: 4px 0;
  }

  li {
    margin-bottom: 3px;
    font-size: 9.5pt;
    line-height: 1.5;
  }

  .skills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }

  .skill-tag {
    background: #dbeafe;
    color: #1e40af;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 8.5pt;
    font-weight: 500;
  }

  .skill-tag.new {
    background: #16a34a;
    color: white;
  }

  .footer-note {
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    font-size: 7pt;
    color: #94a3b8;
    text-align: center;
  }

  .no-print {
    text-align: center;
    margin-bottom: 16px;
  }

  .no-print button {
    background: #2563eb;
    color: white;
    border: none;
    padding: 10px 30px;
    font-size: 11pt;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .no-print button:hover {
    background: #1d4ed8;
  }
</style>
</head>
<body>

<div class="no-print" style="margin-bottom:16px">
  <button onclick="window.print()">🖨️ حفظ كـ PDF / طباعة</button>
  <p style="margin-top:6px;font-size:9pt;color:#64748b">اضغط الزر ثم اختر "Save as PDF" من قائمة الطباعة</p>
</div>

<div class="print-container">
  <div class="header">
    <h1>${normalizedName}</h1>
    <div class="contact-line">
      <span>✉ ${normalizedEmails}</span>
      ${normalizedPhones ? `<span>📞 ${normalizedPhones}</span>` : ''}
    </div>
  </div>

  <div class="body-content">
    ${normalizedBody}
  </div>
</div>

<div class="footer-note" style="margin-top:10px;background:white;padding:8px;max-width:21cm;margin-left:auto;margin-right:auto;border-radius:0 0 8px 8px">
  تم تحسين هذه السيرة لأنظمة ATS - التقييم المتوقع: ${result.score}% - ${new Date().toLocaleDateString('ar-EG')}
</div>

</body>
</html>`;
}

function extractBody(fullHtml) {
  const match = fullHtml.match(/<body>([\s\S]*)<\/body>/i);
  if (match) return match[1];
  return fullHtml;
}

module.exports = { generatePrintHTML };
