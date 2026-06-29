(function () {
  'use strict';

  if (document.body.classList.contains('pdf-mode')) return;

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function getSectionLabel(section, index) {
    const h1 = section.querySelector('h1');
    if (h1) return h1.textContent.trim();
    const h = section.querySelector('h2, h3, h4');
    if (h) return h.textContent.trim();
    return 'Section ' + (index + 1);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const sections = Array.from(document.querySelectorAll('.cv-section'));
    if (!sections.length) return;

    // ── Assign IDs, wrap body content, add collapse toggle ──
    sections.forEach(function (section, i) {
      const label = getSectionLabel(section, i);
      const id = slugify(label) || ('section-' + i);
      section.id = id;

      // Wrap everything after the first child in .cv-section__body
      const children = Array.from(section.children);
      const body = document.createElement('div');
      body.className = 'cv-section__body';
      children.slice(1).forEach(function (child) { body.appendChild(child); });
      section.appendChild(body);

      // Collapse toggle button
      const toggle = document.createElement('button');
      toggle.className = 'cv-section__toggle';
      toggle.setAttribute('aria-label', 'Collapse section');
      toggle.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 7L1 3h8z"/></svg>';
      section.appendChild(toggle);

      // Deep-link copy button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'cv-section__copy-link';
      copyBtn.setAttribute('aria-label', 'Copy link to section');
      copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0z"/></svg>';
      copyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var url = location.origin + location.pathname + '#' + section.id;
        navigator.clipboard.writeText(url).then(function () {
          copyBtn.classList.add('cv-section__copy-link--copied');
          setTimeout(function () { copyBtn.classList.remove('cv-section__copy-link--copied'); }, 1500);
        });
      });
      section.appendChild(copyBtn);

      // Restore saved state
      if (localStorage.getItem('cv-section-' + id) === 'collapsed') {
        section.classList.add('cv-section--collapsed');
        toggle.setAttribute('aria-label', 'Expand section');
        toggle.classList.add('cv-section__toggle--collapsed');
      }

      toggle.addEventListener('click', function () {
        const collapsed = section.classList.toggle('cv-section--collapsed');
        toggle.setAttribute('aria-label', collapsed ? 'Expand section' : 'Collapse section');
        toggle.classList.toggle('cv-section__toggle--collapsed', collapsed);
        localStorage.setItem('cv-section-' + id, collapsed ? 'collapsed' : 'expanded');
      });
    });

    // ── Build sidebar ────────────────────────────────────────
    const sidebar = document.createElement('nav');
    sidebar.className = 'cv-sidebar';
    sidebar.setAttribute('aria-label', 'Section navigation');

    const sidebarTitle = document.createElement('p');
    sidebarTitle.className = 'cv-sidebar__title';
    sidebarTitle.textContent = 'Contents';
    sidebar.appendChild(sidebarTitle);

    const list = document.createElement('ul');
    list.className = 'cv-sidebar__list';

    sections.forEach(function (section) {
      const label = getSectionLabel(section, 0);
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + section.id;
      a.className = 'cv-sidebar__link';
      a.textContent = label;

      // Clicking a collapsed section expands it before scrolling
      a.addEventListener('click', function () {
        if (section.classList.contains('cv-section--collapsed')) {
          const toggle = section.querySelector('.cv-section__toggle');
          section.classList.remove('cv-section--collapsed');
          if (toggle) {
            toggle.setAttribute('aria-label', 'Collapse section');
            toggle.classList.remove('cv-section__toggle--collapsed');
          }
          localStorage.setItem('cv-section-' + section.id, 'expanded');
        }
      });

      li.appendChild(a);
      list.appendChild(li);
    });

    sidebar.appendChild(list);

    // ── Wrap main content in layout container ────────────────
    const main = document.querySelector('.markdown-body');
    if (!main) return;
    const layout = document.createElement('div');
    layout.className = 'cv-layout';
    main.parentNode.insertBefore(layout, main);
    layout.appendChild(sidebar);
    layout.appendChild(main);

    // ── Highlight active section via IntersectionObserver ────
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const link = list.querySelector('a[href="#' + entry.target.id + '"]');
        if (link) link.classList.toggle('cv-sidebar__link--active', entry.isIntersecting);
      });
    }, { rootMargin: '-5% 0px -55% 0px', threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });

    // ── Timeline view ────────────────────────────────────────
    var timelineActive = localStorage.getItem('cv-timeline') === 'on';

    function buildTimeline(section) {
      var existing = section.querySelector('.cv-timeline');
      if (existing) return;
      var entries = Array.from(section.querySelectorAll('.cv-section__body > h3'));
      if (!entries.length) return;
      var container = document.createElement('div');
      container.className = 'cv-timeline';
      entries.forEach(function (h3) {
        var entry = document.createElement('div');
        entry.className = 'cv-timeline-entry';
        var titleEl = document.createElement('div');
        titleEl.className = 'cv-timeline-entry__title';
        titleEl.innerHTML = h3.innerHTML;
        var nextP = h3.nextElementSibling;
        var metaEl = document.createElement('div');
        metaEl.className = 'cv-timeline-entry__meta';
        if (nextP && nextP.tagName === 'P') metaEl.innerHTML = nextP.innerHTML;
        var bodyEl = document.createElement('div');
        bodyEl.className = 'cv-timeline-entry__body';
        var cur = (nextP && nextP.tagName === 'P') ? nextP.nextElementSibling : nextP;
        var nextH3 = h3.nextElementSibling;
        while (nextH3 && nextH3.tagName !== 'H3') nextH3 = nextH3.nextElementSibling;
        while (cur && cur !== nextH3) {
          if (cur.tagName !== 'P' || cur !== (nextP && nextP.tagName === 'P' ? nextP : null)) {
            bodyEl.appendChild(cur.cloneNode(true));
          }
          cur = cur.nextElementSibling;
        }
        entry.appendChild(titleEl);
        entry.appendChild(metaEl);
        entry.appendChild(bodyEl);
        container.appendChild(entry);
      });
      section.querySelector('.cv-section__body').appendChild(container);
    }

    function applyTimeline(section, on) {
      if (on) {
        buildTimeline(section);
        section.classList.add('cv-timeline-mode');
      } else {
        section.classList.remove('cv-timeline-mode');
      }
    }

    sections.forEach(function (section) {
      var label = getSectionLabel(section, 0);
      if (label !== 'Experience') return;

      var h2 = section.querySelector('h2');
      if (!h2) return;
      var btn = document.createElement('button');
      btn.className = 'cv-timeline-toggle' + (timelineActive ? ' cv-timeline-toggle--active' : '');
      btn.title = 'Toggle timeline view';
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25v5.025zM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg> Timeline';
      h2.appendChild(btn);

      if (timelineActive) applyTimeline(section, true);

      btn.addEventListener('click', function () {
        timelineActive = !timelineActive;
        btn.classList.toggle('cv-timeline-toggle--active', timelineActive);
        applyTimeline(section, timelineActive);
        localStorage.setItem('cv-timeline', timelineActive ? 'on' : 'off');
      });
    });

    // ── Ctrl+K Command palette ───────────────────────────────
    var paletteOpen = false;
    var paletteActiveIndex = 0;
    var paletteItems = [];

    function buildPaletteItems(query) {
      var q = (query || '').toLowerCase().trim();
      var items = [];

      // Sections
      sections.forEach(function (s) {
        var label = getSectionLabel(s, 0);
        if (!q || label.toLowerCase().includes(q)) {
          items.push({ icon: '§', label: label, hint: 'Jump', action: function () { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (s.classList.contains('cv-section--collapsed')) { var t = s.querySelector('.cv-section__toggle'); if (t) t.click(); } } });
        }
      });

      if (!q || 'theme github minimal dark'.includes(q)) {
        if (items.length) items.push({ divider: true });
        items.push({ groupLabel: 'Switch Theme' });
        ['github', 'minimal', 'dark'].forEach(function (t) {
          if (!q || t.includes(q)) {
            items.push({ icon: '🎨', label: t.charAt(0).toUpperCase() + t.slice(1) + ' Theme', hint: 'Theme', action: function () { location.href = '?theme=' + t; } });
          }
        });
      }

      if (!q || 'download pdf'.includes(q)) {
        if (items.length) items.push({ divider: true });
        var currentTheme = new URLSearchParams(location.search).get('theme') || 'github';
        items.push({ icon: '⬇', label: 'Download PDF', hint: 'PDF', action: function () { location.href = '/download?theme=' + currentTheme; } });
      }

      return items;
    }

    function renderPalette(query) {
      var listEl = document.querySelector('.cv-palette__list');
      if (!listEl) return;
      paletteItems = buildPaletteItems(query);
      paletteActiveIndex = 0;
      listEl.innerHTML = '';
      paletteItems.forEach(function (item, idx) {
        if (item.divider) {
          var div = document.createElement('li');
          div.className = 'cv-palette__divider';
          listEl.appendChild(div);
          return;
        }
        if (item.groupLabel) {
          var gl = document.createElement('li');
          gl.className = 'cv-palette__group-label';
          gl.textContent = item.groupLabel;
          listEl.appendChild(gl);
          return;
        }
        var li = document.createElement('li');
        li.className = 'cv-palette__item' + (idx === paletteActiveIndex ? ' cv-palette__item--active' : '');
        li.dataset.idx = idx;
        li.innerHTML = '<span class="cv-palette__item-icon">' + item.icon + '</span><span class="cv-palette__item-label">' + item.label + '</span><span class="cv-palette__item-hint">' + (item.hint || '') + '</span>';
        li.addEventListener('mouseenter', function () {
          paletteActiveIndex = parseInt(li.dataset.idx);
          updateActive();
        });
        li.addEventListener('click', function () { item.action(); closePalette(); });
        listEl.appendChild(li);
      });
    }

    function updateActive() {
      var listEl = document.querySelector('.cv-palette__list');
      if (!listEl) return;
      listEl.querySelectorAll('.cv-palette__item').forEach(function (el) {
        var isActive = parseInt(el.dataset.idx) === paletteActiveIndex;
        el.classList.toggle('cv-palette__item--active', isActive);
        if (isActive) el.scrollIntoView({ block: 'nearest' });
      });
    }

    function openPalette() {
      if (paletteOpen) return;
      paletteOpen = true;
      var backdrop = document.createElement('div');
      backdrop.className = 'cv-palette-backdrop';
      backdrop.innerHTML = '<div class="cv-palette"><div class="cv-palette__input-row"><svg class="cv-palette__input-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-3.04-3.04zM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7z"/></svg><input class="cv-palette__input" placeholder="Jump to section, switch theme, download PDF…" autocomplete="off" spellcheck="false"></div><ul class="cv-palette__list"></ul></div>';
      document.body.appendChild(backdrop);
      renderPalette('');
      var input = backdrop.querySelector('.cv-palette__input');
      input.focus();
      input.addEventListener('input', function () { renderPalette(input.value); });
      input.addEventListener('keydown', function (e) {
        var actionItems = paletteItems.filter(function (it) { return it.action; });
        if (e.key === 'ArrowDown') { e.preventDefault(); paletteActiveIndex = Math.min(paletteActiveIndex + 1, paletteItems.length - 1); updateActive(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); paletteActiveIndex = Math.max(paletteActiveIndex - 1, 0); updateActive(); }
        else if (e.key === 'Enter') { var active = paletteItems[paletteActiveIndex]; if (active && active.action) { active.action(); closePalette(); } }
        else if (e.key === 'Escape') { closePalette(); }
      });
      backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closePalette(); });
    }

    function closePalette() {
      paletteOpen = false;
      var el = document.querySelector('.cv-palette-backdrop');
      if (el) el.remove();
    }

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        paletteOpen ? closePalette() : openPalette();
      }
    });

    // ── Download section selector ────────────────────────────
    var dlLink = document.querySelector('.cv-controls__download');
    if (dlLink) {
      dlLink.addEventListener('click', function (e) {
        e.preventDefault();
        openDownloadModal(dlLink.href);
      });
    }

    function openDownloadModal(baseHref) {
      var backdrop = document.createElement('div');
      backdrop.className = 'cv-dl-backdrop';

      var items = sections.map(function (s) {
        return { id: s.id, label: getSectionLabel(s, 0) };
      });

      var checkboxRows = items.map(function (item) {
        return '<label class="cv-dl-item"><input type="checkbox" value="' + item.id + '" checked><span>' + item.label + '</span></label>';
      }).join('');

      backdrop.innerHTML =
        '<div class="cv-dl-modal">' +
          '<div class="cv-dl-modal__header"><h3>Download PDF</h3><p>Choose which sections to include</p></div>' +
          '<div class="cv-dl-modal__toolbar">' +
            '<button id="cv-dl-all">Select all</button>' +
            '<button id="cv-dl-none">Deselect all</button>' +
          '</div>' +
          '<div class="cv-dl-modal__sections">' + checkboxRows + '</div>' +
          '<div class="cv-dl-modal__footer">' +
            '<button class="cv-dl-modal__cancel">Cancel</button>' +
            '<a class="cv-dl-modal__download" href="#">&#8595; Download PDF</a>' +
          '</div>' +
        '</div>';

      document.body.appendChild(backdrop);

      var checkboxes = Array.from(backdrop.querySelectorAll('input[type="checkbox"]'));
      var downloadAnchor = backdrop.querySelector('.cv-dl-modal__download');

      function updateDownloadLink() {
        var unchecked = checkboxes.filter(function (c) { return !c.checked; }).map(function (c) { return c.value; });
        var url = new URL(baseHref, location.origin);
        if (unchecked.length) url.searchParams.set('exclude', unchecked.join(','));
        else url.searchParams.delete('exclude');
        downloadAnchor.href = url.toString();
      }

      updateDownloadLink();
      checkboxes.forEach(function (cb) { cb.addEventListener('change', updateDownloadLink); });

      backdrop.querySelector('#cv-dl-all').addEventListener('click', function () {
        checkboxes.forEach(function (c) { c.checked = true; });
        updateDownloadLink();
      });
      backdrop.querySelector('#cv-dl-none').addEventListener('click', function () {
        checkboxes.forEach(function (c) { c.checked = false; });
        updateDownloadLink();
      });
      backdrop.querySelector('.cv-dl-modal__cancel').addEventListener('click', function () { backdrop.remove(); });
      downloadAnchor.addEventListener('click', function () { backdrop.remove(); });
      backdrop.addEventListener('click', function (e) { if (e.target === backdrop) backdrop.remove(); });
    }

    // ── Scroll-fade animations ───────────────────────────────
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var fadeIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('cv-section--visible');
            fadeIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.04 });
      sections.forEach(function (s) {
        s.classList.add('cv-section--animate');
        fadeIO.observe(s);
      });
    }
  });
})();
