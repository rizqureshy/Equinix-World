/* ============================================================
   Deal Command Center — canvas charts
   Ring gauge · MEDDPICC radar · sparkline · distribution bars
   All single-series, accent-violet, digits/labels carry meaning
   (never color alone). Animated mount, DPR-crisp.
   ============================================================ */
'use strict';

(function () {
  const INK = '#F2EEF3', INK2 = '#B9B3C2', INK3 = '#847E90';
  const GRID = 'rgba(255,255,255,0.07)';
  const STATUS = { good: '#3ECF8E', warn: '#F2B33D', bad: '#FF5A64', dim: '#847E90' };
  const RED = '#8B5CF6', RED_SOFT = 'rgba(139,92,246,0.16)';

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

    /* Ring gauge: pct 0-100, status good|warn|bad. Center text is DOM (crisper). */
    ring(canvas, pct, status, size, thick) {
      const s = size || 84, th = thick || 7;
      const ctx = setup(canvas, s, s);
      const c = s / 2, r = c - th / 2 - 1;
      const col = STATUS[status] || RED;
      animate(t => {
        ctx.clearRect(0, 0, s, s);
        ctx.lineWidth = th;
        ctx.lineCap = 'round';
        ctx.strokeStyle = GRID;
        ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke();
        const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * (pct / 100) * t;
        if (pct > 0) {
          ctx.strokeStyle = col;
          ctx.shadowColor = col; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(c, c, r, a0, a1); ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
    },

    /* Radar: 8 MEDDPICC letters, values 0-3 */
    radar(canvas, letters, scores, size) {
      const s = size || 240;
      const ctx = setup(canvas, s, s);
      const c = s / 2, R = c - 26, n = letters.length;
      const angle = i => -Math.PI / 2 + (i / n) * Math.PI * 2;
      const pt = (i, v) => [c + Math.cos(angle(i)) * R * v, c + Math.sin(angle(i)) * R * v];

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
          const v = Math.max(0.04, (scores[letters[i % n].k] ?? 0) / 3) * t;
          const [x, y] = pt(i % n, v);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = RED_SOFT; ctx.fill();
        ctx.strokeStyle = RED; ctx.lineWidth = 1.8; ctx.stroke();
        // vertex dots
        for (let i = 0; i < n; i++) {
          const raw = scores[letters[i].k] ?? 0;
          const [x, y] = pt(i, Math.max(0.04, raw / 3) * t);
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = raw <= 1 ? STATUS.bad : RED;
          ctx.fill();
        }
        // labels
        ctx.font = '600 10px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = 0; i < n; i++) {
          const [x, y] = pt(i, 1.16);
          const raw = scores[letters[i].k] ?? 0;
          ctx.fillStyle = raw <= 1 ? INK2 : INK;
          ctx.fillText(letters[i].k, x, y);
        }
      }, 850);
    },

    /* Sparkline: array of {pct} points, 0-100 */
    spark(canvas, hist, w, h, status) {
      const W = w || 180, H = h || 44;
      const ctx = setup(canvas, W, H);
      const col = STATUS[status] || RED;
      const vals = hist.length ? hist.map(p => p.pct) : [0];
      if (vals.length === 1) vals.push(vals[0]);
      const pad = 4;
      const x = i => pad + (i / (vals.length - 1)) * (W - pad * 2);
      const y = v => H - pad - (v / 100) * (H - pad * 2);
      animate(t => {
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
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.stroke();
        // last point
        ctx.beginPath(); ctx.arc(x(m - 1), y(vals[m - 1]), 2.6, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
      }, 750);
    },

    /* Horizontal distribution bars: [{label, count, status}] */
    dist(canvas, rows, w) {
      const W = w || 300, rowH = 30, H = rows.length * rowH + 4;
      const ctx = setup(canvas, W, H);
      const max = Math.max(1, ...rows.map(r => r.count));
      const barX = 96, barW = W - barX - 30;
      animate(t => {
        ctx.clearRect(0, 0, W, H);
        rows.forEach((r, i) => {
          const yy = i * rowH + 6;
          ctx.font = '500 11px "IBM Plex Sans", sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillStyle = INK2;
          ctx.fillText(r.label, 0, yy + 9);
          ctx.fillStyle = GRID;
          ctx.fillRect(barX, yy + 2, barW, 14);
          const bw = (r.count / max) * barW * t;
          ctx.fillStyle = STATUS[r.status] || RED;
          if (bw > 0.5) {
            ctx.beginPath();
            ctx.roundRect(barX, yy + 2, Math.max(bw, 3), 14, [0, 4, 4, 0]);
            ctx.fill();
          }
          ctx.fillStyle = INK;
          ctx.font = '600 11px "IBM Plex Mono", monospace';
          ctx.fillText(String(r.count), barX + barW + 8, yy + 9);
        });
      }, 700);
    }
  };

  window.DCC = window.DCC || {};
  DCC.Charts = Charts;
})();
