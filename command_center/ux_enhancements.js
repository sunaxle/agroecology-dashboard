/**
 * Master Command Center — UX Enhancement Layer
 * --------------------------------------------
 * Loaded AFTER dashboard.js. Kept separate so it can evolve without
 * touching the core data/sync engine.
 *
 *  #1  Smart program routing defaults + "Save Receipt" confirmation
 *  #2  "Needs Attention" strip (overdue tasks, follow-ups, missing photos, next 7 days)
 *  #5  Visual calm: strip decorative emoji from buttons/headings (keeps 🌾🏛️🌳🌱 ⚠️)
 *  #6  Mobile: slide-in sidebar drawer + top bar
 */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ==========================================================
  // #1a. Smart Program Routing Defaults
  // ==========================================================
  function suggestRouting(type, site) {
    const t = (type || '').toLowerCase();
    const s = (site || '').toLowerCase();
    const r = { kellogg: false, bfrdp: false, cool: false };

    if (t.includes('cool schools') || t.includes('cue') || s.includes('cool schools') || s.includes('quinta')) {
      r.cool = true;
    } else if (t.includes('field day') || t.includes('ranch') || t.includes('1-on-1')) {
      r.bfrdp = true;
    } else if (t.includes('farmers market') || t.includes('farm stand')) {
      r.kellogg = true;
    } else if (t.includes('workshop') || t.includes('training')) {
      // Hub & Sentli trainings are Kellogg deliverables by default
      if (s.includes('hub') || s.includes('sentli') || s.includes('greenhouse')) r.kellogg = true;
    }
    // Research trials / sensor milestones => Hub only (no external grant)
    return r;
  }

  function applyRoutingSuggestion() {
    const k = $('#route-kellogg'), b = $('#route-bfrdp'), c = $('#route-cool');
    if (!k || !b || !c) return;
    const r = suggestRouting($('#u-type')?.value, $('#u-site')?.value);
    // BFRDP also auto-suggested when any cohort farmer is checked in
    const cohortChecked = $$('#uBfrdpCohortCheckboxes input[type="checkbox"]:checked').length > 0;
    k.checked = r.kellogg;
    b.checked = r.bfrdp || cohortChecked;
    c.checked = r.cool;
    flashRoutingHint();
  }

  function flashRoutingHint() {
    const hint = $('#ccRoutingHint');
    if (!hint) return;
    hint.classList.remove('cc-hint-flash');
    void hint.offsetWidth;
    hint.classList.add('cc-hint-flash');
  }

  function initRouting() {
    const grid = $('.routing-cards-grid');
    if (!grid) return;
    if (!$('#ccRoutingHint')) {
      const hint = document.createElement('div');
      hint.id = 'ccRoutingHint';
      hint.className = 'cc-routing-hint';
      hint.innerHTML = 'Suggested from Activity Type &amp; Site — adjust before saving. Only checked programs receive this record (Hub/Lab always does).';
      grid.parentNode.insertBefore(hint, grid);
    }
    $('#u-type')?.addEventListener('change', applyRoutingSuggestion);
    $('#u-site')?.addEventListener('change', applyRoutingSuggestion);
    $('#uBfrdpCohortCheckboxes')?.addEventListener('change', (e) => {
      if (e.target && e.target.matches('input[type="checkbox"]') && e.target.checked) {
        const b = $('#route-bfrdp');
        if (b) b.checked = true;
      }
    });
    $('#universalLoggerForm')?.addEventListener('reset', () => setTimeout(applyRoutingSuggestion, 0));
    applyRoutingSuggestion();
  }

  // ==========================================================
  // #1b. Save Receipt (replaces the generic toast after logging)
  // ==========================================================
  const PROGRAM_LABELS = {
    KELLOGG: '🌾 W.K. Kellogg',
    BFRDP: '🏛️ USDA BFRDP',
    COOL_SCHOOLS: '🌳 Cool Schools',
    HUB: '🌱 Hub & Lab Ledger'
  };

  window.ccShowSaveReceipt = function (info) {
    const old = $('#ccSaveReceipt');
    if (old) old.remove();
    const progs = Array.isArray(info.programs) ? info.programs.slice() : [];
    if (!progs.includes('HUB')) progs.push('HUB');
    const cloudLine = info.cloud
      ? '<span class="cc-rc-ok">● Synced to cloud</span> — partner dashboards update automatically.'
      : '<span class="cc-rc-warn">● Saved on this device only</span> — cloud is offline; it will not appear on other computers until synced.';

    const el = document.createElement('div');
    el.id = 'ccSaveReceipt';
    el.className = 'cc-receipt';
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <div class="cc-rc-head">
        <strong>Event saved</strong>
        <button type="button" class="cc-rc-close" aria-label="Dismiss">&times;</button>
      </div>
      <div class="cc-rc-topic">${esc(info.topic)}</div>
      <ul class="cc-rc-list">
        ${progs.map(p => `<li>✓ ${esc(PROGRAM_LABELS[p] || p)}</li>`).join('')}
        ${info.cohortUpdatedCount ? `<li>✓ +${esc(info.hours)} hrs added to ${esc(info.cohortUpdatedCount)} BFRDP cohort farmer(s)</li>` : ''}
      </ul>
      <div class="cc-rc-cloud">${cloudLine}</div>
      <div class="cc-rc-actions">
        <button type="button" class="btn btn-primary btn-sm" data-act="view">View event</button>
        <button type="button" class="btn btn-secondary btn-sm" data-act="another">Log another</button>
      </div>`;
    document.body.appendChild(el);

    const close = () => el.remove();
    el.querySelector('.cc-rc-close').addEventListener('click', close);
    el.querySelector('[data-act="view"]').addEventListener('click', () => {
      close();
      if (window.openEventProfile && info.id) window.openEventProfile(info.id, 'logger-view');
    });
    el.querySelector('[data-act="another"]').addEventListener('click', () => {
      close();
      $('#u-topic')?.focus();
    });
    setTimeout(() => { if (document.body.contains(el)) el.classList.add('cc-rc-fade'); }, 11000);
    setTimeout(() => { if (document.body.contains(el)) el.remove(); }, 12000);
  };

  // ==========================================================
  // #2. Needs Attention Strip
  // ==========================================================
  const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

  function parseLooseDate(str) {
    if (!str) return null;
    const iso = String(str).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    const m = String(str).match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})(?:\s*[–-]\s*\d{1,2})?,?\s+(\d{4})/);
    if (m && MONTHS[m[1].toLowerCase()] !== undefined) {
      return new Date(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
    }
    return null;
  }

  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function computeAttention() {
    const data = window.ccData;
    if (!data) return null;
    const today = startOfToday();
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);

    const tasks = (data.getTasks() || []).filter(t => !t.done);
    const overdue = [], dueSoon = [];
    tasks.forEach(t => {
      const d = parseLooseDate(t.due);
      if (!d) return;
      if (d < today) overdue.push({ t, d });
      else if (d <= in7) dueSoon.push({ t, d });
    });

    const records = data.getRecords() || [];
    const followUps = records.filter(r => /follow-up|action needed/i.test(r.status || ''));
    const missingPhotos = records.filter(r => {
      const d = parseLooseDate(r.date);
      const isPast = !d || d <= today;
      const hasPhotos = Array.isArray(r.photos) && r.photos.length > 0;
      const isGrant = Array.isArray(r.programs) && r.programs.some(p => p !== 'HUB');
      return isPast && isGrant && !hasPhotos;
    });

    const upcoming = (data.getEvents() || [])
      .map(ev => ({ ev, d: parseLooseDate(ev.dateTime) }))
      .filter(x => x.d && x.d >= today && x.d <= in7)
      .sort((a, b) => a.d - b.d);

    return { overdue, dueSoon, followUps, missingPhotos, upcoming };
  }

  let activeAttentionKey = null;

  function renderAttentionStrip() {
    const host = $('#ccAttentionStrip');
    if (!host) return;
    const a = computeAttention();
    if (!a) return;

    const tiles = [
      { key: 'tasks', label: 'Tasks overdue / due this week', count: a.overdue.length + a.dueSoon.length, tone: a.overdue.length ? 'alert' : (a.dueSoon.length ? 'warn' : 'ok'), sub: a.overdue.length ? `${a.overdue.length} overdue` : 'None overdue' },
      { key: 'followups', label: 'Events with open follow-ups', count: a.followUps.length, tone: a.followUps.length ? 'warn' : 'ok', sub: a.followUps.length ? 'Needs a note or resolution' : 'All resolved' },
      { key: 'photos', label: 'Grant events missing photos', count: a.missingPhotos.length, tone: a.missingPhotos.length ? 'warn' : 'ok', sub: a.missingPhotos.length ? 'Funders expect visuals' : 'All documented' },
      { key: 'upcoming', label: 'Events in the next 7 days', count: a.upcoming.length, tone: 'info', sub: a.upcoming[0] ? `Next: ${a.upcoming[0].d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Nothing scheduled' }
    ];

    const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    host.innerHTML = `
      <div class="cc-att-head">
        <div>
          <div class="cc-att-eyebrow">${esc(dateLabel)}</div>
          <h2 class="cc-att-title">Needs attention</h2>
        </div>
        <div class="cc-att-actions">
          <button type="button" class="btn btn-gold" data-cc-act="log">+ Log event</button>
          <button type="button" class="btn btn-secondary btn-sm" data-cc-act="sync" title="Pull completed whiteboard & partner events into the master ledger">Sync past events</button>
        </div>
      </div>
      <div class="cc-att-grid">
        ${tiles.map(t => `
          <button type="button" class="cc-att-tile tone-${t.tone} ${activeAttentionKey === t.key ? 'is-open' : ''}" data-att="${t.key}" aria-expanded="${activeAttentionKey === t.key}">
            <span class="cc-att-count">${t.count}</span>
            <span class="cc-att-label">${esc(t.label)}</span>
            <span class="cc-att-sub">${esc(t.sub)}</span>
          </button>`).join('')}
      </div>
      <div class="cc-att-detail" id="ccAttDetail" ${activeAttentionKey ? '' : 'hidden'}></div>`;

    host.querySelector('[data-cc-act="log"]').addEventListener('click', () => window.switchCommandView && window.switchCommandView('logger-view'));
    host.querySelector('[data-cc-act="sync"]').addEventListener('click', () => document.getElementById('btnSyncBackfillAll')?.click());
    $$('.cc-att-tile', host).forEach(btn => btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-att');
      activeAttentionKey = activeAttentionKey === key ? null : key;
      renderAttentionStrip();
    }));

    if (activeAttentionKey) renderAttentionDetail(a, activeAttentionKey);
  }

  function renderAttentionDetail(a, key) {
    const box = $('#ccAttDetail');
    if (!box) return;
    const fmt = (d) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    let rows = [];

    if (key === 'tasks') {
      rows = [...a.overdue.map(x => ({ ...x, late: true })), ...a.dueSoon].map(({ t, d, late }) => `
        <li class="cc-att-row" data-go="tasks">
          <span class="cc-att-date ${late ? 'is-late' : ''}">${late ? 'Overdue · ' : ''}${fmt(d)}</span>
          <span class="cc-att-text">${esc(t.title)}</span>
          <span class="cc-att-meta">${esc(t.owner || '')}</span>
        </li>`);
    } else if (key === 'followups' || key === 'photos') {
      const list = key === 'followups' ? a.followUps : a.missingPhotos;
      rows = list.map(r => `
        <li class="cc-att-row" data-rec="${esc(r.id)}">
          <span class="cc-att-date">${esc(fmt(parseLooseDate(r.date)) || r.date || '')}</span>
          <span class="cc-att-text">${esc(r.topic)}</span>
          <span class="cc-att-meta">${key === 'followups' ? esc((r.status || '').replace(/^Follow-Up Needed:?\s*/i, '')) : 'Add photos →'}</span>
        </li>`);
    } else if (key === 'upcoming') {
      rows = a.upcoming.map(({ ev, d }) => `
        <li class="cc-att-row" data-go="calendar">
          <span class="cc-att-date">${fmt(d)}</span>
          <span class="cc-att-text">${esc(ev.title)}</span>
          <span class="cc-att-meta">${esc(ev.assigned || '')}</span>
        </li>`);
    }

    box.innerHTML = rows.length
      ? `<ul class="cc-att-list">${rows.join('')}</ul>`
      : `<div class="cc-att-empty">Nothing here — you're all caught up.</div>`;

    $$('.cc-att-row', box).forEach(li => li.addEventListener('click', () => {
      const rec = li.getAttribute('data-rec');
      const go = li.getAttribute('data-go');
      if (rec && window.openEventProfile) window.openEventProfile(rec, 'pulse-view');
      else if (go === 'tasks') window.switchCommandView('coworkers-view');
      else if (go === 'calendar') window.switchCommandView('calendar-view');
    }));
  }

  // ==========================================================
  // #5. Emoji Calm — remove decorative emoji from UI chrome
  // ==========================================================
  const KEEP = new Set(['🌾', '🏛', '🌳', '🌱', '⚠']);
  const EMOJI_RUN = /(?:\p{Extended_Pictographic}[\uFE0F\u200D]*)+\s*/gu;
  const CHROME_SELECTOR = [
    '.main-content .btn', '.main-content .view-header h2', '.main-content .panel-header h3',
    '.main-content .card-panel > h3', '.main-content .pillars-grid-3 h3',
    '.main-content .form-group > label', '.main-content .form-group > label > span',
    '.main-content .stat-label', '.main-content .cadence-day', '.main-content .log-once-explainer h4',
    '.main-content .attendee-tab-btn', '.main-content .profile-nav-bar .btn'
  ].join(',');

  function stripEmojiIn(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const v = node.nodeValue;
      if (!v || !EMOJI_RUN.test(v)) { EMOJI_RUN.lastIndex = 0; continue; }
      EMOJI_RUN.lastIndex = 0;
      const next = v.replace(EMOJI_RUN, (m) => {
        const base = m.replace(/[\uFE0F\u200D\s]/g, '');
        for (const k of KEEP) { if (base.includes(k)) return m; }
        return '';
      });
      if (next !== v) node.nodeValue = next;
    }
  }

  let calmQueued = false;
  function calmEmoji() {
    if (calmQueued) return;
    calmQueued = true;
    requestAnimationFrame(() => {
      calmQueued = false;
      $$(CHROME_SELECTOR).forEach(stripEmojiIn);
    });
  }

  // ==========================================================
  // #6. Mobile Drawer + Top Bar
  // ==========================================================
  function initMobileShell() {
    const sidebar = $('.sidebar');
    if (!sidebar || $('#ccMobileTopbar')) return;

    const bar = document.createElement('header');
    bar.id = 'ccMobileTopbar';
    bar.className = 'cc-mobile-topbar';
    bar.innerHTML = `
      <button type="button" class="cc-burger" aria-label="Open menu" aria-controls="ccSidebar" aria-expanded="false"><span></span><span></span><span></span></button>
      <div class="cc-mobile-title">Command Center</div>
      <button type="button" class="btn btn-gold btn-sm cc-mobile-log">+ Log</button>`;
    document.body.insertBefore(bar, document.body.firstChild);

    const backdrop = document.createElement('div');
    backdrop.className = 'cc-drawer-backdrop';
    document.body.appendChild(backdrop);

    sidebar.id = sidebar.id || 'ccSidebar';
    const burger = bar.querySelector('.cc-burger');
    const setOpen = (open) => {
      document.body.classList.toggle('cc-drawer-open', open);
      burger.setAttribute('aria-expanded', String(open));
    };
    burger.addEventListener('click', () => setOpen(!document.body.classList.contains('cc-drawer-open')));
    backdrop.addEventListener('click', () => setOpen(false));
    $$('.nav-link', sidebar).forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    bar.querySelector('.cc-mobile-log').addEventListener('click', () => {
      window.switchCommandView && window.switchCommandView('logger-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================================
  // Boot
  // ==========================================================
  function boot() {
    initMobileShell();
    initRouting();
    renderAttentionStrip();
    calmEmoji();

    document.addEventListener('cc:refreshed', () => {
      renderAttentionStrip();
      calmEmoji();
    });

    // Re-apply emoji calm when views re-render dynamic content
    const main = $('.main-content');
    if (main && 'MutationObserver' in window) {
      new MutationObserver(calmEmoji).observe(main, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
