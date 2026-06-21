function generateCoverLetter(cvData, job) {
  const name = cvData.name || 'Applicant';
  const skills = (cvData.skills || []).slice(0, 8).join(', ');
  const jobTitle = job.title || 'the role';
  const company = job.company || 'your company';
  const exp = ((cvData.experience || {}).entries || []).slice(0, 2);
  const edu = (cvData.education || []).slice(0, 2);

  return {
    subject: `Application for ${jobTitle} at ${company}`,
    body: `Dear Hiring Manager at ${company},

I am writing to express my strong interest in the ${jobTitle} position at ${company}. With my background in ${skills}, I am confident that I can bring value to your team.

${exp.length > 0 ? `In my previous roles:\n${exp.map(e => '• ' + e).join('\n')}` : ''}

${edu.length > 0 ? `My educational background includes:\n${edu.map(e => '• ' + e).join('\n')}` : ''}

I am excited about the opportunity to contribute to ${company} and would welcome the chance to discuss how my skills align with your needs. Thank you for your time and consideration.

Best regards,
${name}`
  };
}

module.exports = { generateCoverLetter };
