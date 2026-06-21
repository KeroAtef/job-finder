const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const SKILLS_DB = [
  'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'c', 'php', 'ruby', 'go', 'rust',
  'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'asp.net',
  'html', 'css', 'sass', 'tailwind', 'bootstrap',
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'jenkins', 'ci/cd',
  'git', 'github', 'linux', 'nginx', 'apache',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
  'data analysis', 'data science', 'power bi', 'tableau', 'excel',
  'agile', 'scrum', 'jira', 'confluence',
  'communication', 'leadership', 'teamwork', 'problem solving', 'project management',
  'flutter', 'dart', 'swift', 'kotlin', 'react native',
  'rest api', 'restful', 'graphql', 'grpc', 'websocket',
  'ui/ux', 'figma', 'photoshop', 'illustrator',
  'selenium', 'jest', 'mocha', 'cypress', 'unit testing', 'tdd',
  'plc', 'scada', 'hmi', 'pid', 'vfd', 'servo', 'stepper', 'encoder',
  'control panel', 'control system', 'industrial automation', 'process control',
  'sensors', 'actuators', 'transducers', 'pneumatic', 'hydraulic',
  'embedded system', 'embedded', 'microcontroller', 'microcontroller',
  'arduino', 'raspberry pi', 'fpga', 'rtos', 'firmware',
  'matlab', 'simulink', 'labview', 'autocad', 'solidworks', 'eplan',
  'electrical', 'electronics', 'circuit', 'pcb', 'schematic',
  'production line', 'manufacturing', 'maintenance', 'troubleshooting',
  'automation', 'robotics', 'mechatronics', 'iot', 'industry 4.0',
  'mobile', 'android', 'ios', 'cross-platform',
  'firebase', 'supabase', 'api', 'rest', 'soap', 'microservice',
  'oop', 'data structure', 'algorithm', 'design pattern',
  'networking', 'tcp/ip', 'modbus', 'profinet', 'ethercat', 'can bus',
  'raspberry', 'sensor', 'actuator', 'control', 'network', 'integration'
];

const COMMON_SECTIONS = [
  'experience', 'work experience', 'professional experience',
  'education', 'academic background',
  'skills', 'technical skills', 'core competencies',
  'projects', 'personal projects',
  'certifications', 'certificates',
  'languages', 'languages & skills',
  'summary', 'profile', 'about me',
  'achievements', 'accomplishments',
  'publications', 'research',
  'volunteering', 'volunteer experience',
  'interests', 'hobbies',
  'references'
];

async function parse(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    return buffer.toString('utf-8');
  }
}

function extractText(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const clean = lines.map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 0);
  return clean.join('\n');
}

function detectSections(text) {
  const lines = text.split('\n');
  const sections = {};
  let currentSection = 'general';

  for (const line of lines) {
    const lower = line.trim().toLowerCase();
    const matched = COMMON_SECTIONS.find(s => lower.includes(s) && lower.length < 50);
    if (matched) {
      currentSection = matched;
      sections[currentSection] = [];
    } else if (sections[currentSection]) {
      sections[currentSection].push(line.trim());
    }
  }

  return sections;
}

function extractSkills(text) {
  const lower = text.toLowerCase();
  const found = SKILLS_DB.filter(skill => {
    const escaped = skill.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}(?:s|es|ing|ed)?\\b`, 'i');
    return pattern.test(lower);
  });
  return [...new Set(found)];
}

function extractEmails(text) {
  const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(pattern) || [];
}

function extractPhones(text) {
  const pattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  return text.match(pattern) || [];
}

function extractLinks(text) {
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  return urls.map(u => u.replace(/[.,;:!?]+$/, ''));
}

function extractNames(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > 0) return lines[0].trim();
  return '';
}

function extractEducation(text) {
  const eduKeywords = [
    'bachelor', 'master', 'phd', 'doctorate', 'b.sc', 'm.sc', 'b.a', 'm.a',
    'degree', 'university', 'college', 'institute', 'school',
    'بكالوريوس', 'ماجستير', 'دكتوراه', 'جامعة', 'كلية', 'معهد'
  ];
  const lower = text.toLowerCase();
  const lines = text.split('\n');
  const eduLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (eduKeywords.some(k => line.includes(k))) {
      const entry = [lines[i].trim()];
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (lines[j].trim() && /^\d{4}/.test(lines[j])) {
          entry.push(lines[j].trim());
        }
      }
      eduLines.push(entry.join(' - '));
    }
  }
  return eduLines;
}

function extractExperience(text) {
  const expKeywords = [
    'experience', 'work', 'employment', 'job', 'career', 'position', 'role',
    'خبرات', 'خبرة', 'عمل', 'وظيفة'
  ];
  const years = text.match(/\b(19|20)\d{2}\b/g) || [];
  const uniqueYears = [...new Set(years)].sort();
  const lines = text.split('\n');
  const expLines = [];
  let inSection = false;

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase().trim();
    if (expKeywords.some(k => lower.includes(k)) && lower.length < 30) {
      inSection = true;
      continue;
    }
    if (inSection) {
      const sectionEnd = COMMON_SECTIONS.some(s => lower.includes(s) && lower.length < 40);
      if (sectionEnd && expLines.length > 0) break;
      if (lines[i].trim()) {
        expLines.push(lines[i].trim());
      }
    }
  }

  return { years: uniqueYears, entries: expLines.slice(0, 20) };
}

function analyze(text) {
  const cleanText = extractText(text);
  const sections = detectSections(cleanText);
  const skills = extractSkills(cleanText);
  const emails = extractEmails(cleanText);
  const phones = extractPhones(cleanText);
  const links = extractLinks(cleanText);
  const name = extractNames(cleanText);
  const education = extractEducation(cleanText);
  const experience = extractExperience(cleanText);
  const wordCount = cleanText.split(/\s+/).length;

  return {
    name,
    emails,
    phones,
    links,
    skills,
    education,
    experience,
    sections: Object.keys(sections),
    wordCount,
    summary: cleanText.substring(0, 500)
  };
}

module.exports = { parse, analyze };
