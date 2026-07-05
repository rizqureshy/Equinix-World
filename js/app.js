/* ============================================================
   DealProof — application shell, router & views
   Rep workspace: playbook · pipeline · deal room · discovery ·
                  objections · emails
   Manager workspace: team command · deal inspect · coaching
   ============================================================ */
'use strict';

(function () {
  const { el, toast, modal, confirmModal, openPalette, tour, copyText } = DCC.UI;
  const S = DCC.Store, D = DCC.DATA, C = DCC.Charts;
  const fmtMoney = DCC.fmtMoney, fmtDate = DCC.fmtDate;

  const SCORE_BG = ['rgba(255,255,255,0.06)', '#332876', '#6F4BD1', '#BCA2FF'];
  const SCORE_FG = ['#8F94A6', '#D6CCF7', '#F4EFFF', '#1D1145'];

  const VIEWS = {
    playbook:   { num: '01', label: 'Playbook',       roles: ['rep', 'manager'], theme: 'playbook',   sub: 'Challenger is how you sell. MEDDPICC is how you know it’s real.' },
    pipeline:   { num: '02', label: 'Pipeline',       roles: ['rep'],            theme: 'pipeline',   sub: 'Every deal, scored on evidence. Work the zeros first.' },
    deal:       { num: '03', label: 'Deal Room',      roles: ['rep'],            theme: 'deal',       sub: 'Score the deal. Find the lie.' },
    discovery:  { num: '04', label: 'Discovery Bank', roles: ['rep'],            theme: 'discovery',  sub: 'Questions that teach while they qualify.' },
    objections: { num: '05', label: 'Objection Tracks', roles: ['rep'],          theme: 'objections', sub: 'Reframe. Don’t rebut.' },
    emails:     { num: '06', label: 'Email Templates', roles: ['rep'],           theme: 'emails',     sub: 'Insight, tension, one ask.' },
    team:       { num: '01', label: 'Team Command',   roles: ['manager'],        theme: 'team',       sub: 'Inspect evidence, not enthusiasm.' },
    inspect:    { num: '02', label: 'Deal Inspect',   roles: ['manager'],        theme: 'inspect',    sub: 'The 15-minute review, run against a live scorecard.' },
    coaching:   { num: '03', label: 'Coaching Guide', roles: ['manager'],        theme: 'coaching',   sub: 'Five questions, in order. Then one action, logged.' }
  };
  const NAV = { rep: ['playbook', 'pipeline', 'deal', 'discovery', 'objections', 'emails'], manager: ['team', 'inspect', 'coaching', 'playbook'] };
  const letterByK = k => D.letters.find(l => l.k === k);

  /* ============================ APP ============================ */
  const App = {
    filter: 'ALL', hideAsked: false, openObj: -1, sortBy: 'health',

    boot() {
      DCC.UI.initTips();
      this.buildShell();
      const canvas = document.getElementById('wave');
      const ok = DCC.Waves.init(canvas);
      if (!ok) document.getElementById('bg').classList.add('no-gl');
      else {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        DCC.Waves.setMotion(S.state.settings.motion && !reduce);
      }
      if (!VIEWS[S.state.view] || !VIEWS[S.state.view].roles.includes(S.state.role)) {
        S.state.view = NAV[S.state.role][0];
      }
      this.go(S.state.view, true);
      this.bindKeys();
      // re-render the deal room when resizing across the compact-widget breakpoint
      this._compactW = window.innerWidth < 1010;
      window.addEventListener('resize', () => {
        clearTimeout(this._rzt);
        this._rzt = setTimeout(() => {
          const c = window.innerWidth < 1010;
          if (c !== this._compactW) {
            this._compactW = c;
            if (S.state.view === 'deal') this.refresh();
          }
        }, 180);
      });
      document.getElementById('splash').classList.add('done');
      if (!S.state.tourDone) setTimeout(() => this.startTour(), 900);
    },

    /* ---------- shell ---------- */
    buildShell() {
      const root = document.getElementById('app');
      this.sideNav = el('nav.side-nav');
      this.sideFoot = el('div.side-foot');
      this.stage = el('main.stage', { id: 'stage' });
      this.crumb = el('div.crumb');
      this.tipChip = el('button.tip-chip', { onclick: () => this.cycleTip(), 'data-tip': 'Click for another tip' });

      const side = el('aside.side', null,
        el('div.side-brand', null,
          el('div.brand-kicker', { text: 'Equinix Interconnection Sales' }),
          el('div.brand-name', { html: 'Deal<span>Proof</span>' }),
          el('div.brand-sub', { text: 'Score what you can prove · MEDDPICC × Challenger' })),
        this.sideNav,
        this.sideFoot);

      this.roleToggle = el('div.role-toggle', { role: 'tablist', 'data-tip': 'Switch workspace (press R)' },
        el('button.role-btn', { text: 'Rep', 'data-role': 'rep', onclick: () => this.setRole('rep') }),
        el('button.role-btn', { text: 'Manager', 'data-role': 'manager', onclick: () => this.setRole('manager') }));

      const top = el('header.topbar', null,
        this.crumb,
        el('div.top-actions', null,
          this.roleToggle,
          el('button.top-btn', { html: '<span class="kbd-ic">⌘K</span> Search', onclick: () => this.palette(), 'data-tip': 'Command palette — jump anywhere' }),
          el('button.top-btn.icon', { html: '⚙', 'aria-label': 'Settings', onclick: () => this.settings(), 'data-tip': 'Settings, data export & import' })));

      root.append(side, el('div.main', null, top, this.stage, this.tipChip));
      this.renderNav();
      this.renderSideFoot();
    },

    renderNav() {
      this.sideNav.innerHTML = '';
      NAV[S.state.role].forEach((id, i) => {
        const v = VIEWS[id];
        this.sideNav.appendChild(el('button.nav-item' + (S.state.view === id ? '.active' : ''), {
          onclick: () => this.go(id), 'data-view': id
        },
          el('span.nav-num', { text: String(i + 1).padStart(2, '0') }),
          el('span.nav-label', { text: v.label }),
          el('span.nav-key', { text: String(i + 1) })));
      });
      this.roleToggle.querySelectorAll('.role-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.role === S.state.role));
    },

    renderSideFoot() {
      this.sideFoot.innerHTML = '';
      let pct, status, label, kicker;
      if (S.state.role === 'manager') {
        const t = S.team();
        pct = t.avg; kicker = 'Team average health';
        status = pct >= S.state.settings.riskThreshold ? 'good' : pct >= 35 ? 'warn' : 'bad';
        label = t.commit + ' of ' + t.count + ' commit-ready';
      } else {
        const d = S.deal();
        kicker = 'Active deal health';
        if (d) { const h = S.health(d); pct = h.pct; status = h.status; label = h.label; }
        else { pct = 0; status = 'dim'; label = 'No deal selected'; }
      }
      const col = C.statusColor(status);
      this.sideFoot.append(
        el('div.foot-kicker', { text: kicker }),
        el('div.foot-row', null,
          el('span.foot-pct', { text: pct + '%', style: { color: col } }),
          el('span.foot-label', { text: label })),
        el('div.foot-bar', null, el('div.foot-fill', { style: { width: pct + '%', background: col } })));
    },

    /* ---------- routing ---------- */
    go(id, instant) {
      const v = VIEWS[id];
      if (!v || !v.roles.includes(S.state.role)) return;
      S.state.view = id;
      S.save();
      this.renderNav();
      this.renderCrumb();
      DCC.Waves.setTheme(v.theme);
      DCC.Waves.pulse(instant ? 0.35 : 0.6);
      this.cycleTip(true);
      const paint = () => {
        this.renderView();
        this.stage.scrollTop = 0;
        // instant jump: smooth-scrolling to top mid-transition reads as jank
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      };
      if (instant) { paint(); this.stage.classList.add('enter'); setTimeout(() => this.stage.classList.remove('enter'), 700); }
      else {
        this.stage.classList.add('leave');
        setTimeout(() => {
          this.stage.classList.remove('leave');
          paint();
          this.stage.classList.add('enter');
          setTimeout(() => this.stage.classList.remove('enter'), 700);
        }, 200);
      }
    },

    refresh() { this.renderView(true); this.renderSideFoot(); },

    viewNum(id) {
      const i = NAV[S.state.role].indexOf(id);
      return i < 0 ? VIEWS[id].num : String(i + 1).padStart(2, '0');
    },

    renderCrumb() {
      const v = VIEWS[S.state.view];
      this.crumb.innerHTML = '';
      this.crumb.append(
        el('span.crumb-num', { text: this.viewNum(S.state.view) }),
        el('span.crumb-sep', { text: '·' }),
        el('span.crumb-label', { text: v.label }));
    },

    cycleTip(reset) {
      const key = S.state.view;
      const tips = D.tips[key] || D.tips.playbook;
      this._tipIdx = reset ? Math.floor(Math.random() * tips.length) : ((this._tipIdx || 0) + 1) % tips.length;
      this.tipChip.innerHTML = '<b>TIP</b><span>' + tips[this._tipIdx % tips.length] + '</span>';
      this.tipChip.classList.remove('flash');
      void this.tipChip.offsetWidth;
      this.tipChip.classList.add('flash');
    },

    setRole(role) {
      if (S.state.role === role) return;
      S.state.role = role;
      S.state.view = NAV[role][0];
      S.save();
      this.renderSideFoot();
      DCC.Waves.pulse(1.0);
      this.go(S.state.view);
      toast(role === 'manager' ? 'Manager workspace — inspect & coach' : 'Rep workspace — sell & score');
    },

    /* ---------- view dispatch ---------- */
    renderView(soft) {
      DCC.UI.hideTip();
      this._dr = null;
      this._gapWrap = null;
      this._calloutEl = null;
      // soft re-renders (filters, sorts, deal switch) skip the reveal stagger
      this.stage.classList.toggle('soft', !!soft);
      this.stage.innerHTML = '';
      const fn = {
        playbook: this.vPlaybook, pipeline: this.vPipeline, deal: this.vDeal,
        discovery: this.vDiscovery, objections: this.vObjections, emails: this.vEmails,
        team: this.vTeam, inspect: this.vInspect, coaching: this.vCoaching
      }[S.state.view];
      if (fn) fn.call(this, soft);
      this.renderSideFoot();
    },

    head(title, subHtml, extra) {
      const v = VIEWS[S.state.view];
      return el('div.view-head.reveal', { style: { '--i': 0 } },
        el('div.kicker', { text: this.viewNum(S.state.view) + ' · ' + v.label }),
        el('h1.view-title', { html: title }),
        subHtml ? el('p.view-sub', { html: subHtml }) : null,
        extra || null);
    },

    /* ============================ REP · PLAYBOOK ============================ */
    vPlaybook() {
      const st = this.stage;
      st.appendChild(this.head(
        'Challenger is how you sell.<br>MEDDPICC is how you know it’s real.',
        'You aren’t selling ports and virtual circuits. You’re selling the removal of network drag from a cloud strategy. Challenger gives the teaching motion to reframe the deal; MEDDPICC gives the evidence standard to inspect it.'));

      // reframe quote
      st.appendChild(el('section.card.dark.reveal', { style: { '--i': 1 } },
        el('div.card-kicker', { text: D.reframe.label }),
        el('div.quote', { text: D.reframe.quote }),
        el('div.quote-note', { text: D.reframe.note })));

      // taxes counters
      st.appendChild(el('section.tax-row.reveal', { style: { '--i': 2 } },
        D.taxes.map(t => {
          const num = el('div.tax-num', { text: '0' });
          this.countUp(num, t.n, t.unit);
          return el('div.tax-card', null, num,
            el('div.tax-label', { text: t.label }),
            el('div.tax-sub', { text: t.sub }));
        })));

      // pillars
      st.appendChild(el('section.grid-3.reveal', { style: { '--i': 3 } },
        D.pillars.map(p => el('div.card.pillar', null,
          el('div.card-kicker.red', { text: p.key }),
          el('div.card-title', { text: p.title }),
          el('p.card-body', { html: p.body })))));

      // stage map
      st.appendChild(el('div.section-head.reveal', { style: { '--i': 4 } },
        el('div.kicker', { text: 'Stage map' }),
        el('h2.section-title', { text: 'Where each MEDDPICC letter gets earned' })));
      st.appendChild(el('section.grid-4.reveal', { style: { '--i': 5 } },
        D.stages.map(sg => el('div.card.stage-card', null,
          el('div.card-kicker', { text: sg.num }),
          el('div.card-title', { text: sg.name }),
          el('p.card-body.small', { text: sg.move }),
          el('div.chip-row', null, sg.letters.map(k =>
            el('span.letter-chip', { text: k, 'data-tip': letterByK(k).name })))))));

      // rules
      st.appendChild(el('section.card.reveal', { style: { '--i': 6 } },
        el('div.card-title', { text: 'Operating rules for the team' }),
        el('div.rules-grid', null, D.rules.map(r => el('div.rule', { html: '→ ' + r })))));
    },

    countUp(node, target, unit) {
      const dur = 900, t0 = performance.now();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const step = now => {
        const t = reduce ? 1 : Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        node.textContent = Math.round(target * e).toLocaleString() + (t === 1 ? unit : '');
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },

    /* ============================ REP · PIPELINE ============================ */
    vPipeline() {
      const st = this.stage;
      const t = S.team();
      st.appendChild(this.head('Score the pipeline. Find the lies.',
        D.scaleLegend + '. Click a deal to open its room. Health is evidence, not optimism.',
        el('div.head-stats', null,
          this.stat('Deals', String(t.count)),
          this.stat('Pipeline', fmtMoney(t.pipeline)),
          this.stat('Weighted', fmtMoney(Math.round(t.weighted)), 'Pipeline × evidence-based health'),
          this.stat('Commit-ready', String(t.commit)))));

      const bar = el('div.toolbar.reveal', { style: { '--i': 1 } },
        el('button.btn.primary', { text: '+ New deal', onclick: () => this.dealModal() }),
        el('div.spacer'),
        el('label.sort-label', { text: 'Sort' }),
        el('select.select', {
          onchange: e => { this.sortBy = e.target.value; this.refresh(); }
        }, ['health', 'value', 'close', 'stale'].map(o =>
          el('option', { value: o, text: { health: 'Health', value: 'Value', close: 'Close date', stale: 'Staleness' }[o], selected: this.sortBy === o ? '' : null }))));
      st.appendChild(bar);

      const deals = S.state.deals.slice().sort((a, b) => {
        if (this.sortBy === 'value') return b.value - a.value;
        if (this.sortBy === 'close') return S.daysToClose(a) - S.daysToClose(b);
        if (this.sortBy === 'stale') return S.staleDays(b) - S.staleDays(a);
        return S.health(b).pct - S.health(a).pct;
      });

      if (!deals.length) {
        st.appendChild(el('div.empty.reveal', { style: { '--i': 2 } },
          el('div.empty-title', { text: 'No deals yet' }),
          el('p.empty-sub', { text: 'Create your first deal, or load the demo pipeline to explore the app.' }),
          el('div.empty-actions', null,
            el('button.btn.primary', { text: '+ New deal', onclick: () => this.dealModal() }),
            el('button.btn', { text: 'Load demo data', onclick: () => { S.resetDemo(); this.refresh(); toast('Demo pipeline loaded', 'good'); } }))));
        return;
      }

      st.appendChild(el('div.deal-grid', null, deals.map((d, i) => this.dealCard(d, i + 2))));
    },

    stat(label, value, tip) {
      return el('div.stat' + (tip ? '' : ''), tip ? { 'data-tip': tip } : null,
        el('div.stat-v', { text: value }),
        el('div.stat-l', { text: label }));
    },

    dealCard(d, i) {
      const h = S.health(d), gate = S.gate(d), mom = S.momentum(d), stale = S.staleDays(d);
      const ring = el('canvas');
      const card = el('article.card.deal-card.reveal', {
        style: { '--i': Math.min(i, 9) },
        onclick: e => {
          if (e.target.closest('.mini-btn')) return;
          S.state.selectedDealId = d.id; S.save();
          this.go('deal');
        }
      },
        el('div.deal-card-top', null,
          el('div', null,
            el('div.deal-name', { text: d.name }),
            el('div.deal-label', { text: d.label || '—' }),
            el('div.deal-meta', { text: d.rep + ' · ' + fmtMoney(d.value) + ' · ' + D.stagesShort[d.stage - 1] })),
          el('div.ring-wrap.sm', null, ring, el('div.ring-txt', null,
            el('b', { text: h.pct + '%' })))),
        el('div.letter-strip', { 'data-tip': 'MEDDPICC scores — click card to open' },
          D.letters.map(l => {
            const sc = d.scores[l.k] ?? 0;
            return el('span.cellmini', {
              text: l.k,
              style: { background: SCORE_BG[sc], color: SCORE_FG[sc] }
            });
          })),
        el('div.deal-card-foot', null,
          el('span.badge.' + gate.cls, { text: gate.name }),
          el('span.mom' + (mom > 0 ? '.up' : mom < 0 ? '.down' : ''), {
            text: (mom > 0 ? '▲ +' : mom < 0 ? '▼ ' : '· ') + mom + ' pts', 'data-tip': 'Health momentum, last few updates'
          }),
          el('span.stale' + (stale >= 14 ? '.hot' : ''), { text: stale + 'd', 'data-tip': stale >= 14 ? 'Stale — force a test: EB access or plan edit' : 'Days since last update' }),
          el('span.spacer'),
          el('button.mini-btn', { html: '⧉', 'data-tip': 'Duplicate', onclick: () => { S.duplicateDeal(d.id); this.refresh(); toast('Deal duplicated'); } }),
          el('button.mini-btn.danger', { html: '✕', 'data-tip': 'Delete deal', onclick: () => confirmModal('Delete deal', 'Delete “' + d.name + '”? This can’t be undone.', () => { S.removeDeal(d.id); this.refresh(); toast('Deal deleted'); }) })));
      requestAnimationFrame(() => C.ring(ring, h.pct, h.status, 56, 5));
      return card;
    },

    dealModal(existing) {
      const d = existing || {};
      const f = {};
      const field = (label, node) => el('label.f-field', null, el('span.f-label', { text: label }), node);
      f.name = el('input.input', { value: d.name || '', placeholder: 'Meridian Bank' });
      f.label = el('input.input', { value: d.label || '', placeholder: 'Fabric expansion · NY4/LD4' });
      f.rep = el('select.select', null, D.reps.map(r => el('option', { value: r, text: r, selected: (d.rep || D.reps[0]) === r ? '' : null })));
      f.value = el('input.input', { type: 'number', min: '0', step: '1000', value: d.value != null ? d.value : 250000 });
      f.stage = el('select.select', null, D.stagesShort.map((s2, i2) => el('option', { value: i2 + 1, text: 'Stage ' + (i2 + 1) + ' · ' + s2, selected: (d.stage || 1) === i2 + 1 ? '' : null })));
      f.close = el('input.input', { type: 'date', value: d.closeDate || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) });
      modal(existing ? 'Edit deal' : 'New deal', el('div.f-grid', null,
        field('Account', f.name), field('Opportunity', f.label),
        field('Rep', f.rep), field('Value (TCV $)', f.value),
        field('Stage', f.stage), field('Target close', f.close)), [
        { label: 'Cancel' },
        {
          label: existing ? 'Save' : 'Create deal', primary: true, onClick: () => {
            const name = f.name.value.trim();
            if (!name) { toast('Give the deal a name', 'bad'); return true; }
            const patch = { name, label: f.label.value.trim(), rep: f.rep.value, value: Math.max(0, +f.value.value || 0), stage: +f.stage.value, closeDate: f.close.value };
            if (existing) { Object.assign(existing, patch); S.touch(existing); }
            else S.addDeal(patch);
            this.refresh();
            toast(existing ? 'Deal updated' : 'Deal created — now score it', 'good');
          }
        }
      ]);
    },

    /* ============================ REP · DEAL ROOM ============================ */
    vDeal(soft) {
      const st = this.stage;
      const d = S.deal();
      if (!d) {
        st.appendChild(this.head('No deal selected', 'Pick a deal from the pipeline, or create one to start scoring.'));
        st.appendChild(el('div.empty.reveal', { style: { '--i': 1 } },
          el('div.empty-actions', null,
            el('button.btn.primary', { text: 'Open pipeline', onclick: () => this.go('pipeline') }),
            el('button.btn', { text: '+ New deal', onclick: () => this.dealModal() }))));
        return;
      }
      const h = S.health(d), gate = S.gate(d), gaps = S.gaps(d);
      const dtc = S.daysToClose(d);

      // deal switcher + header
      const ring = el('canvas');
      const radar = el('canvas');
      const spark = el('canvas');

      st.appendChild(this.head('Score the deal. <span class="dim">Find the lie.</span>', D.scaleLegend + '. Scores and evidence notes save automatically.'));

      const ringB = el('b', { text: h.pct + '%' });
      const ringI = el('i', { text: h.label });
      const gateStat = this.stat('Gate', gate.name);

      st.appendChild(el('section.card.deal-head.reveal', { style: { '--i': 1 } },
        el('div.deal-head-main', null,
          el('div.deal-switch-row', null,
            el('select.select.deal-switch', {
              'data-tip': 'Switch deal',
              onchange: e => { S.state.selectedDealId = e.target.value; S.save(); this.refresh(); }
            }, S.state.deals.map(x => el('option', { value: x.id, text: x.name + (x.label ? ' — ' + x.label : ''), selected: x.id === d.id ? '' : null }))),
            el('button.btn.ghost.sm', { text: 'Edit', onclick: () => this.dealModal(d) }),
            el('button.btn.ghost.sm', { text: 'Copy brief', 'data-tip': 'Copy a markdown deal brief for CRM / Slack', onclick: () => copyText(this.brief(d), 'Deal brief copied') })),
          el('div.deal-meta-row', null,
            this.stat('Value', fmtMoney(d.value)),
            this.stat('Stage', D.stagesShort[d.stage - 1]),
            this.stat('Close', (dtc >= 0 ? 'in ' + dtc + 'd' : Math.abs(dtc) + 'd ago')),
            this.stat('Rep', d.rep),
            gateStat)),
        el('div.deal-head-side', null,
          el('div.ring-wrap.lg', null, ring, el('div.ring-txt', null, ringB, ringI)))));

      this._calloutEl = el('div.callout.warn.reveal', { style: { '--i': 2 } });
      st.appendChild(this._calloutEl);
      this.updateDealCallout(d);

      // live widgets stay pinned beside the scrolling scorecard
      const wPct = el('span.w-pct', { text: h.pct + '%', style: { color: C.statusColor(h.status) } });
      const wLabel = el('div.w-label', { text: h.label });
      const wGate = el('span.badge.' + gate.cls, { text: gate.name });
      const sparkNote = el('div.spark-note', { text: this.sparkNoteText(d, h) });
      const nbaBody = el('div', null, this.nbaContent(gaps));
      const widgets = el('aside.deal-widgets.reveal', { style: { '--i': 3 } },
        el('div.card.widget-card', null,
          el('div.card-kicker', { text: 'Live health' }),
          el('div.w-health-row', null, wPct,
            el('div.w-health-meta', null, wLabel, wGate))),
        el('div.card.widget-card', null,
          el('div.card-kicker', { text: 'Letter shape' }),
          el('div.radar-wrap', null, radar)),
        el('div.card.widget-card', null,
          el('div.card-kicker', { text: 'Health momentum' }),
          el('div.spark-wrap', null, spark),
          sparkNote),
        el('div.card.widget-card.nba', null,
          el('div.card-kicker', { text: 'Next best action' }),
          nbaBody));

      const scoreCol = el('div.deal-scorecol');
      st.appendChild(el('div.deal-body', null, scoreCol, widgets));

      // scorecard
      scoreCol.appendChild(el('div.section-head.reveal', { style: { '--i': 4 } },
        el('h2.section-title', { text: 'Scorecard' }),
        el('span.legend', { text: D.scaleLegend })));

      const rowRefs = {};
      scoreCol.appendChild(el('section.score-list', null, D.letters.map((l, i) => {
        const sc = d.scores[l.k];
        const scored = sc !== undefined && sc !== null;
        const noteOpen = (d.notes[l.k] || '').length > 0;
        const ta = el('textarea.note-ta', {
          placeholder: 'Evidence — what did they say, who said it, where is it written?',
          oninput: e => { d.notes[l.k] = e.target.value; clearTimeout(this._nt); this._nt = setTimeout(() => S.touch(d), 500); }
        });
        ta.value = d.notes[l.k] || '';
        const noteWrap = el('div.note-wrap' + (noteOpen ? '.open' : ''), null, ta);
        const badge = el('div.score-badge', {
          text: l.k,
          style: { background: scored ? SCORE_BG[sc] : 'rgba(255,255,255,0.06)', color: scored ? SCORE_FG[sc] : '#C3C7D4' }
        });
        const anchor = el('div.score-anchor' + (scored ? (sc >= 2 ? '.good' : '.bad') : ''), {
          text: scored ? l.anchors[sc] : 'Not scored yet — pick the anchor that matches your evidence.'
        });
        const btns = [0, 1, 2, 3].map(v =>
          el('button.score-btn' + (sc === v ? '.on' : ''), {
            text: String(v),
            'data-tip': l.anchors[v],
            onclick: () => { S.setScore(d, l.k, v); DCC.Waves.pulse(0.3); this.updateDealLive(d, l.k); }
          }));
        rowRefs[l.k] = { badge, anchor, btns };
        return el('article.card.score-row.reveal', { style: { '--i': Math.min(5 + i, 11) } },
          badge,
          el('div.score-mid', null,
            el('div.score-name-row', null,
              el('span.score-name', { text: l.name }),
              el('span.tip-dot', { 'data-tip': l.tip, text: '?' })),
            el('div.score-def', { text: l.def }),
            anchor,
            noteWrap,
            el('button.note-toggle', {
              text: noteOpen ? 'Evidence note' : '+ Evidence note',
              onclick: e => { noteWrap.classList.toggle('open'); if (noteWrap.classList.contains('open')) ta.focus(); }
            })),
          el('div.score-btns', null, btns));
      })));

      // gap plan (re-rendered in place on score changes)
      this._gapWrap = el('div.gap-wrap');
      scoreCol.appendChild(this._gapWrap);
      this.renderGapPlan(gaps);

      const compact = window.innerWidth < 1010;
      this._dr = {
        dealId: d.id, ring, ringB, ringI,
        gateStatV: gateStat.querySelector('.stat-v'),
        wPct, wLabel, wGate, radar, spark, sparkNote, nbaBody,
        rows: rowRefs,
        radarSize: compact ? 128 : 206,
        sparkW: compact ? 150 : 234, sparkH: compact ? 46 : 54,
        lastPct: 0, lastScores: {}
      };
      requestAnimationFrame(() => {
        C.ring(ring, h.pct, h.status, 96, 8);
        C.radar(radar, D.letters, d.scores, compact ? 128 : 206);
        C.spark(spark, d.history, compact ? 150 : 234, compact ? 46 : 54, h.status);
        if (this._dr && this._dr.dealId === d.id) {
          this._dr.lastPct = h.pct;
          this._dr.lastScores = Object.assign({}, d.scores);
        }
      });
    },

    /* ---- Deal Room in-place updates: no full re-render on score clicks ---- */
    sparkNoteText(d, h) {
      return d.history.length > 1
        ? 'From ' + d.history[0].pct + '% (' + fmtDate(d.history[0].ts) + ') to ' + h.pct + '% today'
        : 'Score the deal to start the trend';
    },

    nbaContent(gaps) {
      return gaps.length
        ? el('div', null,
            el('div.nba-letter', { text: gaps[0].k + ' · ' + gaps[0].name }),
            el('p.card-body.small', { text: gaps[0].action }))
        : el('div', null,
            el('div.nba-letter.good', { text: 'No open gaps' }),
            el('p.card-body.small', { text: 'Every letter is at “told to us” or better. Re-verify before commit: evidence ages.' }));
    },

    updateDealCallout(d) {
      const c = this._calloutEl;
      if (!c) return;
      const h = S.health(d), gate = S.gate(d);
      if (gate.name !== 'Commit' && h.pct >= 50)
        c.innerHTML = '<strong>Health is high but the gate says ' + gate.name + '.</strong> Check EB / DP / PP — averages hide the letter that kills the deal.';
      else if (h.pct < S.state.settings.riskThreshold)
        c.innerHTML = '<strong>Below commit threshold (' + S.state.settings.riskThreshold + '%).</strong> This deal doesn’t qualify for a forecast commit. Work the gap plan below before it goes on the sheet.';
      else { c.style.display = 'none'; return; }
      c.style.display = '';
    },

    renderGapPlan(gaps) {
      const w = this._gapWrap;
      if (!w) return;
      w.innerHTML = '';
      if (!gaps.length) return;
      w.append(
        el('div.section-head', null,
          el('h2.section-title', { text: 'Gap plan — ' + gaps.length + ' coaching action' + (gaps.length > 1 ? 's' : '') })),
        el('section.gap-list', null, gaps.map(g =>
          el('div.gap-row', null,
            el('span.gap-k', { text: g.k + ' · ' + g.name }),
            el('span.gap-action', { text: g.action })))));
    },

    updateDealLive(d, k) {
      const r = this._dr;
      if (!r || r.dealId !== d.id || S.state.view !== 'deal') { this.refresh(); return; }
      const h = S.health(d), gate = S.gate(d), gaps = S.gaps(d);
      const l = letterByK(k), sc = d.scores[k];
      const scored = sc !== undefined && sc !== null;
      const row = r.rows[k];
      if (row) {
        row.badge.style.background = scored ? SCORE_BG[sc] : 'rgba(255,255,255,0.06)';
        row.badge.style.color = scored ? SCORE_FG[sc] : '#C3C7D4';
        row.anchor.textContent = scored ? l.anchors[sc] : 'Not scored yet — pick the anchor that matches your evidence.';
        row.anchor.className = 'score-anchor' + (scored ? (sc >= 2 ? ' good' : ' bad') : '');
        row.btns.forEach((b, v) => b.classList.toggle('on', sc === v));
      }
      const col = C.statusColor(h.status);
      r.wPct.textContent = h.pct + '%';
      r.wPct.style.color = col;
      r.wLabel.textContent = h.label;
      r.wGate.className = 'badge ' + gate.cls;
      r.wGate.textContent = gate.name;
      r.ringB.textContent = h.pct + '%';
      r.ringI.textContent = h.label;
      r.gateStatV.textContent = gate.name;
      r.sparkNote.textContent = this.sparkNoteText(d, h);
      r.nbaBody.innerHTML = '';
      r.nbaBody.appendChild(this.nbaContent(gaps));
      C.ring(r.ring, h.pct, h.status, 96, 8, r.lastPct);
      C.radar(r.radar, D.letters, d.scores, r.radarSize, r.lastScores);
      C.spark(r.spark, d.history, r.sparkW, r.sparkH, h.status, true);
      this.renderGapPlan(gaps);
      this.updateDealCallout(d);
      this.renderSideFoot();
      r.lastPct = h.pct;
      r.lastScores = Object.assign({}, d.scores);
    },

    brief(d) {
      const h = S.health(d), gate = S.gate(d), gaps = S.gaps(d);
      const lines = [
        '# Deal brief — ' + d.name + (d.label ? ' (' + d.label + ')' : ''),
        'Rep: ' + d.rep + ' · Value: ' + fmtMoney(d.value) + ' · Stage ' + d.stage + ' (' + D.stagesShort[d.stage - 1] + ') · Close: ' + d.closeDate,
        'Health: ' + h.pct + '% — ' + h.label + ' · Forecast gate: ' + gate.name,
        '',
        '## Scorecard (' + D.scaleLegend + ')'
      ];
      D.letters.forEach(l => {
        const sc = d.scores[l.k];
        lines.push('- ' + l.k + ' ' + l.name + ': ' + (sc ?? '—') + '/3' + (sc != null ? ' — ' + l.anchors[sc] : ''));
        if (d.notes[l.k]) lines.push('  - Evidence: ' + d.notes[l.k]);
      });
      if (gaps.length) {
        lines.push('', '## Gaps → actions');
        gaps.forEach(g => lines.push('- ' + g.k + ' ' + g.name + ': ' + g.action));
      }
      if (d.coachLog.length) {
        lines.push('', '## Coaching log');
        d.coachLog.forEach(c2 => lines.push('- ' + new Date(c2.ts).toLocaleDateString() + ': ' + c2.text));
      }
      return lines.join('\n');
    },

    /* ============================ REP · DISCOVERY ============================ */
    vDiscovery() {
      const st = this.stage;
      const d = S.deal();
      st.appendChild(this.head('Questions that teach while they qualify',
        'Every question carries an implied insight. Filter by the MEDDPICC letter you’re missing' + (d ? ' — asked-state saves to <strong>' + d.name + '</strong>.' : '.')));

      const chips = ['ALL', ...D.letters.map(l => l.k)];
      st.appendChild(el('div.chip-bar.reveal', { style: { '--i': 1 } },
        chips.map(k => el('button.chip' + (this.filter === k ? '.on' : ''), {
          text: k === 'ALL' ? 'All' : k,
          'data-tip': k === 'ALL' ? 'All questions' : letterByK(k).name,
          onclick: () => { this.filter = k; this.refresh(); }
        })),
        el('span.spacer'),
        d ? el('button.chip.alt' + (this.hideAsked ? '.on' : ''), {
          text: 'Hide asked', onclick: () => { this.hideAsked = !this.hideAsked; this.refresh(); }
        }) : null));

      let qs = D.questions.filter(q => this.filter === 'ALL' || q.tag === this.filter);
      if (d && this.hideAsked) qs = qs.filter(q => !d.asked.includes(q.id));

      st.appendChild(el('section.q-list', null, qs.map((q, i) => {
        let asked = d && d.asked.includes(q.id);
        let card;
        const askBtn = d ? el('button.mini-btn' + (asked ? '.good' : ''), {
          html: asked ? '✓' : '○', 'data-tip': asked ? 'Asked — click to unmark' : 'Mark as asked on ' + d.name,
          onclick: () => {
            asked = !asked;
            d.asked = asked ? d.asked.concat(q.id) : d.asked.filter(x => x !== q.id);
            S.touch(d);
            if (this.hideAsked) { this.refresh(); return; }
            card.classList.toggle('asked', asked);
            askBtn.classList.toggle('good', asked);
            askBtn.innerHTML = asked ? '✓' : '○';
            askBtn.setAttribute('data-tip', asked ? 'Asked — click to unmark' : 'Mark as asked on ' + d.name);
          }
        }) : null;
        card = el('article.card.q-card.reveal' + (asked ? '.asked' : ''), { style: { '--i': Math.min(i + 2, 10) } },
          el('div.q-top', null,
            el('span.letter-chip', { text: q.tag, 'data-tip': letterByK(q.tag).name }),
            el('span.q-text', { text: q.q }),
            el('span.spacer'),
            el('button.mini-btn', { html: '⧉', 'data-tip': 'Copy question', onclick: () => copyText(q.q, 'Question copied') }),
            askBtn),
          S.state.settings.showListen
            ? el('div.q-listen', { html: '<b>Listen for</b>' + q.listen })
            : null);
        return card;
      })));
    },

    /* ============================ REP · OBJECTIONS ============================ */
    vObjections() {
      const st = this.stage;
      st.appendChild(this.head('Reframe. Don’t rebut.',
        'Each objection has a trap (the answer a vendor gives) and a Challenger reframe. Click to expand; copy the track and make it yours.'));

      // bodies are always in the DOM; open/close animates height in place
      st.appendChild(el('section.obj-list', null, D.objections.map((o, i) => {
        const open = this.openObj === i;
        const chev = el('span.obj-chev', { text: open ? '−' : '+' });
        const card = el('article.card.obj-card.reveal' + (open ? '.open' : ''), { style: { '--i': Math.min(i + 1, 9) } },
          el('button.obj-head', {
            onclick: () => {
              const wasOpen = card.classList.contains('open');
              st.querySelectorAll('.obj-card.open').forEach(c => {
                c.classList.remove('open');
                const ch = c.querySelector('.obj-chev');
                if (ch) ch.textContent = '+';
              });
              if (wasOpen) { this.openObj = -1; return; }
              card.classList.add('open');
              chev.textContent = '−';
              this.openObj = i;
            }
          },
            el('span.obj-title', { text: '“' + o.title + '”' }),
            chev),
          el('div.obj-wrap', null,
            el('div.obj-body', null,
              el('div.obj-trap', null,
                el('div.card-kicker.amber', { text: 'The trap' }),
                el('p', { text: o.trap })),
              el('div.obj-track', null,
                el('div.card-kicker', { text: 'The reframe' }),
                el('p', { text: o.track }),
                el('button.btn.ghost.sm', { text: 'Copy track', onclick: () => copyText(o.track, 'Reframe copied') })))));
        return card;
      })));
    },

    /* ============================ REP · EMAILS ============================ */
    vEmails() {
      const st = this.stage;
      st.appendChild(this.head('Emails that teach in the first line',
        'No “hope you’re well.” No feature lists. Insight, tension, one ask. <span class="ph-demo">{placeholders}</span> are highlighted — fill them with the customer’s numbers before sending.'));

      st.appendChild(el('section.mail-list', null, D.emails.map((m, i) =>
        el('article.card.mail-card.reveal', { style: { '--i': i + 1 } },
          el('div.mail-head', null,
            el('div', null,
              el('div.card-title', { text: m.name }),
              el('div.mail-when', { text: m.when })),
            el('button.btn.primary.sm', { text: 'Copy', onclick: () => copyText('Subject: ' + m.subject + '\n\n' + m.body, '“' + m.name + '” copied') })),
          el('div.mail-body', null,
            el('div.mail-subject', { html: 'Subject: ' + this.hilitePh(m.subject) }),
            el('div.mail-text', { html: this.hilitePh(m.body) }))))));
    },

    hilitePh(text) {
      return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/\{([^}]+)\}/g, '<mark class="ph">{$1}</mark>')
        .replace(/\n/g, '<br>');
    },

    /* ============================ MGR · TEAM COMMAND ============================ */
    vTeam() {
      const st = this.stage;
      const t = S.team();
      const deals = S.state.deals;
      st.appendChild(this.head('Inspect evidence, not enthusiasm.',
        'The pipeline as your reps scored it — every claim maps to a letter. The darkest column is the team’s skill gap; the darkest row is this week’s deal review.'));

      // KPIs
      st.appendChild(el('section.kpi-row.reveal', { style: { '--i': 1 } },
        this.kpi(fmtMoney(t.pipeline), 'Total pipeline', null),
        this.kpi(fmtMoney(Math.round(t.weighted)), 'Evidence-weighted', 'Σ value × health. The honest number.'),
        this.kpi(t.commit + ' / ' + t.count, 'Commit-ready', 'Deals passing the commit gate: EB ≥2, DP ≥2, PP ≥2, health ≥ ' + S.state.settings.riskThreshold + '%'),
        this.kpi(String(t.risk), 'At risk', 'Fragile health, or open gaps with < 45 days to close', t.risk > 0 ? 'bad' : 'good'),
        this.kpi(t.avg + '%', 'Avg health', null, t.avg >= S.state.settings.riskThreshold ? 'good' : t.avg >= 35 ? 'warn' : 'bad')));

      if (!deals.length) {
        st.appendChild(el('div.empty.reveal', { style: { '--i': 2 } },
          el('div.empty-title', { text: 'No deals in the pipeline' }),
          el('div.empty-actions', null,
            el('button.btn', { text: 'Load demo data', onclick: () => { S.resetDemo(); this.refresh(); } }))));
        return;
      }

      // heatmap
      st.appendChild(el('div.section-head.reveal', { style: { '--i': 2 } },
        el('h2.section-title', { text: 'MEDDPICC heatmap' }),
        el('span.legend', { text: D.scaleLegend })));

      const hm = el('div.heatmap.reveal', { style: { '--i': 3 } });
      // header row
      hm.appendChild(el('div.hm-corner', { text: 'Deal' }));
      D.letters.forEach(l => hm.appendChild(el('div.hm-col', { text: l.k, 'data-tip': l.name })));
      hm.appendChild(el('div.hm-col.end', { text: 'Health' }));
      deals.forEach(d => {
        const h = S.health(d);
        hm.appendChild(el('button.hm-deal', {
          onclick: () => { S.state.inspectDealId = d.id; S.save(); this.go('inspect'); },
          'data-tip': 'Open in Deal Inspect'
        },
          el('span.hm-deal-name', { text: d.name }),
          el('span.hm-deal-rep', { text: d.rep })));
        D.letters.forEach(l => {
          const sc = d.scores[l.k] ?? 0;
          hm.appendChild(el('div.hm-cell', {
            text: String(sc),
            'data-tip': d.name + ' · ' + l.name + ': ' + letterByK(l.k).anchors[sc],
            style: { background: SCORE_BG[sc], color: SCORE_FG[sc] }
          }));
        });
        hm.appendChild(el('div.hm-health', { text: h.pct + '%', style: { color: C.statusColor(h.status) } }));
      });
      hm.style.gridTemplateColumns = 'minmax(150px, 1.4fr) repeat(' + D.letters.length + ', minmax(34px, 1fr)) 64px';
      st.appendChild(el('section.card.hm-card.reveal', { style: { '--i': 3 } }, el('div.hm-scroll', null, hm)));

      // distributions + attention
      const gateRows = ['Commit', 'Best case', 'Pipeline', 'Unqualified'].map(g => ({
        label: g,
        count: deals.filter(d => S.gate(d).name === g).length,
        status: { 'Commit': 'good', 'Best case': 'warn', 'Pipeline': 'dim', 'Unqualified': 'bad' }[g]
      }));
      const buckets = [
        { label: 'Commit-ready', test: h => h >= S.state.settings.riskThreshold, status: 'good' },
        { label: 'Developing', test: h => h >= 35 && h < S.state.settings.riskThreshold, status: 'warn' },
        { label: 'Fragile', test: h => h < 35, status: 'bad' }
      ].map(b => ({ label: b.label, count: deals.filter(d => b.test(S.health(d).pct)).length, status: b.status }));

      const gateCv = el('canvas'), distCv = el('canvas');
      const attention = deals
        .map(d => ({ d, h: S.health(d), stale: S.staleDays(d), dtc: S.daysToClose(d), gaps: S.gaps(d) }))
        .filter(x => x.stale >= 14 || (x.gaps.length && x.dtc < 45))
        .sort((a, b) => b.stale - a.stale);

      st.appendChild(el('section.grid-3.reveal', { style: { '--i': 4 } },
        el('div.card', null,
          el('div.card-kicker', { text: 'Forecast gates' }),
          gateCv),
        el('div.card', null,
          el('div.card-kicker', { text: 'Health distribution' }),
          distCv),
        el('div.card.attn-card', null,
          el('div.card-kicker.amber', { text: 'Needs attention' }),
          attention.length
            ? el('div.attn-list', null, attention.slice(0, 4).map(x =>
                el('button.attn-row', { onclick: () => { S.state.inspectDealId = x.d.id; S.save(); this.go('inspect'); } },
                  el('span.attn-name', { text: x.d.name }),
                  el('span.attn-why', { text: x.stale >= 14 ? x.stale + 'd untouched' : x.gaps.length + ' gaps · closes in ' + x.dtc + 'd' }))))
            : el('p.card-body.small', { text: 'Nothing on fire. Inspect the commit deals anyway — evidence ages.' }))));

      requestAnimationFrame(() => {
        C.dist(gateCv, gateRows, 290);
        C.dist(distCv, buckets, 290);
      });
    },

    kpi(v, l, tip, status) {
      return el('div.kpi' + (status ? '.' + status : ''), tip ? { 'data-tip': tip } : null,
        el('div.kpi-v', { text: v }),
        el('div.kpi-l', { text: l }));
    },

    /* ============================ MGR · INSPECT ============================ */
    vInspect() {
      const st = this.stage;
      const deals = S.state.deals;
      if (!S.state.inspectDealId && deals.length) S.state.inspectDealId = deals[0].id;
      const d = deals.find(x => x.id === S.state.inspectDealId);

      st.appendChild(this.head('The deal review, live',
        'Run the five questions against the rep’s scorecard. Vague answer → score it together, lower. End with one coaching action, logged.'));

      if (!d) {
        st.appendChild(el('div.empty.reveal', { style: { '--i': 1 } }, el('div.empty-title', { text: 'No deals to inspect' })));
        return;
      }

      st.appendChild(el('div.chip-bar.reveal', { style: { '--i': 1 } }, deals.map(x =>
        el('button.chip' + (x.id === d.id ? '.on' : ''), {
          text: x.name, onclick: () => { S.state.inspectDealId = x.id; S.save(); this.refresh(); }
        }))));

      const h = S.health(d), gate = S.gate(d), gaps = S.gaps(d), mom = S.momentum(d);
      const ring = el('canvas'), radar = el('canvas');

      st.appendChild(el('section.card.deal-head.reveal', { style: { '--i': 2 } },
        el('div.deal-head-main', null,
          el('div.deal-name.lg', { text: d.name }),
          el('div.deal-label', { text: (d.label || '') + ' · ' + d.rep }),
          el('div.deal-meta-row', null,
            this.stat('Value', fmtMoney(d.value)),
            this.stat('Stage', D.stagesShort[d.stage - 1]),
            this.stat('Close', 'in ' + S.daysToClose(d) + 'd'),
            this.stat('Gate', gate.name),
            this.stat('Momentum', (mom > 0 ? '+' : '') + mom + ' pts'),
            this.stat('Untouched', S.staleDays(d) + 'd'))),
        el('div.deal-head-side', null,
          el('div.ring-wrap.lg', null, ring, el('div.ring-txt', null, el('b', { text: h.pct + '%' }), el('i', { text: h.label }))))));

      // letters + gaps
      st.appendChild(el('section.grid-2.reveal', { style: { '--i': 3 } },
        el('div.card.chart-card', null,
          el('div.card-kicker', { text: 'Letter shape' }),
          el('div.radar-wrap', null, radar)),
        el('div.card', null,
          el('div.card-kicker.amber', { text: 'Where it dies today' }),
          gaps.length
            ? el('div.gap-list.tight', null, gaps.map(g => el('div.gap-row', null,
                el('span.gap-k', { text: g.k + ' · ' + g.name }),
                el('span.gap-action', { text: g.action }))))
            : el('p.card-body.small', { text: 'No letter at 0–1. Pressure-test the 3s — ask for the evidence behind each.' }))));

      // five questions
      st.appendChild(el('div.section-head.reveal', { style: { '--i': 4 } },
        el('h2.section-title', { text: 'The five questions' })));
      st.appendChild(el('section.coach-list', null, D.coach.map((q, i) =>
        el('article.card.coach-row.reveal', { style: { '--i': Math.min(5 + i, 10) } },
          el('div.coach-num', { text: q.num }),
          el('div.coach-mid', null,
            el('div.coach-q', { text: '“' + q.q + '”' }),
            el('div.coach-cols', null,
              el('div.coach-good', { html: '<b>Good sounds like</b>' + q.good }),
              el('div.coach-bad', { html: '<b>Red flag</b>' + q.bad })),
            el('div.chip-row', null, q.letters.map(k => {
              const sc = d.scores[k] ?? 0;
              return el('span.letter-chip', {
                text: k + ' · ' + sc,
                'data-tip': letterByK(k).name + ' currently ' + sc + '/3 on this deal',
                style: sc <= 1 ? { background: '#58101B', color: '#FFB9C1' } : null
              });
            })))))));

      // coaching log
      const ta = el('textarea.note-ta.log-ta', { placeholder: 'One gap, one action, one date. e.g. “PP=0 with 45-day close — Priya maps paper process with champion by Friday.”' });
      st.appendChild(el('div.section-head.reveal', { style: { '--i': 11 } },
        el('h2.section-title', { text: 'Coaching log' })));
      st.appendChild(el('section.card.reveal', { style: { '--i': 12 } },
        el('div.log-input', null, ta,
          el('button.btn.primary', {
            text: 'Log action', onclick: () => {
              const text = ta.value.trim();
              if (!text) { toast('Write the action first', 'bad'); return; }
              d.coachLog.unshift({ ts: Date.now(), text });
              S.touch(d);
              this.refresh();
              toast('Coaching action logged', 'good');
            }
          })),
        d.coachLog.length
          ? el('div.log-list', null, d.coachLog.map((c2, ci) =>
              el('div.log-row', null,
                el('span.log-date', { text: fmtDate(c2.ts) }),
                el('span.log-text', { text: c2.text }),
                el('button.mini-btn.danger', { html: '✕', 'data-tip': 'Remove entry', onclick: () => { d.coachLog.splice(ci, 1); S.touch(d); this.refresh(); } }))))
          : el('p.card-body.small.dim2', { text: 'No coaching actions yet. A review without a logged action didn’t happen.' })));

      requestAnimationFrame(() => {
        C.ring(ring, h.pct, h.status, 96, 8);
        C.radar(radar, D.letters, d.scores, 230);
      });
    },

    /* ============================ MGR · COACHING GUIDE ============================ */
    vCoaching() {
      const st = this.stage;
      st.appendChild(this.head('The 15-minute deal review',
        'Five questions, in order. You’re not inspecting the deal — you’re inspecting the rep’s evidence. Vague answer → open Deal Inspect and score it live, together.'));

      st.appendChild(el('section.coach-list', null, D.coach.map((q, i) =>
        el('article.card.coach-row.reveal', { style: { '--i': i + 1 } },
          el('div.coach-num', { text: q.num }),
          el('div.coach-mid', null,
            el('div.coach-q', { text: '“' + q.q + '”' }),
            el('div.coach-cols', null,
              el('div.coach-good', { html: '<b>Good sounds like</b>' + q.good }),
              el('div.coach-bad', { html: '<b>Red flag</b>' + q.bad })))))));

      st.appendChild(el('section.card.dark.reveal', { style: { '--i': 6 } },
        el('div.card-kicker', { text: 'Forecast gates' }),
        el('div.gates-grid', null, D.gates.map(g =>
          el('div.gate-col', null,
            el('div.gate-name', { text: g.name }),
            el('p.gate-rule', { text: g.rule }),
            el('div.gate-test', { text: g.test }))))));

      st.appendChild(el('section.card.reveal', { style: { '--i': 7 } },
        el('div.card-title', { text: 'Manager operating rules' }),
        el('div.rules-grid', null, D.managerRules.map(r => el('div.rule', { html: '→ ' + r })))));
    },

    /* ============================ palette / settings / keys / tour ============================ */
    palette() {
      const cmds = [];
      NAV[S.state.role].forEach(id => cmds.push({ kind: 'Go', label: VIEWS[id].label, run: () => this.go(id) }));
      cmds.push({ kind: 'Role', label: S.state.role === 'rep' ? 'Switch to Manager workspace' : 'Switch to Rep workspace', run: () => this.setRole(S.state.role === 'rep' ? 'manager' : 'rep') });
      S.state.deals.forEach(d => {
        const h = S.health(d);
        cmds.push({
          kind: 'Deal', label: d.name, meta: h.pct + '% · ' + d.rep,
          run: () => {
            if (S.state.role === 'manager') { S.state.inspectDealId = d.id; S.save(); this.go('inspect'); }
            else { S.state.selectedDealId = d.id; S.save(); this.go('deal'); }
          }
        });
      });
      if (S.state.role === 'rep') cmds.push({ kind: 'New', label: 'New deal…', run: () => this.dealModal() });
      const d = S.deal();
      if (d && S.state.role === 'rep') cmds.push({ kind: 'Copy', label: 'Copy deal brief — ' + d.name, run: () => copyText(this.brief(d), 'Deal brief copied') });
      cmds.push({ kind: 'App', label: 'Settings & data', run: () => this.settings() });
      cmds.push({ kind: 'App', label: 'Replay guided tour', run: () => this.startTour() });
      cmds.push({ kind: 'App', label: 'Keyboard shortcuts', run: () => this.helpModal() });
      openPalette(cmds);
    },

    settings() {
      const s = S.state.settings;
      const thr = el('input', { type: 'range', min: '30', max: '85', step: '5', value: s.riskThreshold, class: 'range' });
      const thrV = el('span.range-v', { text: s.riskThreshold + '%' });
      thr.addEventListener('input', () => { thrV.textContent = thr.value + '%'; });
      const listen = el('input', { type: 'checkbox' }); listen.checked = s.showListen;
      const motion = el('input', { type: 'checkbox' }); motion.checked = s.motion;
      const fileIn = el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
      fileIn.addEventListener('change', () => {
        const f = fileIn.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try { S.importJSON(r.result); m.close(); this.renderNav(); this.go(NAV[S.state.role][0], true); toast('Data imported', 'good'); }
          catch (e) { toast('Import failed: ' + e.message, 'bad'); }
        };
        r.readAsText(f);
      });

      const body = el('div.settings', null,
        el('div.set-row', null,
          el('div.set-txt', null, el('b', { text: 'Commit threshold' }), el('span', { text: 'Health % required before a deal qualifies for forecast commit' })),
          el('div.set-ctl', null, thr, thrV)),
        el('div.set-row', null,
          el('div.set-txt', null, el('b', { text: '“Listen for” hints' }), el('span', { text: 'Coaching hints under each discovery question' })),
          el('label.switch', null, listen, el('span.slider'))),
        el('div.set-row', null,
          el('div.set-txt', null, el('b', { text: 'Waveform motion' }), el('span', { text: 'Animated WebGL background (auto-off with reduced-motion)' })),
          el('label.switch', null, motion, el('span.slider'))),
        el('div.set-div'),
        el('div.set-actions', null,
          el('button.btn', {
            text: 'Export data (JSON)', onclick: () => {
              const blob = new Blob([S.exportJSON()], { type: 'application/json' });
              const a = el('a', { href: URL.createObjectURL(blob), download: 'dealproof-export.json' });
              document.body.appendChild(a); a.click(); a.remove();
              toast('Export downloaded', 'good');
            }
          }),
          el('button.btn', { text: 'Import data…', onclick: () => fileIn.click() }),
          el('button.btn', { text: 'Reset demo data', onclick: () => confirmModal('Reset to demo data', 'Replace ALL current deals with the demo pipeline?', () => { S.resetDemo(); m.close(); this.go(NAV[S.state.role][0], true); toast('Demo data restored', 'good'); }, 'Reset') }),
          el('button.btn.danger', { text: 'Clear everything', onclick: () => confirmModal('Clear all data', 'Delete every deal and start empty?', () => { S.clearAll(); m.close(); this.go(NAV[S.state.role][0], true); toast('All data cleared'); }, 'Clear') })),
        fileIn);

      const m = modal('Settings & data', body, [
        {
          label: 'Save settings', primary: true, onClick: () => {
            s.riskThreshold = +thr.value;
            s.showListen = listen.checked;
            s.motion = motion.checked;
            S.save();
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            DCC.Waves.setMotion(s.motion && !reduce);
            this.refresh();
            toast('Settings saved', 'good');
          }
        }
      ]);
    },

    helpModal() {
      const rows = [
        ['1 – ' + NAV[S.state.role].length, 'Jump to section'],
        ['R', 'Toggle Rep / Manager workspace'],
        ['⌘K / Ctrl+K', 'Command palette'],
        ['N', 'New deal (rep)'],
        ['Esc', 'Close dialogs'],
        ['?', 'This help']
      ];
      modal('Keyboard shortcuts', el('div.kbd-list', null, rows.map(r =>
        el('div.kbd-row', null, el('kbd', { text: r[0] }), el('span', { text: r[1] })))));
    },

    bindKeys() {
      document.addEventListener('keydown', e => {
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.palette(); return; }
        if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
        const nav = NAV[S.state.role];
        if (/^[1-9]$/.test(e.key) && +e.key <= nav.length) { this.go(nav[+e.key - 1]); return; }
        if (e.key.toLowerCase() === 'r') { this.setRole(S.state.role === 'rep' ? 'manager' : 'rep'); return; }
        if (e.key.toLowerCase() === 'n' && S.state.role === 'rep') { this.dealModal(); return; }
        if (e.key === '?') { this.helpModal(); }
      });
    },

    startTour() {
      const wasManager = S.state.role === 'manager';
      tour([
        { sel: '.side-brand', title: 'One app, two jobs', body: 'DealProof runs the Challenger sales motion on a MEDDPICC evidence backbone — for the reps working deals and the managers inspecting them.' },
        { sel: '.role-toggle', title: 'Rep ↔ Manager', body: 'Reps get the pipeline, deal rooms and talk tracks. Managers get the team heatmap, deal inspection and coaching tools. Press R to flip anytime.' },
        { sel: '.side-nav', title: 'The workspace', body: 'Number keys 1–6 jump between sections. Everything autosaves as you work.', before: () => { if (S.state.role !== 'rep') this.setRole('rep'); } },
        { sel: '.deal-grid, .empty', title: 'Deals, scored on evidence', body: 'Each deal is scored 0–3 per MEDDPICC letter. Health, forecast gates and coaching actions all derive from those scores.', before: () => this.go('pipeline'), wait: 420 },
        { sel: '.tip-chip', title: 'Coaching everywhere', body: 'Contextual Challenger tips live down here, hover ?-dots and score buttons for guidance, and ⌘K searches everything. Enjoy the waves.' }
      ], () => {
        S.state.tourDone = true; S.save();
        if (wasManager) this.setRole('manager');
      });
    }
  };

  window.addEventListener('DOMContentLoaded', () => App.boot());
  DCC.App = App;
})();
