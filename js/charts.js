/* ============================================================
   DealProof — canvas charts
   Ring gauge · MEDDPICC radar · sparkline · distribution bars
   All single-series, accent-violet, digits/labels carry meaning
   (never color alone). Animated mount, DPR-crisp.
   ============================================================ */
'use strict';

(function () {
  const INK = '#F5F6FA', INK2 = '#C3C7D4', INK3 = '#8F94A6';
  const GRID = 'rgba(255,255,255,0.11)';
  const STATUS = { good: '#45D694', warn: '#F5BA4B', bad: '#FF6670', dim: '#8F94A6' };
  const RED = '#9D74F8', RED_SOFT = 'rgba(139,92,246,0.2)';

  function setup(canvas, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  }

  const eases = t => 1 - Math.pow(1 - t, 3);

  function animate(draw, dur) {
    const t0 = performance.now();
    const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function frame(now) {
      const t = motion ? Math.min(1, (now - t0) / (dur || 700)) : 1;
      draw(eases(t));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const Charts = {
    statusColor: s => STATUS[s] || STATUS.dim,

    /* Ring gauge: pct 0-100, status good|warn|bad. Center text is DOM (crisper).
       Pass fromPct to animate from a previous value instead of from zero. */
    ring(canvas, pct, status, size, thick, fromPct) {
      const s = size || 84, th = thick || 7;
      const ctx = setup(canvas, s, s);
      const c = s / 2, r = c - th / 2 - 1;
      const col = STATUS[status] || RED;
      const p0 = fromPct || 0;
      animate(t => {
        ctx.clearRect(0, 0, s, s);
        ctx.lineWidth = th;
        ctx.lineCap = 'round';
        ctx.strokeStyle = GRID;
        ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke();
        const cur = p0 + (pct - p0) * t;
        const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * (cur / 100);
        if (cur > 0.4) {
          ctx.strokeStyle = col;
          ctx.shadowColor = col; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(c, c, r, a0, a1); ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }, fromPct != null ? 450 : 700);
    },

    /* Radar: 8 MEDDPICC letters, values 0-3.
       Pass fromScores to morph from a previous shape instead of growing from center. */
    radar(canvas, letters, scores, size, fromScores) {
      const s = size || 240;
      const ctx = setup(canvas, s, s);
      const c = s / 2, R = c - 26, n = letters.length;
      const angle = i => -Math.PI / 2 + (i / n) * Math.PI * 2;
      const pt = (i, v) => [c + Math.cos(angle(i)) * R * v, c + Math.sin(angle(i)) * R * v];
      const val = (k, obj) => Math.max(0.04, (((obj || {})[k]) ?? 0) / 3);
      const lerpV = (k, t) => {
        const from = fromScores ? val(k, fromScores) : 0.04;
        return from + (val(k, scores) - from) * t;
      };

      animate(t => {
        ctx.clearRect(0, 0, s, s);
        // grid rings + spokes
        ctx.strokeStyle = GRID; ctx.lineWidth = 1;
        [1 / 3, 2 / 3, 1].forEach(rv => {
          ctx.beginPath();
          for (let i = 0; i <= n; i++) { const [x, y] = pt(i % n, rv); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
        });
        for (let i = 0; i < n; i++) {
          const [x, y] = pt(i, 1);
          ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(x, y); ctx.stroke();
        }
        // data polygon
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const [x, y] = pt(i % n, lerpV(letters[i % n].k, t));
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = RED_SOFT; ctx.fill();
        ctx.strokeStyle = RED; ctx.lineWidth = 2.2; ctx.stroke();
        // vertex dots
        for (let i = 0; i < n; i++) {
          const raw = scores[letters[i].k] ?? 0;
          const [x, y] = pt(i, lerpV(letters[i].k, t));
          ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = raw <= 1 ? STATUS.bad : RED;
          ctx.fill();
        }
        // labels
        ctx.font = '600 11.5px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = 0; i < n; i++) {
          const [x, y] = pt(i, 1.16);
          const raw = scores[letters[i].k] ?? 0;
          ctx.fillStyle = raw <= 1 ? INK2 : INK;
          ctx.fillText(letters[i].k, x, y);
        }
      }, fromScores ? 450 : 850);
    },

    /* Sparkline: array of {pct} points, 0-100. instant=true skips the sweep-in. */
    spark(canvas, hist, w, h, status, instant) {
      const W = w || 180, H = h || 44;
      const ctx = setup(canvas, W, H);
      const col = STATUS[status] || RED;
      const vals = hist.length ? hist.map(p => p.pct) : [0];
      if (vals.length === 1) vals.push(vals[0]);
      const pad = 4;
      const x = i => pad + (i / (vals.length - 1)) * (W - pad * 2);
      const y = v => H - pad - (v / 100) * (H - pad * 2);
      const draw = t => {
        ctx.clearRect(0, 0, W, H);
        const m = Math.max(2, Math.ceil(vals.length * t));
        // area fill
        ctx.beginPath();
        ctx.moveTo(x(0), H - pad);
        for (let i = 0; i < m; i++) ctx.lineTo(x(i), y(vals[i]));
        ctx.lineTo(x(m - 1), H - pad);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, col + '33'); g.addColorStop(1, col + '00');
        ctx.fillStyle = g; ctx.fill();
        // line
        ctx.beginPath();
        for (let i = 0; i < m; i++) i ? ctx.lineTo(x(i), y(vals[i])) : ctx.moveTo(x(i), y(vals[i]));
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.stroke();
        // last point
        ctx.beginPath(); ctx.arc(x(m - 1), y(vals[m - 1]), 3.2, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
      };
      if (instant) draw(1);
      else animate(draw, 750);
    },

    /* Horizontal distribution bars: [{label, count, status}] */
    dist(canvas, rows, w) {
      const W = w || 300, rowH = 34, H = rows.length * rowH + 4;
      const ctx = setup(canvas, W, H);
      const max = Math.max(1, ...rows.map(r => r.count));
      const barX = 106, barW = W - barX - 32;
      animate(t => {
        ctx.clearRect(0, 0, W, H);
        rows.forEach((r, i) => {
          const yy = i * rowH + 7;
          ctx.font = '500 12.5px "IBM Plex Sans", sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillStyle = INK2;
          ctx.fillText(r.label, 0, yy + 10);
          ctx.fillStyle = GRID;
          ctx.fillRect(barX, yy + 2, barW, 16);
          const bw = (r.count / max) * barW * t;
          ctx.fillStyle = STATUS[r.status] || RED;
          if (bw > 0.5) {
            ctx.beginPath();
            ctx.roundRect(barX, yy + 2, Math.max(bw, 3), 16, [0, 4, 4, 0]);
            ctx.fill();
          }
          ctx.fillStyle = INK;
          ctx.font = '600 12px "IBM Plex Mono", monospace';
          ctx.fillText(String(r.count), barX + barW + 9, yy + 10);
        });
      }, 700);
    }
  };

  window.DCC = window.DCC || {};
  DCC.Charts = Charts;
})();
