require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer-core');
const rateLimit = require('express-rate-limit');
const jsonresume = require('./jsonresume');

const app = express();
const PORT = process.env.PORT || 3000;
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const THEMES = ['github', 'minimal', 'dark'];
const JSON_RESUME_PATH = path.join(__dirname, 'resume.json');
const MARKDOWN_PATH = path.join(__dirname, 'cv.md');

function loadMeta() {
  if (fs.existsSync(JSON_RESUME_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(JSON_RESUME_PATH, 'utf8'));
      return data.meta || {};
    } catch (_) {}
  }
  return {};
}

function applyModeFilter(html, forPdf) {
  if (forPdf) {
    return html.replace(/<!--\s*web-only\s*-->[\s\S]*?<!--\s*\/web-only\s*-->/g, '');
  }
  return html.replace(/<!--\s*print-only\s*-->[\s\S]*?<!--\s*\/print-only\s*-->/g, '');
}

marked.setOptions({ gfm: true, breaks: false });

app.use('/themes', express.static(path.join(__dirname, 'themes')));
app.use('/public', express.static(path.join(__dirname, 'public')));

const puppeteerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests — please try again in a few minutes.',
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    'User-agent: *\nAllow: /\n\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n\nUser-agent: SemrushBot\nDisallow: /\n'
  );
});

function readCss(name) {
  return fs.readFileSync(path.join(__dirname, 'themes', `${name}.css`), 'utf8');
}

function getSectionSlug(content) {
  const m = content.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, '').trim()
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function filterSections(wrappedHtml, excludeSlugs) {
  if (!excludeSlugs.length) return wrappedHtml;
  const re = /<section class="cv-section">([\s\S]*?)<\/section>/g;
  const parts = [];
  let m;
  while ((m = re.exec(wrappedHtml)) !== null) {
    if (!excludeSlugs.includes(getSectionSlug(m[1]))) parts.push(m[0]);
  }
  return parts.join('\n');
}

function buildHtml(markdownHtml, theme, { forPdf = false, meta = {} } = {}) {
  const styleBlock = forPdf
    ? `<style>${readCss('base')}</style>\n  <style>${readCss(theme)}</style>`
    : `<link rel="stylesheet" href="/themes/base.css">\n  <link rel="stylesheet" href="/themes/${theme}.css">`;

  const pdfStyles = forPdf ? `
  <style>
    body { background: #fff !important; }
    .markdown-body {
      font-size: 11.5px;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    .markdown-body h1 { font-size: 1.6em; }
    .markdown-body h2 { font-size: 1.2em; margin-top: 0; margin-bottom: 10px; }
    .markdown-body h3 { font-size: 1.05em; margin-top: 8px; margin-bottom: 4px; }
    .markdown-body h2, .markdown-body h3 { break-after: avoid; page-break-after: avoid; }
    .markdown-body table { display: table; overflow: visible; width: 100%; }
    .markdown-body p { margin-bottom: 8px; }
    .markdown-body ul { margin-bottom: 8px; }
    .cv-section {
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 0 0 12px 0 !important;
      margin-bottom: 0 !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .cv-section:first-child { padding: 0 0 12px 0 !important; }
    .cv-section + .cv-section {
      border-top: 1px solid #d0d7de !important;
      padding-top: 12px !important;
    }
    .cv-project { page-break-inside: avoid; break-inside: avoid; }
  </style>` : '';

  const controls = forPdf ? '' : `
    <div class="cv-controls">
      <div class="cv-controls__left">
        <label for="theme-select">Theme:</label>
        <select id="theme-select" onchange="location.href='?theme='+this.value">
          ${THEMES.map(t => `<option value="${t}"${t === theme ? ' selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('\n          ')}
        </select>
      </div>
      <a href="/download?theme=${theme}" class="cv-controls__download">&#8595; Download PDF</a>
    </div>`;

  const controlsCss = forPdf ? '' : '<link rel="stylesheet" href="/public/controls.css">';
  const appScript = forPdf ? '' : '<script src="/public/app.js"></script>';
  const bodyAttr = forPdf ? ' class="pdf-mode"' : '';
  const footer = forPdf ? '' : `
  <footer class="cv-footer">
    Built with <a href="https://github.com/adverserath/ResuMe" target="_blank" rel="noopener">ResuMe</a> — self-hosted CV platform
    &nbsp;·&nbsp;
    <a href="https://buymeacoffee.com/adverserath" target="_blank" rel="noopener">☕ Buy me a coffee</a>
  </footer>`;

  const ogMeta = forPdf ? '' : `
  <meta property="og:type" content="profile">
  <meta property="og:image" content="/og-image">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="/og-image">`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ResuMe — Self-hosted CV</title>
  <link rel="icon" type="image/svg+xml" href="/public/favicon.svg">${ogMeta}
  ${styleBlock}${pdfStyles}
  ${controlsCss}
</head>
<body${bodyAttr}>
  ${controls}
  <main class="markdown-body">
    ${markdownHtml}
  </main>
  ${appScript}
  ${footer}
</body>
</html>`;
}

function resolvedTheme(query) {
  if (THEMES.includes(query)) return query;
  const meta = loadMeta();
  return THEMES.includes(meta.theme) ? meta.theme : 'github';
}

function wrapSections(html) {
  const parts = html
    .split(/<hr\s*\/?>/)
    .map(s => s.trim())
    .filter(Boolean);
  if (!parts.length) return `<section class="cv-section">${html}</section>`;
  return parts.map(s => `<section class="cv-section">${s}</section>`).join('\n');
}

function loadCvHtml() {
  if (fs.existsSync(JSON_RESUME_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(JSON_RESUME_PATH, 'utf8'));
      return jsonresume.render(data);
    } catch (err) {
      console.error('Failed to parse resume.json, falling back to cv.md:', err.message);
    }
  }
  const md = fs.readFileSync(MARKDOWN_PATH, 'utf8');
  return marked.parse(md);
}

app.get('/', (req, res) => {
  const theme = resolvedTheme(req.query.theme);
  const html = applyModeFilter(wrapSections(loadCvHtml()), false);
  res.send(buildHtml(html, theme));
});

app.get('/download', puppeteerLimiter, async (req, res) => {
  const theme = resolvedTheme(req.query.theme);
  const meta = loadMeta();
  const filename = meta.pdfFilename || 'cv.pdf';
  const exclude = req.query.exclude ? req.query.exclude.split(',').filter(Boolean) : [];
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1131 });
    let html = applyModeFilter(wrapSections(loadCvHtml()), true);
    if (exclude.length) html = filterSections(html, exclude);
    await page.setContent(buildHtml(html, theme, { forPdf: true }), {
      waitUntil: 'domcontentloaded',
    });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
      printBackground: true,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).send('PDF generation failed. Is Chromium available at ' + CHROMIUM_PATH + '?');
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/timeline', (req, res) => {
  const theme = resolvedTheme(req.query.theme);
  const html = applyModeFilter(wrapSections(loadCvHtml()), false);
  // Inject timeline=on into localStorage before app.js runs
  const page = buildHtml(html, theme);
  const injected = page.replace(
    '<script src="/public/app.js"></script>',
    '<script>localStorage.setItem("cv-timeline","on");</script><script src="/public/app.js"></script>'
  );
  res.send(injected);
});

app.get('/og-image', puppeteerLimiter, async (req, res) => {
  let browser;
  try {
    const data = fs.existsSync(JSON_RESUME_PATH)
      ? JSON.parse(fs.readFileSync(JSON_RESUME_PATH, 'utf8'))
      : {};
    const basics = data.basics || {};
    const name = basics.name || 'ResuMe - Selfhosted CV';
    const label = basics.label || '';
    const loc = basics.location;
    const locationStr = loc ? [loc.city, loc.region, loc.countryCode].filter(Boolean).join(', ') : '';
    const photo = basics.image ? `<img src="${basics.image}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #fff;">` : `<div style="width:96px;height:96px;border-radius:50%;background:#e6edf3;display:flex;align-items:center;justify-content:center;font-size:40px;">👤</div>`;

    const ogHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 1200px; height: 630px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0d1117 0%, #161b22 100%); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.card { display: flex; align-items: center; gap: 48px; padding: 64px; width: 100%; }
.photo { flex-shrink: 0; }
.text { flex: 1; min-width: 0; }
h1 { font-size: 64px; font-weight: 700; color: #e6edf3; line-height: 1.1; margin-bottom: 16px; }
.label { font-size: 22px; color: #8b949e; line-height: 1.4; margin-bottom: 20px; }
.loc { font-size: 18px; color: #6e7681; }
.badge { display: inline-block; background: #21262d; border: 1px solid #30363d; border-radius: 20px; padding: 6px 16px; font-size: 14px; color: #8b949e; margin-top: 24px; }
</style></head>
<body><div class="card"><div class="photo">${photo}</div><div class="text"><h1>${name}</h1><div class="label">${label}</div>${locationStr ? `<div class="loc">📍 ${locationStr}</div>` : ''}<div class="badge">View CV →</div></div></div></body></html>`;

    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });
    await page.setContent(ogHtml, { waitUntil: 'domcontentloaded' });
    const img = await page.screenshot({ type: 'png' });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(img);
  } catch (err) {
    console.error('OG image generation failed:', err);
    res.status(500).send('OG image generation failed');
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`CV running on http://localhost:${PORT}`);
});
