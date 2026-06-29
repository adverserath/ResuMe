# ResuMe

A self-hosted CV platform. Write your CV in JSON Resume format, get a styled web page with a sidebar, collapsible sections, multiple themes, and a one-click PDF download.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-☕-yellow?style=flat-square)](https://buymeacoffee.com/adverserath)

---

## Features

- **JSON Resume** — author your CV in the open [JSON Resume](https://jsonresume.org) schema (`resume.json`)
- **Multiple themes** — GitHub, Minimal, Dark — switchable live from the top bar
- **PDF download** — server-side PDF via headless Chromium; clean print layout with no sidebar or controls
- **Sidebar navigation** — sticky contents panel with active-section highlighting
- **Collapsible sections** — collapse/expand any section; state persists in localStorage
- **Ctrl+K command palette** — jump to section, switch theme, or download PDF from the keyboard
- **Timeline view** — toggle the Experience section between card and vertical timeline layout
- **Section deep-links** — hover any section to reveal a copy-link button
- **Scroll-fade animations** — sections animate in as they enter the viewport
- **OG image** — `/og-image` renders a 1200×630 social card via Puppeteer (auto-wired into `og:image`)
- **Print/web-only blocks** — wrap content in `<!-- web-only -->` or `<!-- print-only -->` to show it only in the relevant output
- **Configurable PDF filename** — set `meta.pdfFilename` in `resume.json` (e.g. `david-rath.pdf`)
- **Docker Compose** — one command to run everywhere

---

## Quick start

### With Docker Compose (recommended)

```bash
git clone https://github.com/adverserath/ResuMe.git
cd ResuMe
cp resume.template.json resume.json
# Edit resume.json with your details
docker compose up
```

Open [http://localhost:3000](http://localhost:3000).

### Without Docker

Requires Node.js 20+ and Chromium installed locally (for PDF export).

```bash
git clone https://github.com/adverserath/ResuMe.git
cd ResuMe
npm install
cp resume.template.json resume.json
# Edit resume.json with your details
npm start
```

Set `CHROMIUM_PATH` to your local Chromium binary if PDF export fails:

```bash
CHROMIUM_PATH=/usr/bin/chromium npm start
```

---

## Configuration

All configuration lives in the `meta` block at the top of `resume.json`:

```json
{
  "meta": {
    "theme": "github",
    "pdfFilename": "your-name.pdf"
  }
}
```

| Field | Default | Description |
|---|---|---|
| `theme` | `github` | Default theme: `github`, `minimal`, or `dark` |
| `pdfFilename` | `cv.pdf` | Filename for the downloaded PDF |

---

## Themes

| Name | Description |
|---|---|
| `github` | Light, clean — matches GitHub's markdown style |
| `minimal` | Minimal serif typography |
| `dark` | Dark background, high contrast |

Switch theme live from the top bar, or set the default in `meta.theme`.

---

## JSON Resume schema

ResuMe uses the [JSON Resume v1.0.0 schema](https://jsonresume.org/schema) with a few extension fields:

| Field | Purpose |
|---|---|
| `x_educationNote` | Italic note rendered below the Education table |
| `x_philosophy` | Freeform Markdown section — working style, values |
| `x_funFacts` | Array of strings rendered as a bulleted list |

See [`resume.template.json`](resume.template.json) for a fully annotated starting point.

---

## Print/web-only content

Wrap any Markdown string value with HTML comments to control where content appears:

```
<!-- web-only -->
This paragraph only appears on the website, not in the PDF.
<!-- /web-only -->

<!-- print-only -->
This paragraph only appears in the PDF download.
<!-- /print-only -->
```

---

## Routes

| Route | Description |
|---|---|
| `/` | Main CV page |
| `/download?theme=<name>` | Download PDF |
| `/timeline` | CV with Experience in timeline view |
| `/og-image` | 1200×630 PNG social card (requires Chromium) |

---

## Docker environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `CHROMIUM_PATH` | `/usr/bin/chromium` | Path to Chromium binary |

---

## Project structure

```
ResuMe/
├── server.js              # Express server
├── jsonresume.js          # JSON Resume → HTML renderer
├── resume.json            # Your CV data (git-ignored)
├── resume.template.json   # Starter template
├── themes/
│   ├── base.css           # Shared structural styles
│   ├── github.css
│   ├── minimal.css
│   └── dark.css
├── public/
│   ├── app.js             # Sidebar, collapse, palette, timeline
│   ├── controls.css       # Web-only UI styles
│   └── favicon.svg
├── Dockerfile
└── docker-compose.yml
```

---

## Contributing

Issues and PRs welcome. If this saved you time, a coffee is always appreciated:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-☕-yellow?style=flat-square)](https://buymeacoffee.com/adverserath)

---

## License

MIT
