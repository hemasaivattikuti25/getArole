/**
 * Shared utility functions for resume manipulation and ATS text generation.
 */
(function() {
  'use strict';

  window.generateRawResumeText = function(prof, rV2 = null) {
    const p = prof || {};
    const R = rV2 || JSON.parse(localStorage.getItem('getarole_resume_v2') || '{}');
    const lines = [];

    const name = p.name || (R.header && R.header.name) || 'Candidate';
    const headline = p.headline || (R.header && R.header.title) || '';
    const email = p.email || (R.header && R.header.email) || '';
    const phone = p.phone || (R.header && R.header.phone) || '';
    const loc = p.loc || (R.header && R.header.location) || '';

    lines.push(`NAME: ${name}`);
    if (headline) lines.push(`HEADLINE: ${headline}`);
    if (email) lines.push(`EMAIL: ${email}`);
    if (phone) lines.push(`PHONE: ${phone}`);
    if (loc) lines.push(`LOCATION: ${loc}`);

    const summary = p.summary || (R.summary && (R.summary.text || R.summary)) || '';
    if (summary) lines.push(`\nSUMMARY:\n${summary}`);

    const langs = (Array.isArray(p.skills_languages) && p.skills_languages.length) ? p.skills_languages : [];
    const frames = (Array.isArray(p.skills_frameworks) && p.skills_frameworks.length) ? p.skills_frameworks : [];
    const cloud = (Array.isArray(p.skills_cloud) && p.skills_cloud.length) ? p.skills_cloud : [];
    const tools = (Array.isArray(p.skills_tools) && p.skills_tools.length) ? p.skills_tools : [];

    if (langs.length || frames.length || cloud.length || tools.length) {
      lines.push('\nSKILLS & COMPETENCIES:');
      if (langs.length) lines.push(`- Languages: ${langs.join(', ')}`);
      if (frames.length) lines.push(`- Frameworks & Libraries: ${frames.join(', ')}`);
      if (cloud.length) lines.push(`- Cloud, DevOps & Databases: ${cloud.join(', ')}`);
      if (tools.length) lines.push(`- Tools & Platforms: ${tools.join(', ')}`);
    } else if (Array.isArray(p.skills) && p.skills.length) {
      lines.push(`\nSKILLS: ${p.skills.join(', ')}`);
    }

    const exp = (Array.isArray(p.experience) && p.experience.length) ? p.experience : (Array.isArray(R.experience) ? R.experience : []);
    if (exp.length) {
      lines.push('\nWORK EXPERIENCE:');
      exp.forEach(e => {
        const title = e.title || 'Role';
        const comp = e.company || 'Company';
        const dates = e.dates || `${e.start || e.start_year || ''} - ${e.end || e.end_year || 'Present'}`;
        const locStr = e.location ? ` | ${e.location}` : '';
        lines.push(`- ${title} at ${comp} (${dates}${locStr})`);
        const bullets = Array.isArray(e.bullets) ? e.bullets : (e.desc ? e.desc.split('\n').filter(Boolean) : []);
        bullets.forEach(b => {
          lines.push(`  • ${String(b).replace(/^[•\-*\s]+/, '').trim()}`);
        });
      });
    }

    const edu = (Array.isArray(p.education) && p.education.length) ? p.education : (Array.isArray(R.education) ? R.education : []);
    if (edu.length) {
      lines.push('\nEDUCATION:');
      edu.forEach(ed => {
        const deg = ed.degree || 'Degree';
        const sch = ed.school || 'University';
        const yr = ed.year || ed.dates || '';
        const gr = ed.grade ? ` (GPA/Grade: ${ed.grade})` : '';
        lines.push(`- ${deg} - ${sch} (${yr})${gr}`);
        if (ed.coursework) lines.push(`  Coursework: ${ed.coursework}`);
      });
    }

    const proj = (Array.isArray(p.projects) && p.projects.length) ? p.projects : (Array.isArray(R.projects) ? R.projects : []);
    if (proj.length) {
      lines.push('\nPROJECTS:');
      proj.forEach(pr => {
        const pTitle = pr.title || pr.name || 'Project';
        const stack = Array.isArray(pr.tags) ? pr.tags.join(', ') : (pr.stack || '');
        lines.push(`- ${pTitle}${stack ? ` [${stack}]` : ''}`);
        if (pr.demo) lines.push(`  Demo: ${pr.demo}`);
        if (pr.github) lines.push(`  GitHub: ${pr.github}`);
        const pBullets = Array.isArray(pr.bullets) ? pr.bullets : (pr.desc ? pr.desc.split('\n').filter(Boolean) : []);
        pBullets.forEach(b => {
          lines.push(`  • ${String(b).replace(/^[•\-*\s]+/, '').trim()}`);
        });
      });
    }

    const certs = (Array.isArray(p.certifications) && p.certifications.length) ? p.certifications : (Array.isArray(R.certifications) ? R.certifications : []);
    if (certs.length) {
      lines.push('\nCERTIFICATIONS:');
      certs.forEach(c => {
        const cName = typeof c === 'string' ? c : (c.name || c.title || '');
        const cOrg = c.issuer || c.org ? ` - ${c.issuer || c.org}` : '';
        const cDate = c.date || c.year ? ` (${c.date || c.year})` : '';
        lines.push(`- ${cName}${cOrg}${cDate}`);
      });
    }

    return lines.join('\n');
  };
})();
