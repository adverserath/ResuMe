'use strict';

const { marked } = require('marked');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function md(s) {
  if (s == null || s === '') return '';
  return marked.parse(String(s));
}

function mdInline(s) {
  if (s == null || s === '') return '';
  return marked.parseInline(String(s));
}

function formatDate(d) {
  if (!d) return '';
  return String(d).split('-')[0];
}

function dateRange(start, end) {
  const s = formatDate(start);
  const e = end ? formatDate(end) : 'Present';
  if (!s && !e) return '';
  if (!s) return e;
  if (s === e) return s;
  return `${s} – ${e}`;
}

const NETWORK_ICONS = {
  linkedin: '💼',
  github: '🐙',
  twitter: '🐦',
  x: '🐦',
  mastodon: '🐘',
  bluesky: '🦋',
  youtube: '📺',
  stackoverflow: '📚',
  website: '🌐',
};

function networkIcon(network) {
  return NETWORK_ICONS[String(network || '').toLowerCase()] || '🔗';
}

function renderHeader(basics) {
  if (!basics) return '';

  const profiles = (basics.profiles || []).map(p => {
    const display = p.url
      ? p.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
      : (p.username || p.network || '');
    const link = p.url ? `<a href="${esc(p.url)}">${esc(display)}</a>` : esc(display);
    return `${networkIcon(p.network)} ${link}`;
  });

  if (basics.email) profiles.unshift(`✉️ <a href="mailto:${esc(basics.email)}">${esc(basics.email)}</a>`);

  const loc = basics.location;
  const locationStr = loc
    ? `📍 ${esc([loc.city, loc.region, loc.countryCode].filter(Boolean).join(', '))}`
    : '';

  const contact = [locationStr, profiles.join(' &nbsp;·&nbsp; ')].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const photo = basics.image
    ? `<img src="${esc(basics.image)}" alt="${esc(basics.name || '')}">`
    : `<div class="cv-photo__placeholder">
      <svg class="cv-photo__icon" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
      </svg>
      Add photo
    </div>`;

  return `<div class="cv-header">
  <div class="cv-header__text">
    <h1>${esc(basics.name || '')}</h1>
    <p class="cv-tagline">${esc(basics.label || '')}</p>
    <p class="cv-contact">${contact}</p>
  </div>
  <div class="cv-photo">${photo}</div>
</div>`;
}

function renderAbout(basics) {
  if (!basics || !basics.summary) return '';
  return `<h2>About</h2>\n${md(basics.summary)}`;
}

function renderCustomMarkdown(title, value) {
  if (!value) return '';
  return `<h2>${esc(title)}</h2>\n${md(value)}`;
}

function renderFunFacts(facts) {
  if (!Array.isArray(facts) || !facts.length) return '';
  const items = facts.map(f => `<li>${mdInline(f)}</li>`).join('');
  return `<h2>Fun Facts</h2>\n<ul>${items}</ul>`;
}

function renderWork(work) {
  if (!Array.isArray(work) || !work.length) return '';
  const items = work.map(job => {
    const company = job.url
      ? `<a href="${esc(job.url)}">${esc(job.name || job.company || '')}</a>`
      : esc(job.name || job.company || '');
    const title = `${esc(job.position || '')} — ${company}`;
    const range = dateRange(job.startDate, job.endDate);
    const summary = job.summary ? md(job.summary) : '';
    const highlights = Array.isArray(job.highlights) && job.highlights.length
      ? `<ul>${job.highlights.map(h => `<li>${mdInline(h)}</li>`).join('')}</ul>`
      : '';
    return `<h3>${title}</h3>\n<p><strong>${range}</strong></p>\n${summary}${highlights}`;
  }).join('\n');
  return `<h2>Experience</h2>\n${items}`;
}

function renderEducation(edu, note) {
  if (!Array.isArray(edu) || !edu.length) return '';
  const rows = edu.map(e => {
    const degree = [e.studyType, e.area].filter(Boolean).map(esc).join(' ');
    return `<tr><td>${degree}</td><td>${esc(e.institution || '')}</td><td>${esc(e.score || '')}</td><td>${dateRange(e.startDate, e.endDate)}</td></tr>`;
  }).join('');
  const noteBlock = note ? `\n<p class="cv-note">${mdInline(note)}</p>` : '';
  return `<h2>Education</h2>
<table>
  <thead><tr><th>Degree</th><th>Institution</th><th>Result</th><th>Year</th></tr></thead>
  <tbody>${rows}</tbody>
</table>${noteBlock}`;
}

function renderSkills(skills) {
  if (!Array.isArray(skills) || !skills.length) return '';
  const rows = skills.map(s => {
    const kws = Array.isArray(s.keywords)
      ? s.keywords.map(esc).join(' &nbsp;·&nbsp; ')
      : '';
    return `<tr><td>${esc(s.name || '')}</td><td>${kws}</td></tr>`;
  }).join('');
  return `<h2>Technical Skills</h2>\n<table class="cv-skills-table">${rows}</table>`;
}

function renderProjects(projects) {
  if (!Array.isArray(projects) || !projects.length) return '';
  const cards = projects.map(p => {
    const tags = Array.isArray(p.keywords)
      ? p.keywords.map(k => `<span class="cv-tag">${esc(k)}</span>`).join('')
      : '';
    const name = p.url
      ? `<a href="${esc(p.url)}">${esc(p.name || '')}</a>`
      : esc(p.name || '');
    const image = p.image ? `<img class="cv-project__image" src="${esc(p.image)}" alt="${esc(p.name || '')}">` : '';
    return `<div class="cv-project">
      ${image}
      <h4>${name}</h4>
      <p>${esc(p.description || '')}</p>
      <div class="cv-tags">${tags}</div>
    </div>`;
  }).join('');
  return `<h2>Projects &amp; Interests</h2>\n<div class="cv-projects-grid">${cards}</div>`;
}

function renderVolunteer(vol) {
  if (!Array.isArray(vol) || !vol.length) return '';
  const items = vol.map(v => {
    const title = `${esc(v.position || '')} — ${esc(v.organization || '')}`;
    const range = dateRange(v.startDate, v.endDate);
    const summary = v.summary ? md(v.summary) : '';
    const highlights = Array.isArray(v.highlights) && v.highlights.length
      ? `<ul>${v.highlights.map(h => `<li>${mdInline(h)}</li>`).join('')}</ul>`
      : '';
    return `<h3>${title}</h3>\n<p><strong>${range}</strong></p>\n${summary}${highlights}`;
  }).join('\n');
  return `<h2>Leadership</h2>\n${items}`;
}

function render(data) {
  if (!data || typeof data !== 'object') return '';
  const sections = [
    renderHeader(data.basics),
    renderAbout(data.basics),
    renderCustomMarkdown('Professional Summary', data.x_professionalSummary),
    renderWork(data.work),
    renderVolunteer(data.volunteer),
    renderEducation(data.education, data.x_educationNote),
    renderSkills(data.skills),
    renderProjects(data.projects),
    renderCustomMarkdown('Philosophy', data.x_philosophy),
    renderFunFacts(data.x_funFacts),
  ].filter(Boolean);

  return sections.join('\n<hr>\n');
}

module.exports = { render };
