# ResuMe - Roadmap

## Rough edges (project polish)

- [ ] Animate collapse properly - `display: none` skips the opacity transition; use `max-height` or height auto + JS measurement
- [ ] Namespace `localStorage` keys per CV (e.g. include a CV identifier) so multiple resumes on one domain don't collide
- [ ] Handle CVs with no `<hr>` tags - `wrapSections` currently returns empty
- [ ] Guard against literal `<hr>` HTML inside markdown (would cause double-wrap)
- [ ] Add favicon
- [x] Add `<meta>` social cards (`og:title`, `og:description`, `og:image`)
- [ ] Write a README - the project doesn't sell itself when cloned
- [ ] Hide the cv-header h1 from the sidebar (currently shows "David Rath" as a nav link)

## WOW factor - adoption hooks

- [ ] `npx create-resume` scaffolder for one-command setup
- [ ] GitHub Action that publishes to GitHub Pages on push
- [ ] Theme gallery page at `/themes` showing all themes with the actual content
- [ ] Print-perfect PDF: `page-break-inside: avoid` on sections, page numbers, header on continuation pages
- [x] JSON Resume schema support ([jsonresume.org](https://jsonresume.org)) alongside markdown

## WOW factor - visual & interaction

- [ ] Animated GitHub-style contribution heatmap (live from username)
- [ ] Hover/click tag-cloud filter - clicking a skill tag dims sections that don't mention it
- [x] Timeline view - alternate Experience layout as a vertical timeline
- [x] Section deep-link copy button (hover a section, copy a direct URL)
- [x] Scroll-fade animations as sections enter the viewport
- [x] `Ctrl+K` command palette: jump to section, switch theme, download PDF
- [x] Auto-generated OG image route (Puppeteer renders name + tagline + photo to PNG)

## WOW factor - power-user features

- [x] Markdown frontmatter for config (theme, photo, colours per CV) - `meta` block in resume.json
- [x] Print-only / web-only fence blocks (`<!-- print-only -->` / `<!-- web-only -->`)
- [x] Configurable PDF filename via frontmatter (`david-rath.pdf` instead of `cv.pdf`)

## Personal CV improvements (cv.md content)

- [x] **Quantify achievements** - added 1m customers, 1000 users, 4-instance Oracle, 4 years releases, 10+/year, ~5+ incidents/yr, 3-engineer team, 20+ Scouts, 5 adult volunteers, 20+ home sensors
- [x] **Rewrite the opening** - leads with "banker by day, maker by night, Scout leader by weekend" framing
- [ ] **Add project screenshots** - Home Assistant dashboard, 3D-printed parts, Frigate detections, telescope (need image files)
- [x] **Promote Scouting to Leadership section** - renamed Volunteering → Leadership, moved before Education
- [x] **Clarify 2009–2011 timeline** - x_educationNote explains MSc full-time → short IT role → Barclays → dissertation finished alongside first year
- [x] **Merge Barclays bullet list + #### highlights** - single quantified highlights list, generic bullet list dropped
- [x] **Link 2–3 specific GitHub repos** - added ResuMe, BattleBoard, TrueUO with URLs
- [x] **Rewrite Fun Facts** - replaced with 6 specific stories (lightning trigger, DIY boiler thermostat, Instructables Minecraft light, Duplo lighthouse, isolated sensor subnet, foil-board short)
