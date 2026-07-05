/* ============================================================
   DealProof — state, persistence & deal math
   ============================================================ */
'use strict';

(function () {
  const KEY = 'eqx-dcc-v2';
  const LEGACY_KEY = 'eqx-deal-scorecard';
  const DAY = 86400000;

  const uid = () => 'd-' + Math.random().toString(36).slice(2, 9);

  function blankDeal(over) {
    return Object.assign({
      id: uid(), name: 'New deal', label: '', rep: DCC.DATA.reps[0],
      value: 0, stage: 1, closeDate: new Date(Date.now() + 90 * DAY).toISOString().slice(0, 10),
      scores: {}, notes: {}, asked: [], coachLog: [], history: [],
      createdAt: Date.now(), updatedAt: Date.now()
    }, over || {});
  }

  function seedDeals() {
    const now = Date.now();
    return DCC.DATA.seedDeals.map((s, i) => blankDeal({
      id: s.id, name: s.name, label: s.label, rep: s.rep, value: s.value, stage: s.stage,
      closeDate: new Date(now + s.closeIn * DAY).toISOString().slice(0, 10),
      scores: Object.assign({}, s.scores),
      notes: Object.assign({}, s.notes),
      asked: s.asked.slice(),
      coachLog: s.coachLog.map(c => ({ ts: now + c.d * DAY, text: c.text })),
      history: s.history.map((pct, j) => ({ ts: now - (s.history.length - 1 - j) * 9 * DAY, pct })),
      createdAt: now - (60 - i * 7) * DAY,
      updatedAt: now - [1, 3, 8, 24, 2][i % 5] * DAY
    }));
  }

  function migrateLegacy(state) {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const old = JSON.parse(raw);
      if (old && (old.dealName || Object.keys(old.scores || {}).length)) {
        state.deals.unshift(blankDeal({
          name: old.dealName || 'Imported deal', label: 'Imported from v1 scorecard',
          scores: old.scores || {}
        }));
      }
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) { /* legacy data unreadable — skip */ }
  }

  function defaults() {
    const state = {
      v: 2, role: 'rep', view: 'playbook',
      selectedDealId: null, inspectDealId: null,
      deals: seedDeals(),
      settings: { riskThreshold: 60, showListen: true, motion: true, seeded: true },
      tourDone: false
    };
    migrateLegacy(state);
    state.selectedDealId = state.deals[0] ? state.deals[0].id : null;
    return state;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.v === 2 && Array.isArray(s.deals)) {
          const d = defaults();
          // tolerate additions to settings across versions
          s.settings = Object.assign(d.settings, s.settings || {});
          return s;
        }
      }
    } catch (e) { /* corrupted store — start fresh */ }
    return defaults();
  }

  const Store = {
    state: load(),

    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { /* quota/private mode */ }
    },

    deal(id) { return this.state.deals.find(d => d.id === (id || this.state.selectedDealId)) || null; },

    addDeal(over) {
      const d = blankDeal(over);
      this.state.deals.unshift(d);
      this.state.selectedDealId = d.id;
      this.save();
      return d;
    },

    duplicateDeal(id) {
      const src = this.deal(id);
      if (!src) return null;
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = uid();
      copy.name = src.name + ' (copy)';
      copy.createdAt = copy.updatedAt = Date.now();
      this.state.deals.unshift(copy);
      this.save();
      return copy;
    },

    removeDeal(id) {
      this.state.deals = this.state.deals.filter(d => d.id !== id);
      if (this.state.selectedDealId === id) this.state.selectedDealId = this.state.deals[0] ? this.state.deals[0].id : null;
      if (this.state.inspectDealId === id) this.state.inspectDealId = null;
      this.save();
    },

    touch(deal) {
      deal.updatedAt = Date.now();
      this.save();
    },

    setScore(deal, k, v) {
      if (deal.scores[k] === v) delete deal.scores[k];
      else deal.scores[k] = v;
      const pct = this.health(deal).pct;
      const last = deal.history[deal.history.length - 1];
      if (!last || Date.now() - last.ts > DAY / 2) deal.history.push({ ts: Date.now(), pct });
      else last.pct = pct;
      if (deal.history.length > 60) deal.history = deal.history.slice(-60);
      this.touch(deal);
    },

    /* ---------- math ---------- */
    health(deal) {
      const t = this.state.settings.riskThreshold;
      let sum = 0;
      DCC.DATA.letters.forEach(l => { sum += Math.max(0, deal.scores[l.k] ?? 0); });
      const pct = Math.round((sum / (DCC.DATA.letters.length * 3)) * 100);
      const status = pct >= t ? 'good' : (pct >= 35 ? 'warn' : 'bad');
      const label = pct >= t ? 'Commit-ready' : (pct >= 35 ? 'Developing' : 'Fragile');
      return { pct, status, label };
    },

    gate(deal) {
      const s = k => deal.scores[k] ?? 0;
      const h = this.health(deal);
      if (s('EB') >= 2 && s('DP') >= 2 && s('PP') >= 2 && h.pct >= this.state.settings.riskThreshold)
        return { name: 'Commit', cls: 'good' };
      if (s('M') >= 2 && s('CH') >= 2 && s('DC') >= 2) return { name: 'Best case', cls: 'warn' };
      if (s('IP') >= 1) return { name: 'Pipeline', cls: 'dim' };
      return { name: 'Unqualified', cls: 'bad' };
    },

    gaps(deal) {
      return DCC.DATA.letters.filter(l => (deal.scores[l.k] ?? 0) <= 1);
    },

    momentum(deal) {
      const h = deal.history;
      if (h.length < 2) return 0;
      return h[h.length - 1].pct - h[Math.max(0, h.length - 4)].pct;
    },

    staleDays(deal) {
      return Math.floor((Date.now() - deal.updatedAt) / DAY);
    },

    daysToClose(deal) {
      return Math.ceil((new Date(deal.closeDate + 'T12:00:00').getTime() - Date.now()) / DAY);
    },

    team() {
      const deals = this.state.deals;
      const t = this.state.settings.riskThreshold;
      let pipeline = 0, weighted = 0, commit = 0, risk = 0, hsum = 0;
      deals.forEach(d => {
        const h = this.health(d);
        pipeline += d.value;
        weighted += d.value * h.pct / 100;
        hsum += h.pct;
        if (this.gate(d).name === 'Commit') commit++;
        if (h.pct < 35 || (this.gaps(d).length > 0 && this.daysToClose(d) < 45)) risk++;
      });
      return {
        pipeline, weighted, commit, risk,
        avg: deals.length ? Math.round(hsum / deals.length) : 0,
        count: deals.length
      };
    },

    /* ---------- import / export ---------- */
    exportJSON() {
      return JSON.stringify(this.state, null, 2);
    },

    importJSON(text) {
      const s = JSON.parse(text);
      if (!s || s.v !== 2 || !Array.isArray(s.deals)) throw new Error('Not a DealProof export');
      this.state = s;
      this.save();
    },

    resetDemo() {
      localStorage.removeItem(KEY);
      this.state = defaults();
      this.save();
    },

    clearAll() {
      this.state = defaults();
      this.state.deals = [];
      this.state.selectedDealId = null;
      this.state.tourDone = true;
      this.save();
    }
  };

  DCC.Store = Store;
  DCC.fmtMoney = v => v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : '$' + Math.round(v / 1e3) + 'k';
  DCC.fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
})();
